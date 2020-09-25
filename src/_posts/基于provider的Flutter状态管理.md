---
category: Learning
tags:
  - Other
date: 2020-09-23
title: Flutter状态管理(一)：使用Provider并复用你的Redux思想
---

## 前言

> 写作规划
>
> - [ ] InheritedWidget
> - [x] Provider
> - [ ] BLoC
> - [ ] Fish-Redux
> - [ ] RxDart

个人认为, 状态管理真的是前端避不开的问题..., 随着应用复杂度的提升, 好的状态管理方案在解耦 & 数据共享 & 数据流追踪控制 等方面都能起到很好的作用. 在Web开发中, 我们使用过Redux/Mobx/Reconciler这些主流方案, 或者是基于其基本思想的Dva/Icestore/Hox等等. 在Flutter中进行状态管理, 这实际上也是我首次接触. 因此可能存在一些错误或是不足, 还请见谅.

要开始学习Flutter的状态管理, 我们务必需要了解到Flutter的声明式编程理念, 就像JSX一样的 UI = f(State) 思路, 我们通常把"状态"分为两类:

- Ephemeral State, 瞬时状态

  这一类状态只会在其被定义的widget中使用, 不会发生状态共享, 也就是说其他widget不会有机会直接使用, 最多通过回调函数来更改.

- Global State, 全局状态

  这一类状态是状态管理重点关注的部分, 它需要在全局被共享, 供多个widget读写, 如用户登录态与个性化配置等. 如果我们将这些数据每次都在各个widget间进行传递, 无疑会使得整体代码极度耦合, 维护起来更是想让你捶死之前的自己.

![状态管理流程](https://user-gold-cdn.xitu.io/2020/5/29/1725e343dd8ed12a?imageslim)

实际上, 在编写React项目的思路与经验可以被大部分复用到Flutter项目中, 比如类似`context`的`InheritedWidget`, 类似`Redux`+`React-Redux`的`provider`(需要额外安装的依赖).



## Provider

> 由我翻译的 [provider中文文档](https://github.com/linbudu599/provider/blob/docs/simplified-chinese/resources/translations/zh-CN/README.md)

Provider是官方推荐的状态管理方案, 我个人上手后感觉和`Redux` + `React-Redux`的体感类似, 并且非常容易上手, 它的底层同样基于`[InheritedWidget]`, 官方给出的优势包括:

- 对资源的简易配置与卸载
- 懒加载
- 减少模板代码
- 开发者工具
- 更友好的开发者工具

> 截至2020.9.23, Provider版本为`4.3.2+2`

在开始前, 我们可以尝试将其中的重要概念对标到`React-Redux`中

- ChangeNotifier: 数据存放的地方, 就像`store`
- ChangeNotifierProvider: 提供数据的Widget, 就像我们放在React组件最外层的`<Provider>`组件, ChangeNotifierProvider只是提供的providers中最为常用的一种.
- Consumer: 数据的消费者
- Selector: 数据的清洗与'清洗过程优化', 就像`useSelector`或者是`Reselect`这种, 但暂时不清楚底层是否做了类似的缓存支持, 确定的是Selector会对集合类型的值做深比较

还是以计数器为例子:

首先创建一个`ChangeNotifier`, 保存状态:

> 在这里我使用的是Provider官方提供的例子, 混入`DiagnosticableTreeMixin`类并重写`debugFillProperties`方法主要是为了便于调试, 你也可以直接只继承`ChangeNotifier`

```dart
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class Counter with ChangeNotifier, DiagnosticableTreeMixin {
  int _count = 0;
  int get count => _count;

  void increment() {
    _count++;
    notifyListeners();
  }

  void decrement() {
    _count--;
    notifyListeners();
  }

  @override
  void debugFillProperties(DiagnosticPropertiesBuilder properties) {
    super.debugFillProperties(properties);
    properties.add(IntProperty('count', count));
  }
}
```

我们在其中提供了两个方法来对`_count`进行修改, 并在修改完成后调用`notifyListeners`, 这里是为了通知所有该数据的Consumer进行更新.



接着, 提供`ChangeNotifierProvider`, 就像在React中那样, 我们需要把它放置到组件树的顶层:

```dart
void main() {
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider(create: (_) => Counter()),
    ],
    child: StateManagementDemo(),
  ));
}

class StateManagementDemo extends StatelessWidget {
  const StateManagementDemo({Key key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Flutter 状态管理",
      home: HomePage(),
    );
  }
}

```

这里使用了`MultiProvider`, 来更清晰的组织状态树, 否则很可能出现Provider一层套一层的情况, 比如:

```dart
Provider<Something>(
  create: (_) => Something()，
  child: Provider<SomethingElse>(
    create: (_) => SomethingElse()，
    child: Provider<AnotherThing>(
      create: (_) => AnotherThing()，
      child: someWidget，
    )，
  )，
)，
```

这样的思路我们在Redux中也经常使用.

现在widget树内就可以共享这些状态了, 但我们需要使用Consumer来进行构建:

```dart
class HomePage extends StatelessWidget {
  const HomePage({Key key}) : super(key: key);

    
  Widget _text(BuildContext context, String text) {
  	return Text(text,
      	style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500));
  	}
  @override
  Widget build(BuildContext context) {
    print("build");
    return Center(
        child: Scaffold(
            appBar: AppBar(
              title: const Text('Provider Example'),
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text(
                    "Counter Cousumer",
                    style: Theme.of(context).textTheme.headline5,
                  ),
                  Consumer<Counter>(
                    builder: (ctx, counter, child) {
                      return Column(
                        children: <Widget>[
                          const Count(),
                          _text(context, "Consumer: ${counter.count}"),
                        ],
                      );
                    },
                  ),
                  Padding(padding: EdgeInsets.only(top: 20)),
                  Text(
                    "Transformed Counter Cousumer",
                    style: Theme.of(context).textTheme.headline6,
                  ),
                  Consumer<Transform>(
                    builder: (ctx, transform, child) {
                      return Column(
                        children: <Widget>[
                          _text(context,
                              "read: ${context.read<Transform>().transformed}"),
                          _text(context, 'Consumer: ${transform.transformed}'),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            floatingActionButton: // ...
            ));
  }
}
```

我们重点看这一部分:

```dart
Consumer<Counter>(
  builder: (ctx, counter, child) {
    return Column(
      children: <Widget>[
        const Count(),
        _text(context, "Consumer: ${counter.count}"),
        ],
      );
    },
  ),
```

它接受三个参数:

- ctx: `BuildContext`, 上下文(用于定位树中位置)
- 当前`ChangeNotifier`对应的实例
- child: 用于优化widget rebuild的手段, 使用方式见下面的例子

现在我们可以获取数据了, 那么消费呢? 我们创建`floatingActionButton`:

```dart
   floatingActionButton: Consumer<Counter>(
      child: Icon(Icons.add),
      builder: (ctx, counter, child) {
        return FloatingActionButton(
          child: child,
          onPressed: () {
            counter.increment();
          });
        })
```

> 像这样使用child参数来进行优化, 能够很好的控制widget的rebuild.
>

这里使用了`Selector`来构建组件, Selector的优势主要有:

- 更简洁的数据转换写法, 它接收两个泛型, 即为转换前与转换后的数据类型
- rebuild控制, 这里实际上能拿到转换前后的实例, 因此你可以做细粒度的控制

这里的数据获取, 其实我们还有几种方式:

```dart
// 1. 将Count抽离成单独的组件, 使用context.watch()来获取状态树, 并确保在Counter变化时rebuild HomePage组件, 这种将Consumer抽离成组件的方式能够起到优化性能的作用, 但不是必须的, 并且很少需要这么点性能提升.
class Count extends StatelessWidget {
  const Count({Key key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return _text(context,
        'Extract Count to a separate widget & [context.watch]: ${context.watch<Counter>().count}');
  }
}

// 2. 由于Provider基于InheritedWidget, 因此我们可以使用Provider.of, 但是实际上还是推荐Consumer, 因为毕竟自带性能优化(会确保尽可能少的rebuild)
   _text(context,'Provider.of<counter>(ctx): ${Provider.of<Counter>(ctx).count}')
```



我们再来简单回顾一下:

- 提供数据: 使用 [ChangeNotifierProvider](https://pub.dartlang.org/documentation/provider/latest/provider/ChangeNotifierProvider-class.html) , 或是根据你的需求使用其他的Provider如`FutureProvider`等, 为了更好的组织状态树, 推荐使用
- 消费数据: 使用 `Consumer` / `Selector` / `Provider.of()`(来自于`InheritedWidget`), 或者使用`provider`在构建上下文context上扩展的属性: `watch`/`select`/`read`(根据具体需求)
- 性能优化: Selector与`context.select<T>()`



另外一个可能比较常用的`Provider`: `ProxyProvider`, 它的用法主要是在数据层面对状态做转换, 可以同时接收多个providers的数据.

```dart
void main() {
  runApp(MultiProvider(
    providers: [
      ChangeNotifierProvider(
        create: (_) => Counter(),
        lazy: true,
      ),
      ProxyProvider<Counter, Transform>(
          update: (_, counter, __) => Transform(counter.count))
    ],
    child: ProviderDemo(),
  ));
}

class Transform {
  final int _value;

  const Transform(this._value);

  String get transformed => "U clicked $_value times";
}

// build
Text(
  "Transformed Counter Cousumer",
   style: Theme.of(context).textTheme.headline6,
  ),
  Consumer<Transform>(
    builder: (ctx, transform, child) {
      return Column(
        children: <Widget>[
           _text(context,
           "read: ${context.read<Transform>().transformed}"),
            _text(context, 'Consumer: ${transform.transformed}'),
          ],
        );
     },
   ),
```



