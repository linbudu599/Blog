---
category: Learning
tags:
  - Other
date: 2020-10-19
title: TypeScript的另一面：类型编程
---

## 前言

作为前端开发的趋势之一，TypeScript 正在越来越普及，很多人像我一样写了 TS 后再也回不去了，比如写算法题写 demo 都用 TS，JS 只有在 Webpack 配置（实际上这也可以用 TS 写）等少的可怜的情况下才会用到。TS 的学习成本实际上并不高（的确是，具体原因我在下面会讲，别急着锤我），我个人认为它可以被分成两个部分：

- 预实现的 ES 提案，如 装饰器（我之前的一篇文章 [走近 MidwayJS：初识 TS 装饰器与 IoC 机制](https://juejin.im/post/6859314697204662279) 中讲了一些关于 TS 装饰器的历史， 有兴趣的可以看看）， 可选链`?.` ，空值合并运算符`??`，类的私有成员`private`等。除了部分语法如装饰器以外，大部分的预实现实际上就是未来的 ES 语法。对于这一部分来说，无论你先前是只学习过 JS（就像我一样），还是有过 Java、C#的使用经历，都能非常快速地上手，这也是实际开发中使用最多的部分，毕竟和另一块-类型编程比起来，还是这一部分更接地气。
- 类型编程，无论是一个普通接口(`interface`)或是类型别名`type`，还是密密麻麻的`extends` `infer` 工具类型 blabla...（下文会展开介绍），我个人认为都属于类型编程的范畴。这一块实际上对代码的功能层面没有任何影响，即使你把它写成 anyscript，代码该咋样还是咋样。而这也就是类型编程一直不受到太多重视的原因：相比于语法，它会带来代码量大大增多（可能接近甚至超过业务代码），编码耗时增长（头发--）等问题，而带来的唯一好处就是 **类型安全** ， 包括如臂使指的类型提示（VS Code YES!），进一步减少可能存在的调用错误，以及降低维护成本。看起来似乎有得有失，但实际上，假设你花费 1 单位脑力使用基础的 TS 以及简单的类型编程，你就能够获得 5 个单位的回馈。但接下来，有可能你花费 10 个单位脑力，也只能再获得 1 个单位的回馈。另外一个类型编程不受重视的原因则是实际业务中并不会需要多么苛刻的类型定义，通常是底层框架类库才会有此类需求，这一点就见仁见智了，但我想没人会想当业务仔吧。

正文部分包括：

- 基础泛型
- 索引类型 & 映射类型
- 条件类型 & 分布式条件类型
- infer 关键字
- 类型守卫：函数与实例实现
- 内置工具类型机能与原理
- 内置工具类型增强
- 更多通用工具类型

这些名词可能看着有点劝退，但我会尽可能描述的通俗易懂，让你在阅读时不断发出“就这？”的感慨:)

> 为了适配所有基础的读者，本文会讲解的尽可能细致，如果你已经熟悉某部分知识，请跳过~

## 泛型 Generic Type

假设我们有这么一个函数：

```typescript
function foo(args: unknown):unknown { ... }
```

如果它接收一个字符串，返回这个字符串的部分截取，如果接收一个数字，返回这个数字的 n 倍，如果接收一个对象，返回键值被更改过的对象（键名不变），如果这时候需要类型定义，是否要把`unknown`替换为`string|number|object`？ 这样固然可以，但别忘记我们需要的是 **入参与返回值类型相同** 的效果。这个时候泛型就该登场了，泛型使得代码段的类型定义易于重用（比如我们上面提到的场景又多了一种接收布尔值返回布尔值的场景），并提升了灵活性与严谨性:

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

泛型除了单独使用，也经常与其他类型编程语法结合使用，可以说泛型就是 TS 类型编程最重要的基石。单独对于泛型的介绍就到这里，在其他部分我们会讲解更多泛型的~~高级~~使用技巧。

## 索引类型与映射类型

在阅读这一部分前，你需要做好思维转变的准备，需要认识到 **类型编程实际也是编程**，因此你可以将一部分编程思路复用过来。我们实现一个简单的函数：

```typescript
// 假设key是obj键名
function pickSingleValue(obj, key) {
  return obj[key];
}
```

思考要为其进行类型定义的话，有哪些需要定义的地方？

- 参数 obj
- 参数 key
- 返回值 obj

这三样之间是否存在关联？

- key 必然是 obj 中的键值名之一，一定为`string`类型
- 返回的值一定是 obj 中的键值

因此我们初步得到这样的结果：

```typescript
function pickSingleValue<T>(obj: T, key: keyof T) {
  return obj[key];
}
```

`keyof` 是 **index type query**的语法， 即索引类型查询，它会返回后面跟着的类型参数的键值组成的字面量类型（literal types），举个例子：

```typescript
interface foo {
  a: number;
  b: string;
}

type A = keyof foo; // "a" | "b"
```

> 字面量类型是对类型的进一步限制，比如你的状态码只可能是 0/1/2，那么你就可以写成`status: 0 | 1 |2`的形式。字面量类型包括字符串字面量、数字字面量、布尔值字面量。

现在我们发现还少了返回值，如果你此前没有接触过，我们先联想下`for...in`语法，通常遍历对象会这么写：

```typescript
const fooObj: foo = { a: 1, b: "1" };

for (const key in fooObj) {
  console.log(key);
  // for...in中的key不会被推导，所以需要自己标明
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
> type AType = T["a"]; // number
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

这里又出现了新东西`extends`... 它是啥？你可以暂时把`U extends keyof T`理解为泛型 U 必然是泛型 T 的键值中的部分。具体的知识我们会在下一节条件类型讲到。

假设现在我们不只要取出一个值了，我们要取出一系列值：

```typescript
function pick<T extends object, U extends keyof T>(obj: T, keys: U[]): T[U][] {
  return keys.map((key) => obj[key]);
}

// pick(obj, ['a', 'b'])
```

有两个重要变化：

- `keys: U[]` 我们知道 U 是 T 的键名组成的字面量类型的联合类型，那么要表示一个内部元素均是 T 键名的数组，就可以使用这种方式，具体的原理请参见下文的 **分布式条件类型** 章节。
- `T[U][]` 它的原理实际上和上面一条相同，之所以单独拿出来是因为我认为它是一个很好地例子：简单的表现了 TS 类型编程的组合性，你不感觉这种写法就像搭积木一样吗？

### 索引签名 index signature

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

但是一旦某个接口的索引签名类型为`number`，那么它就不能再通过字符串索引访问，如`o['1']`。

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

现在我们有个需求，实现一个接口，它的字段与接口 A 完全相同，但是其中的类型全部为 string，你会怎么做？直接重新声明一个然后手写吗？我们可是聪明的程序员诶，那必不可能这么笨。如果把接口换成对象再想想，其实很简单，new 一个新对象，然后遍历 A 的键名（Object.keys()）来填充这个对象。

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

> 你可以把工具类型理解为你平时放在 utils 文件夹下的公共函数，提供了对公用逻辑（在这里则是类型编程逻辑）的封装，比如上面的两个类型接口就是~

先写个最常用的`Partial`尝尝鲜，工具类型的详细介绍我们会在专门的章节展开：

```typescript
// 将接口下的字段全部变为可选的
type Partial<T> = {
  [K in keyof T]?: T[k];
};
```

是不是特别简单，让你已经脱口而出“就这！”，类似的，还可以实现个`Readonly`，把接口下的字段全部变为只读的。

索引类型、映射类型相关的知识我们暂且介绍到这里，要真正理解它们的作用，还需要好好梳理下，建议你看看自己之前项目的类型定义有没有可以优化的地方。

## 条件类型

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

这里的`T extends object`与`U extends keyof T`都是泛型约束，分别将 T 约束为对象类型和将 U 约束为 T 键名的字面量联合类型。我们通常使用泛型约束来“使得泛型变窄”。

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

同样的，就像三元表达式可以嵌套，条件类型也可以嵌套，如果你看过一些框架源码，也会发现其中存在着许多嵌套的条件类型，无他，条件类型可以将类型约束收拢到非常精确地范围内。

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

我们发现在上面的例子里，条件类型的推导结果都是联合类型（T3 实际上也是，只不过相同所以被合并了）。

是不是 get 到了一点什么？我们再看几个例子：

```typescript
type ObjectWrapper<T> = { object: T };
type ArrayWrapper<T> = { array: T[] };
type Wrapper<T> = T extends any[] ? ArrayWrapper<T> : ObjectWrapper<T>;

// { object: string; }
type T4 = Wrapper<string>;

// { array: number[][]; }
type T5 = Wrapper<number[]>;

// 只会到 ObjectWrapper<string> | ArrayWrapper<number[]>
// 而不会到 { object: string; } | { array: number[][]; }
type T6 = Wrapper<string | number[]>;
```

现在我们可以来讲讲这几个概念了：

- 裸类型参数，没有额外被接口/类型别名包裹过的，就像被`Wrapper`包裹后就不能再被称为裸类型参数。
- 实例化，其实就是条件类型的判断过程，在这里两个例子的实例化过程实际上是不同的，具体会在下一点中介绍。
- 分发至联合类型的过程：
  - 对于 TypeName，它内部的类型参数 T 是没有被包裹过的，所以`TypeName<string | (() => void)>`会被分发为`TypeName<string> | TypeName<(() => void)>`，然后再次进行判断，最后分发为`"string" | "function"`。
  - 对于 Wrapper，由于类型参数 T 被包裹，所以只会在首次分发后就停止，不会在`ObjectWrapper`与`ArrayWrapper`上再次分发，也就是不会到`{ object: string; } | { array: number[][]; }。`

再看一个直观些的例子：

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

## infer 关键字

## 类型守卫 与 is 关键字
