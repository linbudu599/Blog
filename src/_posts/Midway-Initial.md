---
category: Learning
tags:
  - Other
date: 2020-7-31
title: MidwayJS：IoC与TS装饰器（草稿）
---

- IoC机制
- TS 装饰器：属性 方法 类 参数 装饰器工厂
- TS装饰器 tsc编译结果及其本质
- JS装饰器 !== TS装饰器
- TypeDI 使用
- TypeDI 浅析
- Injection 简介、使用



## IoC 与 DI

控制反转 & 依赖注入

解耦合

从接受各种参数来构造一个对象，到现在只接受一个参数——已经实例化的对象

控制者: IoC容器 由容器管理生命周期与实例化对象, 由容器来负责注入



## TS装饰器



### 类装饰器, 入参为类的构造函数

```ts
function addAge(constructor: Function) {
  constructor.prototype.age = 18;
}

@addAge
class Person{
  name: string;
  age!: number;
  constructor() {
    this.name = 'xiaomuzhu';
  }
}

let person = new Person();

console.log(person.age); // 18
```



### 属性与方法装饰器, 入参为 类(当前对象原型) 属性名 属性描述符

```ts
// 声明装饰器修饰方法/属性
function method(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
   console.log(target);
   console.log("prop " + propertyKey);
   console.log("desc " + JSON.stringify(descriptor) + "\n\n");
   descriptor.writable = false;
};

class Person{
  name: string;
  constructor() {
    this.name = 'xiaomuzhu';
  }

  @method
  say(){
    return 'instance method';
  }

  @method
  static run(){
    return 'static method';
  }
}

const xmz = new Person();

// 修改实例方法say
xmz.say = function() {
  return 'edit'
}

// 打印结果,检查是否成功修改实例方法
console.log(xmz.say());
```



### 参数装饰器, 入参为类(当前对象原型) 参数名 参数索引

```ts
function logParameter(target: Object, propertyKey: string, index: number) {
    console.log(target, propertyKey, index);
}

class Person {
    greet(@logParameter message: string,@logParameter name: string): string {
        return `${message} ${name}`;
    }
}
const p = new Person();
p.greet('hello', 'xiaomuzhu');

// Person { greet: [Function] } greet 1
// Person { greet: [Function] } greet 0
```

重要作用(好像也是唯一作用): 给类原型添加参数相关元数据, 然后可由下一个装饰器获取



### 装饰器工厂

抽象四种装饰器共有的逻辑:

```ts
function log(...args : any[]) {
  switch(args.length) {
    case 1:
      return logClass.apply(this, args);
    case 2:
      return logProperty.apply(this, args);
    case 3:
      if(typeof args[2] === "number") {
        return logParameter.apply(this, args);
      }
      return logMethod.apply(this, args);
    default:
      throw new Error("Decorators are not valid here!");
  }
}
```



### 多个装饰器声明

1. 由上至下依次对装饰器表达式求值。
2. 求值的结果会被当作函数，由下至上依次调用

```ts
function f() {
    console.log("f(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("f(): called");
    }
}

function g() {
    console.log("g(): evaluated");
    return function (target, propertyKey: string, descriptor: PropertyDescriptor) {
        console.log("g(): called");
    }
}

class C {
    @f()
    @g()
    method() {}
}
```



```ts
f(): evaluated
g(): evaluated
g(): called
f(): called
```



不同种类装饰器应用顺序:

- 参数 - 方法 - 属性 应用到每个实例
- 参数 - 方法 - 属性 应用到静态成员
- 参数装饰器应用到构造函数
- 构造函数应用到类



## Reflect Metadata

```ts
@Reflect.metadata('name', 'A')
class A {
  @Reflect.metadata('hello', 'world')
  public hello(): string {
    return 'hello world'
  }
}

Reflect.getMetadata('name', A) // 'A'
Reflect.getMetadata('hello', new A()) // 'world'
```

总之:

- Relfect Metadata，可以通过装饰器来给类添加一些自定义的信息
- 然后通过反射将这些信息提取出来
- 也可以通过反射来添加这些信息



```ts
import 'reflect-metadata'

@Reflect.metadata('name', 'xiaomuzhu')
class Person {

    @Reflect.metadata('time', '2019/10/10')
    public say(): string {
        return 'hello'
    }
}


console.log(Reflect.getMetadata('name', Person)) // xiaomuzhu
console.log(Reflect.getMetadata('time', new Person, 'say')) // 2019/10/10
```

可以看见我们在用 `metadata` 设置了元数据后，需要用 `getMetadata` 将元数据取出，但是为什么在取出方法 `say` 上的元数据时需要ts先把 Class 实例化(即`new Person`)呢?

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
const typeParam = Reflect.getMetadata("design:paramtypes", new Person, 'say')

// [Function: String]
```

使用 `design:returntype` 元数据键获取有关方法返回类型的信息:

```ts
const typeReturn = Reflect.getMetadata("design:returntype", new Person, 'say')
// [Function: String]
```



### 实例: 一个基于装饰器的接口路由

```ts
@Controller('/article')
class Home {
    @Get('/content')
    someGetMethod() {
      return 'hello world';
    }
  
    @Post('/comment')
    somePostMethod() {}
}

const METHOD_METADATA = 'method'
const PATH_METADATA = 'path'
// 装饰器工厂函数,接受路由的路径path返回一个装饰器
const Controller = (path: string): ClassDecorator => {
  return target => {
    Reflect.defineMetadata(PATH_METADATA, path, target);
  }
}

// 装饰器工厂函数,首先接受一个方法,比如get/post,如何再接受一个路由路径,返回一个携带了上述两个信息的装饰器
const createMappingDecorator = (method: string) => (path: string): MethodDecorator => {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(PATH_METADATA, path, descriptor.value!);
    Reflect.defineMetadata(METHOD_METADATA, method, descriptor.value!);
  }
}

const Get = createMappingDecorator('GET');
const Post = createMappingDecorator('POST');
```



生成路由:

```ts
function isConstructor(symbol: any): boolean {
  return notUndefined(symbol) &&
      symbol instanceof Function &&
      symbol.constructor &&
      symbol.constructor instanceof Function &&
      notUndefined(new symbol) &&
      Object.getPrototypeOf(symbol) !== Object.prototype &&
      symbol.constructor !== Object &&
      symbol.prototype.hasOwnProperty('constructor');
};

function notUndefined(item: any): boolean {
  return item != undefined && item != 'undefined';
}

function isFunction(value: any): value is Function {
  return typeof value === 'function';
}


function mapRoute(instance: Object) {
const prototype = Object.getPrototypeOf(instance);

// 筛选出类的 methodName
const methodsNames = Object.getOwnPropertyNames(prototype)
                            .filter(item => !isConstructor(item) && isFunction(prototype[item]));
return methodsNames.map(methodName => {
  const fn = prototype[methodName];

  // 取出定义的 metadata
  const route = Reflect.getMetadata(PATH_METADATA, fn);
  const method = Reflect.getMetadata(METHOD_METADATA, fn);
  return {
    route,
    method,
    fn,
    methodName
  }
})
};


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



### tsc编译结果

原始:

```ts
function addAge(constructor: Function) {
  constructor.prototype.age = 18;
}

@addAge
class Person{
  name: string;
  age!: number;
  constructor() {
    this.name = 'xiaomuzhu';
  }
}

let person = new Person();

console.log(person.age); // 18
```

编译:

```js
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function addAge(constructor) {
    constructor.prototype.age = 18;
}
var Person = /** @class */ (function () {
    function Person() {
        this.name = 'xiaomuzhu';
    }
    Person = __decorate([
        addAge
    ], Person);
    return Person;
}());
var person = new Person();
console.log(person.age); // 18

```



## 依赖注入工具类库 简介及使用

- [TypeDI](https://github.com/typestack/typedi)
- [TSYringe](https://github.com/microsoft/tsyringe)

- [Injection](https://github.com/midwayjs/injection)