---
category: Record
tags:
  - GraphQL
date: 2021-2-26
title: 记录一下应该是寒假花费时间最长的一次DeBug
---

我真的佛了佛了佛了, 花了一个小时, 就因为Windows报错信息不完整, 做了一堆无用功.

报错的项目是Serein, 目前还未开源, 一个用来搞对象的全栈项目, 基于Nx Monorepo管理, 前端React(后面还会支持Angular), 后端Nest, 提供REST/GraphQL两套API.
这次的错误是在运行前端项目时:

![image-20210226173905661](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210226173905661.png)



Windows下最后是这么一行报错:

` Error: EBUSY: resource busy or locked, lstat 'D:\pagefile.sys'`

这个文件是Windows的虚拟内存文件, 我原本以为又是权限问题, 百度了下让删掉node_modules和dist文件夹, 重新install和build, 这是第一次尝试, 无果, 以为是pnpm问题, 换成cnpm和yarn试了下, 依旧不行.

尝试移除掉这个sys文件, 在控制面板-系统-高级系统设置-性能中关掉了虚拟内存, 重启, 尝试, 依旧不行.

在这里花的时间最长, 第一次关掉了C盘而不是D盘, 第二次关掉了D盘但是选项勾选错了还能生成, 第三次才对... 每次又要重启-等VSC初始化-重新install build- ...

开始怀疑是依赖问题? 拉取了之前版本的仓库, 安装和运行, 依旧不行.

Google "Can't resolve 'fs' in" 这一行, 最开始没有尝试是因为觉得这个信息搜出来的肯定一堆各种原因造成, 很难找到我要的. 结果一搜, 几乎所有结果都指向两种:

- webpack中没有设置target为node, 相当于在前端打包fs模块
- Angular CLI升级后不再支持打包fs到前端项目(类似意思)

运行项目用的命令是`nx serve`, nx实际上就是对ng的包装, 感觉问题应该在这里, 但是降低CLI版本不太可能.

意识到实际上这就是一个问题: 在前端项目使用了node模块. 但是我觉得我必不可能这么笨比啊, 难道在前端调用fs. 看报错信息集中在type-graphql, 我也没在前端调用啊.

一个个检查引用, 看到`import { useTestQuery } from '@serein/shared';`突然感觉不对劲了, 只有这一行是monorepo的包引用, 果然注释掉就可以了.

这个文件是GraphQL-CodeGen基于GraphQL Schema生成的类型定义文件, 非常非常强大的一个工具, 在这个项目里的作用主要是基于Schema和查询语句, 生成客户端可以直接使用的函数, 比如:

```graphql
query Test {
  Users: users {
    id
    email
    role
  }
  Recipes: recipes {
    title
    description
  }
}
```

会生成:

```ts
export function useTestQuery(baseOptions?: Apollo.QueryHookOptions<TestQuery, TestQueryVariables>) {
        return Apollo.useQuery<TestQuery, TestQueryVariables>(TestDocument, baseOptions);
      }
export function useTestLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<TestQuery, TestQueryVariables>) {
          return Apollo.useLazyQuery<TestQuery, TestQueryVariables>(TestDocument, baseOptions);
        }
```

以及相关的类型定义, 客户端就可以直接导入了.

在未修改的生成文件中, 存在着TypeGraphQL相关的代码:

```ts
import * as TypeGraphQL from 'type-graphql';
export { TypeGraphQL };

@TypeGraphQL.ObjectType()
export class User {
  __typename?: 'User';

  @TypeGraphQL.Field(type => TypeGraphQL.ID)
  id!: Scalars['ID'];

  @TypeGraphQL.Field(type => String)
  email!: Scalars['String'];

  @TypeGraphQL.Field(type => Role)
  role!: FixDecorator<Role>;
};

// ...
```

由于使用了此API其内部会去调用fs path等模块, 所以就报错了.

生成的文件中存在TypeGraphQL代码, 是因为使用了`@graphql-codegen/typescript-type-graphql`这个插件, 其作用是从schema生成TypeGraphQL中的Class(`@ObjectType` `@InputType`). 同时这个插件是和`@graphql-codegen/typescript`有一部分功能重叠的, 如果同时启用二者会造成生成文件中变量的重复定义.



以上.