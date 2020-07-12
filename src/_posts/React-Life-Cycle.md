---
category: Learning
tags:
  - Other
date: 2020-6-29
title: React V16.4生命周期初探
---

## React 16.4 生命周期详解

![img](https://user-gold-cdn.xitu.io/2020/6/26/172f0f5fe1dd926e?imageslim)

### 挂载阶段

#### constructor

- 初始化 state
- 对自定义方法绑定 this -> React 的合成事件机制，使得调用事件时并不是 instance.xxx，而是将事件收集起来分别注册，事件处理函数会被放在数组里，再去遍历执行。

#### static getDerivedStateFromProps

- 静态方法，所以无法获取到 this，也就意味着你不能去执行一些副作用。我感觉这也表达了 React 官方团队的思路：约束开发者，避免开发者自己坑自己。在以下场景中被调用：
  - 父组件传入的 props 变化
  - 组件调用 setState
  - forceUpdate
- 接收 nextProps 与 prevState，即你可以使用新的 props 与当前 state 来调整新的组件状态，返回的对象会被交给 setState 进行更新，如果不需要可以返回 null。
- 注意，在这里没有实例的 this，因此你不能`this.props.xxx !== nextProps.xxx`，而是需要在 state 里保存上一个 props，官方的解释是，这个方法在第一次调用时 prevProps 为 null，那么就需要每次判断，对性能有影响。

#### componentWillMount(UNSAFE)

- 在组件挂载（即 render 方法）之前被调用，所以在这里去执行 setState 不会引起额外的渲染。
- 不要在这里发起 Ajax 请求，首先，无论数据多快返回，都是在 render 后才会返回的。
- 这个生命周期是唯一会在 SSR 中被触发的，因此更不应该将 Ajax 请求或是异步 I/O 放在这里了。基于这些理由，请求数据更应该放在 DidMount 中。
- 如果在这里添加事件监听器或是订阅，componentWillUnmount 并不会确保被触发（如 SSR 中永远不会调用 unmount），只有在 componentDidMount 中绑定，React 才会确保 unmount 被调用，也就是它俩才是真 CP！
- 尤其是在引入了 Fiber 架构后，这个生命周期在 render 之前，因此有可能被打断然后多次调用，这就更可怕了。

#### render

- 核心方法，Class 组件中必须实现
- 当执行到这里，render 会检查 props 与 state，返回：

  - 原生 DOM 元素
  - React 组件 / Fragment
  - 字符串/数字/布尔值/null...
  - Portals

- render 函数应当只负责返回渲染内容，业务逻辑/数据请求应当使用别的生命周期来处理，如 DidMount 和 DidUpdate

#### componentDidMount

- 在组件挂载入 DOM 树后被调用，需要使用 DOM 节点的初始化方法以及网络请求都应该放在这里。
- 这里同样适用于添加订阅/监听，理由请参考上面。但是请记得在 unmount 里取消掉
- 在这里调用 setState 虽然会触发额外的渲染，但是会发生在屏幕被更新前，即用户不会看到更新状态。可以这么理解，挂载 -> mount -> didmount 更新 -> 渲染更新后的 DOM。这里可能涉及到 requestIdleCallback 的知识？

### 更新

> React 组件的更新通常指组件 props 变化 / 组件内部调用 setState / 手动调用 this.forceUpdate

#### componentWillReceiveProps（UNSAFE）

- 父组件传入 props 变动导致更新时，子组件并不一定需要进行更新，这个方法接收 prevProps 与 nextProps，并可以在其中 setState 更新状态来响应更新。
- 当父组件导致子组件重新渲染，即使 props 没有改变也会使得此方法被调用，因此需要进行 prev 与 next 值的比较，来确保其只在 props 更新时执行。
- 这个方法可能在一次更新中被调用多次（如存在副作用的情况）
- 使用 componentDidUpdate，确保每次更新只会调用一次，或是使用 getDerivedStateFromProps 与 componentDidUpdate 一同取代掉它。

#### getDerivedStateFromProps

- 不在赘述，记得这个方法会被调用的四个场景： 挂载、props 更新、setState、forceUpdate

#### shouldComponentUpdate

- 这个方法接收 nextProps 与 nextState，返回 true/false，并指示组件是否重新渲染
- 通常我们会把前后 props 与 state 分别进行比对，来减少重渲染以提高性能
- 官方提供的 PureComponent 在内部实现了 props 与 state 浅层比较（基于 shallowEuqal，可以去源码里看看这个方法）
- 首次渲染与 forceUpdate 并不会触发此方法
- 如果这个方法返回 false，那么就不会触发接下来的 WillUpdate & render & DidUpdate
- 官方提到在后续版本里，React 可能会将这个方法的返回值视为是否重渲染的参考而非指令，即有可能返回 false，但 React 认为有重渲染的必要，因而还是会进行重渲染。

#### componentWillUpdate (UNSAFE)

- 组件接受到新的 props 与 state 后，渲染之前，会调用这个方法，不应该在此方法中调用 setState 或是其他操作来更新组件。
- 通常这个方法的能力可以被 DidUpdate 替代，如果需要在此处获取到 DOM 信息，可以迁移到 getSnapshotBeforeUpdate 里。

#### render

#### getSnapshotBeforeUpdate

- 这个方法接收 prevProps 与 prevState，计算并返回 snapshot，在其中你可以获取到 DOM 信息。
- 它的执行时机是十分有用的，在 render 后，而在更新 DOM 之前才被调用，你可以确保在这里获取到的 DOM 信息是准确无误的。
- 这个方法返回的 snapshot 会被传入给 componentDidUpdate 并作为它的第三个参数，注意，即使你不想返回值，也请返回 null。并且这个方法必须和 DidUpdate 一同使用。
- snapshot 并不一定是 DOM 结构或是组件快照，它也可以是任何值。

#### componentDidUpdate

- 接收 prevProps prevState snapshot，会在更新后立刻被调用，但首次渲染不会被执行。
- 可用于操作 DOM、发起请求、setState，但一定要使用 if 语句控制如`if(this.props.xxx !== prevProps.xxx)`

### 卸载阶段

#### componentWillUnmount

- 在组件卸载销毁前调用，通常在这里清除计时器/订阅、取消请求，在这里调用 setState 没有意义。

### 错误相关

#### static getDerivedStateFromError

- 会在组件或是子组件抛出错误时调用，会接收捕获的错误，并返回一个值用于更新 state。
- 会在渲染阶段调用，因此不允许出现副作用。
- 可以在最外层使用 ErrorBoundry 组件，并基于这个方法来处理报错时的渲染。

#### componentDidCatch

- 接收 error info 参数，抛出的错误与组件错误栈信息。
- 可以执行副作用，你可以在这里上报错误。
