---
category: Learning
tags:
  - Other
date: 2020-6-29
title: 2020前端基础
---

## React 16.4生命周期详解

![img](https://user-gold-cdn.xitu.io/2020/6/26/172f0f5fe1dd926e?imageslim)

### 挂载阶段



#### constructor

- 初始化state
- 对自定义方法绑定this -> React的合成事件机制，使得调用事件时并不是instance.xxx，而是将事件收集起来分别注册，事件处理函数会被放在数组里，再去遍历执行。



#### static getDerivedStateFromProps

- 静态方法，所以无法获取到this，也就意味着你不能去执行一些副作用。我感觉这也表达了React官方团队的思路：约束开发者，避免开发者自己坑自己。在以下场景中被调用：
  - 父组件传入的props变化
  - 组件调用setState
  - forceUpdate
- 接收nextProps与prevState，即你可以使用新的props与当前state来调整新的组件状态，返回的对象会被交给setState进行更新，如果不需要可以返回null。
- 注意，在这里没有实例的this，因此你不能`this.props.xxx !== nextProps.xxx`，而是需要在state里保存上一个props，官方的解释是，这个方法在第一次调用时prevProps为null，那么就需要每次判断，对性能有影响。



#### componentWillMount(UNSAFE)

- 在组件挂载（即render方法）之前被调用，所以在这里去执行setState不会引起额外的渲染。
- 不要在这里发起Ajax请求，首先，无论数据多快返回，都是在render后才会返回的。
- 这个生命周期是唯一会在SSR中被触发的，因此更不应该将Ajax请求或是异步I/O放在这里了。基于这些理由，请求数据更应该放在DidMount中。
- 如果在这里添加事件监听器或是订阅，componentWillUnmount并不会确保被触发（如SSR中永远不会调用unmount），只有在componentDidMount中绑定，React才会确保unmount被调用，也就是它俩才是真CP！
- 尤其是在引入了Fiber架构后，这个生命周期在render之前，因此有可能被打断然后多次调用，这就更可怕了。



#### render

- 核心方法，Class组件中必须实现
- 当执行到这里，render会检查props与state，返回：
  - 原生DOM元素
  - React组件 / Fragment
  - 字符串/数字/布尔值/null...
  - Portals

- render函数应当只负责返回渲染内容，业务逻辑/数据请求应当使用别的生命周期来处理，如DidMount和DidUpdate



#### componentDidMount

- 在组件挂载入DOM树后被调用，需要使用DOM节点的初始化方法以及网络请求都应该放在这里。
- 这里同样适用于添加订阅/监听，理由请参考上面。但是请记得在unmount里取消掉
- 在这里调用setState虽然会触发额外的渲染，但是会发生在屏幕被更新前，即用户不会看到更新状态。可以这么理解，挂载 -> mount -> didmount更新 -> 渲染更新后的DOM。这里可能涉及到requestIdleCallback的知识？



### 更新

> React组件的更新通常指组件props变化 / 组件内部调用setState / 手动调用this.forceUpdate



#### componentWillReceiveProps（UNSAFE）

- 父组件传入props变动导致更新时，子组件并不一定需要进行更新，这个方法接收prevProps与nextProps，并可以在其中setState更新状态来响应更新。
- 当父组件导致子组件重新渲染，即使props没有改变也会使得此方法被调用，因此需要进行prev与next值的比较，来确保其只在props更新时执行。
- 这个方法可能在一次更新中被调用多次（如存在副作用的情况）
- 使用componentDidUpdate，确保每次更新只会调用一次，或是使用getDerivedStateFromProps与componentDidUpdate一同取代掉它。



#### getDerivedStateFromProps


- 不在赘述，记得这个方法会被调用的四个场景： 挂载、props更新、setState、forceUpdate


#### shouldComponentUpdate

- 这个方法接收nextProps与nextState，返回true/false，并指示组件是否重新渲染
- 通常我们会把前后props与state分别进行比对，来减少重渲染以提高性能
- 官方提供的PureComponent在内部实现了props与state浅层比较（基于shallowEuqal，可以去源码里看看这个方法）
- 首次渲染与forceUpdate并不会触发此方法
- 如果这个方法返回false，那么就不会触发接下来的WillUpdate & render & DidUpdate
- 官方提到在后续版本里，React可能会将这个方法的返回值视为是否重渲染的参考而非指令，即有可能返回false，但React认为有重渲染的必要，因而还是会进行重渲染。


#### componentWillUpdate (UNSAFE)

- 组件接受到新的props与state后，渲染之前，会调用这个方法，不应该在此方法中调用setState或是其他操作来更新组件。
- 通常这个方法的能力可以被DidUpdate替代，如果需要在此处获取到DOM信息，可以迁移到getSnapshotBeforeUpdate里。


#### render

#### getSnapshotBeforeUpdate

- 这个方法接收prevProps与prevState，计算并返回snapshot，在其中你可以获取到DOM信息。
- 它的执行时机是十分有用的，在render后，而在更新DOM之前才被调用，你可以确保在这里获取到的DOM信息是准确无误的。
- 这个方法返回的snapshot会被传入给componentDidUpdate并作为它的第三个参数，注意，即使你不想返回值，也请返回null。并且这个方法必须和DidUpdate一同使用。
- snapshot并不一定是DOM结构或是组件快照，它也可以是任何值。



#### componentDidUpdate

- 接收prevProps prevState snapshot，会在更新后立刻被调用，但首次渲染不会被执行。
- 可用于操作DOM、发起请求、setState，但一定要使用if语句控制如`if(this.props.xxx !== prevProps.xxx)`



### 卸载阶段

#### componentWillUnmount

- 在组件卸载销毁前调用，通常在这里清除计时器/订阅、取消请求，在这里调用setState没有意义。



### 错误相关

#### static getDerivedStateFromError

- 会在组件或是子组件抛出错误时调用，会接收捕获的错误，并返回一个值用于更新state。
- 会在渲染阶段调用，因此不允许出现副作用。
- 可以在最外层使用ErrorBoundry组件，并基于这个方法来处理报错时的渲染。



#### componentDidCatch

- 接收error info参数，抛出的错误与组件错误栈信息。
- 可以执行副作用，你可以在这里上报错误。
