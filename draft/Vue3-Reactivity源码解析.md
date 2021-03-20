---
category: Source
tags:
  - Vue3
date: 2021-2-21
title: Vue3 Reactivity源码解析
---

## 前言

> 本文进度
>
> - [ ] 源码阅读
> - [ ] 草稿
> - [ ] 文章

虽然感觉我是不会真的深入学Vue3了, 因为感觉可能Vue2.x带来的阴影一时半会没法消除, 并且最近学了Angular, 为啥同样是模板语法我就很喜欢Ng的, 难道是因为Ng可以用类写组件我感觉很geek? 小而美我有React, 大而全我有Angular, 偶尔换换口味还有Svelte, 应该是不会写多少Vue3代码了.

但是Vue3的Reactivity还是可以瞅瞅的, 毕竟之前没有怎么深入实践过Proxy相关, Immer源码里面的使用我也忘记的差不多了(说到这个, Immer源码我还没全部看完, 那个scope属实把我搞蒙了于是就放弃了)

- 可以使用 [gitzip](http://kinolien.github.io/gitzip/) 把Vue3 Reactivity部分的repo单独下载下来
- Reactivity中使用的`@vue/shared`模块你可以直接进入目录安装, 也可以用我附在最后的shared文件
- 阅读前请确保你了解相关API使用, 本文不会附带使用例子



## 进度

> 按照文件归类

- [ ] reactive
  - [x] reactive
  - [ ] readonly
  - [ ] shallow
  - [ ] ReactiveFlags & Target & TargetType related & proxyMap 
  - [x] createReactiveObject 对象
  - [x] createReactiveObject reactived
  - [ ] createReactiveObject collections
  - [ ] createReactiveObject readonly
  - [ ] createReactiveObject shallow
  - [ ] isReactive & isReadonly & isProxy & toRaw & markRaw
- [ ] ref
- [ ] baseHandler
  - [x] createGetter
  - [x] createSetter
  - [ ] arrayInstrumentations
  - [ ] other handlers
- [ ] collectionHandler
- [ ] computed
- [ ] effect
  - [ ] effect
  - [ ] stop
  - [ ] createReactiveEffect & ...
  - [ ] track
  - [ ] trigger
- [ ] operation



## 正文

Reactivity大概分为几个部分: 

- ref 接收单个参数值并转化为响应式ref对象 需要通过 `.value` 访问
- toRef & toRefs 将响应式对象的属性都转化为响应式ref对象
- reactive 获取对象的响应式代理
- readonly 获取对象的只读代理(即没有setter)
- shallow
  - shallowReactive & shallowReadonly 仅代理第一层对象
- effect
- computed
- 相关
  - isProxy & isReactive & isReadonly & isRef
  - toRaw & markRaw
  - unref
- ref高级API
  - customRef
  - shallowRef & triggerRef

