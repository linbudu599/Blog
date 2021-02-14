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
- [ ] 过滤
- [ ] 组合
- [ ] 多播(multicast)
- [ ] 错误处理
- [ ] 工具
- [ ] 条件/布尔
- [ ] 数学/聚合

不愧是"海量API", 我人看傻了, 一边学一边记录常用的好了.

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