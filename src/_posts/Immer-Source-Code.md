---
category: Source
tags:
  - React
date: 2020-8-12
title: 精读Immer源码（草稿）
---

## Immutable 与 Immer

- 思路 & 代码示例
- 开销 & 性能



> - 全新的数据结构操作方式
> - 操作结果需要通过`toJS`方法才能得到原生对象，使得在操作一个对象的时候需要小心翼翼。



【例子：操作对象】

【例子：React Reducer + Immer(curried produce)】



Immer的优势大致可以归类为以下几点：

- 使用原生 JS 的 API 与数据结构，直接使用原生API修改数据，几乎为0的学习成本。
- 共享不变的结构，来大大降低深度更新的开销。
- 支持 Map 与 Set 数据结构，同时支持使用`Object.defineProperty`来对ES5做支持。
- 柯里化与Redux的良好支持
- 轻量！



## 简介

在开始前，对于没有使用过Immer的同学，我们势必要稍微讲解一下Immer整体的思路，否则后面的源码环节可不好读懂。

【图：Immer原理示意图】

Immer整体的思路很简单，总共就几个概念:

- `currentState`，即你传入produce的首个参数，这是初始状态。
- `draftState`，Immer内部根据你的初始状态生成了这个”草稿对象“（实际上是初始状态的代理），对原先对象的操作会反映在这个草稿对象上，以此来保证原对象不会被改变。
- `nextState`，根据草稿对象来生成（`finalize`）一个最终的对象，这即是produce方法的返回值。

也就是说，我们会以一个代理对象搜集所有的写操作（读操作还是会使用原对象），并根据这个代理对象去生成最终的全新状态。在这个过程中实际上Immer还会做许多优化，包括：

- 由于Proxy只能监听单层，因此对于嵌套对象需要创建多层Proxy，Immer采取了只创建顶层Proxy，后续按需创建的措施，可以理解为代理的懒初始化。以`draftState.a.x = 1`为例，当`draftState.a`这个`getter`触发时，才会去创建对应到`draftState.a`的proxy对象。
- 复用没有变动的子树，而只是替换掉发生了变动的子树到根节点的整条线路，这样做在修改深层嵌套对象时在性能上有很大的帮助。
- 冻结初始对象，待扩展。



## 源码环节

xxxx铺垫下



我们的目点会放在基本使用，而柯里化的过程与Map、Set、ES5代理实现以及patch功能（可理解为时间旅行能力）都只会一笔带过。



我们从入口开始，这个文件简化的样子如下：

```typescript
import { IProduce, Immer } from "./internal";

const immer = new Immer();

export const produce: IProduce = immer.produce;

export default produce;

export const setAutoFreeze = immer.setAutoFreeze.bind(immer);

export const setUseProxies = immer.setUseProxies.bind(immer);
```

默认导出的`produce`方法来自于全局唯一的immer实例，而`Immer`类来自于`immerClass.ts`文件，这个马上就会讲到。稍微看一眼`setAutoFreeze`和`setUseProxies`这两个方法，这两个方法会决定在produce过程中是否自动冻结初始状态与是否使用ES6 Proxy。



导出的 immer 实例来自于 Immer 类（immerClass.ts），这个类大概长这样：

```typescript
export class Immer implements ProducersFns {
	useProxies_: boolean = hasProxies;

	autoFreeze_: boolean = __DEV__ ? true /* istanbul ignore next */ : !isMinified

	constructor(config?: { useProxies?: boolean; autoFreeze?: boolean }) {
		if (typeof config?.useProxies === "boolean")
			this.setUseProxies(config!.useProxies);
		if (typeof config?.autoFreeze === "boolean")
			this.setAutoFreeze(config!.autoFreeze);
		this.produce = this.produce.bind(this);
	}

	produce(base: any, recipe?: any, patchListener?: any) {
		// ...
	}


	setAutoFreeze(value: boolean) {
		this.autoFreeze_ = value;
	}

	setUseProxies(value: boolean) {
		if (value && !hasProxies) {
			die(20);
		}
		this.useProxies_ = value;
	}
}
```

可以看到在实例化的过程中会设置`autoFreeze_`与`useProxies_`属性，后续immer实例实际上会被作为参数在各个方法间传递，因此只需要`immer.autoFreeze_`的方式就能获取到配置。

最最重要的produce方法内部：

```typescript
produce(base: any, recipe?: any, patchListener?: any) {
		if (typeof base === "function" && typeof recipe !== "function") {
			// ...柯里化处理逻辑
		}

		let result;

		// Only plain objects, arrays, and "immerable classes" are drafted.
		if (isDraftable(base)) {
			const scope = enterScope(this);
			const proxy = createProxy(this, base, undefined);
			let hasError = true;
			try {
				result = recipe(proxy);
				hasError = false;
			} finally {
				// finally instead of catch + rethrow better preserves original stack
				if (hasError) revokeScope(scope);
				else leaveScope(scope);
			}
			// 异步处理
			if (typeof Promise !== "undefined" && result instanceof Promise) {
				// ...
			}
			usePatchesInScope(scope, patchListener);
			const res = processResult(result, scope);
			return res;
		} else if (!base || typeof base !== "object") {
			result = recipe(base);
			if (result === NOTHING) return undefined;
			if (result === undefined) result = base;
			if (this.autoFreeze_) freeze(result, true);
			return result;
		} else die(21, base);
	}
```

首先是判断入参，来确定是否是柯里化调用，否则才走正常处理逻辑。然后判断入参是否是可草稿化的（draftable），其判断函数如下：

```typescript
export function isDraftable(value: any): boolean {
	if (!value) return false
	return (
		isPlainObject(value) ||
		Array.isArray(value) ||
		!!value[DRAFTABLE] ||
		!!value.constructor[DRAFTABLE] ||
		isMap(value) ||
		isSet(value)
	)
}

/*#__PURE__*/
export function isPlainObject(value: any): boolean {
	if (!value || typeof value !== "object") return false
	const proto = Object.getPrototypeOf(value)
	return !proto || proto === Object.prototype
}
```

也就是说只有数组/plainObject/Map/Set才可以草稿化，`!!value[DRAFTABLE] ||
!!value.constructor[DRAFTABLE]`的逻辑涉及到类的草稿化，这里暂时跳过。

然后是很重要的两个方法，`enterScope`与`createProxy`：

在immer整体源码中





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



## 一个简版Immer

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

### Immer 对 ES6 Class 的处理

- Class 的草稿状态是一个新对象,但是和原本的 Class 共享原型
- 创建草稿对象时 Immer 会复制所有属性，包括不可枚举的和 Symbol()值（getOwnPropertySymbols()?）
- getters 会在拷贝过程中被触发
- 继承的 getter 和方法同样会被草稿对象继承
- 不会触发（invoke）构造函数
- 最终实例的构造过程和草稿创建过程一样
- 草稿中只有具有 setter 的 getter 会被写入，不然这个值是无法更新的

对草稿对象的深拷贝对反馈到自定义的 setter 函数，它并不修改原始对

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
