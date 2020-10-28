---
category: Tutorial
tags:
  - TypeScript
date: 2020-10-19
title: TypeScript的另一面-类型编程
---

![](https://juejin-article-img.oss-cn-hangzhou.aliyuncs.com/jerry-zhang-Y8lCoTRgHPE-unsplash_20201020195742.jpg)

## 前言

作为前端开发的趋势之一，TypeScript 正在越来越普及，很多人像我一样写了 TS 后再也回不去了，比如写算法题写 demo 都用 TS，JS 只有在 Webpack 配置（实际上这也可以用 TS 写）等少的可怜的情况下才会用到（有了`ts-node`后，我连爬虫都用 ts 写了）。

TS 的学习成本实际上并不高（的确是，具体原因我在下面会讲，别急着锤我），我个人认为它可以被分成两个部分：

- 预实现的 ES 提案，如 装饰器（我之前的一篇文章 [走近 MidwayJS：初识 TS 装饰器与 IoC 机制](https://juejin.im/post/6859314697204662279) 中讲了一些关于 TS 装饰器的历史， 有兴趣的可以看看）， 可选链`?.` ，空值合并运算符`??`，类的私有成员`private`等。除了部分语法如装饰器以外，大部分的预实现实际上就是未来的 ES 语法。对于这一部分来说，无论你先前是只学习过 JS（就像我一样），还是有过 Java、C#的使用经历，都能非常快速地上手，这也是实际开发中使用最多的部分，毕竟和另一块-**类型编程**比起来，还是这一部分更接地气。
- 类型编程，无论是一个普通接口(`interface`)或是类型别名`type`，还是密密麻麻的`extends` `infer` 工具类型 blabla...（下文会展开介绍），我个人认为都属于类型编程的范畴。这一块实际上对代码的功能层面没有任何影响，即使你把它写成 anyscript，代码该咋样还是咋样。而这也就是类型编程一直不受到太多重视的原因：相比于语法，它会带来代码量大大增多（可能接近甚至超过业务代码），编码耗时增长（头发--）等问题，而带来的唯一好处就是 **类型安全** ， 包括如臂使指的类型提示（**VS Code YES!**），进一步减少可能存在的调用错误，以及降低维护成本。看起来似乎有得有失，但实际上，假设你花费 1 单位脑力使用基础的 TS 以及简单的类型编程，你就能够获得 5 个单位的回馈。但接下来，有可能你花费 10 个单位脑力，也只能再获得 2 个单位的回馈。另外一个类型编程不受重视的原因则是实际业务中并不会需要多么苛刻的类型定义，通常是底层框架类库才会有此类需求，这一点就见仁见智了，但我想没人会想永远当业务仔吧（没有阴阳怪气的意思）。

正文部分包括：

- **基础泛型**
- **索引类型 & 映射类型**
- **条件类型 & 分布式条件类型**
- **infer 关键字**
- **类型守卫 is in 关键字**
- **内置工具类型机能与原理**
- **内置工具类型增强**
- **更多通用工具类型**

这些名词可能看着有点劝退，但我会尽可能描述的通俗易懂，让你在阅读时不断发出“就这？”的感慨:)

> 为了适配所有基础的读者，本文会讲解的尽可能细致，如果你已经熟悉某部分知识，请跳过~

## 泛型 Generic Type

假设我们有这么一个函数：

```typescript
function foo(args: unknown): unknown { ... }
```

如果它接收一个字符串，返回这个字符串的部分截取，如果接收一个数字，返回这个数字的 n 倍，如果接收一个对象，返回键值被更改过的对象（键名不变），如果这时候需要类型定义，是否要把`unknown`替换为`string | number | object`？ 这样固然可以，但别忘记我们需要的是 **入参与返回值类型相同** 的效果。这个时候泛型就该登场了，泛型使得代码段的类型定义**易于重用**（比如我们上面提到的场景又多了一种接收布尔值返回布尔值的场景后的修改），并提升了**灵活性**与严谨性:

> 工程层面当然不会写这样的代码了... 但就当个例子看吧 hhh

```typescript
function foo<T>(arg: T): T {
  return arg;
}
```

我们使用`T`来表示一个未知的类型，它是入参与返回值的类型，在使用时我们可以显示指定泛型:

```typescript
foo<string>("linbudu");
const [count, setCount] = useState<number>(1);
```

当然也可以不指定，因为 TS 会自动推导出泛型的实际类型。

> 泛型在箭头函数下的书写：
>
> ```typescript
> const foo = <T>(arg: T) => arg;
> ```
>
> 如果你在 TSX 文件中这么写，`<T>`可能会被识别为 JSX 标签，因此需要显式告知编译器：
>
> ```typescript
> const foo = <T extends {}>(arg: T) => arg;
> ```

除了用在函数中，泛型也可以在类中使用：

```typescript
class Foo<T, U> {
  constructor(public arg1: T, public arg2: U) {}

  public method(): T {
    return this.arg1;
  }
}
```

泛型除了单独使用，也经常与其他类型编程语法结合使用，可以说泛型就是 TS 类型编程最重要的基石。单独对于泛型的介绍就到这里（因为单纯的讲泛型实在没有什么好讲的），在接下来我们会讲解更多泛型的~~高级~~使用技巧。

## 索引类型与映射类型

在阅读这一部分前，你需要做好思维转变的准备，需要认识到 **类型编程实际也是编程**，因此你可以将一部分编程思路复用过来。我们实现一个简单的函数：

```typescript
// 假设key是obj键名
function pickSingleValue(obj, key) {
  return obj[key];
}
```

思考要为其进行类型定义的话，有哪些需要定义的地方？

- 参数`obj`
- 参数`key`
- 返回值

这三样之间是否存在关联？

- `key`必然是`obj`中的键值名之一，一定为`string`类型
- 返回的值一定是**obj 中的键值**

因此我们初步得到这样的结果：

```typescript
function pickSingleValue<T>(obj: T, key: keyof T) {
  return obj[key];
}
```

`keyof` 是 **索引类型查询**的语法， 它会返回后面跟着的类型参数的键值组成的字面量类型（`literal types`），举个例子：

```typescript
interface foo {
  a: number;
  b: string;
}

type A = keyof foo; // "a" | "b"
```

> 字面量类型是对类型的进一步限制，比如你的状态码只可能是 0/1/2，那么你就可以写成`status: 0 | 1 | 2`的形式。字面量类型包括**字符串字面量**、数字字面量、**布尔值字面量**。

还少了返回值，如果你此前没有接触过此类语法，应该会卡住，我们先联想下`for...in`语法，通常遍历对象会这么写：

```typescript
const fooObj: foo = { a: 1, b: "1" };

for (const key in fooObj) {
  console.log(key);
  console.log(fooObj[key as keyof foo]);
}
```

和上面的写法一样，我们拿到了 key，就能拿到对应的 value，那么 value 的类型也就不在话下了：

```typescript
function pickSingleValue<T>(obj: T, key: keyof T): T[keyof T] {
  return obj[key];
}
```

> 伪代码解释下：
>
> ```typescript
> interface T {
>   a: number;
>   b: string;
> }
>
> type TKeys = keyof T; // "a" | "b"
>
> type PropAType = T["a"]; // number
> ```
>
> 你用键名可以取出对象上的键值，自然也就可以取出接口上的键值（也就是类型）啦~

但这种写法很明显有可以改进的地方：`keyof`出现了两次，以及泛型 T 应该被限制为对象类型，就像我们平时会做的那样：用一个变量把多处出现的存起来，**在类型编程里，泛型就是变量**。

```typescript
function pickSingleValue<T extends object, U extends keyof T>(
  obj: T,
  key: U
): T[U] {
  return obj[key];
}
```

这里又出现了新东西`extends`... 它是啥？你可以暂时把`T extends object`理解为**T 被限制为对象类型**，`U extends keyof T`理解为**泛型 U 必然是泛型 T 的键名组成的联合类型（以字面量类型的形式）**。具体的知识我们会在下一节条件类型讲到。

假设现在我们不只要取出一个值了，我们要取出一系列值：

```typescript
function pick<T extends object, U extends keyof T>(obj: T, keys: U[]): T[U][] {
  return keys.map((key) => obj[key]);
}

// pick(obj, ['a', 'b'])
```

有两个重要变化：

- `keys: U[]` 我们知道 U 是 T 的键名组成的联合类型，那么要表示一个内部元素均是 T 键名的数组，就可以使用这种方式，具体的原理请参见下文的 **分布式条件类型** 章节。
- `T[U][]` 它的原理实际上和上面一条相同，之所以单独拿出来是因为我认为它是一个很好地例子：简单的表现了 TS 类型编程的组合性，你不感觉这种写法就像搭积木一样吗？

### 索引签名 Index Signature

索引签名用于快速建立一个内部字段类型相同的接口，如

```typescript
interface Foo {
  [keys: string]: string;
}
```

那么接口 Foo 就被认定为字段全部为 string 类型。

值得注意的是，由于 JS 可以同时通过数字与字符串访问对象属性，因此`keyof Foo`的结果会是`string | number`。

> ```typescript
> const o: Foo = {
>   1: "芜湖！",
> };
>
> o[1] === o["1"];
> ```

但是一旦某个接口的索引签名类型为`number`，那么它就不能再通过字符串索引访问，如`o['1']`这样。

### 映射类型 Mapped Types

映射类型同样是类型编程的重要底层组成，通常用于在旧有类型的基础上进行改造，包括接口包含字段、字段的类型、修饰符（readonly 与?）等等。

从一个简单场景入手：

```typescript
interface A {
  a: boolean;
  b: string;
  c: number;
  d: () => void;
}
```

现在我们有个需求，实现一个接口，它的字段与接口 A 完全相同，但是其中的类型全部为 string，你会怎么做？直接重新声明一个然后手写吗？我们可是聪明的程序员诶，那必不可能这么笨。如果把接口换成对象再想想，其实很简单，new 一个新对象，然后遍历 A 的键名（`Object.keys()`）来填充这个对象。

```typescript
type StringifyA<T> = {
  [K in keyof T]: string;
};
```

是不是很熟悉？重要的就是这个`in`操作符，你完全可以把它理解为就是`for...in`，也就是说你还可以获取到接口键值类型，比如我们复制接口！

```typescript
type Clone<T> = {
  [K in keyof T]: T[K];
};
```

掌握这种思路，其实你已经接触到一些工具类型的底层实现了：

> 你可以把工具类型理解为**你平时放在 utils 文件夹下的公共函数，提供了对公用逻辑（在这里则是类型编程逻辑）的封装**，比如上面的两个类型接口就是~

先写个最常用的`Partial`尝尝鲜，工具类型的详细介绍我们会在专门的章节展开：

```typescript
// 将接口下的字段全部变为可选的
type Partial<T> = {
  [K in keyof T]?: T[k];
};
```

是不是特别简单，让你已经脱口而出“就这！”，类似的，还可以实现个`Readonly`，把接口下的字段全部变为只读的。

索引类型、映射类型相关的知识我们暂且介绍到这里，要真正理解它们的作用，还需要好好梳理下，建议你看看自己之前项目的类型定义有没有可以优化的地方。

## 条件类型 Conditional Types

条件类型的语法实际上就是三元表达式：

```typescript
T extends U ? X : Y
```

> 如果你觉得这里的 extends 不太好理解，可以暂时简单理解为 U 中的属性在 T 中都有。

因此条件类型理解起来更直观，唯一需要有一定理解成本的就是 **何时条件类型系统会收集到足够的信息来确定类型**，也就是说，条件类型有可能不会被立刻完成判断。

在了解这一点前，我们先来看看条件类型常用的一个场景：**泛型约束**，实际上就是我们上面的例子：

```typescript
function pickSingleValue<T extends object, U extends keyof T>(
  obj: T,
  key: U
): T[U] {
  return obj[key];
}
```

这里的`T extends object`与`U extends keyof T`都是泛型约束，分别**将 T 约束为对象类型**和将 U 约束为 T 键名的字面量联合类型。我们通常使用泛型约束来**“使得泛型收窄”**。

以一个使用条件类型作为函数返回值类型的例子：

```typescript
declare function strOrnum<T extends boolean>(
  x: T
): T extends true ? string : number;
```

在这种情况下，条件类型的推导就会被延迟（deferred），因为此时类型系统没有足够的信息来完成判断。

只有给出了所需信息（在这里是 x 值），才可以完成推导。

```typescript
const strReturnType = strOrNum(true);
const numReturnType = strOrNum(false);
```

同样的，就像三元表达式可以嵌套，条件类型也可以嵌套，如果你看过一些框架源码，也会发现其中存在着许多嵌套的条件类型，无他，条件类型可以将类型约束收拢到非常精确的范围内。

```typescript
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends Function
  ? "function"
  : "object";
```

### 分布式条件类型 Distributive Conditional Types

官方文档对分布式条件类型的讲解内容甚至要多于条件类型，因此你也知道这玩意没那么简单了吧~ 分布式条件类型实际上不是一种特殊的条件类型，而是其特性之一。概括地说，就是 **对于属于裸类型参数的检查类型，条件类型会在实例化时期自动分发到联合类型上**

> 原文: _Conditional types in which the checked type is a **naked type parameter** are called distributive conditional types. Distributive conditional types are automatically **distributed over union types** during instantiation_

先提取几个关键词，然后我们再通过例子理清这个概念：

- **裸类型参数**
- **实例化**
- **分发到联合类型**

```typescript
// 使用上面的TypeName类型别名

// "string" | "function"
type T1 = TypeName<string | (() => void)>;

// "string" | "object"
type T2 = TypeName<string | string[]>;

// "object"
type T3 = TypeName<string[] | number[]>;
```

我们发现在上面的例子里，条件类型的推导结果都是联合类型（T3 实际上也是，只不过相同所以被合并了），并且就是类型参数被依次进行条件判断的结果。

是不是 get 到了一点什么？我们再看另一个例子：

```typescript
type Naked<T> = T extends boolean ? "Y" : "N";
type Wrapped<T> = [T] extends [boolean] ? "Y" : "N";

/*
 * 先分发到 Naked<number> | Naked<boolean>
 * 然后到 "N" | "Y"
 */
type Distributed = Naked<number | boolean>;

/*
 * 不会分发 直接是 [number | boolean] extends [boolean]
 * 然后是"N"
 */
type NotDistributed = Wrapped<number | boolean>;
```

现在我们可以来讲讲这几个概念了：

- 裸类型参数，没有额外被接口/类型别名包裹过的，就像被`Wrapped`包裹后就不能再被称为裸类型参数。
- 实例化，其实就是条件类型的判断过程，在这里两个例子的实例化过程实际上是不同的，具体会在下一点中介绍。
- 分发至联合类型的过程：
  - 对于 TypeName，它内部的类型参数 T 是没有被包裹过的，所以`TypeName<string | (() => void)>`会被分发为`TypeName<string> | TypeName<(() => void)>`，然后再次进行判断，最后分发为`"string" | "function"`。
  - 抽象下具体过程：
    ```typescript
    ( A | B | C ) extends T ? X : Y
    // 相当于
    (A extends T ? X : Y) | (B extends T ? X : Y) | (B extends T ? X : Y)
    ```

    ```

一句话概括：**没有被额外包装的联合类型参数，在条件类型进行判定时会将联合类型分发，分别进行判断。**

## infer 关键字

`infer`是`inference`的缩写，通常的使用方式是`infer R`，`R`表示 **待推断的类型**。通常`infer`不会被直接使用，而是被放置在底层工具类型中，需要在条件类型中使用。看一个简单的例子，用于获取函数返回值类型的工具类型`ReturnType`:

```typescript
const foo = (): string => {
  return "linbudu";
};

// string
type FooReturnType = ReturnType<typeof foo>;
```

`infer`的使用思路可能不是那么好习惯，我们可以用前端开发中常见的一个例子类比，页面初始化时先显示占位交互，像 Loading/骨架屏，在请求返回后再去渲染真实数据。`infer`也是这个思路，**类型系统在获得足够的信息后，就能将 infer 后跟随的类型参数推导出来**，最后返回这个推导结果。

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
```

类似的，借着这个思路我们还可以获得函数入参类型、类的构造函数入参类型、Promise 内部的类型等，这些工具类型我们会在后面讲到。

infer 其实没有特别难消化的知识点，它需要的只是思路的转变，你要理解 **延迟推断** 的概念。

## 类型守卫 与 is in 关键字 Type Guards

前面的内容可能不是那么符合人类直觉，需要一点时间消化，这一节我们来看点简单（相对）且直观的知识点：类型守卫。

假设有这么一个字段，它可能字符串也可能是数字：

```typescript
numOrStrProp: number | string;
```

现在在使用时，你想将这个字段的联合类型缩小范围，比如精确到`string`，你可能会这么写：

```typescript
export const isString = (arg: unknown): boolean => typeof arg === "string";
```

看看这么写的效果：

```typescript
function useIt(numOrStr: number | string) {
  if (isString(numOrStr)) {
    console.log(numOrStr.length);
  }
}
```

![image](https://juejin-article-img.oss-cn-hangzhou.aliyuncs.com/image_20201020135440.png)

啊哦，看起来`isString`函数并没有起到缩小类型范围的作用，参数依然是联合类型。这个时候就该使用`is`关键字了：

```typescript
export const isString = (arg: unknown): arg is string =>
  typeof arg === "string";
```

这个时候再去使用，就会发现在`isString(numOrStr)`为 true 后，`numOrStr`的类型就被缩小到了`string`。这只是以原始类型为成员的联合类型，我们完全可以扩展到各种场景上，先看一个简单的假值判断：

```typescript
export type Falsy = false | "" | 0 | null | undefined;

export const isFalsy = (val: unknown): val is Falsy => !val;
```

是不是还挺有用？这应该是我日常用的最多的类型别名之一了。

也可以在 in 关键字的加持下，进行更强力的类型判断，思考下面这个例子，要如何将 " A | B " 的联合类型缩小到"A"？

```typescript
class A {
  public a() {}

  public useA() {
    return "A";
  }
}

class B {
  public b() {}

  public useB() {
    return "B";
  }
}
```

再联想下`for...in`循环，它遍历对象的属性名，而`in`关键字也是一样：

```typescript
function useIt(arg: A | B): void {
  if ("a" in arg) {
    arg.useA();
  } else {
    arg.useB();
  }
}
```

再看一个使用字面量类型作为类型守卫的例子：

```typescript
interface IBoy {
  name: "mike";
  gf: string;
}

interface IGirl {
  name: "sofia";
  bf: string;
}

function getLover(child: IBoy | IGirl): string {
  if (child.name === "mike") {
    return child.gf;
  } else {
    return child.bf;
  }
}
```

之前有个小哥问过一个问题，我想很多用 TS 写接口的小伙伴可能都遇到过，即登录与未登录下的用户信息是完全不同的接口：

```typescript
interface IUserProps {
  isLogin: boolean;
  name: string; // 用户名称仅在登录时有
  from: string; // 用户来源（一般用于埋点），仅在未登录时有
}
```

这种时候使用**字面量类型守卫**：

```typescript
function getUserInfo(user: IUnLogin | ILogined): string {
  return user.isLogin ? user.id : user.from;
}
```

还可以使用`instanceof`来进行实例的类型守卫，建议聪明的你动手尝试下~

## 工具类型 Tool Type

这一章是本文的最后一部分，应该也是本文“性价比”最高的一部分了，因为即使你还是不太懂这些工具类型的底层实现，也不影响你把它用好。就像 Lodash 不会要求你每用一个函数就熟知原理一样。这一部分包括**TS 内置工具类型**与社区的**扩展工具类型**，我个人推荐在完成学习后记录你觉得比较有价值的工具类型，并在自己的项目里新建一个`.d.ts`文件存储它。

> **在继续阅读前，请确保你掌握了上面的知识，它们是类型编程的基础**

### 内置工具类型

在上面我们已经实现了内置工具类型中被使用最多的一个:

```typescript
type Partial<T> = {
  [K in keyof T]?: T[k];
};
```

它用于将一个接口中的字段变为全部可选，除了映射类型以外，它只使用了`?`可选修饰符，那么我现在直接掏出小抄（好家伙）：

- 去除可选修饰符：`-?`
- 只读修饰符：`readonly`
- 去除只读修饰符：`-readonly`

恭喜，你得到了`Required`和`Readonly`（去除 readonly 修饰符的工具类型不属于内置的，我们会在后面看到）:

```typescript
type Required<T> = {
  [K in keyof T]-?: T[K];
};

type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

在上面我们实现了一个 pick 函数：

```typescript
function pick<T extends object, U extends keyof T>(obj: T, keys: U[]): T[U][] {
  return keys.map((key) => obj[key]);
}
```

照着这种思路，假设我们现在需要从一个接口中挑选一些字段：

```typescript
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 期望用法
type Part = Pick<A, "a" | "b">;
```

还是映射类型，只不过现在映射类型的映射源是类型参数`K`。

既然有了`Pick`，那么自然要有`Omit`，它和`Pick`的写法非常像，但有一个问题要解决：我们要怎么表示`T`中剔除了`K`后的剩余字段？

> Pick 选取传入的键值，Omit 移除传入的键值

这里我们又要引入一个知识点：`never`类型，它表示永远不会出现的类型，通常被用来将**收窄联合类型或是接口**，详细可以看 [尤大的知乎回答](https://www.zhihu.com/search?type=content&q=ts%20never)， 在这里 我们不做展开介绍。

上面的场景其实可以简化为：

```typescript
// "3" | "4" | "5"
type LeftFields = Exclude<"1" | "2" | "3" | "4" | "5", "1" | "2">;
```

可以用排列组合的思路考虑：`"1"`在`"1" | "2"`里面吗(`"1" extends "1"|"2" -> true`)？ 在啊， 那让它爬，"3"在吗？不在那就让它留下来。

**这里实际上使用到了分布式条件类型的特性，假设 Exclude 接收 T U 两个类型参数，T 联合类型中的类型会依次与 U 类型进行判断，如果这个类型参数在 U 中，就剔除掉它（赋值为 never）**

```typescript
type Exclude<T, U> = T extends U ? never : T;
```

那么 Omit：

```typescript
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

剧透下，**几乎所有使用条件类型的场景，把判断后的赋值语句反一下，就会有新的场景**，比如`Exclude`移除掉键名，那反一下就是保留键名：

```typescript
type Extract<T, U> = T extends U ? T : never;
```

再来看个常用的工具类型`Record<Keys, Type>`，通常用于生成以联合类型为键名（`Keys`），键值类型为`Type`的新接口，比如：

```typescript
type MyNav = "a" | "b" | "b";
interface INavWidgets {
  widgets: string[];
  title?: string;
  keepAlive?: boolean;
}
const router: Record<MyNav, INavWidgets> = {
  a: { widget: [""] },
  b: { widget: [""] },
  c: { widget: [""] },
};
```

其实很简单，把`Keys`的每个键值拿出来，类型规定为`Type`即可

```typescript
// K extends keyof any 约束K必须为联合类型
type Record<K extends keyof any, T> = {
  [P in K]: T;
};
```

在前面的 infer 一节中我们实现了用于获取函数返回值的`ReturnType`：

```typescript
type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
```

其实把 infer 换个位置，比如放到返回值处，它就变成了获取参数类型的`Parameters`:

```typescript
type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;
```

如果再大胆一点，把普通函数换成类的构造函数，那么就得到了获取构造函数入参类型的`ConstructorParameters`：

```typescript
type ConstructorParameters<
  T extends new (...args: any) => any
> = T extends new (...args: infer P) => any ? P : never;
```

> 加上`new`关键字来使其成为**可实例化类型声明**

把待 infer 的类型放到其返回处，想想 new 一个类会得到什么？实例！所以我们得到了实例类型`InstanceType`：

```typescript
type InstanceType<T extends new (...args: any) => any> = T extends new (
  ...args: any
) => infer R
  ? R
  : any;
```

这几个例子看下来，你应该已经 get 到了那么一丝天机，类型编程的确没有特别高深晦涩的语法，它考验的是你对其中基础部分如**索引**、**映射**、**条件类型**的掌握程度，以及举一反三的能力。下面我们要学习的社区工具类型，本质上还是各种基础类型的组合，只是从常见场景下出发，补充了官方没有覆盖到的部分。

### 社区工具类型

> 这一部分的工具类型大多来自于[utility-types](https://github.com/piotrwitek/utility-types)，其作者同时还有[react-redux-typescript-guide](https://github.com/piotrwitek/react-redux-typescript-guide) 和 [typesafe-actions](https://github.com/piotrwitek/typesafe-actions)这两个优秀作品。

我们由浅入深，先封装基础的类型别名和对应的类型守卫，不对原理做讲述：

```typescript
export type Primitive =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

export const isPrimitive = (val: unknown): val is Primitive => {
  if (val === null || val === undefined) {
    return true;
  }

  const typeDef = typeof val;

  const primitiveNonNullishTypes = [
    "string",
    "number",
    "bigint",
    "boolean",
    "symbol",
  ];

  return primitiveNonNullishTypes.indexOf(typeDef) !== -1;
};

export type Nullish = null | undefined;

export type NonUndefined<A> = A extends undefined ? never : A;
// 实际上是TS内置的
type NonNullable<T> = T extends null | undefined ? never : T;
```

> `Falsy`和`isFalsy`我们已经在上面体现了~

趁着对 infer 的记忆来热乎，我们再来看一个常用的场景，提取 Promise 的实际类型：

```typescript
const foo = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    resolve("linbudu");
  });
};

// Promise<string>
type FooReturnType = ReturnType<typeof foo>;

// string
type NakedFooReturnType = PromiseType<FooReturnType>;
```

如果你已经熟练掌握了`infer`的使用，那么实际上是很好写的，只需要用一个`infer`参数作为 Promise 的泛型即可：

```typescript
export type PromiseType<T extends Promise<any>> = T extends Promise<infer U>
  ? U
  : never;
```

使用`infer R`来等待类型系统推导出`R`的具体类型。

### 递归的工具类型

前面我们写了个`Partial` `Readonly` `Required`等几个对接口字段进行修饰的工具类型，但实际上都有局限性，如果接口中存在着嵌套呢？

```typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};
```

理一下逻辑：

- 如果不是对象类型，就只是加上`?`修饰符
- 如果是对象类型，那就**遍历这个对象内部**
- 重复上述流程。

是否是对象类型的判断我们见过很多次了, `T extends object`即可，那么如何遍历对象内部？实际上就是递归。

```typescript
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
```

> `utility-types`内部的实现实际比这个复杂，还考虑了数组的情况，这里为了便于理解做了简化，后面的工具类型也同样存在此类简化。

那么`DeepReadobly` `DeepRequired`也就很简单了：

```typescript
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

// 即DeepReadonly
export type DeepImmutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};

export type DeepNonNullable<T> = {
  [P in keyof T]: T[P] extends object ? DeepImmutable<T[P]> : NonNullable<T[P]>;
};
```

### 返回键名的工具类型

在有些场景下我们需要一个工具类型，它返回接口字段键名组成的联合类型，然后用这个联合类型进行进一步操作（比如给 Pick 或者 Omit 这种使用），一般键名会符合特定条件，比如：

- 可选/必选/只读/非只读的字段
- （非）对象/（非）函数/类型的字段

来看个最简单的函数类型字段`FunctionTypeKeys`：

```typescript
export type FunctTypeKeys<T extends object> = {
  [K in keyof T]-?: T[K] extends Function ? K : never;
}[keyof T];
```

`{ [K in keyof T]: ... }[keyof T]`这个写法可能有点诡异，拆开来看：

```typescript
interface IWithFuncKeys {
  a: string;
  b: number;
  c: boolean;
  d: () => void;
}

type WTFIsThis<T extends object> = {
  [K in keyof T]-?: T[K] extends Function ? K : never;
};

type UseIt1 = WTFIsThis<IWithFuncKeys>;
```

很容易推导出`UseIt1`实际上就是：

```typescript
type UseIt1 = {
  a: never;
  b: never;
  c: never;
  d: "d";
};
```

> `UseIt`会保留所有字段，满足条件的字段其键值为字面量类型（值为键名）

加上后面一部分：

```typescript
// "d"
type UseIt2 = UseIt1[keyof UseIt1];
```

这个过程类似排列组合：`never`类型的值不会出现在联合类型中

> ```typescript
> // string | number
> type WithNever = string | never | number;
> ```

所以`{ [K in keyof T]: ... }[keyof T]`这个写法实际上就是为了返回键名（准备的说是**键名组成的联合类型**）。

那么非函数类型字段也很简单了，这里就不做展示了，下面来看可选字段`OptionalKeys`与必选字段`RequiredKeys`，先来看个小例子：

```typescript
type WTFAMI1 = {} extends { prop: number } ? "Y" : "N";
type WTFAMI2 = {} extends { prop?: number } ? "Y" : "N";
```

如果能绕过来，很容易就能得出来答案。如果一时没绕过去，也很简单，对于前面一个情况，`prop`是必须的，因此空对象`{}`并不能继承自`{ prop: number }`，而对于可选情况下则可以。因此我们使用这种思路来得到可选/必选的键名。

- `{} extends Pick<T, K>`，如果`K`是可选字段，那么就留下（OptionalKeys，如果是 RequiredKeys 就剔除）。
- 怎么剔除？当然是用`never`了。

```typescript
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];
```

这里是剔除可选字段，那么 OptionalKeys 就是保留了：

```typescript
export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];
```

只读字段`IMmutableKeys`与非只读字段`MutableKeys`的思路类似，即先获得：

```typescript
interface MutableKeys {
  readonlyKeys: never;
  notReadonlyKeys: "notReadonlyKeys";
}
```

然后再获得不为`never`的字段名即可。

这里还是要表达一下对作者的敬佩，属实巧妙啊，首先定义一个工具类型`IfEqual`，比较两个类型是否相同，甚至可以比较修饰前后的情况下，也就是这里只读与非只读的情况。

```typescript
type Equal<X, Y, A = X, B = never> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B;
```

- 不要被`<T>() => T extends X ? 1 : 2`干扰，可以理解为就是用于比较的包装，这一层包装能够区分出来只读与非只读属性。
- 实际使用时（非只读），我们为 X 传入接口，为 Y 传入去除了只读属性`-readonly`的接口，为 A 传入字段名，B 这里我们需要的就是 never，因此可以不填。

实例：

```typescript
export type MutableKeys<T extends object> = {
  [P in keyof T]-?: Equal<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    P,
    never
  >;
}[keyof T];
```

几个容易绕弯子的点：

- 泛型 Q 在这里不会实际使用，只是映射类型的字段占位。
- X Y 同样存在着 **分布式条件类型**， 来依次比对字段去除 readonly 前后。

同样的有：

```typescript
export type IMmutableKeys<T extends object> = {
  [P in keyof T]-?: Equal<
    { [Q in P]: T[P] },
    { -readonly [Q in P]: T[P] },
    never,
    P
  >;
}[keyof T];
```

- 这里不是对`readonly`修饰符操作，而是调换条件类型的判断语句。

### 基于值类型的 Pick 与 Omit

前面我们实现的 Pick 与 Omit 是基于键名的，假设现在我们需要按照值类型来做选取剔除呢？

其实很简单，就是`T[K] extends ValueType`即可：

```typescript
export type PickByValueType<T, ValueType> = Pick<
  T,
  { [Key in keyof T]-?: T[Key] extends ValueType ? Key : never }[keyof T]
>;

export type OmitByValueType<T, ValueType> = Pick<
  T,
  { [Key in keyof T]-?: T[Key] extends ValueType ? never : Key }[keyof T]
>;
```

> 条件类型承担了太多...

### 工具类型一览

总结下我们上面书写的工具类型：

- 全量修饰接口：`Partial` `Readonly(Immutable)` `Mutable` `Required`，以及对应的递归版本
- 裁剪接口：`Pick` `Omit` `PickByValueType` `OmitByValueType`
- 基于 infer：`ReturnType` `ParamType` `PromiseType`
- 获取指定条件字段：`FunctionKeys` `OptionalKeys` `RequiredKeys` ...

**需要注意的是，有时候单个工具类型并不能满足你的要求，你可能需要多个工具类型协作**，比如用`FunctionKeys`+`Pick`得到一个接口中类型为函数的字段。

如果你之前没有关注过 TS 类型编程，那么可能需要一定时间来适应思路的转变。我的建议是，从今天开始，从现在的项目开始，从类型守卫、泛型、最基本的`Partial`开始，让你的代码**精准而优雅**。

## 尾声

在结尾说点我个人的理解吧，我认为 TypeScript 项目实际上是需要经过组织的，而不是这一个接口那一个接口，这里一个字段那里一个类型别名，更别说明明可以使用几个工具类型轻松得到的结果却自己重新写了一遍接口。但很遗憾，要做到这一点实际上会耗费大量精力，并且对业务带来的实质提升是微乎其微的（长期业务倒是还好），毕竟页面不会因为你的类型声明严谨环环相扣就 PVUV 暴增。我目前的阶段依然停留在寻求开发的效率和质量间寻求平衡，目前的结论：**多写 TS，写到如臂指使，你的效率就会 upup**。

<<<<<<< HEAD
那我们本篇就到这里了，下篇文章内容是在 Flutter 中使用 GraphQL，说实在的，这二者的结合给我一种十分诡异的感觉，像是在介绍前女友给现在的女朋友认识...
=======
那我们本篇就到这里了，下篇文章内容是在 Flutter 中使用 GraphQL，说实在的，这二者的结合给我一种十分诡异的感觉，像是在介绍前女友给现在的女朋友认识...
>>>>>>> c4b87b0405686b67428c5c705c01c1ed74eb4c33
