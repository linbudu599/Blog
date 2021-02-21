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
- [ ] 多播(multicast)
- [x] 错误处理
- [x] 工具
- [ ] 条件/布尔
- [ ] 数学/聚合

不愧是"海量API", 我人看傻了, 一边学一边记录常用的好了.

会先把大致的作用都过一遍再回过头来补充代码示例, 这样可以互相比较嘛.

## 创建操作符

- of 接收一个参数并转换为ob
- from 接收一组参数并转为一组ob
- fromEvent 从DOM事件产生ob
- fromEventPattern 使用addHandler与removeHanler创建ob
- defer 惰性创建
- empty 抛出一个直接complete的ob 使用NEVER替代
- throwError 抛出一个直接error的ob
- never 不会产生值也不会complete的ob 使用NEVER替代
- interval 定时器流
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
  - debounceTime
- throttle 发出一个值 沉默 直到第二个ob发送(或者完成) 继续下一个值 重复
  - throttleTime
- audit debounce返回沉默期间的第一个值, audit返回最后一个, durationOb持续的时间内会持续忽略源值. 最开始时durationOb是禁用的, 第一个源值到达, 启用durationOb, 持续忽略接下来的源值, durationOb到期禁用, 返回这段时间的最后一个值
  - auditTime
- sample 同步版本的audit/debounce? durationOb发出时发送最新的源值
  - sampleTime



## 组合操作符

- combineLatest 接收多个ob 每次发出所有ob最新值的组合 (在任意一个ob发送时)
- combineAll 接收一个高阶ob 收集所有内部ob 在最外部ob完成时订阅所有已经收集的ob 并通过combineLatest打平
- concat 顺序的连结多个ob 在一个结束后才会开始下一个
  - concatAll 就像组合版本的combineAll(combineAll是a1, b2, 而concatAll是a, 1, b, 2)
- exhaust 专一版本的mergeAll 会在当前专注的内部ob未完成时丢弃掉其他ob发出的值
- switch 花心版本的exhaust 会丢弃掉当前专注的ob订阅新的有值发出的ob
- forkJoin 在接受的所有ob完成时输出每个ob最后的结果组成的值
- merge 将多个ob组合到一个(不是combine那种), 可控制并发
  - mergeAll 通过同时发出高阶ob内部ob发出的值将高阶ob打平
- race
- startWith 在pipe中存在时, 会先发出其内部的ob再发出源ob
- withLatestForm 在源ob发出值时使用此值和输入ob的最新值计算输出值
- zip 组合多个ob 最后得到一个ob 值来自于输入ob按顺序计算而来(同样不是combine那种组合)



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
- toPromise