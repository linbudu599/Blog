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
- 心智模型转变：render - 异步 - 悬停等待 - 更新，更彻底的异步同步化，更细粒度的异步控制，在JSX层就干净的解决了副作用（同构芜湖！）  统一由父组件创建fetcher，分发资源
- React.lazy()实现类似Webpack的Dynamic Import，因此也可以为Suspense所用
