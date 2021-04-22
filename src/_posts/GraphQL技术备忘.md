---
category: Records
tags:
  - GraphQL
  - Node

date: 2021-4-22
title: GraphQL 技术备忘
---

## 前言

​		这段时间一直在给nx写插件,感觉我老是定目标定的雄心勃勃,真正开始实现时却懒懒散散. 比如第一期项目规划了11个插件包,目前只有两个处在能用的状态,其他压根还没开始. 主要原因还是涉及的知识确实有点多,每个插件包的集成方式都不同blabla...扯远了.

​		然后担心自己的看家本领GraphQL哪天忘光了, 特意来整理一篇相关的技术备忘. 大部分是我曾经使用过的, 也有小部分一直感兴趣但是没开始学的.



## 技术栈

- TypeGraphQL 这个没得说, 最爱!

- Prisma, 其实不是GraphQL专属, 也可以用在REST API, 但挺契合GraphQL的, 因为内置了dataloader! 而且确实很好玩.

- GraphQL-Code-Generator, 神器, 从GraphQL Schema生成TS类型定义/Apollo-Client的useQuery useMutation函数等, 甚至可以生成TypeGraphQL的Resolver定义. 这些能力都得益于它的插件体系, 常用插件如

  - [`@graphql-codegen/typescript`](https://www.graphql-code-generator.com/docs/plugins/typescript) 生成基础的TS类型定义, 这一插件是其他TS类型插件的基础, 如[`@graphql-codegen/typescript-operations`](https://www.graphql-code-generator.com/docs/plugins/typescript-operations) [`@graphql-codegen/typescript-resolvers`](https://www.graphql-code-generator.com/docs/plugins/typescript-resolvers). 同时, 这一插件的类型将是在客户端/服务端通用的.

    > 通用意味着它不会导入node相关的模块, 如TypeGraphQL插件会导入TypeGraphQL, 而TypeGraphQL只能在node环境下使用.

  - [`@graphql-codegen/typescript-operations`](https://www.graphql-code-generator.com/docs/plugins/typescript-operations) 供客户端使用, 这个插件通过GraphQL Schema及Operations生成与Operations对应的类型, 需要和TS插件一同使用.

  - [`@graphql-codegen/typescript-resolvers`](https://www.graphql-code-generator.com/docs/plugins/typescript-resolvers) 生成GraphQL Resolver的类型定义, 包括parent/args/inputs/return/context等. 注意, 是从Schema生成Resolver类型定义, 然后引入供真实的resolver使用, 来确保全链路的类型安全. 这个插件还可以很灵活的引入你的DB Model,Context Type等.

    ```yaml
    schema: schema.graphql
    generates:
      ./resolvers-types.ts:
        config:
          contextType: models#MyContextType
          mappers:
            User: ./models#UserModel
            Profile: ./models#UserProfile
        plugins:
          - typescript
          - typescript-resolvers
    ```

    > [实例](https://codesandbox.io/s/condescending-albattani-ixyp9?file=/resolvers.ts) [文章](https://the-guild.dev/blog/better-type-safety-for-resolvers-with-graphql-codegen)

  - [`@graphql-codegen/typed-document-node`](https://www.graphql-code-generator.com/docs/plugins/typed-document-node), 为`DocumentNode` 生成类型定义. `DocumentNode`的概念之前只简单接触过, 举例来说graphql-tag的`gql`方法就能够把查询语句转为`DocumentNode`类型.

    作者写了相关的发展历程:

    - 最开始, 需要自己手动把query语句中的字段及类型添加到`client.query<{//...}>`中

    - 有了CodeGen以后, 可以直接从生成的类型中引入XXXQuery, XXXQueryVars, 然后传给`client.query<XXXQuery, XXXQueryVars>`, 看起来简单多了, 但是这样我们还是需要每次手动指定类型.

    - CodeGen的Apollo插件来了, 现在生成的useXXXQuery已经附带了相关类型, 直接调用就好了.

    - 然后就到了`TypedDocumentNode`, 因为有时候我们确实不想再包一层hooks啊啥的, 现在我们只需要预编译`DocumentNode`, 然后加上TS类型就行了.

      ![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210422110137079.png)

  - [`@graphql-codegen/typescript-react-apollo`](https://www.graphql-code-generator.com/docs/plugins/typescript-react-apollo) 与 [`@graphql-codegen/typescript-apollo-client-helpers`](https://www.graphql-code-generator.com/docs/plugins/typescript-apollo-client-helpers), 生成ApolloClient集成代码, 不做多介绍.

  - [`@graphql-codegen/typescript-document-nodes`](https://www.graphql-code-generator.com/docs/plugins/typescript-document-nodes), 从GraphQL文件生成TS文件, 基于GraphQL-Tag.

  - [`@graphql-codegen/typescript-type-graphql`](https://www.graphql-code-generator.com/docs/plugins/typescript-type-graphql), 类似于基础TS插件, 但是会生成可供TypeGraphQL直接使用的类型定义, 比如interface会被生成为class, 然后添加上@ObjectType啊@Field啊这种装饰器.

  - [`@graphql-codegen/add`](https://www.graphql-code-generator.com/docs/plugins/add) 添加内容到生成文件中.

  - [`@graphql-codegen/schema-ast`](https://www.graphql-code-generator.com/docs/plugins/schema-ast) 以AST的形式输出合并的Schema

  - [`@graphql-codegen/fragment-matcher`](https://www.graphql-code-generator.com/docs/plugins/fragment-matcher), 这个一直没太搞懂, 见[apollo文档](https://www.apollographql.com/docs/react/data/fragments/#fragments-on-unions-and-interfaces)

  - [`@graphql-codegen/introspection`](https://www.graphql-code-generator.com/docs/plugins/introspection), 生成自省文件, 通常在json字段中.

  - [`@graphql-codegen/time`](https://www.graphql-code-generator.com/docs/plugins/time) 添加生成时间

  - [`@graphql-codegen/named-operations-object`](https://www.graphql-code-generator.com/docs/plugins/named-operations-object) 输出所有你可用的GraphQL Pperations与Fragments, 常用于[refetch](https://www.apollographql.com/docs/react/api/react/hooks/#refetch)的类型验证.

- GenQL, 类似Prisma的思路, 从一个Schema生成client, 导入这个client就能获得全链路的类型安全. GenQL还提供了链式操作/多clients等.
- @2fd/graphqldoc, 从GraphQL Schema生成静态文档.
- @saeris/apollo-server-vercel, 直接白嫖Vercel Functions, 可以很容易的接入各种GraphQL工具.
- GraphQL-Voyager, 从GraphQL Schema生成可视化的界面, 展示各个类型之间的联系等.
- ApolloGraphQL, 略过.
- Gqless, 号称不需要写查询的GraphQL Client, 还没体验过
- GraphQL-Crunch,  减少GraphQL响应的体积
- Hasura Engine 与 PostGraphile, 简单介绍不完, 去官网看吧
- GraphQL-Request, Prisma团队的作品, 非常迷你的一个GraphQL请求库, 适用于双端.
- GraphQL Tools, 提供了各种方法让你为所欲为..., 目前只用到Directives相关的方法.
- GraphQL Shield, 用于快速搭建鉴权层.



暂时应该就这些了... 其他的想到再补充!