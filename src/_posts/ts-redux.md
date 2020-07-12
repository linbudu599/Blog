---
category: Learning
tags:
  - TypeScript
date: 2020-4-22
title: Redux与TypeScript协作：越写越香
---

## 前言

- 写了太久`Dva`, 以至于突然发现自己要忘记基础的`Redux`使用了, 工具是很迷人, 但基础还是很重要. 基于`Redux`的数据流方案一套接一套, 但核心思想一直未曾变过.
- 不知道为啥我从未对`Redux`的规范感到不耐, `actionCreator`/`constants`/`reducer`/...我始终都觉得是有意义并有趣的. (我虽然比较皮但是被约束时还挺带劲?)
- 感觉博客不一定是要写新东西嘛, 偶尔复盘下也是不错的.
- 之前好像没有正式用`TypeScript`写过`Redux`相关代码, 因为是和`Dva`以及`Antd Pro`同步接触的, 于是特此摸索一篇.

## 正文

### 规范 store

我个人认为, 有必要对整个应用的 store 树做一个类型定义, 不仅是为了方便一眼看清整个 store 的数据流结构, 也是为了在后续使用`useSelector`一类 API 时对整体 state 约束.

`store/model.ts`, 你也可以写在`store/index.ts`中

```typescript
export interface IState1 {
  name: string;
  token: string;
  isValid: boolean;
  order: number;
}

export interface IState2 {
  company: string;
  companyId: string;
  job: string;
  jobId: string;
  isHighP: boolean;
}

export interface IGlobalState {
  state1: IState1;
  state2: IState2;
}
```

整个 store 拥有两颗"子树", 在本文中为节约篇幅只会对其中之一进行具体描述.

### 定义常量

`/store/state1/constants.ts`, 你不仅可以用它来存储`Action Types`

```typescript
export enum StateOneActionTypes {
  ACTION_ONE = "state1/ACTION_ONE",
  ACTION_TWO = "state1/ACTION_TWO",
  ACTION_THREE = "state1/ACTION_THREE",
}
```

推荐使用`Enum`来进行定义.

### 定义`Action Creators`

`/store/state1/action.ts`, 这里的重点逻辑是为`Action`定义接口, 以及合并接口为类型别名(供`Reducer`使用)

```typescript
import { StateOneActionTypes } from "./constants";
import { IState1 } from "../model";

export interface IOneMutationOne {
  type: StateOneActionTypes.ACTION_ONE;
  payload: IState1;
}

export interface IOneMutationTwo {
  type: StateOneActionTypes.ACTION_TWO;
  payload: IState1;
}

export const stateOneMutationOne: (state: IState1) => IOneMutationOne = (
  state
) => {
  console.log("stateOneMutationOne Action Creator");
  return {
    type: StateOneActionTypes.ACTION_ONE,
    payload: state,
  };
};

export const stateOneMutationTwo: (state: IState1) => IOneMutationTwo = (
  state
) => {
  console.log("stateOneMutationTwo Action Creator");
  return {
    type: StateOneActionTypes.ACTION_TWO,
    payload: state,
  };
};

export type StateOneAction = IOneMutationOne | IOneMutationTwo;
```

使用`payload`也是受到`Dva`的影响, 这样可以在后续方便的将载荷统一解构出来. 我感觉, 虽然多个`Action Creators`可能会有重复代码, 但还是最好隔离开来.

### 定义 Reducer

`/store/state1/reducer.ts`

```typescript
import { StateOneActionTypes } from "./constants";
import { IState1 } from "../model";
import { StateOneAction } from "./action";

export const initialState: IState1 = {
  name: "Linbudu",
  token: "ASDHJKL7DF63452894NF467255F",
  isValid: true,
  order: 1,
};

export function reducer(
  state: IState1 = initialState,
  { type, payload }: StateOneAction
): IState1 {
  switch (type) {
    case StateOneActionTypes.ACTION_ONE: {
      console.log(`${StateOneActionTypes.ACTION_ONE} Invoked With Payload:`);
      console.log(`${JSON.stringify(payload)}`);
      return {
        ...state,
        ...payload,
      };
    }
    case StateOneActionTypes.ACTION_TWO: {
      console.log(`${StateOneActionTypes.ACTION_TWO} Invoked With Payload:`);
      console.log(`${JSON.stringify(payload)}`);
      return {
        ...state,
        ...payload,
      };
    }
    default:
      return state;
  }
}
```

这里为了简化就没有去做什么真实的增删查改(其实就是懒), 主要是规范了入参`state`以及函数返回值`IState1`.

### 导出与合并

`store/state1/index.ts`

```typescript
import { reducer } from "./reducer";

export default reducer;
```

`store/index.ts`

```typescript
import { createStore, applyMiddleware, combineReducers } from "redux";

import stateOwnReducer from "./state1";

const reducer = combineReducers({
  state1: stateOwnReducer,
});

const store = createStore(reducer, applyMiddleware());

export default store;
```

(这里只把`state1`子树添加到了主`store`中, 也没有使用别的中间件)

### 使用

> 这里使用到了`useSelector`与`useDispatch`这两个`React-Redux`的 Hooks API, 我个人认为这会逐渐取代`mapStateToProps`与`mapDispatchToProps`. 如果你不了解这两个 API, 可以阅读我的[这篇博客](https://linbudu.top/posts/2020/02/20/关于useselector的一些思考.html)

`App.tsx`

```ts
import React, { useState, useEffect } from "react";
import { IGlobalState } from "./store/model";
import {
  stateOneMutationOne,
  stateOneMutationTwo,
} from "./store/state1/action";
import { useSelector, useDispatch } from "react-redux";
import "./App.css";

function App() {
  const data = useSelector(({ state1 }: IGlobalState) => {
    return {
      ...state1,
    };
  });

  const { name, token, isValid, order } = data;
  return (
    <div className="App">
      <p>Redux & TypeScript</p>
      <p>
        {name}, {token}, {isValid ? "true" : "false"}, {order}
      </p>
    </div>
  );
}

export default App;
```

能够正确打印出结果:

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200422111406.png)

尝试`dispatch`一个`action`:

```tsx
function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(
      stateOneMutationOne({
        name: "Penumbra",
        token: "ASDHJKL7DF63452894NF467255F",
        isValid: false,
        order: 6,
      })
    );
  }, []);

  return <>{/* TSX */}</>;
}

export default App;
```

在控制台查看结果:

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200422111625.png)

妥了!

## 总结

我个人认为, 这一套"繁琐"的模板代码和`TypeScript`绝不是多此一举, 二者从两个不同的角度去约束继而帮助开发者写出健壮的易于维护的代码, 繁琐的模板代码避免了开发者犯下"拼错 action type"/"没有通过 dispatch"之类的错误, 而`TypeScript`则用强大的类型系统把奇奇怪怪的`undefined`之类的错误挡在门外.

(TypeScript 真香)
