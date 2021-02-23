---

category: Record
tags:
  - RxJS
date: 2021-2-14
title: RxJS常用操作符记录
---

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



不愧是"海量API", 我人看傻了, 一边学一边记录常用的好了.

会先把大致的作用都过一遍再回过头来补充代码示例, 这样可以互相比较嘛.

## 创建操作符

- of 接收一个参数并转换为ob
- ajax 基于Ajax请求创建一个ob
- from 接收一组参数并转为一组ob
- fromEvent 从DOM事件产生ob
- fromEventPattern 使用addHandler与removeHanler创建ob
- defer 惰性创建
- generate 基于条件与迭代器不断产生值, (initial, continueConditionFunc, iteratorFunc), 在条件为true时不断进行迭代
- empty 抛出一个直接complete的ob 使用NEVER替代
- throwError 抛出一个直接error的ob
- never 不会产生值也不会complete的ob 使用NEVER替代
- interval 定时器流, 
- timer 可延时的interval
- range 产生范围ob
- repeat 重复源ob产生的流



## 转换操作符

- buffer 当closingNotifier有输出时才会输出缓冲区数据
  - bufferCount 指定缓冲区长度
  - bufferTime 指定缓冲时间
  - bufferToggle 使用opening+closing控制
  - bufferWhen 当closing返回的ob发出数据时关闭当前缓冲区, 并立刻准备好下一个
- concatMap 接收project与resultSelector 相当于在源ob的每个值后附加一连串串行ob(处理完一串才会到下一串, 就像并发为1的mergeMap)
  - concatMapTo 接收innerOb与resultSelector 源值会被直接替换 并且最后会展平为单个ob来输出
- map mapTo 映射处理
- merge 合并多个ob源(可控制并发)
  - mergeMap 对每个值进行一次映射, 并且会使用mergeAll展平, 最后只会输出1个
  - mergeMapTo
  - mergeAll 将ob内的ob拿出来展平, 可控制并发
- scan 对每个源值应用累加器, 返回中间ob与最终ob
  - mergeScan 将累加器的中间与返回ob合并到输出ob
- switchMap 接收project与resultSelector 将源值映射后合并到最终ob 最终只会发出最新投射的值
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

- combineLatest 接收多个ob 在任意一个输入ob产生值时发出源ob与所有输入ob最新值的组合
  - 会在每个ob都至少发出一个值时才输出第一个值
  - 如果每个ob都只发送一个值, 并且计算需要的只是每个ob的最后一个值, 使用forkJoin更好
- combineAll 接收一个高阶ob 收集所有内部ob 在最外部ob完成时订阅所有已经收集的ob 并通过combineLatest打平
- concat 顺序的连结多个ob 在一个结束后才会开始下一个
  - concatAll 就像组合版本的combineAll(combineAll是[a, 1], [b, 2]的"组合", 而concatAll是a, 1, b, 2这样的"连结")
  - 如果对ob的执行顺序无要求, 可以使用merge
- merge 将多个ob组合到一个(不是combine那种将多个产生值合并为一个再输出的组合, 也不是concat那种一个完了再下一个, 就像是可并发的concat), 可控制并发
  - 如果对顺序有要求, 应当使用concat
  - mergeAll 通过同时发出高阶ob内部ob发出的值将高阶ob打平
- exhaust 专一版本的mergeAll 会在当前专注的内部ob未完成时丢弃掉其他ob发出的值
- switch 花心版本的exhaust 会丢弃掉当前专注的ob订阅新的有值发出的ob, 常用于请求竞态
- forkJoin 在接受的所有ob完成时输出每个ob最后的结果组成的值
  - 适用于只关心每个ob的最后一个值的情况
  - 如果有一个ob没有完成, 那么forkJoin永远不会产生值
  - 如果有ob失败了, 将失去其他ob的值, 此时应当使用catchError进行兜底
  - 如果需要正确的得到每个ob与值的相对应关系, 应该使用zip
- race 
- startWith 在pipe中存在时, 会先发出其内部的ob再发出源ob
  - endWith
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

