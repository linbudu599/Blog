---
category: Record
tags:
  - RxJS
date: 2021-2-14
title: RxJS学习记录
---

## 前言

## 整理进度

- [x] 创建
- [x] 转换
- [x] 过滤
- [x] 组合
- [x] 多播(multicast)
- [x] 错误处理
- [x] 工具
- [x] 条件/布尔
- [x] 数学/聚合
- [x] Subject
- [ ] Scheduler
- [x] [太狼老师的教程](https://zhuanlan.zhihu.com/p/23464709)



不愧是"海量API", 我人看傻了, 一边学一边记录常用的好了.

会先把大致的作用都过一遍再回过头来补充代码示例, 这样可以互相比较嘛.

## 创建操作符

- of 接收任意参数并转换为ob

  - scheduler已被弃用，应当将of替换为scheduled操作符

- ajax 基于Ajax请求创建一个ob （导出自rxjs/ajax）

  - 使用方式：

    ```typescript
    import { ajax } from 'rxjs/ajax';
    import { map, catchError } from 'rxjs/operators';
    import { of } from 'rxjs';
    
    const obs$ = ajax(`https://api.github.com/users?per_page=5`).pipe(
      map(userResponse => console.log('users: ', userResponse)),
      catchError(error => {
        console.log('error: ', error);
        return of(error);
      })
    );
    ```

  - 类似于axios，ajax方法也可以接受一个由url、method、headers、body等属性组成的对象

- from 接收一组参数并转为一组ob

  - scheduler已被弃用，应当将of替换为scheduled操作符

  - 可被转化为Observable的类型一览

    ```typescript
    export type ObservableInput<T> =
      | Observable<T>
      | InteropObservable<T>
      | AsyncIterable<T>
      | PromiseLike<T>
      | ArrayLike<T>
      | Iterable<T>
      | ReadableStreamLike<T>;
    ```

- fromEvent 从DOM事件产生ob

- fromEventPattern 使用addHandler与removeHanler创建ob

- defer 惰性创建，在被订阅时才会调用工厂函数创建一个Ob

  - 相关：
    - 条件操作符iif：（condition，trueRes=EMPTY，fasleRes=EMPTY），根据条件动态的判断订阅哪个Ob，常和mergeMap一起使用（打平内部Ob）

- generate 基于条件与迭代器不断产生值, (initial, continueConditionFunc, iteratorFunc, resultSelector), 在条件为true时不断进行迭代

- empty 抛出一个直接complete的ob，不返回值，应使用EMPTY替代。

  - 相当于它直接调用`subscript.complete()`
  - 相关：
    - isEmpty，如果输入的Observable产生了值，那么它就会返回false。
    - defaultEmpty，接受一个默认值，如果输入Observable没有产生值，则使用这一操作符的默认值。

- throwError 抛出一个直接error的ob，接受一个工厂函数，用于创建错误实例。

  - 相当于它直接调用`subscript.error()`
  - 相关：
    - throwIfEmpty：如果源Ob没有产生值，就会产生一个错误。如果没有指定工厂函数，则使用EmptyError。
    - catchError：通过返回一个新的ob或者抛出错误来catch管道中的错误。

- never 不会产生值也不会complete的ob。已废弃，使用NEVER替代。

- interval（period）定时器流, 从0开始产生值。

  - 相关：
    - timeInterval：发出一个对象，包含当前值以及上一个值到当前值的时间间隔

- timer （initialDelay，period）可延时的interval，从0开始产生值。

- range (start, count)产生范围ob。

- repeat （count = Infinity）重复源ob产生的流。



## 转换操作符

- buffer 当closingNotifier有输出时才会输出缓冲区数据，以数组的形式

  - 相关：
    - bufferCount （size，startBufferEvery） 使用固定长度的缓冲区，而非closingNotifier。第二个参数startBufferEvery指定何时开始缓存下一个buffer，如指定为1，则结果如下(size为5)：
      - 1s [0] -> 2s [0,1] [1] -> 3s [0,1,2] [1,2] [2] ...
    - bufferTime （bufferTimeSpan，bufferCreationInterval）指定缓冲时间，每隔span秒发送一次缓冲区，每隔interval开启一个缓冲区
    - bufferToggle （opening：Ob， closingSelector: Func）使用opening+closing控制，opening Ob有值产生时，开启一个新的缓冲区，并在closingSelector返回Ob有值产生时，输出缓冲区内容。
    - bufferWhen （closingSelector: Func） 当closing返回的ob发出数据时，关闭当前缓冲区, 并立刻准备好下一个

- concatMap （project，resultSelector），相当于在源ob的每个值后附加一连串串行ob(处理完一串才会到下一串, 就像并发为1的mergeMap)。

  - 用于产生高阶Ob（concat、concatAll是组合操作符，一个接收Ob，一个无参数，concatAll在管道中的上一级通常会map回来新的Ob或是，然后concatAll会依次订阅这些Ob）

  - 实例

    ```typescript
    const source = of(2000, 1000);
    // map value from source into inner observable, when complete emit result and move to next
    const example = source.pipe(
      concatMap(val => of(`Delayed by: ${val}ms`).pipe(delay(val)))
    );
    
    //output: With concatMap: Delayed by: 2000ms, With concatMap: Delayed by: 1000ms
    const subscribe = example.subscribe(val =>
      console.log(`With concatMap: ${val}`)
    );
    ```

    

  - concatMapTo 接收innerOb与resultSelector,源值会被直接替换 并且最后会展平为单个ob来输出

- map mapTo 映射处理

- merge 合并多个ob源(可控制并发)
  - mergeMap 对每个值进行一次映射, 并且会使用mergeAll展平, 最后只会输出1个
  - mergeMapTo
  - mergeAll 将ob内的ob拿出来展平, 可控制并发
  
- scan 对每个源值应用累加器, 返回中间ob与最终ob
  - mergeScan 将累加器的中间与返回ob合并到输出ob
  
- switchMap 接收project与resultSelector 将源值映射后合并到最终ob 最终只会发出最新投射的值
  
  - 能够取消副作用
  - 切换到一个全新的Ob
  - switchMapTo
  - switch 通过只发出ob内部的最新ob来展平一个高阶ob
  
- groupBy 基于keySelector/eleSelector进行分组

- pairwise 从第2项开始成对的发送当前值与前一个值 [1,2]

- partition 将源一分为二: 满足与不满足的

- pluck 将源值映射为源值的键值

- window 在内部ob发出项时, 将源ob的值分割为嵌套的ob
  - 就像buffer, 但这里是将多个值组合成嵌套的ob
  - windowCount 每个窗口值有上限版本
  - windowToggle 以opening作为窗口开始, 以closing作为结束
  - windowWhen 每当closing有值产生时发出当前的窗口并开始下一个



## 过滤操作符

- delay 为源的所有值进行延时
- distinct 返回与之前源ob发出的值都不同的值(keySelector + Set)
  - distinctUntilChanged 返回所有与前一项不同的值
  - distinctUntilKeyChanged  可接收keySelector版本的distinctUntilChanged 
- elementAt 发出发送序列的第N个值
- filter
- first 返回第一个值(或是第一个通过筛选的值)
  - last
- ignoreElements  忽略所有项, 直接调用源的complete/error
- single  返回单个匹配项
- skip跳过前N个值
  - skipLast
  - skipUntil 跳过直到notifierOb开始发送值
- take
  - takeLast
  - takeUntil 持续发送直到notifierOb开始发送值
  - takeWhile 发出满足条件的每个值, 并在出现不满足的值时立即完成
- debounce 由durationOb决定的一段时间内都没有一个新的源值发送, 才会发出下一个值
  - debounceTime 源ob发送一个值后, 在指定时间内都没有下一个值, 才会发出当前的这个值
- throttle 发出一个值 沉默 直到第二个ob发送(或者完成) 继续下一个值 重复
  - throttleTime 发出一个值后会沉默指定时间 在此过程中源ob的输出都将被忽略  指定时间结束后才能够发送下一个值
- audit debounce返回沉默期间的第一个值, audit返回最后一个, durationOb持续的时间内会持续忽略源值. 最开始时durationOb是禁用的, 第一个源值到达, 启用durationOb, 持续忽略接下来的源值, durationOb到期禁用, 返回这段时间的最后一个值
  - auditTime
- sample 同步版本的audit/debounce? durationOb发出时发送最新的源值
  - sampleTime



## 组合操作符

- combineLatest 接收多个ob 在任意一个输入ob产生值时发出源ob与所有输入ob最新值（最新值是相对于单个Ob来说的）的组合
  - 会在每个ob都至少发出一个值时才输出第一个值（与withLatestFrom一致）
  - 如果每个ob都只发送一个值, 或者计算需要的只是每个ob的最后一个值, 使用forkJoin更好
  
- combineAll 接收一个高阶ob 收集所有内部ob 在最外部ob完成时订阅所有已经收集的ob 并通过combineLatest打平。

  - 具体地说，在源Ob完成后，对内部ob应用combineLatest 

  - 实例：

    ```typescript
    import { take, map, combineAll } from 'rxjs/operators';
    import { interval } from 'rxjs';
    
    const source$ = interval(1000).pipe(take(2));
    
    const example$ = source$.pipe(
      map(val =>
        interval(1000).pipe(
          map(i => `Result (${val}): ${i}`),
          take(5)
        )
      )
    );
    
    // source$2 比 source$1晚产生1s
    example$
      .pipe(combineAll())
      /*
      output:
      ["Result (0): 0", "Result (1): 0"]
      ["Result (0): 1", "Result (1): 0"]
      ["Result (0): 1", "Result (1): 1"]
      ["Result (0): 2", "Result (1): 1"]
      ["Result (0): 2", "Result (1): 2"]
      ["Result (0): 3", "Result (1): 2"]
      ["Result (0): 3", "Result (1): 3"]
      ["Result (0): 4", "Result (1): 3"]
      ["Result (0): 4", "Result (1): 4"]
    */
      .subscribe(console.log);
    ```

    

- concat （...obs）顺序的连结多个ob，但是在一个结束后才会开始下一个
  - concatAll，同样用于处理高阶Ob。它的处理方式是对于返回的内部Ob，一个个的进行订阅。就像组合版本的combineAll(combineAll是[a, 1], [b, 2]的"组合", 而concatAll是a,b,1,2这样的"连结")
  
    - 实例
  
      ```typescript
      import { take, concatAll } from 'rxjs/operators';
      import { interval, of } from 'rxjs';
      
      // interval返回的还是Ob，这里之前是个误区，包括of等返回的都是Ob
      const obs1 = interval(1000).pipe(take(5));
      const obs2 = interval(500).pipe(take(2));
      const obs3 = interval(2000).pipe(take(1));
      //emit three observables
      const source = of(obs1, obs2, obs3);
      
      const example = source.pipe(concatAll());
      
      /*
        output: 0,1,2,3,4,0,1,0
      */
      const subscribe = example.subscribe(val => console.log(val));
      ```
  
      
  
  - 如果对ob的执行顺序无要求, 可以使用merge
  
    
  
- merge 将多个ob组合到一个(不是combineLatest那种将多个产生值合并为一个再输出, 也不是concat那种一个完了再下一个), 就像是字面意思...的合并到一个Ob。
  
  - 有点像zip，但zip是等所有Ob都产生一次值后再以数组发出收集的值。
  - 如果对顺序有要求, 应当使用concat
  - mergeAll （concurrent），接收一个产生ob的源ob，通过同时发出高阶ob内部ob发出的值将高阶ob打平。同样会等源ob完成生产所有内部ob后，再订阅这些内部ob？
  
- exhaustAll 专一版本的mergeAll 会在当前专注的内部ob未完成时丢弃掉其他ob发出的值

- switchAll 花心版本的exhaust 会丢弃掉当前专注的ob订阅新的有值发出的ob, 常用于请求竞态

- forkJoin（属于静态方法，不会被用在pipe中） 在接受的所有ob完成时输出每个ob最后的结果组成的值
  - 适用于只关心每个ob的最后一个值的情况
  - 如果有一个ob没有完成, 那么forkJoin永远不会产生值
  - 如果有ob失败了, 将失去其他ob的值, 此时应当使用catchError进行兜底
  - 如果需要正确的得到每个ob与值的相对应关系, 应该使用zip
  
- race 发出最新的值，在遇到错误时，不会做出响应（所以不会被catchError catch到）

- startWith 在pipe中存在时, 会先发出其内部的ob再发出源ob
  - endWith 在源ob完成时，发出一个值
  - 如果想要在计算完成时执行操作, 但不想要产生一个新值, 应该使用finalize
  
- withLatestFrom 在源ob发出值时使用此值和输入ob的最新值计算输出值

- zip 组合多个ob 最后得到一个ob 值来自于输入的ob按顺序计算而来



## 多播

- multicast 将一个ob在多个订阅者之间共享, 通常会先将订阅者添加到Subject上, 再由Subject监听多播ob, 见下方Subject相关
- share 就像自带refCount的multicast
- shareReplay 在share的基础上还能够缓存最后N个值
  - 通常在有副作用或者复杂计算时, 为了避免其在多个订阅者中都进行执行, 或者后续加入的订阅者需要能够访问先前的值.
- publish 需要手动调用connect的multicast/share, 就像是先注册到订阅者列表中, 手动决定何时开始发布值



## 错误处理

- catchError 通过返回一个新的ob来捕获错误
- retry(count) 返回源ob在发生错误时不断重新从头尝试直到最大重试次数的ob
- retryWhen((errors)=>ob) 在源ob发生error时 将error传递给notifier进行判断 当notifier进入complete或者error时 对源ob的订阅也将进入complete或者error 如果notifier不断继续 则会从头开始订阅源ob



## 工具操作符

- tap(原先的do) 在每次源ob发送值时 执行一次操作 不影响返回的ob
- delay 延迟源ob发送

  - delayWhen 由接收的ob决定延迟时间
- materialize 将ob包装为Notification类型, 此对象是`{kind:"", value:"", error:undefined, hasValue: true}`的形式
  - dematerialize: 相反, 从Notification对象到ob代表着的发送(即 next complete error)
- observerOn: 基于指定的调度器重新发出通知, 如`Scheduler.animationFrame`
  - subscribeOn: 基于指定的调度器订阅
- timeInterval 发出包含当前值以及与前一次发出值间隔的时间(基于调度器的now方法获取每次的当前时间, 再计算时间差)
- timestamp 在产生值时 为其附加一个时间戳
- timeout 在指定时间内没有ob产生时抛出错误
  - timeoutWith 在指定时间内没有ob产生时订阅另一个源ob
- toArray 将源ob的所有值收集到数组中
- finalize 在ob结束后执行操作



## 条件/布尔

- defaultIfEmpty 为直到完成时也没有值产生的源ob指定一个默认值
- every 判断源ob发出的每个值是否都满足指定条件, 如果是, 则返回true
- find 发出源ob中第一个满足条件的值
  - findIndex
- isEmpty 在源ob为空的情况下发出一个发出true的ob
- sequenceEqual依次比较两个源ob产生的每个值, 在完全相等时返回true
- iif 在订阅将被发起时才决定订阅哪一个ob(三元表达式)



## 数学/聚合

- count 在源ob完成时告知发送值的数量
- max 通过比较函数找到源ob发出值中最大的一项
  - min
- reduce 在源ob发出的值上应用累加器函数 并返回最终的累加值



## 调度器



## Subject

- Subject是特殊的ob, 它能够在多个观察者之间共享一个ob(在正常情况下, 一个ob的多个观察者, 每一个都会重新执行这个ob)

- Subject实际上也是EventEmitter, 它将维护多个观察者的注册信息

- multicast操作符在底层实际上使用了Subject

- Subject可以被订阅, 并且订阅者并不能区分自己订阅的是ob还是sub, 但subscribe方法实际上不会直接调用ob, 而是像addEventListener那样新增一个订阅者到注册信息中

- Subject可以通过next error complete方法来将值/状态传递给所有观察者们

  ```typescript
  const sub = new Subject();
  
  sub.subscribe((x) => console.log(`1-${x}`));
  sub.subscribe((x) => console.log(`2-${x}`));
  
  sub.next('item1');
  sub.next('item2');
  sub.next('item3');
  
  sub.complete();
  
  1-item1
  2-item1
  1-item2
  2-item2
  1-item3
  2-item3
  ```

- Subject同时还可以作为观察者, 也就是直接被传给ob的subscribe方法

  ```typescript
  const sourceOb = from([1, 2, 3]);
  
  const sub = new Subject();
  
  sub.subscribe((x) => console.log(`1-${x}`));
  sub.subscribe((x) => console.log(`2-${x}`));
  
  sourceOb.subscribe(sub);
  
  1-1
  2-1
  1-2
  2-2
  1-3
  2-3
  ```

  这里可以理解为, sub上注册的订阅者现在将多播的订阅sourceOb

  > Subject是将任意ob执行同时在多个订阅者之间共享的唯一方式

### 多播的ob

> 多播的ob会将通知通过一个可能拥有多个订阅者的subject发送出去

multicast的底层原理: 观察者订阅subject, 由subject进行注册, 然后再由subject去订阅源ob, 将源ob的值多播给多个观察者:

```typescript
const sourceOb = from([1, 2, 3]);

const sub = new Subject();

const multicasted = sourceOb.pipe(multicast(sub));

// 实际上即是sub.subscribe
multicasted.subscribe((x) => console.log(`1-${x}`));
multicasted.subscribe((x) => console.log(`2-${x}`));

sourceOb.subscribe(sub);
```

### 引用计数

 假设要实现第一个观察者到达时自动连结, 最后一个观察者取消订阅时自动取消共享, 使用手动订阅需要自己一个个处理subscribe和unsubscribe, 在这种情况下, 可以将refCount方法加入到管道中, 它会在第一个订阅者出现时让多播ob自动启动(共享), 在最后一个订阅者离开时取消共享.

```typescript
const source = interval(500);
const subject = new Subject();
const refCounted = source.pipe(multicast(subject), refCount());

let subscription1: Subscription, subscription2: Subscription;

console.log('observerA subscribed');
// 会自动开始共享ob 因为第一个订阅者出现了
subscription1 = refCounted.subscribe({
  next: (v) => console.log(`observerA: ${v}`),
});

setTimeout(() => {
  console.log('observerB subscribed');
  subscription2 = refCounted.subscribe({
    next: (v) => console.log(`observerB: ${v}`),
  });
}, 600);

setTimeout(() => {
  console.log('observerA unsubscribed');
  subscription1.unsubscribe();
}, 1200);

// 取消共享 因为没有观察者了
setTimeout(() => {
  console.log('observerB unsubscribed');
  subscription2.unsubscribe();
}, 2000);
```

### BehaviorSubject

新增了"当前值"的概念, 会保存被发送的最新值, 并且当新的观察者参与订阅时会立即接收到当前值.

```typescript
const subject = new BehaviorSubject(0); // 0 is the initial value

subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`),
});

subject.next(1);
subject.next(2);

subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`),
});

subject.next(3);

observerA: 0
observerA: 1
observerA: 2
observerB: 2
observerA: 3
observerB: 3
```

第二个观察者接收到的首个值就是2



### ReplaySubject

类似前一个, 但它可以发送旧的值给订阅者(根据实例化时的缓冲长度决定)

```typescript
subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
 
subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);
 
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});
 
subject.next(5);

// observerA: 1
// observerA: 2
// observerA: 3
// observerA: 4
// observerB: 2
// observerB: 3
// observerB: 4
// observerA: 5
// observerB: 5
```

B加入时, 最新的3个值: 2 3 4会被发送给B

> 除了指定缓冲长度, 还可以指定缓存时间

### AsyncSubject

只有当当前共享的Ob完成时, 才会将最后一个值发送给所有订阅者

> 只发送一个值, 类似last操作符

```typescript
const subject = new AsyncSubject();
 
subject.subscribe({
  next: (v) => console.log(`observerA: ${v}`)
});
 
subject.next(1);
subject.next(2);
subject.next(3);
subject.next(4);
 
subject.subscribe({
  next: (v) => console.log(`observerB: ${v}`)
});
 
subject.next(5);
subject.complete();
 
// Logs:
// observerA: 5
// observerB: 5
```



## 太狼老师的教程

### 一

要实现的功能:

- 输入字符, 敲击回车/点击ADD, 创建一个Todo Item并清空输入框
- 点击一个TodoItem来完成它
- 移除TodoItem

> 这篇文章使用的RxJS版本是5.x, 也就是说在6.x使用需要把链式调用转换为`.pipe`调用

```typescript
import { Observable } from "rxjs";
import { createTodoItem } from "./lib";

const $input = <HTMLInputElement>document.querySelector(".todo-val");
const $list = <HTMLUListElement>document.querySelector(".list-group");
const $add = document.querySelector(".button-add");

const enter$ = Observable.fromEvent<KeyboardEvent>($input, "keydown").filter(
  // 监听enter键作为一个单独的流
  (r) => r.keyCode === 13
);

// add键的点击同理
const clickAdd$ = Observable.fromEvent<MouseEvent>($add, "click");

// 将enter与add点击监听合并为一个流
const input$ = enter$.merge(clickAdd$);

const item$ = input$
  // 提取输入值
  .map(() => $input.value)
  // 去空
  .filter((r) => r !== "")
  // 返回一个DOM片段
  .map(createTodoItem)
  // 使用do来执行副作用/DOM操作等
  .do((ele: HTMLLIElement) => {
    $list.appendChild(ele);
    // 清空输入框
    $input.value = "";
  })
  .publishReplay(1)
  .refCount();

const toggle$ = item$
  // mergeMap 对每个值进行一次映射 并使用mergeAll展平最后的结果
  .mergeMap(($todoItem) =>
    // 将item映射到item的点击事件
    Observable.fromEvent<MouseEvent>($todoItem, "click")
      // 仅关心item被点击
      .filter((e) => e.target === $todoItem)
      // 再将每次点击映射回item
      .mapTo($todoItem)
  )
  .do(($todoItem: HTMLElement) => {
    // 处理样式(标识状态)
    if ($todoItem.classList.contains("done")) {
      $todoItem.classList.remove("done");
    } else {
      $todoItem.classList.add("done");
    }
  });

const remove$ = item$
  .mergeMap(($todoItem) => {
    const $removeButton = $todoItem.querySelector(".button-remove");
    return Observable.fromEvent($removeButton, "click").mapTo($todoItem);
  })
  .do(($todoItem: HTMLElement) => {
    // 从 DOM 上移掉 todo item
    const $parent = $todoItem.parentNode;
    $parent.removeChild($todoItem);
  });

const app$ = toggle$.merge(remove$).do((r) => console.log(r));

app$.subscribe();

// lib
export const createTodoItem = (val: string) => {
  const result = <HTMLLIElement>document.createElement("LI");
  result.classList.add("list-group-item");
  const innerHTML = `
    ${val}
    <button type="button" class="btn btn-default button-remove" aria-label="right Align">
      <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
    </button>
  `;
  result.innerHTML = innerHTML;
  return result;
};
```

主要关注:

- 由于add键点击与enter的效果相同, 所以可以将这两个流合并(merge)
- 为每一个item进行一次映射, 然后展平内部的所有ob >>> mergeMap
- 将item映射到item的点击事件, 过滤target不为对应item的点击事件, 再将满足条件的点击事件映射回(mapTo)item, 然后在do中对这个item进行操作

- 由于ob默认是单播的, 即会为每一个订阅者进行一次独特的执行. 这里假设先点击了toggle, 执行完毕后点击remove, remove会重新去订阅, 但此时已经没有流会产生(因为没有输入事件了), 因此需要将此ob多播, 猜测publishReplay即为shareReplay, 思路类似, refCount则用于自动启用?



## 二

实现功能:

- 回车/add后发送请求, 在请求返回后清空输入框并基于结果生成todo, 在请求返回前回车/add时, 比对输入框当前值与上一个值是否相同, 仅在不想同时才会取消掉上次请求并发送新请求(竞态)
- 点击item时发送请求, 间隔300ms内的点击只会发出一次
- 每次输入字符会在停止200ms后发送一个请求, 搜索是否有匹配的todo, 若有则高亮匹配项. 如果在上一次搜索返回前输入了新字符, 则取消掉上一个

```typescript
import { Observable, Subject } from "rxjs";
import {
  createTodoItem,
  mockToggle,
  mockHttpPost,
  search,
  HttpResponse,
} from "./lib";

const $input = <HTMLInputElement>document.querySelector(".todo-val");
const $list = <HTMLUListElement>document.querySelector(".list-group");
const $add = document.querySelector(".button-add");

// 后面的 search$ 与 enter 应该时从同一个 Observable 中转换出来，这里将 input 事件的 Observable publish 成 muticast
const type$ = Observable.fromEvent<KeyboardEvent>($input, "keydown")
  .publish()
  .refCount();

const search$ = type$
  .debounceTime(200)
  .filter((evt) => evt.keyCode !== 13)
  .map((result) => (<HTMLInputElement>result.target).value)
  .switchMap(search)
  .do((result: HttpResponse | null) => {
    const actived = document.querySelectorAll(".active");
    Array.prototype.forEach.call(actived, (item: HTMLElement) => {
      item.classList.remove("active");
    });
    if (result) {
      const item = document.querySelector(`.todo-item-${result._id}`);
      item.classList.add("active");
    }
  });

const enter$ = type$.filter((r) => r.keyCode === 13);

const clickAdd$ = Observable.fromEvent<MouseEvent>($add, "click");

const input$ = enter$.merge(clickAdd$);

const clearInputSubject$ = new Subject<any>();

const item$ = input$
  .map(() => $input.value)
  .filter((r) => r !== "")
  // 使输入框值不变时无法走到请求取消的环节
  // 返回与之前源ob都不同的值
  // .distinct()
  // 避免在输入值相同时也过滤掉ob
  // flushes会清空缓存：flushes会被订阅，并在完成时清空缓存
  .distinct(null, clearInputSubject$)
  // 当ob内部流动的值同样是ob时  订阅最新的一个 将其的值传给下一个操作符 并取消对上一个的订阅
  // 实际上就是先switch然后map
  .switchMap(mockHttpPost)
  .map(createTodoItem)
  .do((ele: HTMLLIElement) => {
    $list.appendChild(ele);
    $input.value = "";
  })
  .publishReplay(1)
  .refCount();

const toggle$ = item$
  .mergeMap(($todoItem) => {
    return (
      Observable.fromEvent<MouseEvent>($todoItem, "click")
        // 300ms内只会发出一次
        .debounceTime(300)
        .filter((e) => e.target === $todoItem)
        .mapTo({
          data: {
            _id: $todoItem.dataset["id"],
            isDone: $todoItem.classList.contains("done"),
          },
          $todoItem,
        })
    );
  })
  .switchMap((result) =>
    mockToggle(result.data._id, result.data.isDone)
      // 映射回原对象
      .mapTo(result.$todoItem)
  );

const remove$ = item$
  .mergeMap(($todoItem) => {
    const $removeButton = $todoItem.querySelector(".button-remove");
    return Observable.fromEvent($removeButton, "click").mapTo($todoItem);
  })
  .do(($todoItem: HTMLElement) => {
    // 从 DOM 上移掉 todo item
    const $parent = $todoItem.parentNode;
    $parent.removeChild($todoItem);
  });

const app$ = toggle$.merge(remove$, search$).do((r) => {
  console.log(r);
});

app$.subscribe();
```

注意点:

- 多播ob的应用场景, 及派生ob
- distinct的flushes

### 三

- 文件上传: 断点续传与恢复/分片/进度展示

> 后面会用框架重构

```typescript
import { Observable, Subscriber, Subject } from "rxjs";
// spark-md5 没有第三方 .d.ts 文件，这里用 commonjs 风格的 require 它
// 如果未再 tsconfig.json 中设置 noImplicitAny: true 且 TypeScript 版本大于 2.1 则也可以用
// import * as SparkMD5 from 'spark-md5' 的方式引用
const SparkMD5 = require("spark-md5");
// @warn memory leak
const $attachment = document.querySelector(".attachment");
const $progressBar = document.querySelector(".progress-bar") as HTMLElement;
const apiHost = "http://127.0.0.1:5000/api";

interface FileInfo {
  fileSize: number;
  fileMD5: string;
  lastUpdated: string;
  fileName: string;
}

interface ChunkMeta {
  fileSize: number;
  chunkSize: number;
  chunks: number;
  fileKey: string;
}

type Action = "pause" | "resume" | "progress" | "complete";

export class FileUploader {
  // 有文件进入时触发
  // 原始流
  private file$ = Observable.fromEvent($attachment, "change")
    .map((r: Event) => (r.target as HTMLInputElement).files[0])
    .filter((f) => !!f);

  private click$ = Observable.fromEvent($attachment, "click")
    // 过滤子节点冒泡
    .map((e: Event) => e.target)
    .filter((e: HTMLElement) => e === $attachment)
    // 1-2-3 上传-暂停-继续
    // scan会不断生成这几个状态
    .scan((acc: number, val: HTMLElement) => {
      if (val.classList.contains("glyphicon-paperclip")) {
        return 1;
      }
      if (acc === 2) {
        return 3;
      }
      return 2;
    }, 3)
    .filter((v) => v !== 1)
    // 根据状态改变icon样式
    .do((v) => {
      console.log(v);
      if (v === 2) {
        this.action$.next({ name: "pause" });
        $attachment.classList.remove("glyphicon-pause");
        $attachment.classList.add("glyphicon-play");
      } else {
        this.action$.next({ name: "resume" });
        this.buildPauseIcon();
      }
    })
    .map((v) => ({ action: v === 2 ? "PAUSE" : "RESUME", payload: null }));

  private action$ = new Subject<{
    name: Action;
    payload?: any;
  }>();

  private pause$ = this.action$.filter((ac) => ac.name === "pause");
  private resume$ = this.action$.filter((ac) => ac.name === "resume");

  // 进度流
  private progress$ = this.action$
    .filter((action) => action.name === "progress")
    .map((action) => action.payload)
    .distinctUntilChanged((x: number, y: number) => x - y >= 0)
    .do((r) => {
      const percent = Math.round(r * 100);
      $progressBar.style.width = `${percent}%`;
      $progressBar.firstElementChild.textContent = `${
        percent > 1 ? percent - 1 : percent
      } %`;
    })
    .map((r) => ({ action: "PROGRESS", payload: r }));

  public uploadStream$ = this.file$
    .switchMap(this.readFileInfo)
    .switchMap((i) =>
      Observable.ajax
        // 获取分片信息(并不是实际上传)
        .post(`${apiHost}/upload/chunk`, i.fileinfo)
        .map((r) => {
          // 按照返回的分片信息进行分片
          const blobs = this.slice(
            i.file,
            r.response.chunks,
            r.response.chunkSize
          );
          return { blobs, chunkMeta: r.response };
        })
    )
    // 创建暂停按钮
    .do(() => this.buildPauseIcon())
    .switchMap(({ blobs, chunkMeta }) => {
      const uploaded: number[] = [];
      const dists = blobs.map((blob, index) => {
        let currentLoaded = 0;
        return this.uploadChunk(chunkMeta, index, blob).do((r) => {
          currentLoaded = r.loaded / chunkMeta.fileSize;
          uploaded[index] = currentLoaded;
          const percent = uploaded.reduce((acc, val) => acc + (val ? val : 0));
          // 计算进度
          this.action$.next({ name: "progress", payload: percent });
        });
      });

      // 并发上传所有分片(并发度3)
      const uploadStream = Observable.from(dists).mergeAll(this.concurrency);

      // 所有分片上传完毕后输出值
      // 再映射到本次切片的元数据chunkMeta
      return Observable.forkJoin(uploadStream).mapTo(chunkMeta);
    })
    // 上传分片
    .switchMap((r: ChunkMeta) =>
      Observable.ajax
        .post(`${apiHost}/upload/chunk/${r.fileKey}`)
        // 将请求映射到上传状态
        .mapTo({
          action: "UPLOAD_SUCCESS",
          payload: r,
        })
    )
    .do(() => {
      $progressBar.firstElementChild.textContent = "100 %";
      // restore icon
      $attachment.classList.remove("glyphicon-pause");
      $attachment.classList.add("glyphicon-paperclip");
      ($attachment.firstElementChild as HTMLInputElement).disabled = false;
    })
    // 与过程流 点击流合并
    .merge(this.progress$, this.click$);

  constructor(private concurrency = 3) {}

  // side effect
  private buildPauseIcon() {
    $attachment.classList.remove("glyphicon-paperclip");
    $attachment.classList.add("glyphicon-pause");
    ($attachment.firstElementChild as HTMLInputElement).disabled = true;
  }

  // 读取文件信息
  // 拿到文件流后会附带文件信息与MD5信息
  // 用于uploadSream$的第一次switchMap
  private readFileInfo(
    file: File
  ): Observable<{ file: File; fileinfo: FileInfo }> {
    const reader = new FileReader();
    const spark = new SparkMD5.ArrayBuffer();
    reader.readAsArrayBuffer(file);
    return Observable.create(
      (observer: Subscriber<{ file: File; fileinfo: FileInfo }>) => {
        reader.onload = (e: Event) => {
          spark.append((e.target as FileReader).result);
          const fileMD5 = spark.end();
          observer.next({
            file,
            fileinfo: {
              fileMD5,
              fileSize: file.size,
              lastUpdated: file.lastModifiedDate.toISOString(),
              fileName: file.name,
            },
          });
          observer.complete();
        };
        return () => {
          if (!reader.result) {
            console.warn("read file aborted");
            reader.abort();
          }
        };
      }
    );
  }

  private slice(file: File, n: number, chunkSize: number): Blob[] {
    const result: Blob[] = [];
    for (let i = 0; i < n; i++) {
      const startSize = i * chunkSize;
      const slice = file.slice(
        startSize,
        i === n - 1 ? startSize + (file.size - startSize) : (i + 1) * chunkSize
      );
      result.push(slice);
    }
    return result;
  }

  private uploadChunk(
    meta: ChunkMeta,
    index: number,
    blob: Blob
  ): Observable<ProgressEvent> {
    const host = `${apiHost}/upload/chunk/${meta.fileKey}?chunk=${
      index + 1
    }&chunks=${meta.chunks}`;
    return Observable.create((subscriber: Subscriber<ProgressEvent>) => {
      const ajax$ = Observable.ajax({
        url: host,
        body: blob,
        method: "post",
        crossDomain: true,
        headers: { "Content-Type": "application/octet-stream" },
        // 进度获取
        progressSubscriber: subscriber,
      })
        // 在暂停流有输出时 停止输出值
        .takeUntil(this.pause$)
        // 在恢复流有输出时 重复
        .repeatWhen(() => this.resume$);
      const subscription = ajax$.subscribe();
      return () => subscription.unsubscribe();
    }).retryWhen(() => this.resume$);
  }
}
```

