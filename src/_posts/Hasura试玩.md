---
category: Learning
tags:
  - GraphQL
date: 2021-2-8
title: Hasura Engine试玩
---

Hasura和PostGraphile这两个东西很早就在我的TODO上了, 但是一直拖啊拖的, 索性今天第一件事情就来简单试玩Hasura, 包括这么几个功能:

- 从数据库表结构映射到GraphQL 对象类型
- 合并远程Schema
- 触发器
- 鉴权

真心很强大哇, 感觉的确是可以直接一步到位的, 除了自己的Hasura Cloud还提供了Docker以及K8S的方式来本地部署. 如果是练手项目, 还可以直接用Heroku提供的PostgreSQL, 起飞!

> 可以理解为, Hasura本身只是一个Engine, 你可以在本地或者是自己的服务器上部署, 然后就能享受到它为你进行的GraphQL API控制比如鉴权和触发器这种, 部署在Hasura Cloud的话, 官方估计是提供了埋点以及快速回滚等等优势吧, 就像Apollo Engine的Schema Report那种.

## 入手

首先在控制台新建数据表:

![image-20210208111656994](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210208111656994.png)

然后就能用GraphiQL查询了:

![image-20210208111845362](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210208111845362.png)

很方便的地方是, 数据库外键也能自动转化为关系映射.

自动生成了Query/Mutation/Subscription操作

![image-20210208112513452](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210208112513452.png)

这个左边Explorer栏的功能Gatsby也有, 确实很方便, 但是好像playground并不支持?

## 合并远程Schema

这个真的挺强, 我试着把GraphQL-Explorer-Server的合并过来了:

![image-20210208112326314](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210208112326314.png)

好家伙我直接好家伙.

这个功能的主要场景应该是一些需要自己手写逻辑的API(也就是不是简单的CRUD, Hasura能cover的应该只是基于数据库的CRUD, 或者你的数据源不是这个数据库甚至根本不是数据库类型(而是BFF), 那就要自己写了), 你想让手写的GraphQL也加入到Hasura管控中, 就可以使用这个功能.

![Architecture of Hasura with remote schemas](https://hasura.io/docs/1.0/_images/remote-schema-arch1.png)

并且只需要提供HTTP入口即可.

## 事件触发器

这个触发器和Serverless的不太一样, 后者的主要是HTTP触发器或者云服务触发器(比如OSS/云数据库等), Hasura的触发器是只针对数据库的, 比如你的INSERT/UPDATE/DELETE操作.

![image-20210208113025849](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210208113025849.png)

还有Schedule Trigger, 应该是定时的触发器, 这里就先略过了.

## 鉴权

这个应该是Hasura最重要的功能之一了(毕竟官网最大字体就是说的这个).

![Authentication and authorization with Hasura](https://hasura.io/docs/1.0/_images/auth-high-level-overview1.png)

HASURA的鉴权是基于角色(Roles)的, 并且认证(**Authentication**)的步骤是独立的(比如你可以用自己写的或者是第三方服务). 用户的请求头中携带着用户的权限信息, 传递给认证服务后, 其响应中会以session变量(X-Hasura-Role)的方式携带用户的角色信息.

对于授权(**Authorization**), 则是由Hasura负责的, 我不确定这里能不能理解为Hasura转化出的schema上是否是使用了指令比如`@auth`来进行各种粒度的控制的(*granular enough to control access to any row or column in your database*)

整个过程大概是这样的:

- 用户请求到达Hasura
- Hasura转发请求头到认证服务, 获得返回的用户角色
- 根据用户角色生成行/列级别(够细粒度吧!)的SQL语句, 并对数据库执行响应操作

### 认证

- 可以让认证服务暴露一个webhook, 所有Hasura获得的请求都会从这里走一遍获得权限信息.
- 也可以用JWT的方式, 认证服务服务下发token(包含X-Hasura-*的信息载荷), 在此模式下就可以让Hasura自己验证并解密token了.

这个实际上也可以配置, 并且为各种角色创建不同的规则, 这里就不一一试用了.



暂时就先玩到这里, 希望以后能有机会在生产环境体验这个.