---
category: Thoughts
tags:
  - React
date: 2020-2-20
title: 关于useSelector的一些学习
---

## 前言

又懒又忙的我会突然为`useSelector`整理一篇博文，是因为之前的我使用它，就是直接用而已，完全不考虑它替我们做了什么，和 connect 比起来又有什么好处，以及它是如何发扬 Hooks 的哲学的，直到前几天偶然看见一篇文章，又去研究了下官方文档，才发现好像我之前的使用过于浅显，我很不喜欢这种感觉，正好也将近一个月没写过博客了，于是就趁此机会做一下记录。

这篇文章大部分思路和示例来自于知乎作者[张立理](https://www.zhihu.com/people/otakustay)，是和贺师俊、杨健等等前端领域同一批次的大佬。也正是作者的讲解让我对这个 api 产生了兴趣。

## React-Redux 与 Reselect

其实早在`React-Redux@7`发布之前，就已经能够见到这样一种写法：

```js
// store/selector.js

export const dataSelector = (state)=>{
  return {
    data: // ... 假装这里有很复杂的逻辑
  }
}

// page/index.js

const mapStateToProps = (state)=>{
  return dataSelector(state)
}
// ... 然后connect
```

这种写法的好处是很明显的，页面中不会再出现又臭又长的 state 提取/转换逻辑，但是其实这并没有改变实质上的问题：

如果组件发生了更新，那么就要重新调用`dataSelector()`进行计算，如果这里的转换逻辑过于复杂，那么性能势必会受到影响。

因此 [Reselect](https://github.com/reduxjs/reselect) 应运而生，从它的自我介绍就能很容易知道它诞生是为了解决什么：

> Simple “selector” library for Redux (and others) inspired by getters in NuclearJS, subscriptions in re-frame and this proposal from speedskater.
>
> 对于 Reselect 这个库我只用过一两次，只用到了最为主要的那个 API，因此以下介绍可能有失偏颇。

这是一个最基本的使用例子：

**`createSelector(...inputSelectors | [inputSelectors], resultFunc)`**

```js
import { createSelector } from "reselect";

const selectorA = (state) => state.account.username;
const selectorB = (state) => state.account.info;

const selectSomeData = createSelector(
  // 不一定要数组哈，也可以分开传
  [selectorA, selectorB],
  (username, info) => ({ ...username, infoDeatil: info[username.info] })
);

// 一个copy的例子
const getVisibilityFilter = (state) => state.visibilityFilter;
const getTodos = (state) => state.todos;

export const getVisibleTodos = createSelector(
  [getVisibilityFilter, getTodos],
  (visibilityFilter, todos) => {
    switch (visibilityFilter) {
      case "SHOW_ALL":
        return todos;
      case "SHOW_COMPLETED":
        return todos.filter((t) => t.completed);
      case "SHOW_ACTIVE":
        return todos.filter((t) => !t.completed);
    }
  }
);
```

这个 API 接收选择器（`input-selectors`）和变换函数作为参数，选择器返回的值会被作为变换函数的入参，你可以在这里进行更细的筛选。
如果`input-selectors`的值不变，即变换函数的入参不变，说明最后的变换结果也不会变，那么`reselect`会直接返回缓存起来的值。

`reselect`的大致思路就是这样，它良好（不敢说很好，因为没怎么用）的解决了组件更新时的计算开销，如果变动的不是或不会影响`store`中的数据，那么就不会重新调用选择器进行计算。

~~也许是因为这个思路是大势所趋，`React-Redux@7`推出了`useSelector`这个方法。~~

为什么要划掉呢，因为这个方法和`reselect`其实关联甚少，最重要的是它的缓存功能太弱了（参看下文），试问，谁不想享受`useSelector`的便利同时让缓存机制保护我们的应用呢？

## useSelector

这个 api 的使用方式没有什么要讲的，我扔个例子你们就看懂了。

`const result : any = useSelector(selector : Function, equalityFn? : Function)`

```tsx
// 这里的getIn是Immutable.Js的，和这个api无关哈。
const data: IRank = useSelector((state: IGlobalState) => ({
  rankList: state.getIn(["rank", "rankList"]),
  loading: state.getIn(["rank", "loading"]),
}));

const { rankList, loading } = data;
```

和`mapStateToProps`很像吧？的确是这样，它同样也会订阅 store，并且在你每分发一个 action 就会执行一次。

> 你可以在一个函数组件中多次调用 useSelector()。每一个 useSelector() 的调用都会对 Redux 的 store 创建的一个独立的 订阅(subscription)。由于 Redux v7 的 批量更新(update batching) 行为，对于一个组件来说，如果一个 分发后(dispatched) 的 action 导致组件内部的多个 useSelector() 产生了新值，那么仅仅会触发一次重渲染。

当你分发 action 后，它会将上一次调用的结果和本次调用的结果进行比较（通过严格比较===，connect 使用的是浅比较），如果不一样，组件才会被强制重渲染。

> 浅比较并不是指 ==。严格比较 === 对应的是 疏松比较 ==，与 浅比较 对应的是 深比较。
> 深比较会递归进行浅比较，需要两个对象的属性都相等才会返回 true。同时深比较不会考虑这两个对象是不是同一个对象的引用。后面会展开讲。

> 我们可以多次调用它，每一个调用都会创建一个独立的订阅。由于 Redux v7 的 批量更新(update batching) 行为，对于一个组件来说，如果一个 分发后(dispatched) 的 action 导致组件内部的多个 useSelector() 产生了新值，那么仅仅会触发一次重渲染。

其实就是官方为我们提供了一个比 connect 更优雅的方式来组织代码，但是我们最关心的缓存问题却并没有解决。
它提供的缓存能力同样是不那么有效的，严格比较与浅比较，你懂的。

但是如果追求接近完美的缓存，就有点过于苛求 react-redux 了，缓存模型应当是研发人员的重要任务，但是`Apollo`的缓存我感觉就挺好~

话说回来，如果对缓存的需要不可忽视，那么我们需要再把`Reselect`请回来，用法不变，还是用`createSelector`把选择器包起来，多了一步传给`useSelector`。

```js
import { createSelector } from "reselect";
import { useSelector } from "react-redux";

const selectUserDisplay = createSelector(
  (state) => state.currentUser,
  (state) => state.entities.jobs,
  (user, jobs) => ({ ...user, job: jobs[user.job] })
);

// 在组件里
const user = useSelector(selectUserDisplay);
```

上面和以下示例来自于张老师的文章：

> 当你需要根据组件自己的 state 或 props 去访问 store 的时候，这么实现（指上面的例子）显然是不行的，所以你需要 useCallback：

```js
import { useCallback } from "react";
import { createSelector } from "reselect";
import { useSelector } from "react-redux";

// 下面全部在组件里
const { id } = props;
const selectUserDisplay = useCallback(
  createSelector(
    (state) => state.users,
    (state) => state.entities.jobs,
    (users, jobs) => {
      const { job, ...user } = users[id];
      return { ...user, job: jobs[job] };
    }
  ),
  [id]
);
const user = useSelector(selectUserDisplay);
```

> 不同于普通的纯函数，createSelector 是有开销的，包括组装函数的时间开销，以及开辟一个内部缓存的空间开销。useCallback 虽然能稳定返回的函数，但并不减少 createSelector 的调用次数，只是一部分调用所返回的结果被直接丢弃，等着 GC 回收。但是，GC 是性能的大敌，从 Immutable 到 useCallback 产生的碎片，这是整个 React 当前的性能模型所未能解决的问题。

其实

作者提供了他认为最优的方案：

```js
import { useMemo } from "react";
import { useSelector } from "react-redux";

// 组件里
const { id } = props;
const users = useSelector((s) => s.entities.users);
const jobs = useSelector((s) => s.entities.jobs);
const userDisplay = useMemo(() => {
  const { job, ...user } = users[id];
  return { ...user, job: jobs[job] };
}, [id, users, jobs]);
```

（其实我也没能想到 useMemo 还能这么用。）

这种思路使得细粒度筛选 store 和良好缓存能力很好的共存了，而且也能使用组件内部的状态/属性来参与筛选。我愿称之为妙！

同时注意，你可以会发现我们还可以传入另外一个参数，react-redux 提供的`shallowEqual()`，或是 Immutable.js/Lodash 提供的方法。这个参数会作为比较两次调用结果的计算函数。

## 场景

实际上现在我们有两种方案，当组件单纯连接到 store，并且提取数据不需要使用组件内部状态，那么 createSelector 会是不错的选择（注意，createSelector 本身也是有开销的）。当提取数据需要更细粒度，并且过程依赖组件属性/状态，那么像这种 useMemo 的搭配会更好。

## 彩蛋

react-redux@7 并不是只提供了这一个 hooks，下面会简单介绍一下我使用/了解过的 hooks。

### useDispatch

如果说 useSelector 是为了替代 mapStateToProps，那么 useDispatch 就是为了替代 mapDispatchToProps，这两个一起使用以后，connect 就可以正式退休了。

我个人理解，useDispatch 实际上就是返回了之前 mapDispatchToProps 的入参中的 diapatch 引用，使得现在可以直接在组件内部 dispatch 一个 action，但组件的属性中不需要有 dispatch。

```js
import React from "react";
import { useDispatch } from "react-redux";

export const CounterComponent = ({ value }) => {
  const dispatch = useDispatch();

  return (
    <div>
      <span>{value}</span>
      <button onClick={() => dispatch({ type: "increment-counter" })}>
        Increment counter
      </button>
    </div>
  );
};
```

注意，如果你将一个内部调用了此类 dispatch 的函数传给子组件，最好把它用`useCallback`包裹起来，以避免不必要的重渲染。

### useStore

通过这个 API，你现在可以直接访问到 Redux 的根 Store 了，一个比较可能用到这个 api 的场景就是在替换 store 的 reducer，比如 MPA 应用做热更新。

## 浅比较和深比较

看了一下 React-Redux 提供的`ShallowEuqal`API 的源码，和 React 内部`shouldComponentUpdate`生命周期里的`ShallowEuqal`实现思路几乎一样，代码也差不多，这里贴一下 React 中的实现：

```js
const hasOwn = Object.prototype.hasOwnProperty;

// 实际上是Object.is()方法的补全
function is(x, y) {
  if (x === y) {
    // 处理+0===-0 true
    return x !== 0 || y !== 0 || 1 / x === 1 / y;
  } else {
    // 处理NaN===NaN false
    return x !== x && y !== y;
  }
}

export default function shallowEqual(objA, objB) {
  // 对基本数据类型比较
  // 过滤掉均为基本类型的情况
  if (is(objA, objB)) return true;

  // 过滤掉这两种情况
  // 只有一方是对象
  // 有null
  if (
    typeof objA !== "object" ||
    objA === null ||
    typeof objB !== "object" ||
    objB === null
  ) {
    return false;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (let i = 0; i < keysA.length; i++) {
    if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }

  return true;
}
```

可以看到，浅比较实际上只比较了两个对象的 key 以及为基本类型的 value，如果存在嵌套对象就莫的法子了。
而深比较则是在浅比较的基础上对两个对象的子对象进行递归遍历，不去管子对象的引用，而是确保其值相同。

## 参考文章

- [如何看待 react-redux@7 的 useSelector API？](https://www.zhihu.com/question/332090851/answer/730617297)
- [IMWeb 你真的了解浅比较么？](https://www.imweb.io/topic/598973c2c72aa8db35d2e291)
- [React-Redux 官方 Hooks 文档说明](http://react-china.org/t/topic/34076)
