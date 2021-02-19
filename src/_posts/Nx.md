---
category: Learning
tags:
  - Angular
  - Nest
  - Node

date: 2021-2-19
title: 基于Nx打造你的Angular+NestJS Monorepo 项目(大纲状态)
---

## 大纲

这篇文章感觉有点尴尬, Angular在国内的受众技术水平肯定比我顶, 看这篇教写Todo App的文章没啥意义, 而且官网教程也是写个Todo. 而要是不会Angular的, 看这篇文章不就看了个寂寞? 西八, 先写着吧

- Angular Nest介绍
- Nx介绍
- Monorepo简单介绍
- 初始化Nx项目 项目结构
- 生成Angular与Nest项目 启动项目 nx run-many
- 生成component/lib/shared/dto/... nx g @nrwl/xxx:xxx <xxx\> 命令
  - \+ 撤销
- Nest项目
  - 目录结构
  - lowdb配置
    - @types/lowdb的小问题
    - 注入db实例到provider
  - 完成 server controller
  - 单元测试?
- Angular项目
  - ng-zorro配置
  - 添加必要ng ng-zorro模块
  - 组件划分
  - todo-item 开发 数据流
  - todo-form 开发 组件通信
  - 单元测试
- 总结