---
category: Tutorial
tags:
  - Node
  - GraphQL
  - Prisma

date: 2021-6-15
title: Prisma，下一代ORM，不仅仅是ORM（下篇）
---

在上一篇文章中，我们从NodeJS社区的传统ORM讲起，介绍了它们的特征以及传统ORM的Active Record、Data Mapper模式，再到Prisma的环境配置、基本使用以及单表实践。在这篇文章中，我们将介绍Prisma的多表、多表级联、多数据库实战，以及Prisma与GraphQL的协作，在最后，我们还会简单的收尾来展开聊一聊Prisma，帮助你建立大致的印象：Prisma的优势在哪里？什么时候该用Prisma？

## Prisma多表、多数据库实战

在大部分情况下我们的数据库中不会只有一张数据表，多表下的操作（级联、事务等）也是判断一个ORM是否易用的重要指标。在这一方面Prisma同样表现出色，类似于上篇文章中的单表示例，Prisma同样提供了以简洁语法操作级联的能力。

### Prisma 多表

> 本部分的示例代码见 [multi-models](https://github.com/linbudu599/Prisma-Article-Example/tree/main/src/multi-models)

我们首先在Prisma Schema中定义多张数据表，各个实体之间的级联关系如下：

> - User -> Profile 1-1
> - User -> Post 1-m
> - Post -> Category m-n

```prisma
model Category {
  id   Int    @id @default(autoincrement())
  name String
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  postUUID String @default(uuid())
  title     String
  content   String?
  published Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
  categories Category[]
}

model Profile {
  id           Int     @id @default(autoincrement())
  bio          String?
  profileViews Int     @default(0)
  user   User? @relation(fields: [userId], references: [id])
  userId Int?  @unique
}

model User {
  id   Int    @id @default(autoincrement())
  name String @unique
  age  Int    @default(0)
  posts Post[]
  profile Profile?
  avaliable Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

在这里我们主要关注Prisma如何连接各个实体，明显能看到相关代码应该是：

```prisma
posts Post[]
profile Profile?
```

在关系的拥有者中（在一对一、一对多关系中，通常认为只存在一方拥有者，而在多对多关系中，通常认为互为拥有者）我们只需要定义字段以及字段代表的实体，而在关系的另一方中，我们需要使用prisma的`@relation`语法来标注这一字段表征的关系，如

```prisma
user   User? @relation(fields: [userId], references: [id])
userId Int?  @unique
```

- fields属性位于当前的表中，`userId`和`user`必须保持一致的可选/必选，即要么同为可选，要么同为必选。
- references属性位于关系的另一方中，表征与`userId`对应的字段。
- 除了fields与reference属性外，还可使用name属性来显式指定关系名称，这在一些情景下可以避免歧义。
- 在一对一、一对多关系中，`@relation`是必须被使用的。

在多对多关系中，如Post与Category，可以不使用`@relation`来声明级联关系，这样将会自动使用双方表中的`@id`来建立级联关系。如果你觉得这种隐式指定可能会带来歧义或者你需要额外定制，也可以使用额外的一张数据表，使用`@relation`分别与Post、Category建立一对多关系。

创建完毕schema后，执行`yarn generate:multi`来生成Prisma Client，便可以开始使用了。

上面的级联关系如果以对象的形式表示，大概是这样的：

```javascript
const user = {
  profile: {
    
  }
  posts: {
  	categories: {
  
		}
	}
}
```

因此，在Prisma中我们也以类似的方式操作各张数据表：

```typescript
  const simpleIncludeFields = {
    profile: true,
    posts: {
      include: {
        categories: true,
      },
    },
  };

 const createUserWithFullRelations = await prisma.user.create({
    data: {
      name: randomName(),
      age: 21,
      profile: {
        create: {
          bio: randomBio(),
        },
      },
      posts: {
        create: {
          title: randomTitle(),
          content: "鸽置",
          categories: {
            create: [{ name: "NodeJS" }, { name: "GraphQL" }],
          },
        },
      },
    },
    include: simpleIncludeFields,
  });
```

来看看和单表操作中不同的部分：

- 默认情况下，返回结果中不会包含级联关系，只会包含实体自身的标量，如`'prisma.user.xxx'`返回的结果只会包含User实体自身除了级联以外的字段。
- 如果想要像上面的例子一样，操作实体的同时操作其多个级联关系，prisma提供了connect、create、connectOrCreate方法，分别用于连接到已有的级联实体、创建新的级联实体以及动态判断。

connectOrCreate的使用方式如下：

```typescript
const connectOrCreateRelationsUser = await prisma.user.create({
    data: {
      name: randomName(),
      profile: {
        connectOrCreate: {
          where: {
            id: 9999,
          },
          create: {
            bio: "Created by connectOrCreate",
          },
        },
      },
      posts: {
        connectOrCreate: {
          where: {
            id: 9999,
          },
          create: {
            title: "Created by connectOrCreate",
          },
        },
      },
    },
    select: simpleSelectFields,
  });
```

我们为profile和post使用了不存在的ID进行查找，因此Prisma会为我们自动创建级联实体。

看完了级联创建，再来看看级联的更新操作，一对一：

```typescript
const oneToOneUpdate = await prisma.user.update({
    where: {
      name: connectOrCreateRelationsUser.name,
    },
    data: {
      profile: {
        update: {
          bio: "Updated Bio",
        },
        // update
        // upsert
        // delete
        // disconnect(true)
        // create
        // connect
        // connectOrCreate
      },
    },
    select: simpleSelectFields,
  });
```

对于更新，prisma直接提供了一系列便捷方法，覆盖绝大部分的case（我暂时没发现有覆盖不到的），create、connect、connectOrCreate同样存在于user.update方法上，还新增了disconnect来断开级联关系。

一对多的更新则多了一些不同：

```typescript
 const oneToMnayUpdate = await prisma.user.update({
    where: {
      name: connectOrCreateRelationsUser.name,
    },
    data: {
      posts: {
        updateMany: {
          data: {
            title: "Updated Post Title",
          },
          where: {},
        },
        // set 与 many, 以及各选项类型
        // set: [],
        // update
        // updateMany
        // delete
        // deleteMany
        // disconnect: [
        //   {
        //     id: 1,
        //   },
        // ],
        // connect
        // create
        // connectOrCreate
        // upsert
      },
    },
    select: simpleSelectFields,
  });
```

你可以使用update/delete来一把梭的进行所有级联关系的更新，如用户VIP等级提升，更新用户所有文章的曝光率；也可以使用updateMany/deleteMany对符合条件的级联实体做精细化的修改；亦或者，你可以直接使用set方法，覆盖所有的级联实体关系（如set为[]，则用户的所有级联文章关系都将消失）。

至于多对多的更新操作，类似于上面一对多的批量更新，这里就不做展开了。



#### 多表级联进阶

> 本部分的代码见[multi-models-advanced](https://github.com/linbudu599/Prisma-Article-Example/tree/main/src/multi-models-advanced)。

这一部分不会做过多展开，毕竟本文还是属于入门系列的文章。但是我在GitHub代码仓库中提供了相关的示例，如果你有兴趣，直接查看即可。

 在这里简单的概括下代码仓库中的例子：

- 自关联，我们前面的级联关系都来自于不同实体之间，实际上相同实体之间的关联也是常见的。如用户邀请其他用户时，通常会有已邀请的用户和当前用户的邀请人这两个同样属于User实体的操作。
- 使用中间表来构建多对多的关系，就如我们上面提到的Post与Category关系，其实在Prisma中还可以定义额外的一张CategoriesOnPosts表，显式的配置级联信息。这种情况下又要如何进行CRUD呢？
- 细粒度的操作符，实体级别的every/some/none，标量级别的contain/startsWith/endsWith/equals/...，另外，Prisma还支持[JSON Filters](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#json-filters)来直接对JSON数据进行过滤（例子中没有体现）。



### 这我得来点骚操作啊

#### 多个Prisma Client

> 本部分代码见[multi-clients](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#json-filters)。

由于Prisma的独特用法，你应该很容易想到要创建多个Prisma Client来连接不同的数据库是非常容易地，并且和单个Prisma Client使用没有明显的差异。其他ORM的话则需要稍微折腾一些，如TypeORM需要创建多个连接池（TypeORM中的每个连接并不是“单个的”，而是连接池的形式）。

在这个例子中，我们使用Key-Value的形式，一个client存储key，另一个存储value：

```prisma
model Key {  kid Int    @id @default(autoincrement())  key String  createdAt DateTime @default(now())  updatedAt DateTime @updatedAt}model Value {  vid   Int    @id @default(autoincrement())  key   String  value String  createdAt DateTime @default(now())  updatedAt DateTime @updatedAt}
```

> 以上的model定义是用两个schema文件储存的

在npm scripts中，我已经准备好了相关的script，运行`yarn generate:multi-db`即可。

实际使用也和单个Client没差别：

```typescript
import { PrismaClient as PrismaKeyClient, Key } from "./prisma-key/client";import { PrismaClient as PrismaValueClient } from "./prisma-value/client";const keyClient = new PrismaKeyClient();const valueClient = new PrismaValueClient();
```

首先创建key（基于uuid），然后基于key创建value：

```typescript
const key1 = await keyClient.key.create({    data: {      key: uuidv4(),    },    select: {      key: true,    },  });const value1 = await valueClient.value.create({    data: {      key: key1.key,      value: "林不渡",    },    select: {      key: true,      value: true,    },  });
```

> 真的就和单个client没区别，是吧...



#### Prisma与其他ORM协作

> 本部分的示例见[with-typeorm](https://github.com/linbudu599/Prisma-Article-Example/tree/main/src/with-typeorm) 与 [with-typegoose](https://github.com/linbudu599/Prisma-Article-Example/tree/main/src/with-typegoose)

既然Prisma + Prisma没问题，那么Prisma + 其他ORM呢？其实同样很简单，以TypeORM的例子为例，步骤是相同的：

- 创建Prisma连接
- 创建TypeORM连接
- 以Prisma创建key
- 使用Prisma的key创建TypeORM的value
- 查询所有Prisma的key，用于查询所有TypeORM的value

```typescript
// 创建TypeORM连接const connection = await createConnection({    type: "sqlite",    database: IS_PROD      ? "./dist/src/with-typeorm/typeorm-value.sqlite"      : "./src/with-typeorm/typeorm-value.sqlite",    entities: [ValueEntity],    synchronize: true,    dropSchema: true,  });  // 使用Prisma存储key  const key1 = await prisma.prismaKey.create({    data: {      key: uuidv4(),    },    select: {      key: true,    },  });		// 使用Prisma的key创建TypeORM的value  const insertValues = await ValueEntity.createQueryBuilder()    .insert()    .into(ValueEntity)    .values([      {        key: key1.key,        value: "林不渡",      }    ])    .execute();  const keys = await prisma.prismaKey.findMany();	// 查询得到所有的key，用于遍历查询value  for (const keyItem of keys) {    const key = keyItem.key;    console.log(`Search By: ${key}`);    const value = await ValueEntity.createQueryBuilder("value")      .where("value.key = :key")      .setParameters({        key,      })      .getOne();    console.log("Search Result: ", value);    console.log("===");  }
```



## Prisma + GraphQL

> 本部分的代码见[typegraphql-apollo-server](https://github.com/linbudu599/Prisma-Article-Example/tree/main/src/typegraphql-apollo-server)

Prisma和GraphQL有个共同点，那就是它们都是SDL First的，Prisma Schema和GraphQL Schema在部分细节上甚至是一致的，如标量以及`@`语法（虽然prisma中是内置函数，GraphQL中则是指令）等。而且，Prisma内置了DataLoader来解决GraphQL N+1问题，所以你真的不想试试Prisma + GraphQL吗？

> 关于DataLoader，可以参见我之前写的[GraphQL N+1问题到DataLoader源码解析](https://juejin.cn/post/6923552292197105677)，其中就包含了Prisma2中内置的DataLoader源码解析。

技术栈与要点：

- 基于TypeGraphQL构建GraphQL Schema与Resolver，这也是目前主流的一种方式，毕竟写原生GraphQL的话其实不太好扩展（除非借助GraphQL-Modules），类似的方式还有使用Nexus来构建Schema。

- 基于ApolloServer构建GraphQL服务，它是目前使用最广的GraphQL服务端框架之一。

  我们将实例化完毕的Prisma Client挂载在Context中，这样在Resolver中就能够获取到prisma实例。

  这一方式其实就类似于REST API中，我们拆分应用程序架构为Controller-Service的结构，Controller对应的即是这里的Resolver，直接接受请求并处理。在GraphQL应用中你同样可以拆分一层Service，但这里为了保持代码精简就没有采用。

  > 关于Context API，建议阅读Apollo的[官方文档](https://www.apollographql.com/docs/)。

- 在这里为了示范GraphQL Generation系列的技术栈（其实就是为了好玩），我还引入了GraphQL-Code-Generator（基于构建完毕的GraphQL Schema生成TS类型定义）以及GenQL（基于Schema生成client，然后就可以以类似Prisma Client的方式调用各种方法了，还支持链式调用，很难不资瓷）

在这里我们直接看重要代码即可：

```typescript
// server.tsconst server = new ApolloServer({  schema,  context: { prisma },});// user.resolver.ts@Resolver(TodoItem)export default class TodoResolver {  constructor() {}  @Query((returns) => [TodoItem!]!)  async QueryAllTodos(@Ctx() ctx: IContext): Promise<TodoItem[]> {    return await ctx.prisma.todo.findMany({ include: { creator: true } });  }  @Query((returns) => TodoItem, { nullable: true })  async QueryTodoById(    @Arg("id", (type) => Int) id: number,    @Ctx() ctx: IContext  ): Promise<TodoItem | null> {    return await ctx.prisma.todo.findUnique({      where: {        id,      },      include: { creator: true },    });  }  @Mutation((returns) => TodoItem, { nullable: true })  async MutateTodoStatus(    @Arg("id", (type) => Int) id: number,    @Arg("status") status: boolean,    @Ctx() ctx: IContext  ): Promise<TodoItem | null> {    try {      return await ctx.prisma.todo.update({        where: {          id,        },        data: {          finished: status,        },        include: { creator: true },      });    } catch (error) {      return null;    }  }  @Mutation((returns) => TodoItem, { nullable: true })  async CreateTodo(    @Arg("createParams", (type) => CreateTodoInput) params: CreateTodoInput,    @Ctx() ctx: IContext  ): Promise<TodoItem | null> {    try {      return await ctx.prisma.todo.create({        data: {          title: params.title,          content: params?.content ?? null,          type: params?.type ?? ItemType.FEATURE,          creator: {            connect: {              id: params.userId,            },          },        },        include: { creator: true },      });    } catch (error) {      return null;    }  } }
```

很明显和上面例子中的唯一差异就是这里推荐把prisma挂载到context上然后再调用方法，而不是为每个Resolver导入一次Prisma Client。而在Midway与Nest这一类基于IoC机制的Node框架中，推荐的使用方法是将Prisma Client注册到容器中，然后注入到Service层中。

> 关于Nest与Prisma的使用，可参考仓库README中的介绍。



## 尾声：Prisma展望

在本文的最后，让我们来扩展性的聊一聊Prisma吧：

- Prisma的出现是为了解决什么？它和其他操作数据库的方案（SQL、ORM、Query Builder）比起来，有什么新的优势吗？

  > 完整版内容参考方方老师翻译的这篇 [Why Prisma？](https://zhuanlan.zhihu.com/p/142607078)

  - 手写原生SQL：只要你的能力到位，SQL的控制力是最强的，其控制粒度也是最精细的，几乎没有对手。但前提是，能力到位。手写SQL会花费大量的时间，当你花了多一倍的时间手写SQL却没有得到正比的回报，我想你需要停下来思考下？
  - Query Builder：在上一篇文章我们讲到，Query Builder不是ORM，但它更加贴近原生的SQL，Query Builder的每一次链式调用都会对最终生成的SQL进行一次修改。另外，Query Builder同样需要一定的SQL知识，如leftJoin等。
  - ORM，在JavaScript中通常使用Class的方式来定义数据表模型，看起来很贴心，但实际上会导致[对象关系阻抗不匹配（Object-relational impedance mismatch）](https://link.zhihu.com/?target=https%3A//en.wikipedia.org/wiki/Object-relational_impedance_mismatch)。 举例来说，我们习惯于通过User.post.category这种`.`的方式来访问嵌套的数据实体，但实际上User、Post、Category应该是独立的实体，它们是独立集合而不是对象属性的关系。在ORM中我们使用`.`的方式来访问，但底层它也是通过外键JOIN的方式来构造SQL的。
  - 那么Prisma呢？它不再需要你一边用Class定义一边告诉自己牢记这是关系型数据库了...，现在你可以直接用JS对象的模式来思考。它的控制力不如SQL与Query Builder，因为你还是直接通过已经封装完毕的create/update方法来调用。然而，由于它的心智模型，你使用它就像是使用一个普通对象一样，比起ORM来易用的多。



- Prisma是ORM吗？

  当然是啦！

  只不过和传统的ORM不一样，Prisma使用的方式是“声明式”的，在你的prisma文件中声明数据库结构即可，这一实现使得它可以是跨语言的（只需要配置client.provider即可，目前仅有`prisma-client-js`实现）。而传统ORM提供的使用方式则是“面向对象的”，你需要将你的数据表结构一一映射到与语言对应的模型类中去。

  

- Prisma和GraphQL Generation

  上面说到，由于Prisma和GraphQL都是Schema First，因此二者往往能够产生奇妙的化学反应。最容易想到的就是二者Schema的互相转化，但目前社区似乎没有类似的方案，原因无他，如果从Prisma Schema生成原生GraphQL Schema，并没有太多意义，因为现在其实很少会书写原生的Schema了。其次，如果要从Prisma得到GraphQL的类型定义，也没有必要直接转换到原生，完全可以转换到高阶表示，如Nexus与TypeGraphQL，所以目前社区有的也是 [`nexus-plugin-prisma`](https://nexusjs.org/docs/plugins/prisma/overview) 和 [`typegraphql-prisma`](https://github.com/michallytek/typegraphql-prisma#readme) 这两个方案，前者生成Nexus Type Builders，后者生成TypeGraphQL Class以及CRUD Resolvers。



### 一体化框架

目前除了React这样的前端框架，Express这样的后端框架，其实还有一体化框架（Monolithic Framework），这一类框架最早来自于Ruby On Rails的思路。

目前在前端领域中，一体化框架的思路主要是这样的：

- 开发时，前端直接导入后端的函数，后端函数中直接进行数据源的操作（ORM或者已有的API），而不是前端后端各起一个服务。
- 构建时，框架会自动把前端对后端的函数导入，转换为HTTP请求，而后端的函数则会呗构建为FaaS函数或者API服务。

- [BlitzJS](https://blitzjs.com/)，基于NextJS + Prisma + GraphQL，但实际上不需要有GraphQL相关的知识，作者成功把GraphQL的Query/Mutation通过Prisma转成了普通的方法调用，你也不需要自己书写Schema了。
- [RedwoodJS](https://github.com/redwoodjs/redwood)，类似于Blitz，基于React + Prisma + GraphQL，但场景在JAMStack，Blitz更倾向于应用程序开发。并且和Blitz抹消了GraphQL的存在感不同，RedWoodJS采用[Cells](https://learn.redwoodjs.com/docs/tutorial/cells)来实现前后端通信。
- [Midway-Hooks](https://github.com/midwayjs/hooks)，前端框架不绑定，支持React/Vue，因此对应的支持React Hooks与Composition API。开发服务器基于Vite，可部署为单独Server或者FaaS，阿里内部都在用，很难不资瓷！