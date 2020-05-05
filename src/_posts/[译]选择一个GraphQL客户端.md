---
category: Learning
tags:
  - Other
date: 2020-5-05
title: 译：在Apollo与Relay之间选择一个GraphQL Client
---

> [Choosing a GraphQL Client: Apollo vs. Relay](https://blog.codazen.com/choosing-graphql-client-apollo-vs-relay), 作者 **Rachel Lee**, 原文来自于[codazen](https://www.codazen.com/)的博客

![Choosing a GraphQL Client: Apollo vs. Relay](https://blog.codazen.com/hubfs/ApollovsRelay_CDZ.jpg)

> 如果你就是想看看二者的对照表, 那就一直往下滑吧, 当然, 希望你这样不会伤到作者的心.

你会看到这篇文章应该是你听闻过了`GraphQL`, 这一全新的开创性的为你的应用获取数据的方式. 也许你已经搞定如何从零搭建一个`GraphQL Server`(如果没有, 你可以读读[这些棒呆了的文章](https://blog.apollographql.com/the-concepts-of-graphql-bc68bd819be3)). 那么现在, 你需要选择一个客户端来使得你崭新的`GraphQL Server`得以派上用场. 你可能已经听说过`Relay`并且已经走了一遍教程, 或许你觉得它有点令人困惑或是困难? 并且没有意识到其实你还有其他选择. 实际上, `Apollo`和`Relay`是目前最领先的两个开源 GraphQL 客户端框架(适用于 NodeJS 应用).

> 要是有个快速简单的双方对比就好了, 这样你就可以很容易就哪一款客户端框架更适合你作出一个有效的决定, 啊哈, 恭喜你找到了!

## 为什么需要选择一个 GraphQL Client?

在我们决定使用哪一个客户端框架时, 我们理所应当先讨论讨论, 为什么我们需要一个专用于 GraphQL 的客户端? 为什么不坚持使用原先你正用的舒服的那个? `Redux`可以和`GraphQL`协同工作的不错. 如果你想花更多时间来尝试弄明白 GraphQL 内部类似于 Redux 但更符合常理的上下文机制(Context)是如何工作的, 我强烈推荐你阅读[James Childs-Maidment’s fantastic article on Getting started with Redux and GraphQL.](https://medium.com/@childsmaidment/getting-started-with-redux-and-graphql-8384b3b25c56)

然而我们都知道`Redux`并不是为了最大限度发挥 GraphQL 优势而设计的, 如果你学习 GraphQL 的目标是准备真正的发挥它神奇的优势, 那么在其客户端侧也花时间去做相关工作, 以此来尽可能地利用你的`GraphQL Server`, 就是理所当然的了.

为了达到这个目标, Apollo 和 Relay 都实现了查询与某种形式的数据缓存, 以此来更好的优化向`GraphQL Server`发起地请求.

这也就意味着实际上二者已经做了大量工作在预处理/后处理(`pre/post-processing`)上来达成智能有效的请求发送. 这也是 Redux 不能为你做的. Apollo 和 Relay 还做了很多其他贴心的优化, 以下是一份简洁且有条理的二者的对照表.

### 对照

[Apollo](https://www.apollographql.com/docs/react/) 和 [Relay](https://facebook.github.io/relay/) 拥有很多相似的特性, 但是它们并不完全相同, 所以我对它们的差异做了一份分类. 为了使内容简洁, 我会在部分条目加上我认为较为有用的资源链接来提供更多信息.

#### 关键点(Key Values)

##### Apollo

- 渐进式的使用方式(译者注, Apollo 允许你只启用很少的一部分功能来实现应用)
- 易于入门
- 便于调试与易懂
- 为交互式应用打造
- 社区驱动

##### Relay

- 声明式使用: 只需要知道什么是数据, 而不用担心如何/何时获取
- 搭配使用: 在视图层中书写数据依赖
- 数据变动(Mutations): 数据一致性, 乐观更新以及错误处理

#### 缓存中对象区分(Object Identification for Caching)

**Apollo**: `__typename` + id(客户端自动生成)

**Relay**: [graphql-relay](https://www.npmjs.com/package/graphql-relay) 全局 id(由服务端生成, 需要*[GraphQL schema configuration](https://facebook.github.io/relay/graphql/objectidentification.htm)*)

#### 查询语言(Query Language)

**Apollo:** [graphql-tag](https://www.npmjs.com/package/graphql-tag)

**Relay:** [Relay.QL](https://facebook.github.io/relay/docs/en/classic/classic-api-reference-relay-ql.html)

#### 查询批处理(Query Batching)

**Apollo:** [内置](https://blog.apollographql.com/query-batching-in-apollo-63acfd859862)(只需要一行代码来设置与配置)

**Relay:** [react-relay-network-layer](https://www.npmjs.com/package/react-relay-network-layer)

#### 订阅支持(Subscriptions)

**Apollo:** [支持](https://blog.apollographql.com/graphql-subscriptions-in-apollo-client-9a2457f015fb)

**Relay:** [支持(_ish_)](https://www.npmjs.com/search?q=graphql+relay+subscription)

#### 片段支持(Fragment)

**Apollo:** [yes](https://www.apollographql.com/docs/react)

**Relay:** yes

#### 乐观 UI 更新(Optimistic UI Updates)

**Apollo:** [yes](https://blog.apollographql.com/mutations-and-optimistic-ui-in-apollo-client-517eacee8fb0)

**Relay:** [yes](http://blog.pathgather.com/blog/a-beginners-guide-to-relay-mutations)

#### 分页(Pagination)

**Apollo:** [对范式(schema)进行任意分页](https://blog.apollographql.com/pagination-and-infinite-scrolling-in-apollo-client-59ff064aac61) (服务端), [fetchMore API](https://www.apollographql.com/docs/react/features/pagination.html) (客户端)

**Relay:** 基于指针(cursor) (服务端, 需要 [GraphQL connections configuration](https://facebook.github.io/relay/docs/en/graphql-server-specification.html))

#### 自定义网络接口(Custom Network Interfaces)

**Apollo:** [yes](https://www.apollographql.com/docs/react/advanced/network-layer.html)

**Relay:** [yes](https://facebook.github.io/relay/docs/en/network-layer.html)

#### 服务端渲染(SSR)

**Apollo:** [yes](https://www.apollographql.com/docs/react/features/server-side-rendering.html)

**Relay:** [isomorphic-relay](https://www.npmjs.com/package/isomorphic-relay)

#### 性能优化(Performance (Caching and Query Optimization))

**Apollo:** [yes](https://www.apollographql.com/docs/react/advanced/caching.html)

**Relay:** [yes](https://facebook.github.io/relay/docs/en/thinking-in-graphql.html)

#### 路由(Routing)

**Apollo:** [react-router](https://www.npmjs.com/package/react-router)

**Relay:** [react-router-relay](https://www.npmjs.com/package/react-router-relay)

#### 单元测试

**Apollo:** [Jest](https://jestjs.io/) (assuming you’re using React)

**Relay:** [Jest](https://jestjs.io/)

#### 开发者工具(Developer Tools)

**Apollo:** [Redux DevTools](https://www.apollographql.com/docs/react/features/developer-tooling.html) - (_[谷歌浏览器扩展](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)_)

**Relay:** React DevTools - (_[谷歌浏览器扩展](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)_)

#### 兼容性

**Apollo:** React, React Native, Angular 2, Redux, Meteor

**Relay:** React, React Native

#### 学习曲线(至精通)

**Apollo:** [类似 react-redux](https://www.apollographql.com/docs/react/essentials/get-started.html)

**Relay:** 全新概念

#### 变动复杂程度(Mutation-Writing Complexity)

##### Apollo

- 简单的 GraphQL mutation 与 resolver(这里不翻译, 避免影响理解 GraphQL 语法)
- 使用 Apollo-Client 发送语义化的 mutation
- 更新 Apollo-Client 内置的 store

##### Relay

- GraphQL mutation, 需要带上客户端变动 ID(WithClientMutationID)
- 在 GraphQL 与 Relay 间匹配变量名
- 设置宽松的查询与配置项

#### 文档

**Apollo:** [详细](https://www.apollographql.com/docs/react/), 还有图片!

**Relay:** [...写的一般](https://facebook.github.io/relay/docs/en/introduction-to-relay.html)

#### 开源状态(至 2020-05-05)

**Apollo:** https://github.com/apollostack/apollo-client

- Watchers: 313
- Stars: 13.7k
- Forks: 1.7k
- Open Issues: 525
- Pending PRs: 98

**Relay:** https://github.com/facebook/relay

- Watchers: 388

- Stars: 14.4k

- Forks: 1.4k

- Open Issues: 189

- Pending PRs: 29

### 尾声

归根结底, 决定权还是在你手里, 并需要根据项目类型来决定. Apollo 提供了更友好的开发者体验和将 GraphQL 接入到已有项目的工作效能. 尤其是在已有项目并非使用 React 的情况下.

而 Relay 则在移动端性能与评测表现上(Facebook 水平上)更有优势.

随着 GraphQL 的继续发展, 二者都有着庞大的社区专注支持自身, 来创建一个更好的网络世界. 所以你不必担心在使用其中之一的过程中出现严重的错误.

我的团队决定采用 Relay, 为什么? Relay 团队一直在努力完善一些主要特性, 并且[Relay 的未来](https://reactjs.org/blog/2016/08/05/relay-state-of-the-state.html)看起来也十分不错. 同时, 由于 Relay 和 GraphQL 都是由 Facebook 提出的, 我们认为任何 GraphQL 的更新都会由 Relay 更快的跟进.

现在, 做出你的选择吧: [Get started with Apollo](https://blog.apollographql.com/apollo-client-graphql-with-react-and-redux-49b35d0f2641) or [Get started with Relay](https://facebook.github.io/relay/docs/en/introduction-to-relay.html)

如果你需要更多可供阅读的文章, 可以参考上面给出的链接, 它们各自专注于某个特定的关于 GraphQL/Relay/Apollo 的话题. 同时, 也别忘记了关注下一篇介绍 Relay 与 Relay 2 之间的重大更新的文章!
