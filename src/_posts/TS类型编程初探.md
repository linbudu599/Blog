---
category: Learning
tags:
  - Other
date: 2020-5-30
title: TypeScript 类型编程初探
---

## 条件类型

TypeScript 在 2.8 版本以后引入了 **条件类型** 的设定, 使得我们不用再把类型写死了, 条件类型会在获得需要的条件之后确定自己的类型, 最常使用的条件类型语法是这样的:

`T extends U ? TypeA : TypeB`

这与三目运算符的逻辑相同, 即当 T 能够赋值给 U 时, 取类型 A, 否则取类型 B. 关于 **T 赋给 U**这里, 其实我觉得可以真的理解为继承, 即 U 的属性 T 都有, 但 T 中的属性 U 不一定都有.

如:

```typescript
// number
type WhatAmI = string | number extends string ? string : number;
```

当然, 这里的 T 和 U 还可能是接口或者类型别名之类的. 以一个使用条件类型作为函数返回值签名的例子为例:

```typescript
declare function f<T extends boolean>(x: T): T extends true ? string : number;

// 条件不足 只能推断出来 string | number
const x = f(Math.random() < 0.5);
// number
const y = f(false);
// string
const z = f(true);
```

条件类型只有当获得的条件足够丰富, 才能够得到确切的类型.

### 分布式有条件类型

条件类型中有一个特殊的家伙, **分布式有条件类型**, 它有啥作用呢, 按照官方文档的说法,
**分布式有条件类型在实例化时会自动分发成联合类型**, 同时 **分布式有条件类型** 成立的前提是其类型参数符合 **裸类型参数(Naked Type Parameter)**, 也就是说在你使用条件类型时传入的参数没有被数组/元组/函数/类/Promise..所包裹, 以`T extends U ? TypeA : TypeB`为例, T 与 U 都需要满足裸类型参数的要求, 才会实现分布式条件类型.

```typescript
type NakedUsage<T> = T extends boolean ? "YES" : "NO";

type WrappedUsage<T> = [T] extends [boolean] ? "YES" : "NO";
```

那么分布式条件类型的作用是什么? 直接理解官方的解释未免太过拗口, 我们直接来写写例子:

```typescript
type Distributed = NakedUsage<number | boolean>; //  = NakedUsage<number> | NakedUsage<boolean> =  "NO" | "YES"

type NotDistributed = WrappedUsage<number | boolean>; // "NO"
```

很明显的一个区别, `NakedUsage`在使用时, 传入的类型参数会被分别进行判断, 即分发到`NakedUsage<number> | NakedUsage<boolean>`, 再通过分别判断得到的值确定最终结果.

而`WrappedUsage`, 由于类型参数被包裹在元组内, 因此在使用时只会进行一次判断, 也就不会进行**分发**

### 条件类型与映射类型协作

如果你阅读过一些 ts 写的库/框架源码, 你会发现 **泛型** / **映射类型** / **条件类型** 就像是绑在一起的三兄弟, 经常一同出现. 以一道思考题为例:

```typescript
interface Part {
  id: number;
  name: string;
  subparts?: Part[];
  updatePart(newName: string): void;
}

// 设计一个工具类型, 将接口中类型为函数的值取出来 即 type R = "updatePart"
type R = FunctionPropertyNames<Part>;
```

思路是这样的, 我们新建一个接口, 使用旧的`interface`的字段, 再使用`[keyof T]`与`T[K]`取得字段的类型值, 判断这个类型值是否能`extends Function`:

```typescript
type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? K : never
}[keyof T];

// 类型R的值为接口Part的键, 因此需要再`[keyof T]`取出值来
type R = {
  id: never;
  name: never;
  subparts: never;
  updatePart: "updatePart";
};
```

## 索引类型 & 映射类型 & infer 关键字

这三者是 TypeScript 类型编程的关键基础, 因此如果想要写出漂亮又强大的泛型或是用类型编程玩出花来, 这是必不可少的.

### 索引类型

我相信我们应该都写过这样的代码:

```typescript
interface ISomething {
  [key: string]: string;
}
```

我个人认为这也可以算是索引类型的一种体现. 索引类型又分 **索引类型查询操作符** 与 **索引类型访问操作符**. 前者通常是这么用的:

```typescript
interface IWorker {
  name: string;
  age: string;
  work: string;
}

type workerProps = keyof IWorker; // "name" | "age" | "work"
```

也就是说, 它是 某个接口(也可以是类型别名甚至类, 以下统一使用接口进行举例)的属性值构成的 联合类型, 其值是以字面量类型的形式存在的. 既然我们能拿到某个接口的所有字段了, 那么再迈一步, 我们就可以使用这个字段去获取到该字段对应的类型, 如`name`的类型为`string`. 即使用访问操作符, 如:

```typescript
// string | number | boolean
type workerPropsType = IWorker[workerProps];
```

索引类型我个人常用于函数部分的泛型处理, 以一个类似 lodash 中 pick 的函数为例:

```typescript
function pick<T, K extends keyof T>(o: T, names: K[]): T[K][] {
  return names.map((n) => o[n]);
}

const res = pick(user, ["token", "id"]);
```

### 映射类型

映射类型的语法为 `[K in Keys]`, 其中 `K` 会依次绑定到每个属性(即依次以每个属性为值), `Keys`即为字符串字面量构成的联合类型, 也即是上面索引类型查询操作符`keyof`的结果.

考虑这样一个场景, 当前有一个接口, 有数十个字段, 现在需要以这个接口为基础再创建一个接口, 变动就是所有字段都变为可选的, 该如何实现? 根据上面映射类型的定义, 我们很容易想到类似`{K?:T[K]}`的写法:

```typescript
interface IUser {
  name: string;
  age: number;
  work: boolean;
}

type Partial<T> = { [K in keyof T]?: T[K] };

// { name?: string; ...}
type IPartialUser = Partial<IUser>;
```

这样的写法的确需要一定的理解成本, 因为 K 实际上是依次绑定到每个属性的, 你可以联想到 JavaScript 中的`map`函数. 类似的, 我们还可以用这种语法为每个字段添加/去掉`readonly`属性等等.

### infer 关键字

> 待处理

## 工具类型

工具类型实际上是 TS 官方提供的一些封装好的类型别名(`Type`), 它们接收数个泛型, 并对其进行一定处理后返回我们需要的类型, 最常使用到的工具类型有`Partical`(其实就是上面实现的那个将接口字段全部变为可选的类型别名)与`ReturnType`等. 如果你之前没有使用过工具类型, 可以先从这两个最为基础的入手, 看看工具类型能做什么.

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
