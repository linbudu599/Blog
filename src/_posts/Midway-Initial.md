---
category: Learning
tags:
  - Other
date: 2020-7-31
title: 走近MidwayJS：IoC与TS装饰器（草稿）
---

- IoC 机制
- TS 装饰器：属性 方法 类 参数 装饰器工厂
- TS 装饰器 tsc 编译结果及其本质
- JS 装饰器 !== TS 装饰器
- TypeDI 使用
- TypeDI 浅析
- Injection 简介、使用

## 前言

很惭愧在阿里实习将近三个月没有一点文章产出，同期入职的 [炽翎](https://juejin.im/user/3122268753634541) 和 [炬透](https://juejin.im/user/2365804756090381) 都产出了不少优秀的文章，如[不想痛失薪资普调和年终奖？试试自动化测试！（基础篇）](https://juejin.im/post/6844904194600599560)，不禁感慨优秀的人都是有共同点的：善于总结沉淀，而且文笔还好（这点太羡慕了）。入职即将满三个月，也就是说我三个多月没写过文章了。文笔拙劣，还请见谅。

本篇文章是 [MidwayJS ](https://github.com/midwayjs/midway)的系列推广文章第一篇，原本我打算直接一篇搞定，做个MidwayJS开发后台应用的教程就好了。但是在提笔前询问过一些同学，发现即使是已经有工作经验的同学中也有一部分没有了解过TS装饰器相关的知识，对于IoC机制也知之甚少（虽然没学过Java的我同样只是一知半解），因此这篇文章会首先讲解IoC机制（主要是依赖注入）与TS装饰器相关的知识，力求内容不枯燥，并使各位成功的对MidwayJS来电~



## MidwayJS简介

> MidwayJS目前已经升级到Midway-Serverless体系，这可能会给没接触过Serverless、只是想学习框架本身的你带来一些困扰。你可以先阅读其[框架本身](https://midwayjs.org/midway/)，来只体验框架本身作为后端应用的能力。

你可能没有听过Egg，但你一定听过或者使用过Koa/Express，Egg基于Koa并在其能力上做了增强，奉行【约定优于配置】，同时它又能作为一款定制能力强的基础框架，来使得你能基于自己的技术架构封装出一套适合自己业务场景的框架。MidwayJS正是基于Egg，但在Egg的基础上做了一些较大的变动

- 更好的TS支持，可以说写MidwayJS比较舒服的一个地方就是它的TypeScript支持了，比如会作为服务的接口定义会单独存放于`interface`, 与TypeORM这种TS支持好的框架协作起来更是愉悦。

- IoC机制的路由，以我们下篇文章将要实现的接口为例：

  ```typescript
  @provide()
  @controller('/user')
  export class UserController {
  
    @get('/all')
    async getUser(): Promise<void> {
      // ...
    }
  
    @post('/create')
    	// ...
    }
  
    @get('/uid/:uid')
    async findUserByUid(): Promise<void> {
      // ...
    }
  
    @del('/uid/:uid')
    async deleteUser(): Promise<void> {
      // ...
    }
  
  }
  ```

  （Midway同时保留了Egg的路由能力，即`src/app/router.ts`的路由配置方式）

  这里是否会让你想到`NestJS`？的确在路由这里二者的思想基本是相同的，但Midway的IoC机制底层基于 [Injection]([https://midwayjs.org/injection/guide.html#%E8%8E%B7%E5%8F%96-ioc-%E5%AE%B9%E5%99%A8](https://midwayjs.org/injection/guide.html#获取-ioc-容器))，同样是Midway团队的作品。并且，Midway的IoC机制也是其Midway-Serverless能力的重要支持（这个我们下篇文章才会讲到）。

- 生态复用，Egg与Koa的中间件大部分能在Midway应用中完美兼容,少部分暂不支持的也由官方团队在快速兼容。



对于MidwayJS的介绍我们就到这里，如果你已经比较了解IoC机制与TS装饰器的相关知识，这篇文章其实你已经可以跳过了。如果你比较想先试试，可以先去试试我预先写好的一个Demo，基于Midway + TypeORM + SQLite3，地址：[Midway-Article-Demo](https://github.com/linbudu599/Midway-Article-Demo)。



下面的部分里，我们会讲解这些东西：

- IoC机制与依赖注入（Dependence Injection）
- TS装饰器 基本语法
- Reflect元编程
- tsc对装饰器与Reflect的编译结果
- 实现简单的基于IoC的路由
- 常见TS依赖注入类库（TypeDI、Injection）的使用与差异
- 关于TS装饰器的小故事



由于我本身并没学习过Java以及Spring IoC，因此我的理解可能存在一些偏差，还请在评论区指出错误之处~



## IoC 与 DI

控制反转 & 依赖注入

解耦合

从接受各种参数来构造一个对象，到现在只接受一个参数——已经实例化的对象

控制者: IoC 容器 由容器管理生命周期与实例化对象, 由容器来负责注入



## TS 装饰器

### TS装饰器的那些事儿
注意，JS与TS中的装饰器不是一回事，JS中的装饰器目前依然停留在 [stage 2](https://github.com/tc39/proposal-decorators) 阶段，并且目前版本的草案与TS中的实现差异相当之大（TS是基于第一版，JS目前已经第三版了），所以二者最终的装饰器实现必然有非常大的差异。在本篇文章的最后部分，我会提到关于TS装饰器的一些小故事。

为什么我们需要装饰器？在后面的例子中我们会体会到装饰器的强大与魅力，基于装饰器我们能够快速优雅的复用逻辑，同时我们本文的重点：**依赖注入**也可以通过装饰器来非常简洁的实现。现在我们可能暂时体会不到 **强大**、**简洁** 这些关键词，不急，安心读下去。我会尝试通过这篇文章让你对TS装饰器整体建立起一个认知，并爱上在日常开发里也去使用装饰器。



### 装饰器与注解

装饰器与注解实际上也有一定区别，由于并没有学过Java，这里就不与Java中的注解进行比较了。而只是说我所认为的二者差异：

- **注解** 应该如同字面意义一样， 只是为某个被注解的对象提供元数据（`metadata`）的注入，本质上不能起到任何修改行为的操作，需要scanner去进行扫描获得元数据并基于其去执行操作，注解的元数据才有实际意义。
- **装饰器** 没法添加元数据，只能基于已经由注解注入的元数据来执行操作，来对类、方法、属性、参数进行某种特定的操作。



### 不同类型的装饰器及使用

> 在开始前，你需要确保在`tsconfig.json`中设置了`experimentalDecorators`为true。

首先要明确地是，TS中的装饰器实现本质是一个语法糖，它的本质是一个函数，如果调用形式为`@deco()`，那么这个函数应该再返回一个函数来实现调用。

其次，你应该明白ES6中class的实质，如果不明白，推荐阅读我的这篇文章: [从Babel编译结果看ES6的Class实质](https://linbudu.top/posts/2020/03/25/babel-class.html)

#### 类装饰器

```ts
function addProp(constructor: Function) {
  constructor.prototype.job = 'fe';
}

@addProp
class P {
  job: string;
  constructor(public name: string) {}
}

let p = new P('林不渡');

console.log(p.job); // fe
```

我们发现，在以单纯装饰器方式`@addProp`调用时，不管用它来装饰哪个类，起到的作用都是相同的，因为其中要复用的逻辑是固定的。我们试试以`@addProp()`的方式来调用：

```typescript
function addProp(param: string): ClassDecorator {
  return (constructor: Function) => {
    constructor.prototype.job = param;
  };
}

@addProp('fe+be')
class P {
  job: string;
  constructor(public name: string) {}
}

let p = new P('林不渡');

console.log(p.job);
```

现在我们想要添加的属性值就可以由我们决定了, 实际上由于我们拿到了原型对象，还可以进行花式操作，后面会解锁更多神秘姿势~



#### 方法装饰器

 方法装饰器的入参为 **类的原型对象**  **属性名** 以及**属性描述符(descriptor)**，其属性描述符包含`writable` `enumerable` `configurable` ，我们可以在这里去配置其相关信息。

> 注意，对于静态成员来说，首个参数会是类的构造函数。而对于实例成员（比如下面的例子），则是类的原型对象

```ts
function addProps(): MethodDecorator {
  return (target, propertyKey, descriptor) => {
    console.log(target);
    console.log(propertyKey);
    console.log(JSON.stringify(descriptor));

    descriptor.writable = false;
  };
}

class A {
  @addProps()
  originMethod() {
    console.log("I'm Original!");
  }
}

const a = new A();

a.originMethod = () => {
  console.log("I'm Changed!");
};

a.originMethod();// I'm Changed!
```

你是否觉得有点想起来`Object.defineProperty()`？ 的确方法装饰器也是借助它来修改类和方法的属性的。



#### 属性装饰器

类似于方法装饰器，但它的入参少了属性描述符。原因则是目前没有方法在定义原型对象成员同时去描述一个实例的属性（创建描述符）。

```typescript
function addProps(): PropertyDecorator {
  return (target, propertyKey) => {
    console.log(target);
    console.log(propertyKey);
  };
}

class A {
  @addProps()
  originProps: any;
}
```

属性与方法装饰器有一个重要作用是注入与提取元数据，这点我们在后面会体现到。



#### 参数装饰器

参数装饰器的入参首要两位与属性装饰器相同，第三个参数则是参数在当前函数参数中的索引。

```ts
function paramDeco(params?: any): ParameterDecorator {
  return (target, propertyKey, index) => {
    console.log(target);
    console.log(propertyKey);
    console.log(index);
    target.constructor.prototype.fromParamDeco = '呀呼！';
  };
}

class B {
  someMethod(@paramDeco() param1: any, @paramDeco() param2: any) {
    console.log(`${param1}  ${param2}`);
  }
}

new B().someMethod('啊哈', '林不渡！');
// @ts-ignore
console.log(B.prototype.fromParamDeco);

```

参数装饰器与属性装饰器都有个特别之处，他们都不能获取到描述符descriptor，因此也就不能去修改其参数/属性的行为。但是我们可以这么做：给类原型添加某个属性，携带上与**参数/属性/装饰器入参**的、相关的元数据，并由下一个执行的装饰器来读取。

当然像例子中这样直接在原型上添加属性的方式是十分不推荐的，后面我们会使用ES6的Reflect来进行元数据的读/写。



### 装饰器工厂

假设现在我们同时需要四种装饰器，你会怎么做？定义四种装饰器然后分别使用吗？也行，但后续你看着这一堆装饰器可能会感觉有点头疼...，因此我们可以考虑接入工厂模式，使用一个装饰器工厂来为我们根据条件吐出不同的装饰器。



首先我们准备好各个装饰器函数：

（不建议把功能也写在装饰器工厂中，会造成耦合）

```ts
// @ts-nocheck

function classDeco(): ClassDecorator {
  return (target: Object) => {
    console.log('Class Decorator Invoked');
    console.log(target);
  };
}

function propDeco(): PropertyDecorator {
  return (target: Object, propertyKey: string) => {
    console.log('Property Decorator Invoked');
    console.log(propertyKey);
  };
}

function methodDeco(): MethodDecorator {
  return (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    console.log('Method Decorator Invoked');
    console.log(propertyKey);
  };
}

function paramDeco(): ParameterDecorator {
  return (target: Object, propertyKey: string, index: number) => {
    console.log('Param Decorator Invoked');
    console.log(propertyKey);
    console.log(index);
  };
}
```

 

接着，我们实现一个工厂函数来根据不同条件返回不同的装饰器：

```typescript
enum DecoratorType {
  CLASS = 'CLASS',
  METHOD = 'METHOD',
  PROPERTY = 'PROPERTY',
  PARAM = 'PARAM',
}

type FactoryReturnType =
  | ClassDecorator
  | MethodDecorator
  | PropertyDecorator
  | ParameterDecorator;

function decoFactory(type: DecoratorType, ...args: any[]): FactoryReturnType {
  switch (type) {
    case DecoratorType.CLASS:
      return classDeco.apply(this, args);

    case DecoratorType.METHOD:
      return methodDeco.apply(this, args);

    case DecoratorType.PROPERTY:
      return propDeco.apply(this, args);

    case DecoratorType.PARAM:
      return paramDeco.apply(this, args);

    default:
      throw new Error('Invalid DecoratorType');
  }
}

@decoFactory(DecoratorType.CLASS)
class C {
  @decoFactory(DecoratorType.PROPERTY)
  prop: any;

  @decoFactory(DecoratorType.METHOD)
  method(@decoFactory(DecoratorType.PARAM) param: string) {}
}

new C().method();
```

（注意，这里在TS类型定义上似乎有些问题，所以需要带上顶部的`@ts-nocheck`，在后续解决了类型报错后，我会及时更新的TAT）



### 多个装饰器声明

> 装饰器求值顺序来自于TypeScript官方文档一节中的装饰器说明。

 类中不同声明上的装饰器将按以下规定的顺序应用：

 1. *参数装饰器*，然后依次是*方法装饰器*，*访问符装饰器*，或*属性装饰器*应用到每个实例成员。
 2. *参数装饰器*，然后依次是*方法装饰器*，*访问符装饰器*，或*属性装饰器*应用到每个静态成员。
 3. *参数装饰器*应用到构造函数。
 4. *类装饰器*应用到类。



注意这个顺序，后面我们能够实现元数据读写，也正是因为这个顺序。



当存在多个装饰器来装饰同一个声明时，则会有以下的顺序：

- 首先，由上至下依次对装饰器表达式求值，得到返回的真实函数（如果有的话）
- 而后，求值的结果会由下至上依次调用

（有点类似洋葱模型）



```ts
function foo() {
    console.log("foo in");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("foo out");
    }
}

function bar() {
    console.log("bar in");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("bar out");
    }
}

class A {
    @foo()
    @bar()
    method() {}
}

// foo in
// bar in
// bar out
// foo out
```



## Reflect Metadata

```ts
@Reflect.metadata("name", "A")
class A {
  @Reflect.metadata("hello", "world")
  public hello(): string {
    return "hello world";
  }
}

Reflect.getMetadata("name", A); // 'A'
Reflect.getMetadata("hello", new A()); // 'world'
```

总之:

- Relfect Metadata，可以通过装饰器来给类添加一些自定义的信息
- 然后通过反射将这些信息提取出来
- 也可以通过反射来添加这些信息

```ts
import "reflect-metadata";

@Reflect.metadata("name", "xiaomuzhu")
class Person {
  @Reflect.metadata("time", "2019/10/10")
  public say(): string {
    return "hello";
  }
}

console.log(Reflect.getMetadata("name", Person)); // xiaomuzhu
console.log(Reflect.getMetadata("time", new Person(), "say")); // 2019/10/10
```

可以看见我们在用 `metadata` 设置了元数据后，需要用 `getMetadata` 将元数据取出，但是为什么在取出方法 `say` 上的元数据时需要 ts 先把 Class 实例化(即`new Person`)呢?

原因就在于元数据是被添加在了实例方法上，因此必须实例化才能取出，要想不实例化，则必须加在静态方法上.



### 内置元数据

通过 `design:type` 作为 key 可以获取目标的类型，比如在上例中，我们获取 `say` 方法的类型:

```ts
...
// 获取方法的类型
const type = Reflect.getMetadata("design:type", new Person, 'say')

[Function: Function]
```

通过 `design:paramtypes` 作为 key 可以获取目标参数的类型，比如在上例中，我们获取 `say` 方法参数的类型:

```ts
// 获取参数的类型,返回数组
const typeParam = Reflect.getMetadata("design:paramtypes", new Person(), "say");

// [Function: String]
```

使用 `design:returntype` 元数据键获取有关方法返回类型的信息:

```ts
const typeReturn = Reflect.getMetadata(
  "design:returntype",
  new Person(),
  "say"
);
// [Function: String]
```

### 实例: 一个基于装饰器的接口路由

```ts
@Controller("/article")
class Home {
  @Get("/content")
  someGetMethod() {
    return "hello world";
  }

  @Post("/comment")
  somePostMethod() {}
}

const METHOD_METADATA = "method";
const PATH_METADATA = "path";
// 装饰器工厂函数,接受路由的路径path返回一个装饰器
const Controller = (path: string): ClassDecorator => {
  return (target) => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  };
};

// 装饰器工厂函数,首先接受一个方法,比如get/post,如何再接受一个路由路径,返回一个携带了上述两个信息的装饰器
const createMappingDecorator = (method: string) => (
  path: string
): MethodDecorator => {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value!);
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value!);
  };
};

const Get = createMappingDecorator("GET");
const Post = createMappingDecorator("POST");
```

生成路由:

```ts
function isConstructor(symbol: any): boolean {
  return (
    notUndefined(symbol) &&
    symbol instanceof Function &&
    symbol.constructor &&
    symbol.constructor instanceof Function &&
    notUndefined(new symbol()) &&
    Object.getPrototypeOf(symbol) !== Object.prototype &&
    symbol.constructor !== Object &&
    symbol.prototype.hasOwnProperty("constructor")
  );
}

function notUndefined(item: any): boolean {
  return item != undefined && item != "undefined";
}

function isFunction(value: any): value is Function {
  return typeof value === "function";
}

function mapRoute(instance: Object) {
  const prototype = Object.getPrototypeOf(instance);

  // 筛选出类的 methodName
  const methodsNames = Object.getOwnPropertyNames(prototype).filter(
    (item) => !isConstructor(item) && isFunction(prototype[item])
  );
  return methodsNames.map((methodName) => {
    const fn = prototype[methodName];

    // 取出定义的 metadata
    const route = Reflect.getMetadata(PATH_METADATA, fn);
    const method = Reflect.getMetadata(METHOD_METADATA, fn);
    return {
      route,
      method,
      fn,
      methodName,
    };
  });
}

Reflect.getMetadata(PATH_METADATA, Home);

const info = mapRoute(new Home());

console.log(info);
// [
//   {
//     route: '/home',
//     method: undefined,
//     fn: [Function: Home],
//     methodName: 'constructor'
//   },
//   {
//     route: '/article',
//     method: 'GET',
//     fn: [Function],
//     methodName: 'someGetMethod'
//   },
//   {
//     route: '/comment',
//     method: 'POST',
//     fn: [Function],
//     methodName: 'somePostMethod'
//   }
// ]
```

### tsc 编译结果

原始:

```ts
function addAge(constructor: Function) {
  constructor.prototype.age = 18;
}

@addAge
class Person {
  name: string;
  age!: number;
  constructor() {
    this.name = "xiaomuzhu";
  }
}

let person = new Person();

console.log(person.age); // 18
```

编译:

```js
var __decorate =
  (this && this.__decorate) ||
  function(decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
function addAge(constructor) {
  constructor.prototype.age = 18;
}
var Person = /** @class */ (function() {
  function Person() {
    this.name = "xiaomuzhu";
  }
  Person = __decorate([addAge], Person);
  return Person;
})();
var person = new Person();
console.log(person.age); // 18
```

## 依赖注入工具类库 简介及使用

- [TypeDI](https://github.com/typestack/typedi)
- [TSYringe](https://github.com/microsoft/tsyringe)

- [Injection](https://github.com/midwayjs/injection)z

