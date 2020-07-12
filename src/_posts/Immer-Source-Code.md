---
category: Learning
tags:
  - Other
date: 2020-7-07
title: Immer 源码解读（草稿）
---

## 优势

- 使用原生 JS 的 API 与数据结构
- TS 支持好
- 共享不变的结构
- 深度更新的开销小
- 模板代码少
- 低学习成本，直接修改对象即可
- 支持 Map 与 Set（需要额外开启~）
- 轻量！

## 分析

- 基于 Proxy（支持 defineProperty 来 fallback）
- currentState -> draftState -> nextState，初始状态不会被改动，草稿状态是初始状态的代理，变更会反映到草稿状态上，并用来生成新状态，生成时还会共享不变的数据结构。

## 对 Class 的处理

- Class 的草稿状态是一个新对象,但是和原本的 Class 共享原型
- 创建草稿对象时 Immer 会复制所有属性，包括不可枚举的和 Symbol()值（getOwnPropertySymbols()?）
- getters 会在拷贝过程中被触发
- 继承的 getter 和方法同样会被草稿对象继承
- 不会触发（invoke）构造函数
- 最终实例的构造过程和草稿创建过程一样
- 草稿中只有具有 setter 的 getter 会被写入，不然这个值是无法更新的

## API

- produce
- current()，草稿的当前状态（快照），未来对草稿的状态不会影响到这个方法的返回值，由其创建的对象不会被冻结（produce 的会~），可以在异步中保存
- original ✔️
- isDraft ✔️
- setAutoFreeze ✔️ freeze+isFrozen
- setUseProxies ✔️ revocable 收回代理权，控制访问（仅允许一次）

## 思路

内部自己维护一份 state，劫持掉所有读写，内部根据变化决定如何返回。

```javascript
class Store {
  constructor(state) {
    this.modified = false;
    this.source = state;
    this.copy = null;
  }
  get(key) {
    if (!this.modified) return this.source[key];
    return this.copy[key];
  }
  set(key, value) {
    if (!this.modified) this.modifing();
    return (this.copy[key] = value);
  }
  modifing() {
    if (this.modified) return;
    this.modified = true;
    this.copy = Array.isArray(this.source)
      ? this.source.slice()
      : { ...this.source };
  }
}

const PROXY_FLAG = "@@SYMBOL_PROXY_FLAG";
const handler = {
  get(target, key) {
    if (key === PROXY_FLAG) return target;
    return target.get(key);
  },
  set(target, key, value) {
    return target.set(key, value);
  },
};

function produce(state, producer) {
  const store = new Store(state);
  const proxy = new Proxy(store, handler);

  producer(proxy);

  const newState = proxy[PROXY_FLAG];
  if (newState.modified) return newState.copy;
  return newState.source;
}
```

判断 modify 的值来决定返回哪一个，这样和 immer 就只差深嵌套对象更新时的结构化共享和校验了。

## 源码

对草稿对象的深拷贝对反馈到自定义的 setter 函数，它并不修改原始对象值，而是递归父级进行浅拷贝，并返回新的顶级对象作为新状态。

- 初始状态 -> 草稿状态，生成代理对象，注入额外信息

  ```js
  {
    modified, // 是否被修改过
    finalized, // 是否已经完成（所有 setter 执行完，并且已经生成了 copy）
    parent, // 父级对象
    base, // 原始对象（也就是 obj）
    copy, // base（也就是 obj）的浅拷贝，使用 Object.assign(Object.create(null), obj) 实现
    proxies, // 存储每个 propertyKey 的代理对象，采用懒初始化策略
  }
  ```

  在代理对象上绑定了 getter 和 setter，然后交由 producer

- getter： 懒初始化的代理生成，节省性能并支持递归监听

- setter：对原始值浅拷贝（保存到 copy），设置 modified 为 true，按需浅拷贝！根据 parent 属性递归父级不断浅拷贝，确定此节点到根节点的链路对象是最新的。

- 执行完 produce 后：如果用户的操作已完成而 modified 仍为 fasle，说明没有发生过修改，直接返回 base。反之则需要返回其 copy 属性，由于 setter 过程是递归的，使得 draft 的子对象还是 draft（包含了前面注入的额外信息），需要层层递归拿到最终值。

- 递归 base 和 copy 的子属性，不同则递归整个过程，否则直接返回。

- 最终的对象由 base 的未修改的部分+copy 的修改的部分拼接得到（这就是共享结构的方式），再使用 freeze 冻结 copy 属性，置 finalized 为 true。

- 注意递归调用 finalize 的过程

> 跳过 Patch 柯里化 fallback（Map Set ES5 ...）的部分

### Immer 类

导出的 immer 实例来自于 Immer 类，在初始化时会根据 autoFreeze\_与 useProxies\_（有根据生产环境和是否经过压缩的机制）全局初始化（单例模式），并将 produce 方法绑定到当前的实例，默认导出的就是这个 produce 方法。

#### produce 方法

接收 base recipe patchListener

最开始会判断 base 为函数（柯里化的情况）以及 patchListener 启用情况，这里就跳过了，直接看最主要的用法，如

```js
import produce from "immer";

const baseState = [
  {
    todo: "Learn typescript",
    done: true,
  },
  {
    todo: "Try immer",
    done: false,
  },
];

const nextState = produce(baseState, (draftState) => {
  draftState.push({ todo: "Tweet about it" });
  draftState[1].done = true;
});
```

先判断 isDraftable（是否可生成 Draftable State），只有 PlainObject（在 common 里的方法，主要是无原型对象以及原型为 Object.prototype 的对象~），数组，以及"Immerable Classes"。

首先生成 scope，enterScope()方法中，创建了绑定到当前 immer 实例的 currentScope，保存了这些信息：

```js
		drafts_: [],
		parent_,
		immer_,
		canAutoFreeze_: true,
		unfinalizedDrafts_: 0
```

然后就该去创建代理对象了，createProxy(base, value, parent)，parent 第一次创建为 undefined，根据 value 类型决定是否启用插件/是否启用 Proxy 生成最终的代理。最普通的情况就是走到 createProxyProxy()方法里，同时还会根据 parent 是否存在创建 scope，并将本次生成的草稿状态推入到 scope.drafts\_中。如果 parent 存在，则 scope 即为 parent 的 scope\_属性，否则需要 getCurrentScope()（比如第一次）。

在 createProxyProxy(base, parent)中，根据 base 的类型构造 state 对象:

```js
const state: ProxyState = {
		type_: isArray ? ProxyTypeProxyArray : (ProxyTypeProxyObject as any),
		// Track which produce call this is associated with.
		scope_: parent ? parent.scope_ : getCurrentScope()!,
		// True for both shallow and deep changes.
		modified_: false,
		// Used during finalization.
		finalized_: false,
		// Track which properties have been assigned (true) or deleted (false).
		assigned_: {},
		// The parent draft state.
		parent_: parent,
		// The base state.
		base_: base,
		// The base proxy.
		draft_: null as any, // set below
		// The base copy with any updated values.
		copy_: null,
		// Called by the `produce` function.
		revoke_: null as any,
		isManual_: false
	}
```

type\_，这里根据是否是数组判断

scope\_，保存 parent.scope\_或是当前的 scope\_，保存当前调用它的 produce

modified\_，判断当前元素是否被更改，浅层与深层更新都为 true

finalized\_，最终生成结果时会用到。

revoke\_，由 produce 调用，收回代理权

traps，也就是代理后拦截设置（拦截哪些操作 做出哪些修改），对象与数组使用的是不同的。这里应该是重点，先放着。

调用 Proxy.revocable(target, traps)，挂载 revoke 方法，并返回生成的 proxy 实例。

调用 recipe 方法传入 proxy（所以说 draftState 就是代理对象嘛！那这样 icestore 中的 reducer 入参的 state 就是这个草稿对象了）。如果执行出错了，需要调用 revokeScope，重置 scope（这里还不太懂，或者说 scope 的作用还不太懂...）。

返回的结果还需要判断一下是不是 Promise，这么说支持异步？

返回的结果需要走 processResult，将 base 中没改变的和 draft 中的收集到的改变拼接起来。在其中还需要调用 finalize 函数，finalize 和 finalizeTree 暂时跳过（看不懂 QAQ）

对于 base 不存在的情况(!base)以及类型不为对象的 base，则是直接走 recipe()
