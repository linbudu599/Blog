---
category: Learning
tags:
  - Node

date: 2021-3-20
title: Prisma，下一代ORM，不仅仅是ORM
---

## 大纲

### 介绍

- [ ] ~~ORM的发展历程：Java中的~~
- [x] NodeJS社区的主流ORM：TypeORM、Sequelize（Sequelize-TypeScript）、MikroORM、Mongoose。
- [x] ORM的Data Mapper与Active Record
- [x] Query Builder (MQuery、TypeORM) 与 ORM 的不同
- [x] Prisma与这两者的区别

### 入门-基础-单表

- [ ] 安装CLI、初始化项目
- [ ] Prisma 的整体使用流程简单介绍：schema > client & db push/migrate > operation
- [ ] SQLite3 驱动安装
- [ ] datasource、provider、model
- [ ] 环境变量
- [ ] 书写一个简单的model
- [ ] VS Code插件
- [ ] 标量 内置函数
- [ ] C R U D
  - [ ] select 与 include
- [ ] 筛选、条件查询 >>> 多表级联示例



### 入门-基础-多表级联

- [ ] 新增1-1 1-n m-n级联到schema：relation语法
- [ ] 级联下的CRUD
- [ ] 级联查询、嵌套查询、条件查询、操作符



### 入门-进阶-多表级联

- 模型自关联下的级联关系
- 操作符组合使用



### 探索

- [ ] 大致工作原理
- [ ] \+ GraphQL：内置DataLoader
- [ ] GraphQL + TypeScript + TypeGraphQL + GraphQL-Code-Generatot + GenQL + Prisma：全链路类型安全保证
- [ ] Prisma在一体化框架（Blitz、Midway-Hooks）中的应用



## 前言

### NodeJS社区中的ORM

经常写NodeJS的同学应该免不了和ORM打交道，毕竟写原生SQL对技能要求是真的高。ORM的便捷使得很多情况下我们能直观而方便的和数据库打交道（虽然的确有些情况下ORM搞不定），NodeJS社区中主流的ORM主要有这么几个，它们都有各自的一些特色：

- [Sequelize](https://github.com/sequelize/sequelize)，比较老牌的一款ORM，缺点是TS支持不太好，但是社区有[Sequelize-TypeScript](https://github.com/RobinBuschmann/sequelize-typescript)。

  Sequelize定义表结构的方式是这样的：

  ```javascript
  const { Sequelize, Model, DataTypes } = require('sequelize');
  const sequelize = new Sequelize('sqlite::memory:');
  
  class User extends Model {}
  User.init({
    username: DataTypes.STRING,
    birthday: DataTypes.DATE
  }, { sequelize, modelName: 'user' });
  
  (async () => {
    await sequelize.sync();
    const jane = await User.create({
      username: 'janedoe',
      birthday: new Date(1980, 6, 20)
    });
    console.log(jane.toJSON());
  })();
  ```

  （我是觉得不那么符合直觉）

- [TypeORM](https://github.com/typeorm/typeorm)，NodeJS社区star最多的一个ORM。也确实很好用，是我用的最多的一个ORM。亮点在基于装饰器语法声明表结构、事务、级联等，以及很棒的TS支持。TypeORM声明表结构是这样的：

  ```typescript
  import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    firstName: string;
  
    @Column()
    lastName: string;
  
    @Column()
    age: number;
  }
  ```

  直观的多吧？

- [MikroORM](https://github.com/mikro-orm/mikro-orm)，比较新的一个ORM，同样大量基于装饰器语法，亮点在于自动处理所有事务以及实体会在全局保持单例模式，还没有用过。MikroORM定义表结构方式是这样的：

  ```typescript
  @Entity()
  export class Book extends BaseEntity {
  
    @Property()
    title!: string;
  
    @ManyToOne()
    author!: Author;
  
    @ManyToOne()
    publisher?: IdentifiedReference<Publisher>;
  
    @ManyToMany({ fixedOrder: true })
    tags = new Collection<BookTag>(this);
  
  }
  ```

- Mongoose、TypeGoose，MongoDB专有的ORM，这里不做示例。



### ORM的Data Mapper与Actice Record模式

如果你去看了上面列举的ORM文档，你会发现MikroORM的简介中包含这么一句话：`TypeScript ORM for Node.js based on Data Mapper`，而TypeORM的简介中则是`TypeORM supports both Active Record and Data Mapper patterns`。

使用ORM的过程中，你是否了解过 **Data Mapper** 与 **Active Record** 这两种模式的区别？

先来看看TypeORM中分别是如何使用这两种模式的：

Active Record:

```typescript
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  isActive: boolean;
}

const user = new User();
user.name = "不渡";
user.isActive = true;

await user.save();

const newUsers = await User.find({ isActive: true });
```

TypeORM中，Active Record模式下需要让实体类继承`BaseEntity`类，这样实体类上就具有了各种方法，如`save` `remove` `find`方法等。AR模式最早由 [Martin Fowler](https://en.wikipedia.org/wiki/Martin_Fowler_(software_engineer)) 在 企业级应用架构模式 一书中命名。

Data Mapper:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  isActive: boolean;
}

const userRepository = connection.getRepository(User);

const user = new User();
user.name = "不渡";
user.isActive = true;

await userRepository.save(user);

await userRepository.remove(user);

const newUsers = await userRepository.find({ isActive: true });
```

可以看到在DM模式中，实体类不再能够自己进行数据库操作，而是需要先获取到一个对应到表的“仓库”，然后再调用这个“仓库”上的方法。



对这两个模式进行比较，很容易发现AR模式要简单的多，而DM模式则更加严谨。那么何时使用这两种模式就很清楚了，如果你在开发比较简单的应用，直接使用AR模式就好了，因为这会减少很多代码。但是如果你在开发规模较大的应用，使用DM模式则能够帮助你更好的维护代码（实体类不再具有访问数据库权限了，只能通过统一的接口(`getRepository` `getManager`等)）。

### Query Builder

实际上除了ORM与原生SQL以外，还有一种常用的数据库交互方式：Query Builder（以下简称QB）。

QB和ORM其实我个人觉得既有相同之处又有不同之处，但是挺容易搞混，比如 [MQuery](https://github.com/aheckmann/mquery) (MongoDB的一个Query Builder)的方法是这样的：

```javascript
mquery().find(match, function (err, docs) {
  assert(Array.isArray(docs));
})

mquery().findOne(match, function (err, doc) {
  if (doc) {
    // the document may not be found
    console.log(doc);
  }
})

mquery().update(match, updateDocument, options, function (err, result){})
```

是不是看起来和ORM很像？但我们再看看其他的场景：

```javascript
mquery({ name: /^match/ })
  .collection(coll)
  .setOptions({ multi: true })
  .update({ $addToSet: { arr: 4 }}, callback)
```

在ORM中，通常不会存在这样的多个方法链式调用，而是通过单个方法+多个参数的方式来操作，这也是我认为Query Builder和ORM的一个重要差异。再来看看TypeORM的Query Builder模式：

```typescript
import { getConnection } from "typeorm";

const user = await getConnection()
.createQueryBuilder()
.select("user")
.from(User, "user")
.where("user.id = :id", { id: 1 })
.getOne();
```

以上的操作其实就相当于`userRepo.find({ id: 1 })`，你可能会觉得QB的写法过于繁琐，但实际上这种模式要灵活的多，和SQL语句的距离也要近的多（你可以理解为每一个链式方法调用都会对最终生成的SQL语句进行一次操作）。

同时在部分情境（如多级级联下）中，QB反而是代码更简洁的那一方，如：

```typescript
 const selectQueryBuilder = this.executorRepository
      .createQueryBuilder("executor")
      .leftJoinAndSelect("executor.tasks", "tasks")
      .leftJoinAndSelect("executor.relatedRecord", "records")
      .leftJoinAndSelect("records.recordTask", "recordTask")
      .leftJoinAndSelect("records.recordAccount", "recordAccount")
      .leftJoinAndSelect("records.recordSubstance", "recordSubstance")
      .leftJoinAndSelect("tasks.taskSubstance", "substance");
```

以上代码构建了一个包含多张表的级联关系的Query Builder。

### Prisma

接下来就到了我们本篇文章的主角：[Prisma](https://www.prisma.io/) 。Prisma对自己的定义仍然是NodeJS的ORM，但个人感觉它比普通意义上的ORM要强大得多，独特的Schema定义、比TypeORM更加严谨全面的TS类型定义（尤其是在级联关系中）、更容易上手和更全面的过滤操作符等，很容易让初次接触的人欲罢不能（比如我）。

简单的介绍下这些特点：

- Schema定义，我们前面看到的ORM都是使用JS/TS文件来定义数据库表结构的，而Prisma不同，它使用`.prisma`后缀的文件来书写独特的Prisma Schema，然后基于schema生成表结构，VS Code有prisma官方提供的高亮、语法检查插件，所以不用担心使用负担。

- TS类型定义，可以说Prisma的类型定义是全覆盖的，查询参数、操作符参数、级联参数、返回结果等等，比TypeORM的都更加完善。

- 更全面的操作符，如对字符串的查询，Prisma中甚至提供了contains、startsWith、endsWith这种细粒度的操作符供过滤使用（而TypeORM中只能使用[ILike](https://github.com/typeorm/typeorm/blob/c8bf81ed2d47ba0822f8d6267ae1997180db2e31/src/find-options/operator/ILike.ts)这种方法来全量匹配）。（这些操作符的具体作用我们会在后面讲到）

  

在这一部分的最后，我们来简单的介绍下Prisma的使用流程，在正文中，我们会一步步详细介绍Prisma的使用，包括单表、多表级联以及Prisma与GraphQL的奇妙化学反应。



- 首先，创建一个名为`prisma`的文件夹，在内部创建一个`schema.prisma`文件

  > 如果你使用的是VS Code，可以安装Prisma这一扩展来获得`.prisma`的语法高亮

- 在schema中定义你的数据库类型、路径以及你的数据库表结构，示例如下：

  ```prisma
  model Todo {
    id        Int      @id @default(autoincrement())
    title     String
    content   String?
    finished  Boolean  @default(false)
    
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```

- 运行`prisma generate`命令，prisma将为你生成`Prisma Client`，内部结构是这样的：

  ![image-20210324100621450](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324100621450.png)

- 在你的文件中导入`Prisma Client`即可使用：

  ```typescript
  import { PrismaClient } from "./prisma/client";
  
  const prisma = new PrismaClient();
  
  async function createTodo(title: string, content?: string) {
    const res = await prisma.todo.create({
      data: {
        title,
        content,
      },
    });
    return res;
  }
  ```

  每张表都会被存放在`prisma.model`的命名空间下。

如果看完简短的介绍你已经感觉这玩意有点好玩了，那么在跟着本文完成实践后，你可能也会默默把手上的项目迁移到Prisma（毕设也可以安排上）~



## 上手Prisma

你可以在 [Prisma-Article-Example](https://github.com/linbudu599/Prisma-Article-Example) 找到完整的示例，以下的例子我们会从一个空文件夹开始。

### 项目初始化

- 创建一个空文件夹，执行`npm init -y`

- 全局安装`@prisma/cli`：`npm install prisma -g`

  > `@prisma/cli` 包已被更名为 `prisma`
  >
  > 全局安装`@prisma/cli`是为了后面执行相关命令时方便些~

- 安装必要的依赖：

  ```bash
  npm install @prisma/client sqlite3 prisma -S
  npm install typescript @types/node nodemon ts-node -D
  ```

  > 安装`prisma`到文件夹时会根据你的操作系统下载对应的Query Engine：
  >
  > ![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324102112439.png)

- 执行`prisma version`，确定安装成功。

  ![image-20210324102342154](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324102342154.png)

- 执行`prisma init`，初始化一个Prisma项目（这个命令的侵入性非常低，只会生成`prisma`文件夹和`.env`文件，如果`.env`文件已经存在，则会将需要的环境变量追加到已存在的文件）。

  ![image-20210324102523696](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324102523696.png)

- 查看`.env`文件

  ```text
  # Environment variables declared in this file are automatically made available to Prisma.
  # See the documentation for more detail: https://pris.ly/d/prisma-schema#using-environment-variables
  
  # Prisma supports the native connection string format for PostgreSQL, MySQL and SQLite.
  # See the documentation for all the connection string options: https://pris.ly/d/connection-strings
  
  DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
  ```

  你会发现这里的数据库默认使用的是postgresql，在本文中为了降低学习成本，我们全部使用SQLite作为数据库，因此需要将变量值修改为`file:../demo.sqlite`

  > 如果你此前没有接触过SQLite，可以理解为这是一个能被当作数据库读写的文件（`.sqlite`后缀），因此使用起来非常容易，也正是因为它是文件，所以需要将`DATABASE_URL`这一变量改为`file://`协议。

  同样的，在Prisma Schema中我们也需要修改数据库类型为`sqlite`：

  ```prisma
  // This is your Prisma schema file,
  // learn more about it in the docs: https://pris.ly/d/prisma-schema
  
  datasource db {
    provider = "sqlite"
    url      = env("DATABASE_URL")
  }
  
  generator client {
    provider = "prisma-client-js"
  }
  ```

### 创建数据库

 在上面的Prisma Schema中，我们只定义了datasource和generator，它们分别负责定义使用的数据库配置和客户端生成的配置，举例来说，默认情况下prisma生成的client会被放置在node_modules下，导入时的路径也是`import { PrismaClient } from "@prisma/client"`，但你可以通过`client.output`命令更改生成的client位置。

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "./client"
}
```

这一命令会使得client被生成到``prisma`文件夹下。

> 将client生成到对应的prisma文件夹下使得在monorepo（或者只是多个文件夹的情况）下，每个项目可以方便的使用不同配置的schema生成的client。

我们在Prisma Schema中新增数据库表结构的定义：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("SINGLE_MODEL_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "./client"
}

model Todo {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  finished  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

简单解释下相关语法：

- Int、String等这一类标量会被自动基于数据库类型映射到对应的数据类型。
- @id 即意为标识此字段为主键，@default()意为默认值，autoincrement与now为prisma内置的函数，类似的内置函数还有uuid、cuid等。

### 客户端生成与使用

现在你可以生成客户端了，执行`prisma generate`：

![image-20210324105558187](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324105558187.png)

还没完，我们的数据库还没创建出来，执行`prisma db push --preview-feature`

![image-20210324110551303](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324110551303.png)

> 这个命令也会执行一次`prisma generate`，你可以使用`--skip-generate`跳过这里的client生成。

现在根目录下就出现了`demo.sqlite`文件。

在根目录下创建index.ts：

```typescript
// index.ts
import { PrismaClient } from "./prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Prisma!");
}

main();
```

> 从使用方式你也可以看出来`PrismaClient`实际上是一个类，所以你可以继承这个类来进行很多扩展操作，在后面我们会提到。

在开始使用前，为了后续学习的简洁，我们使用`nodemon` + `ts-node`，来帮助我们在index.ts发生变化时自动重新执行。

```json
{
  "name": "Prisma2-Explore",
  "restartable": "r",
  "delay": "500",
  "ignore": [
    ".git",
    "node_modules/**",
    "/**/*.test.ts",
    "/**/*.sql",
    "/prisma/*",
    "/**/*.graphql",
    "/**/generated/*",
    "/**/graphql/*"
  ],
  "verbose": true,
  "execMap": {
    "": "node",
    "js": "node --harmony",
    "ts": "ts-node "
  },
  "watch": ["./**/*.ts"],
}
```

并将启动脚本添加到package.json：

```json
{
   "scripts": {
    "start": "nodemon index.ts"
  }
}
```

执行`npm start`：

![image-20210324110144559](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324110144559.png)

### C R U D

接下来就到了正式使用环节，以下内容会指引你如何使用Prisma来对数据库进行CRUD操作，很有可能你会一边学一边感觉自己之前对ORM的认识都被颠覆了：CRUD还能这么玩？

> 以下代码均在函数main中

- 创建

  ```typescript
   const createTodo = await prisma.todo.create({
      data: {
        title: "Prisma",
        content: "Learn Prisma CRUD",
      },
    });
    console.log("createTodo: ", createTodo);
  ```

  ![image-20210324110955713](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210324110955713.png)