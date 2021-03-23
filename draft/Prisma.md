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

  



