---
category: Learning
tags:
  - Other
date: 2020-7-06
title: 瞄瞄Concurrent模式：Suspense（草稿）
---

> 草稿状态， 预计在本周末完工？

## React Concurrent Mode

- 提升用户体验，尽可能的不改动太多的API，心智模型的转变。
- CPU密集型优化：Reconcilation阶段，现在协调阶段可以被中断以让位，使得页面保持响应。废弃生命周期
- IO密集型优化：异步处理， Suspense与useTransition

### Suspense，悬停

- SUspense + React.lazy()
- 提供给数据获取库如got axios umi-request的机制 三方库可以通过这种机制告知React组件先使用fallback，等完成获取再继续更新正式UI
- 包裹包含异步操作的组件（包括useTransition）
- 实现类似常用的ErrorBoundary(componentDidCatch)，但捕获异常后会提供fallback并且可回退。捕获的是Promise异常
- 需要处理失败（reject）掉的异常，正常抛出
- 抛出Promise异常时，React会查找最近的Suspense来处理它
- 避免重渲染时再次抛出错误，需要缓存异步状态。Suspense切换状态时组件会被卸载，不可由自身缓存。
  - 全局缓存，如Redux
  - React-Cache，LRU全局缓存
  - 提升状态到父级组件
  - Context API, Relay用的就是这种
  - 需要由状态管理方案跟进？
- 并发异步操作，细粒度的控制加载状态的缓存策略
- Suspense编排（SuspenseList可以控制其中的Suspense fallback的顺序），Loading指示符的个数 顺序等
- 模式切换，快网速-所有数据fetch完成后再渲染， 慢网速-细粒度组件的等待更新
- createFetcher，一个返回Promsie的异步方法在经过其包装后可以直接在FC的render中同步的调用read方法获取数据。
- PlaceHolder与Loading
- createResource().read()后：
  - 无缓存，抛出一个Promise异常（亦或是具有thenable接口的对象即可？），由Suspense捕获，展示fallback（PlaceHolder/Loading），等待Promise resolved掉后，卸载fallback，挂载组件，同时read去获取resolve的值。异步状态的缓存则需要交由第三方方案？react-cache似乎还是实验性的。作者之一（Andrew Clark）的说法则是先从缓存（应该read方法是和缓存方案集成的）里读值，如果还没有缓存（有点语病，但似乎也没有），则抛出Promise异常(throws a promise)。
  
- 心智模型转变：render - 异步 - 悬停等待 - 更新，更彻底的异步同步化，更细粒度的异步控制，在JSX层就干净的解决了副作用（同构芜湖！）  统一由父组件创建fetcher，分发资源   给予组件悬停的能力！而不用关心为什么悬停。
- React.lazy()实现类似Webpack的Dynamic Import，因此也可以为Suspense所用。动态引入类似于Promise的机制，也具有pending/resolved/rejected三种状态，可以被Suspense捕获到（当然这也是为啥得放在Suspense里包裹，useTransition类似）  内部任意一个子组件处于suspense状态（抛出了Promise？），就会激活fallback。

> React 还会跟踪抛出的 Promise 。组件中的 Promise 一旦 resolve ，React 就会尝试去继续渲染该组件。因为我们假定由于 Promise 已经被 resolve ，这也就意味着暂停的组件已经具有正确渲染所需的全部数据。为此，我们使用某种形式的缓存来存储数据。该缓存取决于每次渲染时数据是否可用（如果可用就会像从变量中取值一样读取它），若数据没有准备好，则会触发 fetch 然后抛出 Promise 以便 React 捕获。如上所述，这并不是数据加载所独有的，任何可以使用 Promise 来描述的异步操作都可以充分利用 Suspense ，显然代码分割是一个非常明显且流行的例子。
- 解决网速够快下的loading态 -> maxDuration.
  
