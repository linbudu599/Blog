---
category: Record
tags:
  - RxJS
  - Angular
date: 2021-2-28
title: NgRx 快速入门(WIP)
---

## 前言

> 本文进度
>
> - [ ] 完成NgRx基本的文档阅读
> - [ ] 将对应的代码整理到 Nx-Todo-App > NgRx-Practice 中
> - [ ] 比对Redux系列中的库
> - [ ] 草稿
> - [ ] 讲人话, 发文章, 西内!

是的, 我又发现了一个很好玩的东西! Redux + Redux-Saga + Connected-React-Router + RxJS + Angular = NgRx!

Flux式的数据流, 同样是action >>> reducer >>> Immutable State, 但又有很多差异, 这些差异主要集中在写法上, 比如内置了createAction createSelector(功能非常强答) createEffect等等这些API, 类型提示非常舒服. 整体思路是和在React中使用Redux差不多的, 主要是把思路更换到Angular + RxJS会花费一点时间.

这篇文章简单记录下入门过程中的学习:

- 基础概念

  - action
    - createAction: 有Payload则需要传入`props<T>()`
  - reducer
    - initialState
      - plain
      - adapter
    - FEATURE_KEY
    - on(action, (state) => modifiedState)
    - _reducer 与 reducer
    - [ ] Feature State 注册
  - effects
  - selectors
    - createSelector((state) => state.a, (a) => a.b)
    - createFeatureSelector()
    - combination
    - [ ] 重置缓存
    - [ ] this.store.select() 与 this.store.pipe(selector())
    - [ ] 对选取结果进一步的pipe处理
  - [ ] Meta-Reducers (Mw in Redux)
  - [ ] 注入式Reducer
  - facade
  - [ ] effects
  - [ ] RouterStore
  - [ ] Adapter
  - [ ] ComponentStore
  - [ ] Data
  - [ ] View
  - models: 作为其他文件的类型定义

- Nx

  - ` ng g @nrwl/angular:ngrx counter --module=apps/ngrx-practice/src/app/app.module.ts --root `
  - `ng g @nrwl/angular:lib products`
  - `ng g @nrwl/angular:ngrx products --module=libs/products/src/lib/products.module.ts --directory +state/products --defaults`
  - --root: 设置Store / Effects / Router-Store / DevTools 等
  - --syntax:
  - --facade: 

- Ng注册

  - StoreModule
  - StoreRouterConnectingModule
  - EffectsModule
  - StoreDevtoolsModule

  