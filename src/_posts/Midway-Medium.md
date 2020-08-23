---
category: Learning
tags:
  - Other
date: 2020-7-31
title: 走近MidwayJS：基于Midway打造后台应用
---

## 前言

在 上一篇 [走近MidwayJS：初识TS装饰器与IoC机制](https://juejin.im/post/6859314697204662279)中, 我们介绍了 MidwayJS 的基本能力来源: 依赖注入及其实现机制(装饰器). 那么这一篇我们可以进入实战环节了, 本篇文章我们会以这样的顺序, 介绍如何基于Midway打造一个简单的后台应用的过程:

> 技术栈主要为 `TypeScript` + `TypeORM` + `SQLite3`, 请确保你掌握基本的TS语法, 并且读过了上篇文章.

- **项目初始化** & **环境配置** & **依赖安装**
- **数据库连接** & **整体项目介绍**
- 正式开发: **路由** & **中间件 **等功能使用
- `MidwayJS`下的**单元测试**与其他能力
- `Midway-Serverless`展望: **纯函数应用** & **前后端一体化应用**

如果你对文中的某些部分感到疑惑, 请参见[MidwayJS官方文档](https://midwayjs.org/midway/), 或者在评论区留言告诉我, 我会尽可能为你解答.



## 初始化

Midway官方团队提供了初始化工具`midway-init`, 来方便我们快速创建一个Midway应用, 我们首先进行安装, 或者你也可以使用`npx`

```bash
$ npm i midway-init -g
$ midway-init
```

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/1.png)

选择第一个模板来创建项目, 后续的项目描述可以根据自己的喜好来.

在完成初始化后, 项目的目录是这样的:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822153910.png)

如果你使用过`Egg`, 这个项目目录应该对你来说很熟悉. 我们大概讲解一下:

- `/src`  整个项目的核心逻辑.
- `/app`  存放控制器 公共资源 与 中间件(目前还没有).
- `/config`  各个环境的配置, 支持根据环境变量自动识别启用配置.
- `/service` 核心业务逻辑, 我们把连接数据库与数据处理的过程放在这里.
- `/interface` 上图中只是一个`interface.ts`文件, 作用会在后面讲到.
- `/test` 测试用例

> 你可以理解为`controller`只是起到路由的作用, 它会去调用`service`提供的方法获得所需数据后再作为响应回传. 核心逻辑都在`service`中.



在执行完`npm install`后, 我们可以先执行`npm run dev`来尝鲜下, 控制台会执行这样的输出:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822154607.png)

然后你就可以访问 `http://127.0.0.1:7001/` 来看看效果了.

你也可以先看看各个文件内容大致感受一下, 但是在这里我们先继续配置环境, 我们使用`SQLite3`作为数据库, 因为我觉得它尤其轻量~

MacOS上的操作比较简单, 你可以使用`Homebrew`来安装. 在Windows上则会麻烦一些, 你可以参见 [在Windows上安装SQLite3](https://www.runoob.com/sqlite/sqlite-installation.html) . 

正确安装后, 在终端中执行:

```bash
$ sqlite3
```

显示的结果应该大致如图中所示:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822155135.png)



我们使用 [TypeORM](https://github.com/typeorm/typeorm) 来操作数据库, 安装它以及对应的SQLite3驱动:

```bash
$ npm i typeorm sqlite3 -S
```

> 注意, 你可能会遇到`node-gyp`的报错问题, 如果发生了相关错误, 请安装`Python2.7.5`后重试.
>
> 阅读TypeORM的文档可能需要科学上网, 但这里由于我们只使用到它的一小部分能力, 你也可以只靠文章中我的介绍来熟悉API.



## 数据库连接

对于NodeJS应用连接数据库, 我们通常会在应用启动前创建连接, 而后就可以在任意文件中使用这个连接了. MidwayJS应用的实现则会更优雅, 它可以在初始化创建连接后, 将连接存放到容器中, 后续直接将连接注入到类中使用.



MidwayJS的启动自定义能力继承于Egg, 包括以下几个生命周期:

- configWillLoad
- configDidLoad
- didLoad
- willReady
- serverDidReady
- beforeClose

我们选择在`willReady`阶段去创建连接. 首先在`/src` 下建立`app.ts`文件去做启动自定义, Midway会自动检测到该文件并做相应的处理.

```typescript
import "reflect-metadata";
import { Application } from "midway";

// App 启动前钩子
class AppBootHook {
  app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  async willReady() {
    console.log("before ready");
  }
}

export default AppBootHook;
```

再次启动应用:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822161237.png)



日志似乎不太好看出来, 简单, 正好我想整点花里胡哨的, 我们使用`chalk`来做命令行的彩色输出:

```bash
$ npm install chalk -S
```

并建立`/app/util/index.ts`文件, 后面我们还会有其他的工具方法放在这里.

```typescript
import chalk from 'chalk';

export const log = (message: string, color?: string): void => {
  const printColor = color || 'green';
  console.log(chalk[printColor](message));
};
```

我们要连接的数据库在哪儿? 简单, 在根目录下新建一个`.db`后缀的文件, 如`test.db`, 它就是我们的数据库了. 然后配置ORM, 同样在根目录下新建`ormconfig.json`, 配置如下

```json
{
  "type": "sqlite",
  "database": "./test.db",
  "synchronize": true,
  "dropSchema": true,
  "logging": true,
  "logger": "advanced-console",
  "entities": ["src/entity/**/*.ts"]
}
```

`database`为你的数据库路径, 注意不要填错, `enyities`为TypeORM的"实体"文件, 你可以理解为表. 我们会在后面才去建立. 现在更改`app.ts`:

```typescript
import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import { Application } from "midway";
import { log } from "./util";

class AppBootHook {
  app: Application;
  connection: Connection;

  constructor(app: Application) {
    this.app = app;
  }

  async willReady() {
    log("=== TypeORM Starting ===");

    createConnection()
      .then(async (connection) => {
        log("=== Database Connection Established ===");
      })
      .catch((error) => {
        console.error(error);
        log("Oops! An Error Occured", "red");
      });
  }
}

export default AppBootHook;

```

`createConnection`即为TypeORM连接数据库的方式, 它是一个异步方法, 我们在`.then()`中去做一些处理, 比如打印成功日志与注入连接到容器.

现在启动应用, 你得到的终端输出大致是这样的:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822162527.png)



## 建立数据库结构

现在我们终于可以大概介绍下项目是啥样的了, 首先是数据库结构

- User, 包含`uid` name description age job字段
- Game, 包含 gid name saleYear favorCount rate字段
- Flow, 包含gid, uid, isLike, date字段

其实很简单, 存储用户信息与游戏信息, 用户点赞或取消点赞会记录在Flow表并反馈到Game表中游戏的点赞数(favorCount).



我们首先在`/src`下建立一个`interface`文件夹,用于存储这三张表(实体)的接口定义:

```typescript
// user.ts
export interface IUser {
  uid?: number;
  name: string;
  description?: string;
  age: number;
  job?: string;
}

// game.ts
export interface IGame {
  gid: string;
  name: string;
  saleYear: string;
  favorCount?: number;
  rate?: number;
}

// flow.ts
export interface IFlow {
  gid: string;
  uid: string;
  isLike: boolean;
  date?: Date;
}
```

然后在`interface/index.ts`中做统一的导出:

```typescript
export * from './user';
export * from './game';
export * from './flow';
```



接着, 我们新建实体, 在`/src`下新建`/entity`文件夹, 我们在这里定义TypeORM实体:

```typescript
// user.ts
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IUser } from "../interface";

@Entity()
export class User implements IUser {
  @PrimaryGeneratedColumn()
  uid: number;

  @Column()
  name: string;

  @Column({ default: "Stupid and Lazy" })
  description?: string;

  @Column()
  age: number;

  @Column({ default: "Frontend Engineer" })
  job?: string;
}

// game.ts
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IGame } from "../interface";

@Entity()
export class Game implements IGame {
  @PrimaryGeneratedColumn()
  gid: string;

  @Column()
  name: string;

  @Column()
  saleYear: string;

  @Column({ default: 0 })
  favorCount?: number;

  @Column({ default: 0.0 })
  rate?: number;
}

// flow.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IFlow } from '../interface';

@Entity()
export class Flow implements IFlow {
  @PrimaryGeneratedColumn()
  flowId: string;

  @Column()
  gid: string;

  @Column()
  uid: string;

  @Column()
  isLike: boolean;

  @Column({ default: Date.now() })
  date?: Date;
}

// 同样的, 做统一导出
export * from './game';
export * from './user';
export * from './flow';
```

可以看到, 借助装饰器的能力来定义表结构, 同样显得非常简洁, 简单介绍下API

- Entity, 该装饰器意味着这个类会被作为TypeORM实体
- PrimaryGeneratedColumn, 意味着该属性会被作为自增主键
- Column, 意味着该属性会作为普通字段.



既然有了数据库, 我们自然也要有一些初始数据, 包括用户信息和游戏信息. 我们在`src/util/index.ts`下新增两个mock方法:

```typescript
import { IUser } from "../interface";
import { IGame } from "../interface";

export const mockUserData = (length: number): IUser[] => {
  const arr = Array(length);

  for (let i = 0; i < length; i++) {
    arr.push({
      name: `linbudu${Math.floor(Math.random() * 100)}`,
      age: Math.floor(Math.random() * 22),
    });
  }

  return arr;
};

export const mockGameData = (length: number): IGame[] => {
  const arr = Array(length);

  for (let i = 0; i < length; i++) {
    arr.push({
      name: "Subnatica",
      saleYear: "2019",
      price: "99",
      favorCount: 0,
    });
  }

  return arr;
};
```

(Subnautica深海迷航应该是我Steam上游戏时间最长的游戏了...  深海+生存+部分克苏鲁元素, 我爱了!)



接下来我们尝试启动自定义中连接数据库以及添加mock数据:

```typescript
import "reflect-metadata";
import { createConnection, getConnection, Connection } from "typeorm";
import { Application } from "midway";
import { User, Game, Flow } from "./entity";
import { mockUserData, mockGameData, log } from "./util";

class AppBootHook {
  app: Application;
  connection: Connection;

  constructor(app: Application) {
    this.app = app;
  }

  async willReady() {
    log("=== TypeORM Starting ===");

    createConnection()
      .then(async (connection) => {
        log("=== Database Connection Established ===");
        await connection.manager.insert(User, mockUserData(5));
        await connection.manager.insert(Game, mockGameData(5));
        await connection.manager.insert(Flow, {
          uid: "1",
          gid: "1",
          isLike: true,
        });
      
        log("=== Initial [User & Game] Info Injected Successfully ===");
      })
      .catch((error) => {
        log(error, "red");
        log("Oops! An Error Occured", "red");
      });
  }

}

export default AppBootHook;
```

接下来我们可以启动看看, 在这之前需要删除掉`src/controllrt/user.ts`与`/src/service/user.ts`与`interface.ts`文件, 否则会造成错误的引入.

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822165712.png)

终端的命令告诉我们输入成功了, 现在我们去看看数据库里是否真的插入了mock数据.

在终端依次执行以下命令:

```bash
$ sqlite3
$ .open test.db
$ .headers on
$ .mode column
$ SELECT * FROM user;
```

结果如下:![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822170003.png)



或者, 你也可以使用VS Code插件`SQLite`来进行查看, 安装后在命令面板使用`Open DataBase`, 选择当前的数据库, 在左侧资源管理器打开视图:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822170318.png)

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200822170225.png)



## 核心逻辑

现在我们万事具备, 可以开始正式开发了. 首先按照MidwayJS的开发规范来说, 我们的service 类的接口定义, 同样需要放在`/interface`下, 比如现在我们的`interface/user.ts`长这样:

```typescript
import { InsertResult, DeleteResult } from "typeorm";
import { IGame } from ".";

export interface IUserService {
  // 获取所有用户
  getAllUsers(): Promise<IUser[] | null>;
  // 创建一个用户
  createUser(user: IUser): Promise<InsertResult>;
  // 根据uid查找一个用户
  findUserByUid(uid: string): Promise<IUser>;
  // 删除用户
  deleteUser(uid: string): Promise<DeleteResult>;
  // 用户喜欢的游戏
  userLikedGames(uid: string): Promise<IGame[]>;
  // 填充mock用户数据
  fillMockUser(): Promise<InsertResult>;
}

export type searchConditions = Partial<IUser>;

export interface IUser {
  uid?: number;
  name: string;
  description?: string;
  age: number;
  job?: string;
}
```

还记得前面我们提到, MidwayJS能够把数据库连接注入容器, 在这里我们先使用另外一种同样不错的方式来减少代码量.

创建`service/base.ts`

```typescript
import { Connection, getConnection } from 'typeorm';

export default class BaseService {
  connection: Connection;

  constructor() {
    this.connection = getConnection();
  }
}
```

创建`service/user.ts`

```typescript
import { provide } from "midway";
import { IUserService } from "../interface";
import BaseService from "./base";

@provide("userService")
export class UserService extends BaseService implements IUserService {
  constructor() {
    super();
  }

}
```

由于UserService继承于BaseService, 因此其内部的方法可以直接使用`this.connection`. 我们先写个获取所有用户的方法:

```typescript
async getAllUsers(): Promise<IUser[] | null> {
  log("=== getAllUsers Service Invoked ===");
  const result = await this.connection.manager.find(User);
  return result;
}
```

> 如果你之前没有使用过TypeORM甚至是任何ORM如Sequelize/Mongoose, 也关系不大, 你可以单纯的先从字面意义上去理解API的作用, 如find就是查找.
>
> `this.connection.manager.find()`接受两个参数, 第一个为实体, 第二个为查询选项, 在这里没有选项的情况下, 返回的是全部User实体下的数据, 其他使用的方法同样类似.

由于实际上这就是CRUD, 我直接给出完整的userService

```typescript
import { provide } from "midway";
import { InsertResult, DeleteResult } from "typeorm";
import { User, Flow, Game } from "../entity";
import { mockUserData, log } from "../util";
import { IUserService, IUser, IGame } from "../interface";
import BaseService from "./base";

@provide("userService")
export class UserService extends BaseService implements IUserService {
  constructor() {
    super();
  }

  async getAllUsers(): Promise<IUser[] | null> {
    log("=== getAllUsers Service Invoked ===");
    const result = await this.connection.manager.find(User);
    return result;
  }

  async createUser(user: IUser): Promise<InsertResult> {
    log("=== createUser Service Invoked ===");
    const result = await this.connection.manager.insert(User, { ...user });
    return result;
  }

  async findUserByUid(uid: string): Promise<IUser> {
    log("=== findUserByUid Service Invoked ===");
    const result = await this.connection.manager.findOne(User, uid);
    return result;
  }

  async deleteUser(uid: string): Promise<DeleteResult> {
    log("=== deleteUser Service Invoked ===");
    const result = await this.connection.manager.delete(User, uid);
    return result;
  }

  async fillMockUser(): Promise<InsertResult> {
    log("=== fillMockUser Service Invoked ===");
    const result = await this.connection.manager.insert(User, mockUserData(5));
    return result;
  }

  async userLikedGames(uid: string): Promise<IGame[]> {
    log("=== userLikedGames Service Invoked ===");
   // ...
  }
}

```

`userLikedGames`的实现我们先空着, 因为这里需要调用GameService的方法. 我们首先实现GameService:

```typescript
// interface/game.ts
import { InsertResult } from "typeorm";

export interface IGame {
  gid: string;
  name: string;
  saleYear: string;
  favorCount?: number;
  rate?: number;
}

export interface IGameService {
  // 获取所有游戏
  getAllGames(): Promise<IGame[] | null>;
  // 基于GID查找游戏
  getGameByGid(gdi: string): Promise<IGame>;
  // 点赞游戏
  likeGame(gid: string, uid: string): Promise<InsertResult>;
  // 取消点赞游戏
  unlikeGame(gid: string, uid: string): Promise<InsertResult>;
}
```

```typescript
// service/game.ts
import { provide, inject } from "midway";
import { InsertResult, Connection } from "typeorm";
import { Game, Flow } from "../entity";
import { log } from "../util";
import { IGameService, IGame } from "../interface";

@provide("gameService")
export class GameService implements IGameService {
  @inject("connection")
  connection: Connection;

  async getAllGames(): Promise<IGame[]> {
    const result = await this.connection.manager.find(Game);
    return result;
  }
  async getGameByGid(gid: string): Promise<IGame> {
    const result = await this.connection.manager.findOne(Game, gid);
    return result;
  }
  async likeGame(gid: string, uid: string): Promise<InsertResult> {
    // ...
  }
  async unlikeGame(gid: string, uid: string): Promise<InsertResult> {
    // ...
}
```

点赞游戏和取消点赞的接口我们先空着, 接下来我们看看怎么把controller与service连结在一起.

首先实现一个简单的方法来拼接响应:

```typescript
// util/index.ts
export const responseGener = (data: any, message: string, success = true) => {
  return {
    success,
    message,
    data,
  };
};
```



controller其实就是路由层, 像我们上一节讲到的, 基于`@get`/`@post`方法装饰器来规定http方法, 并用参数来规定路径, 如`@get("/user")`

```typescript
import { Context, controller, get, inject, provide, post, del } from "midway";
import { IUserService } from "../../interface";
import { responseGener } from "../../util";

@provide()
@controller("/user")
export class UserController {
  @inject()
  ctx: Context;

  @inject("userService")
  service: IUserService;

  @get("/all")
  async getUser(): Promise<void> {
    const res = await this.service.getAllUsers();
    this.ctx.body = responseGener(res, "Fetch User Info Successfully");
  }

}
```



```typescript
@inject("userService")
  service: IUserService;
```

这一段代码很好的证明了依赖注入机制的简洁性, 事实上你还可以注入配置`@config` / 插件`@plugin` / 自定义日志`@log`...

然后我们就可以直接`this.service.xxx`来调用我们前面写好的方法了, 完整的userController如下:

```typescript
import { Context, controller, get, inject, provide, post, del } from "midway";
import { IUserService } from "../../interface";
import { responseGener } from "../../util";

@provide()
@controller("/user")
export class UserController {
  @inject()
  ctx: Context;

  @inject("userService")
  service: IUserService;

  @get("/all")
  async getUser(): Promise<void> {
    const res = await this.service.getAllUsers();
    this.ctx.body = responseGener(res, "Fetch User Info Successfully");
  }

  @post("/create")
  async createUser(): Promise<void> {
    const { body } = this.ctx.request;
    const res = await this.service.createUser({ ...body });
    this.ctx.body = responseGener(res, "Create User Successfully");
  }

  @get("/uid/:uid")
  async findUserByUid(): Promise<void> {
    const {
      params: { uid },
    } = this.ctx;
    const res = await this.service.findUserByUid(uid);
    this.ctx.body = responseGener(res, "Find User By UID Successfully");
  }

  @del("/uid/:uid")
  async deleteUser(): Promise<void> {
    const {
      params: { uid },
    } = this.ctx;
    const res = await this.service.deleteUser(uid);
    this.ctx.body = responseGener(res, "Delete User Successfully");
  }

  @get("/fillMockData")
  async fillMockData(): Promise<void> {
    const res = await this.service.fillMockUser();
    this.ctx.body = responseGener(res, "Fill Mock User Successfully");
  }

  @get("/like/:uid")
  async userLikedGames(): Promise<void> {
    // ...
  }
}

```

现在你可以启动项目来正式体验下了, 我们把gameController也补上:

```typescript
// controller/game.ts
import { Context, controller, get, inject, provide, post } from 'midway';
import { IGameService } from '../../interface';
import { responseGener, log } from '../../util';

@provide()
@controller('/games')
export class GameController {
  @inject()
  ctx: Context;

  @inject('gameService')
  service: IGameService;

  @get('/all')
  async getAllGames(): Promise<void> {
    const res = await this.service.getAllGames();
    this.ctx.body = responseGener(res, 'Fetch Game Info Successfully');
  }

  @get('/gid/:gid')
  async getGameById(): Promise<void> {
    const {
      params: { gid },
    } = this.ctx;
    const res = await this.service.getGameByGid(gid);
    this.ctx.body = responseGener(res, 'Find Game By GID Successfully');
  }

  @post('/like')
  async likeGame(): Promise<void> {
    // ...
  }

  @post('/unlike')
  async unlikeGame(): Promise<void> {
    // ...
  }
}
```



## 中间件

Node框架都逃不过中间件的概念, 没办法, 谁让它真的好用呢. 在MidwayJS中, 我们可以使用全局以及路由级别的中间件.

首先我们在`app`下新建`middleware`文件夹, 先新建一个`cors.ts`文件来做跨域中间件支持.

```typescript
// middleware/cors.ts
import { Middleware } from 'midway';
import { log } from '../../util';

interface ICORSOptions {
  methods: string[];
  origin: string[];
}

const cors = ({ methods, origin }: ICORSOptions): Middleware => {
  return async (ctx, next) => {
    log('=== CORS Middlware Invoked ===');
    log(`Allowed Methods: ${methods}`);
    log(`Allowed Origin: ${origin}`);

    ctx.set('Access-Control-Allow-Origin', origin);
    ctx.set('Access-Control-Allow-Methods', methods);

    ctx.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Content-Length, Authorization, Accept, X-Requested-With'
    );

    ctx.method.toUpperCase() === 'OPTIONS' ? (ctx.body = 200) : await next();
  };
};

export default cors; 
```



你会发现这个中间件和Koa的中间件有些区别, 实际上它返回的那个函数才是中间件, 它可以接受选项来做基于环境或者是各种条件的定制. 那么它的选项来自于哪里? 这就要提到另一个我觉得设计很精巧的Egg/MidwayJS思路了, 中间件的启用和传给中间件的配置都在`config`文件中, 基于此我们能够快速根据环境来调整启用的中间件与传入给中间件的配置.



同时, 由于底层基于Koa, 所以我们还可以直接使用大部分的Koa中间件, 如`koa-logger`

我们在`middleware`下再新增一个`logger.ts`:

```typescript
import logger from 'koa-logger';

export default logger;
```



来到`config/config.default.ts`, 我们进行如下配置:

```typescript
import { EggAppConfig, EggAppInfo, PowerPartial } from 'midway';
import path from 'path';

export type DefaultConfig = PowerPartial<EggAppConfig>;

export default (appInfo: EggAppInfo) => {
  const config = {} as DefaultConfig;

  config.keys = appInfo.name + '_{{keys}}';

  config.middleware = ['cors', 'logger'];

  config.security = {
    csrf: false,
  };

  config.cors = {
    methods: '*',
    origin: '*',
  };

  return config;
};

```

在这里我们开启了cors与looger中间件, 并设置允许所有域和所有http方法通过.

来启动项目, 任意访问一个路由:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200823110533.png)

在配置中启用的路由是全局的, 那么如果我们想要使用路由级别的中间件该如何处理? 比如有部分比较耗时的操作, 只在部分路由生效, 或者是某些路由代表了敏感操作需要进行鉴权与日志留存?

在这里我们实现后者的情况, 对删除用户时做一个日志记录:

在`middleware`下新增`delLogger.ts`:

```typescript
import {
  Middleware,
  WebMiddleware,
  provide,
  logger,
  config,
  EggLogger,
  EggAppConfig,
} from "midway";

import { log } from "../../util";

@provide()
export class DelMw implements WebMiddleware {
  @config("delRouter")
  delConfig: EggAppConfig;

  @logger("delLogger")
  logger: EggLogger;

  resolve(): Middleware {
    return async (ctx, next) => {
      ctx.auth = this.delConfig.auth;

      log(
        `=== DEL Router Mw Invoked With UID: ${ctx.params.uid} & Auth: ${ctx.auth} ===`
      );

      this.logger.warn(
        `=== DEL Router Mw Invoked With UID: ${ctx.params.uid} & Auth: ${ctx.auth} ===`
      );
      await next();

      log("=== DEL Router Mw End");
    };
  }
}

```

路由级别的中间件推荐以类的形式书写, 其中的`public resolve`方法才是实际执行的中间件, 这么一来使得它同样可以被IoC容器收集(因为被`@provide()`装饰了), 并且也可以注入配置.

在`config.default.ts`中新增:

```typescript
config.delRouter = {
    auth: true,
  };

config.customLogger = {
  delLogger: {
    level: 'INFO',
    file: path.join(appInfo.root, 'logs/del.log'),
  },
};
```

使用POSTMan 访问`/user/uid/1` (`DELETE`):

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200823111150.png)



![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200823110533.png)

查看`log/del.log`:

![](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/QQ%E6%88%AA%E5%9B%BE20200823111555.png)



## Midway-Serverless



## Midway-Hooks


