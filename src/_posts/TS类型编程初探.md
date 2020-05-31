---
category: Learning
tags:
  - Other
date: 2020-5-30
title: TypeScript 类型编程初探
---

## 类型守卫 & is 关键字

> 待更新

## 分布式条件类型

> 待更新

## 索引类型 & 映射类型 & infer 关键字

> 待更新

## 工具类型

工具类型实际上是 TS 官方提供的一些封装好的类型别名(`Type`), 它们接收数个泛型, 并对其进行一定处理后返回我们需要的类型, 最常使用到的工具类型有`Partical`与`ReturnType`等. 如果你之前没有使用过工具类型, 可以先从这两个最为基础的入手, 看看工具类型能做什么.

**`Partical`**

![Partical](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/111.png)

**`ReturnType`**

![ReturnType](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/222.png)

前者将一个接口的所有字段变为可选的, 后者则是获取到一个函数的返回类型. 事实上工具类型的底层实现大多并不复杂, 多数是依靠着前面提到的**索引类型 & 映射类型 & infer 关键字**等, 如`Partical`的实现即为:

```typescript
type Partial<T> = { [P in keyof T]?: T[P] };
```

但你应该也感觉到了, 使用一个易懂的类型别名替代这段逻辑, 会使得整体代码看起来清晰简洁. 实际使用中我们也会自己定义一些官方未提供的工具类型, 或是在已提供的工具类型上进行一些扩展, 再以`Partical`为例, 假设此时存在嵌套情况, 即某个字段的类型仍是一个接口, 你想将该接口的所有字段也变为可选的, 这时你就可以自己写一个`DeepPartical`类型:

```typescript
type DeepPartial<T> = {
  [U in keyof T]?: T[U] extends object ? DeepPartial<T[U]> : T[U]
};

interface INestState {
  propA: string;
  propB: IState;
}

type TNestState = DeepPartial<INestState>;

const nest: TNestState = {
  propA: "芜湖! 起飞!",
  propB: {
    name: "budu",
  },
};
```

到这里你应该对工具类型的实现与意义大致有个底了, 除了索引类型映射类型等, 我们通常还会用到这些`-`与`+`修饰符, 如`-?`代表将可选属性变为必选属性, `-readonly`属性代表将只读属性变为非只读属性.

下面我们可以来看看常用的内置工具类型是如何实现的了~

### Exclude

```typescript
type Exclude<T, U> = T extends U ? never : T;
```

`Exclude`接收两个类型参数, 并会返回 T 类型中在 U 类型也存在的字段(或者说可分配给 U 的):

![Exclude](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/333.png)

never 这个关键字在很多工具类型或是自定义工具类型中都有出现, 类型为 never 的字段将会被移除出类型, 因为其代表着永远也不会存在.

### Pick

```typescript
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
```

`Pick`类型就像 Lodash 的 pick 函数一样, 它从 T 中选择部分字段返回.

![Pick](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/444.png)

### Omit

`Omit`类型其实就是`Pick`与`Exclude`的协作:

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

![Omit](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/555.png)

`Omit`类型与`Pick`类型看起来就像是相反的, 它会剔除掉我们提供的字段, 实际上我们就可以像上面那样, 使用`Exclude`与`Pick`类型实现它.

### NoNullable

```typescript
type NonNullable<T> = T extends null | undefined ? never : T;
```

该工具类型会移除属性中的`null`与`undefined`值.

### Extract

```typescript
type Extract<T, U> = T extends U ? T : never;
```

可以看到, `Extract`和`Exclude`的三目运算符判断是相反的, 它俩也起着反作用. 它会返回 T 类型中去掉不可分配给 U 类型后的字段

![Extract](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/112.png)

### utility-types

官方提供的工具类型其实不多, 于是社区就涌现了[utility-types](https://github.com/piotrwitek/utility-types)这样提供更多场景下的工具类型的库, 我们可以在里面看看几个:

> 注意, 使用前需要先引入, 如`import { Intersection } from "utility-types";`

- Compute\<A>:

  `Compute`类型能够将交叉类型合并到一起:

  ```typescript
  type Compute<A extends any> = A extends Function
    ? A
    : { [K in keyof A]: A[K] };

  type Computed = Compute<{ x: "x" } & { y: "y" }>;
  /**
    {
      x: "x",
      y: "y"
    }
  */
  ```

- Merge<O1, O2>:

  `Merge`类型能够合并两个类型, 实际上其底层实现使用了`Compute`与`Omit`, 思路是使用`Omit`剔除掉 O2 中 O1 的字段后, 使用`Compute`进行合并.

  ```typescript
  type O1 = {
    name: string;
    id: number;
  };

  type O2 = {
    id: number;
    from: string;
  };

  type MergedO = Merge<O1, O2>; //{name id from}

  type Merge<O1 extends object, O2 extends object> = Compute<
    O1 & Omit<O2, keyof O1>
  >;
  ```

- Intersection<T, U>:

  `Intersection`能够提取两个类型的交集, 实际上是`Extract`和`Pick`的结合

  ```typescript
  type Props = {
    name: string;
    age: number;
    visible: boolean;
    method: Function;
  };

  type DefaultProps = { age: number; method: Function };

  // { age: number; }
  type DuplicatedProps = Intersection<Props, DefaultProps>;

  type Intersection<T extends object, U extends object> = Pick<
    T,
    Extract<keyof T, keyof U> & Extract<keyof U, keyof T>
  >;
  ```

  这个实现稍微复杂一些, 首先是`Extract<keyof T, keyof U> & Extract<keyof U, keyof T`这一步, 能够找出 T 与 U 共有的字段,然后再使用`Pick`将这些字段 pick 出来.

这个库还提供了许多实用的工具类型, 不论是使用还是借助其学习 TS 的类型编程都是不错的选择~
