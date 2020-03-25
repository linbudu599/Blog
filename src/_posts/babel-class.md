---
category: Learning
tags:
  - Other
date: 2020-3-25
title: 从Babel编译结果看ES6的Class实质
---

> ES6 的 Class 虽然只是一剂语法糖, 但还是为不少其他语言转过来的程序猿提供了更清晰的思路去编写代码, 即使它的实质还是原型和原型链. 但我们现在可以让函数做自己的事情去了, 而不是又当爹(逻辑函数)又当妈(构造函数). 但是你是否想过 ES6 的 Class 在经过编译后发生了什么? 方法被添加到什么地方? 静态方法呢? 继承(super)是如何实现的?

> 本篇文章中的 Class 语法不会包括私有属性/装饰器等尚未确定的语法

## 基础 Class 代码分析

```js
class Parent {
  constructor(name) {
    this.name = name || "Parent";
    this.age = 21;
  }
  sayName() {
    console.log(this.name);
  }

  saySth(str) {
    console.log(str);
  }

  static staticMethod(str) {
    console.log(str);
  }
}

const p = new Parent("Parenttt");
p.sayName();
p.saySth("HelloP");
Parent.staticMethod("Sttttatic");
```

这是一段简单的代码, 它构造了一个`Parent`类, 我们使用[Babel 官网的编译器](https://www.babeljs.cn/repl#?browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=MYGwhgzhAEAKYCcCmA7ALtA3gKGtYA9ihGggK7BoEIAUKYAtkgJRa57RoAWAlhAHT0m0ALzQhSaAB8p0AETxk6OQG52ebn35gA5pLEAmAIxq8AX3YQwATwByjJDVY4O-IhAIgk_EAR01NAQlmU2gLSxsAZW4aEgRndTdiT29ffziQ9nC8EjA0HmBoXPzgAFkkbgIAE1jSBNdCZK8fP1r40Itw7EaSaAAHUXEkAHc4RFQ0GgVx9DQ0OUy-_is7Byc1HpSW_yWGVaZF5aiYuQAJJBBfWAW1bEUJ5bQ8gvLKmrlouaeSm-xsIA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015&prettier=true&targets=&version=7.9.0&externalPlugins=), 设定编译目标为 `es2015-strict`.

### 编译结果

我们首先看看编译后的结果:

```js
"use strict";

function _instanceof(left, right) {
  // ...
}

function _classCallCheck(instance, Constructor) {
  // ...
}

function _defineProperties(target, props) {
  // ...
}

function _createClass(Constructor, protoProps, staticProps) {
  // ...
}

var Parent = /*#__PURE__*/ (function() {
  function Parent(name) {
    _classCallCheck(this, Parent);

    this.name = name || "Parent";
    this.age = 21;
  }

  _createClass(
    Parent,
    [...]
  );

  return Parent;
})();

var p = new Parent("Parenttt");
p.sayName();
console.log(p.myName);
p.saySth("HelloP");
Parent.staticMethod("Sttttatic");
```

首先会发现的是, `Parent`类实际上还是一个函数(IIFE 内部返回的那个`Parent`函数), 我们在`_createClass`中对它进行了一些操作后将其返回, 而后这个函数就是可以实例化的了. 那么很明显, 关键在`_createClass`上, 你很容易猜到这一步主要添加了方法和属性啥的.

但是在内部的`Parent`函数中, 我们首先调用了 `_classCallCheck()` 方法, 顾名思义它是要检测调用方式的, 那么它是如何判定的?

```js
function _classCallCheck(instance, Constructor) {
  if (!_instanceof(instance, Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
```

我们都知道函数在被`new`关键字调用时内部的 this 会指向当前的实例对象, 在这个检测方法里我们主要是判断这个 class 是否是以`new`关键字调用, 否则我们就认为这个类被错误的当成函数调用了. 这里的`_instanceof()` 方法是对原生`instanceof`方法的补全, 来看一哈它的逻辑:

```js
function _instanceof(left, right) {
  if (
    right != null &&
    typeof Symbol !== "undefined" &&
    right[Symbol.hasInstance]
  ) {
    return !!right[Symbol.hasInstance](left);
  } else {
    return left instanceof right;
  }
}
```

`[Symbol.hasInstance]`这个接口可能部分同学没接触过, 实际上`instanceof`运算符就是调用这个接口(这个接口指向一个内部方法), 类似的常用内置 Symbol 值还有`Symbol.iterator`以及`Symbol.toPrimitive`等.

这里主要是为支持`Symbol`语法的环境做了一些增强处理.

然后是我们比较关心的`_createClass()`方法, 可以先看看它的入参:

```js
_createClass(
  Parent,
  [
    {
      key: "sayName",
      value: function sayName() {
        console.log(this.name);
      }
    },
    {
      key: "saySth",
      value: function saySth(str) {
        console.log(str);
      }
    }
  ],
  [
    {
      key: "staticMethod",
      value: function staticMethod(str) {
        console.log(str);
      }
    }
  ]
);
```

的确这里就是把方法用键值对的方式传进去了, 注意点看你会发现其实一共有三个参数, 静态方法被单独作为第三个参数了.

再来看看它的内部实现:

```js
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
```

关键是 `_defineProperties` 这个方法, 我们可以发现它对修饰符进行了一些变动然后再使用原生的方法, 将这个属性添加到类上, **你会发现实例方法是被添加到原型上的, 而静态方法则是被添加到函数本身**.

这或许能解开在初学 ES6 Class 语法时的一些困惑:

- 内部所有方法都是不可枚举的, 因为其修饰符`enumerable`被置为 false, 除非你去改动编译结果.
- 静态方法与实例方法的调用方式

来梳理一下 ES6 Class 的实质?

- 仍然是函数, 只不过类本身就是构造函数
- 方法被添加到原型对象或函数本身
- 调用前会经过检测, 所以不能以函数方式调用

这只是一个最简单的例子, 下面来看一个继承的例子:

## 继承

源代码:

```js
class Parent {
  // ...
}

class Child extends Parent {
  constructor(name) {
    super();
    this.name = name || "Child";
    this.age = 0;
  }

  ownMethod() {
    console.log("Own Method");
  }
}
```

这次的代码就复杂了一些, 我主要摘出新增的部分

```js
function _typeof(obj) {
  // ...
}

function _createSuper(Derived) {
  // ...
}

function _possibleConstructorReturn(self, call) {
  // ...
}

function _assertThisInitialized(self) {
  // ...
}

function _isNativeReflectConstruct() {
  // ...
}

function _getPrototypeOf(o) {
  // ...
}

function _inherits(subClass, superClass) {
  // ...
}

function _setPrototypeOf(o, p) {
  // ...
}

var Child = /*#__PURE__*/ (function(_Parent) {
  _inherits(Child, _Parent);

  var _super = _createSuper(Child);

  function Child(name) {
    var _this;

    _classCallCheck(this, Child);

    _this = _super.call(this);
    _this.name = name || "Child";
    _this.age = 0;
    return _this;
  }

  _createClass(Child, [
    {
      key: "ownMethod",
      value: function ownMethod() {
        console.log("Own Method");
      }
    }
  ]);

  return Child;
})(Parent);
```

可以看到多了不少逻辑, 但是! 有一大部分逻辑还是主要在进行增强原生方法, 进行一些边界情况处理.

我们一个个拆开看看, 从 `_inherits()` 方法开始:

```js
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
```

- 边界情况处理, 父类必须是 null 或者函数

- 子类的原型对象的`__proto__`指向父类的原型对象

  假设子类实例为 c, 那么有

  ```js
  c.__proto__ === Child.prototype; // true
  c.__proto__.__proto__ === Parent.prototype; //true
  ```

  `Object.create()`方法的第二个参数我们平时不会怎么用到, 可以简单看一下[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/create)上的解释:

  > ```
  > propertiesObject
  > ```
  >
  > 可选。如果没有指定为 [`undefined`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/undefined)，则是要添加到新创建对象的不可枚举（默认）属性（即其自身定义的属性，而不是其原型链上的枚举属性）对象的属性描述符以及相应的属性名称。这些属性对应[`Object.defineProperties()`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties)的第二个参数。

- 如果父类不为 null, 使用增强的 `_setPrototypeOf()` 方法, 将子类的原型对象进行修改, 这个方法实际上只是做了一些兼容性处理, 看了一下主要是 IE9 以下不支持这个方法

  ```js
  function _setPrototypeOf(o, p) {
    _setPrototypeOf =
      Object.setPrototypeOf ||
      function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };
    return _setPrototypeOf(o, p);
  }
  ```

  > ```js
  > Child.__proto__ === Parent; // true
  > ```

这一步主要是设置了 `subClass.prototype.__proto__` 以及`subClass.__proto__`, 可以理解分别为子类实例和子类本身连接到了父类, 毕竟原型的本质是委托嘛.

接着是 `_createSuper(Child)` 方法:

```js
function _createSuper(Derived) {
  return function() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (_isNativeReflectConstruct()) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}
```

其中包含的其他方法先不管, 我们可以先看看大致思路:

- 获取到 `Child` 原型对象, 即父类

- 如果环境中可用`Reflect`, 就使用`Reflect`语法创建构造函数
- 否则就老老实实的在父类上调用

`_getPrototypeOf()`:

```js
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}
```

同样是兼容性处理, 这里就跳过

`_isNativeReflectConstruct()`:

```js
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function() {}));
    return true;
  } catch (e) {
    return false;
  }
}
```

如果不懂 Reflect, 可以看一下[阮老师的文章](https://es6.ruanyifeng.com/#docs/reflect), 这里使用的`Reflect.construct(target, args)`其实就等同于`new target(...args)`, 相当于一种不使用 new 来调用构造函数的方式.

> 为什么要使用`Reflect`呢, 我个人认为这样使得很多调用方式更清晰了, 同时处理结果也更加"正常".

```js
Date.prototype.toString.call(Reflect.construct(Date, [], function() {}));
```

这一句代码的作用, 我个人认为是更像在试探确定环境支持`Reflect`后的测试代码..., 确定它能够正常工作.

`_possibleConstructorReturn()`

```js
function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }
  return _assertThisInitialized(self);
}

function _typeof(obj) {
  // ... typeOf 补全增强, 不展开介绍
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return self;
}
```

和`Child类`内部连起来看:

```js
var Child = /*#__PURE__*/ (function(_Parent) {
  _inherits(Child, _Parent);

  var _super = _createSuper(Child);

  function Child(name) {
    var _this;

    _classCallCheck(this, Child);

    _this = _super.call(this);
    _this.name = name || "Child";
    _this.age = 0;
    return _this;
  }

  _createClass(Child, [
    {
      key: "ownMethod",
      value: function ownMethod() {
        console.log("Own Method");
      }
    }
  ]);

  return Child;
})(Parent);
```

可以看到在这一步主要确保了`_super()`(`super()`)方法被调用.

注意在这一步和 ES5 的继承有很大的不同:

- 首先生成了父类的实例, 然后再调用子类的构造函数去修饰实例!
- ES5 的继承则是先生成子类实例, 然后用父类的构造函数去修饰子类实例, 这么做的缺点也很明显:
  - 父类实例过早创建，无法接受子类的动态参数；
  - 子类所有实例原型为同一父类实例，修改父类实例属性会影响所有子类实例。

> 引用阮一峰老师的 `ECMAScript6入门` 的 class 继承篇：
>
> 子类必须在`constructor`方法中调用`super`方法，否则新建实例时会报错。这是因为子类自己的`this`对象，必须先通过父类的构造函数完成塑造，得到与父类同样的实例属性和方法，然后再对其进行加工，加上子类自己的实例属性和方法。如果不调用`super`方法，子类就得不到`this`对象。
>
> ES5 的继承，实质是先创造子类的实例对象`this`，然后再将父类的方法添加到`this`上面（`Parent.apply(this)`）。ES6 的继承机制完全不同，实质是先将父类实例对象的属性和方法，加到`this`上面（所以必须先调用`super`方法），然后再用子类的构造函数修改`this`。

然后就是重复在第一个例子中的事情了, 将子类的方法添加到本身或者原型对象上. 这也是为什么同名方法能够屏蔽掉父类方法的原因.
