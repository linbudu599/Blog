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

    - [x] createAction: 有Payload则需要传入`props<T>()`

  - reducer

    - [x] initialState
      - [x] plain
      - [x] adapter
    - [x] FEATURE_KEY
    - [x] on(action, (state) => modifiedState)
    - [x] _reducer 与 reducer
    - [x] Feature State 注册

  - selectors

    - [x] createSelector((state) => state.a, (a) => a.b)

    - [x] with props

    - [x] createFeatureSelector()

    - [x] combination

    - [x] 重置缓存

    - [x] this.store.select() 与 this.store.pipe(selector())

      > 直接调用select可以不为Store传入泛型

    - [x] 对选取结果进一步的pipe处理

  - [x] Meta-Reducers (Mw in Redux)

  - [x] 注入式Reducer

  - [ ] facade

  - [x] effects

    - 类似于dva/icestore的使用方式, 监听到对应的action >>> 触发effect >>> 在effect完成后dispatch一个新的action(一般负责携带返回的数据填充store)
    - 同一组effect放在一个类中, 多个effect由xxx$ = this.actions$.pipe()的方式分别定义, 通常会注入service layer到类中
    - 在监听到action --- 派发新的action 中间, 可以任意使用RxJS的操作符来进行各种方便的操作(实际上从ofType开始也都是放在一个pipe中进行的)
    - 如果不使用service, 也可以直接使用@nrwl/angular提供的封装好的fetch方法, 里面内置了run onSuccess onError方法
    - effect类需要在EffectsModule中注册
    - EffectsModule同样也有forRoot和forFeature方法, 来约束module能进行的操作 
    - 如果在pipe中需要使用store中的数据, 可以使用` concatLatestFrom(action => this.store.select(fromBooks.getCollectionBookIds))`这种方式
    - 如果这是一个不需要dispatch(比如在pipe的最后使用tap判断下数据, 调用window.alert这种API)的effect, 可以在第二个参数传入dispatch: false

  - [x] RouterStore

    之前的react-router-redux, 现在的connected-react-router

    作用就是为了在路由切换周期内去自动的dispatch action, 或者说监听路由的状态. 通常会使用来自路由状态的数据进行一些额外的操作

    - setup: StoreModule.forRoot中的featureReducer和routerReducer(导出自'@ngrx/router-store'包), AppRoutingModule, StoreRouterConnectingModule, 均在全局AppModule中注册

    - 使用featureSelector + getSelectors, 获取来自于routerReducer专属的选择器

      ```typescript
      import { getSelectors, RouterReducerState } from '@ngrx/router-store';
      import { createFeatureSelector } from '@ngrx/store';
      
      export const selectRouter = createFeatureSelector<RouterReducerState>('router');
      
      export const {
        selectCurrentRoute, // select the current route
        selectFragment, // select the current route fragment
        selectQueryParams, // select the current route query params
        selectQueryParam, // factory function to select a query param
        selectRouteParams, // select the current route params
        selectRouteParam, // factory function to select a route param
        selectRouteData, // select the current route data
        selectUrl, // select the current url
      } = getSelectors(selectRouter);
      ```

    - 使用路由选择器进一步封装:

      ```typescript
      import { createFeatureSelector, createSelector } from '@ngrx/store';
      import { selectRouteParams } from '../router.selectors';
      import { carAdapter, CarState } from './car.reducer';
      
      export const carsFeatureSelector = createFeatureSelector<CarState>('cars');
      
      const { selectEntities, selectAll } = carAdapter.getSelectors();
      
      export const selectCarEntities = createSelector(
        carsFeatureSelector,
        selectEntities
      );
      
      export const selectCar = createSelector(
        selectCarEntities,
        selectRouteParams,
        (cars, { carId }) => cars[carId]
      );
      
      ```

  		将selectRouteParams和selectCarEntities组合起来, 就能够基于store和路由状态进行选择

  - [x] Entity

    用于管理集合类型的实体状态适配器

    - 减少用于创建管理model集合的模板代码, adapter中会提供getInitialState和getSelectors方法
    - 提供高性能CRUD操作来管理实体集合, addOne, addMany, updateOne, updateMany等

    ```typescript
    // 实体的全局状态
    // EntityState的泛型是集合中单个项的类型
    export interface BookEntityState extends EntityState<Book> {
      selectedBookId: string | null;
      globalProp: boolean;
    }
    
    // 集合主键的获取
    export const selectBookId = (book: Book): string => book.id;
    
    // 集合的排序依据
    export const sortByTitle = (bookA: Book, bookB: Book): number =>
      bookA.volumeInfo.title.localeCompare(bookB.volumeInfo.title);
    
    // 集合对应的适配器上提供了getInitialState getSelectors 以及集合的操作方法
    export const booksAdapter: EntityAdapter<Book> = createEntityAdapter<Book>({
      selectId: selectBookId,
      sortComparer: sortByTitle,
    });
    
    // 使用适配器的方法修改集合
    export const booksEntityReducer = createReducer(
      initialEntityState,
      on(addBookEntity, (state, { book }) => booksAdapter.addOne(book, state)),
      on(addBooksEntity, (state, { books }) => booksAdapter.addMany(books, state)),
      on(updateBookEntity, (state, { update }) =>
        booksAdapter.updateOne(update, state)
      ),
      on(updateBooksEntity, (state, { updates }) =>
        booksAdapter.updateMany(updates, state)
      )
    );
    
    export const getSelectedBookId = (state: BookEntityState) =>
      state.selectedBookId;
    
    // 供selector使用 进一步简化选择器代码
    export const {
      selectIds: selectBookIds,
      selectEntities: selectBookEntities,
      selectAll: selectAllBooks,
      selectTotal: selectTotalBooks,
    } = booksAdapter.getSelectors();
    
    // 首级选择器必须使用EntityState作为泛型
    export const selectBooksStateEntity = createFeatureSelector<fromBooks.BookEntityState>(
      'books'
    );
    
    export const selectBookIds = createSelector(
      selectBooksStateEntity,
      // 相当于fromBooks.selectBookIds(BooksState)
      fromBooks.selectBookIds
    );
    
    export const selectAllBook = createSelector(
      selectBooksStateEntity,
      fromBooks.selectAllBooks
    );
    export const selectUserTotal = createSelector(
      selectBooksStateEntity,
      fromBooks.selectTotalBooks
    );
    
    export const selectBookEntities = createSelector(
      selectBooksStateEntity,
      fromBooks.selectBookEntities
    );
    
    export const selectCurrentBookId = createSelector(
      selectBooksStateEntity,
      fromBooks.getSelectedBookId
    );
    
    export const selectCurrentBook = createSelector(
      selectBooksStateEntity,
      selectCurrentBookId,
      (bookEntities, bookId) => bookEntities[bookId]
    );
    
    ```

  - [x] ComponentStore

    - 和`@ngrx/store`是独立的, 但一起使用也不错,component-store中可以拿到全局store的数据.
    - 使用方法更简单, component-store内部就是select/updater/effect这几个方法.
      - select可以是防抖的, 通常会用一个附带的effect来搭配完成竞态等处理
      - updater分为setState和patchState
      - effect可以直接传入一个内部各种pipe最后返回值的函数,也可以再加一个依赖项
    - 使用场景:
      - 本地的UI状态, 以组件自治的思路划分
      - 让服务基于ComponentStore扩展, 并且把所有的相关逻辑都塞到服务里.
        - 可以直接以整个服务作为provider, 或者以ComponentStore作为provider.

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
    - forRoot
    - forFeature
  - StoreRouterConnectingModule

- EffectsModule

  - StoreDevtoolsModule

