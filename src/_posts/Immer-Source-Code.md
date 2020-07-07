---
category: Learning
tags:
  - Other
date: 2020-7-07
title: Immer 源码解读（草稿）
---

## 优势

- 使用原生JS的API与数据结构
- TS支持好
- 共享不变的结构
- 深度更新的开销小
- 模板代码少
- 低学习成本，直接修改对象即可
- 支持Map与Set（需要额外开启~）
- 轻量！



## 分析

- 基于Proxy（支持defineProperty来fallback）
- currentState -> draftState -> nextState，初始状态不会被改动，草稿状态是初始状态的代理，变更会反映到草稿状态上，并用来生成新状态，生成时还会共享不变的数据结构。



## 对Class的处理

- Class的草稿状态是一个新对象,但是和原本的Class共享原型
- 创建草稿对象时Immer会复制所有属性，包括不可枚举的和Symbol()值（getOwnPropertySymbols()?）
- getters会在拷贝过程中被触发
- 继承的getter和方法同样会被草稿对象继承
- 不会触发（invoke）构造函数
- 最终实例的构造过程和草稿创建过程一样
- 草稿中只有具有setter的getter会被写入，不然这个值是无法更新的



## API

- produce 
- current()，草稿的当前状态（快照），未来对草稿的状态不会影响到这个方法的返回值，由其创建的对象不会被冻结（produce的会~），可以在异步中保存
- original ✔️
- isDraft ✔️
- setAutoFreeze ✔️ freeze+isFrozen
- setUseProxies ✔️ revocable 收回代理权，控制访问（仅允许一次）





## 思路

内部自己维护一份state，劫持掉所有读写，内部根据变化决定如何返回。

```javascript
class Store {
  constructor(state) {
    this.modified = false
    this.source = state
    this.copy = null
  }
  get(key) {
    if (!this.modified) return this.source[key]
    return this.copy[key]
  }
  set(key, value) {
    if (!this.modified) this.modifing()
    return this.copy[key] = value
  }
  modifing() {
    if (this.modified) return
    this.modified = true
    this.copy = Array.isArray(this.source)
      ? this.source.slice()
      : { ...this.source }
  }
}

const PROXY_FLAG = '@@SYMBOL_PROXY_FLAG'
const handler = {
  get(target, key) {
    if (key === PROXY_FLAG) return target
    return target.get(key)
  },
  set(target, key, value) {
    return target.set(key, value)
  },
}

function produce(state, producer) {
  const store = new Store(state)
  const proxy = new Proxy(store, handler)

  producer(proxy)

  const newState = proxy[PROXY_FLAG]
  if (newState.modified) return newState.copy
  return newState.source
}
```

判断modify的值来决定返回哪一个，这样和immer就只差深嵌套对象更新时的结构化共享和校验了。



## 源码

对草稿对象的深拷贝对反馈到自定义的setter函数，它并不修改原始对象值，而是递归父级进行浅拷贝，并返回新的顶级对象作为新状态。



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

  在代理对象上绑定了getter和setter，然后交由producer

- getter： 懒初始化的代理生成，节省性能并支持递归监听

- setter：对原始值浅拷贝（保存到copy），设置modified为true，按需浅拷贝！根据parent属性递归父级不断浅拷贝，确定此节点到根节点的链路对象是最新的。

- 执行完produce后：如果用户的操作已完成而modified仍为fasle，说明没有发生过修改，直接返回base。反之则需要返回其copy属性，由于setter过程是递归的，使得draft的子对象还是draft（包含了前面注入的额外信息），需要层层递归拿到最终值。

- 递归base和copy的子属性，不同则递归整个过程，否则直接返回。

- 最终的对象由base的未修改的部分+copy的修改的部分拼接得到（这就是共享结构的方式），再使用freeze冻结copy属性，置finalized为true。

- 注意递归调用finalize的过程
