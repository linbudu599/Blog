---
date: 2021-3-3
title: 写在2021: 值得关注/学习的前端框架和工具库
---

## 前言

最近在知乎看到了这么个问题：[学完Vue还有必要学习React和Node吗？](https://www.zhihu.com/question/446723495/answer/1756515485)， 有很奇妙的感觉，因为我在最开始入门前端时，也是以Vue入的门，在“学完”Vue之后， 我也有了这个疑问，但当时的我没多想，觉得“技多不压身”，反正都是前端，以后肯定用得上，那就学呗。所以我一路到现在都是处于这么一种状态：**看到一个新的框架—看看文档和场景—嗯哼，不错—学！** 虽然这样也造成我目前没有特别深入的方向，比如21届的大佬们在工程化（@zoomdong（抖音架构）@神三元（抖音架构）@炽翎（淘系））、微前端（@lenconda（cbu） @bven(wxg) ）、AST（@ATQQ（美团到店事业群））、等等都已经开始深耕，我还在~~当弟弟~~追着各种新框架学，这里面固然有我接触前端较晚还没确定自己的最爱的原因，也应该有我喜欢新事物的原因在。

这个问题的题主很明显遇到了大部分同学入门前端时会遇到的困惑：怎么这个还没学完又看到说那个才是主流的，怎么这个版本还没吃透又来了一个break change的新版本，怎么前端出框架的速度这么快？？

很简单，如果学有余力，学就是了。如果学不动了，就盯着一个方向甚至是一个框架吃透，在简历上，“了解过A、B、C，使用过D、E、F” 绝对不如 “深入了解React原理，精通Fiber架构实现”更能体现你的专业水准。但有一点请注意，**学有余力不是因为当前方向浅尝辄止而学有余力，是在当前方向足够深入同时还学有余力~**

对于不知道学啥的同学，就有了这篇文章，我会在接下来罗列我深入/尝试/了解过的，认为值得学习的各个方向框架与工具类库，并且对它们做一个简要介绍。

>  对于我认为较为主流的则不会包含（如Vue与React框架本身这种）。



## Web

### React

#### 状态管理

- Jotai，原子化的状态管理思路（就像React官方的Recoil），亮点是API比Recoil简洁很多，对Suspense模式支持好，可以考虑用来代替useContext + useReducer的状态管理。
- [IceStore](https://github.com/ice-lab/icestore)，淘系Ice团队出品的状态管理库，我在日常业务中使用最多的一个状态管理方案，亮点是基于Immer来实现数据不可变，整体的使用方案就像Dva一样，state + reducer + effects，支持React Hooks写法，TypeScript支持好。
- XState，不止适用于React，可以和Vue/Svelte这样的框架一起，也可以和RxJS这样的响应式库一起用。它对自己的定义也不包含状态管理的字样，而是有穷状态机。暂时没有使用过，具体特性略过。
- SWR、React-Query、useRequest，网络请求的状态管理、缓存、竞态处理等。

#### 生态

- GatsbyJS，基于React的静态页面生成器，非常快。优点是有非常多的插件（plugin）和模板（starter），并且支持很多CMS（如Contentful、Neltify等），适合喜欢在线写文档的。我正在考虑把博客迁移到GatsbyJS + CMS的方案，这样随便找一台电脑就能写博客了。
- React-Testing-Library，React测试库，个人感觉和Enzyme代表了两个不同方向，但是RTL还提供了Hooks的测试库，给力奥。



### Angular！

- Angular是我最近正在学的一个框架，在开始前我其实是拒绝的，但写了两个例子之后我觉得真香！你可能听过它不好的一面：笨重 难以定制 学习成本高 断崖式更新...， 可能也听过它好的一面：不需要再自己挑选路由 状态管理 依赖注入很香...。在最开始我就是处在这么个情况，直到我跟着官方教程走完第一个demo，我觉得我一段时间内不会再学Vue3了（对不起尤大）。整体的感受非常舒服：

  - 模块划分，我本人非常喜欢模块化的思想（个人认为React的是组件化而不是模块化），各个模块完全自己干自己的，不管是多级路由还是复杂数据流都显得结构清晰。

  - 模板语法，在用Vue的时候我没有感觉到模板语法有多好，可能是因为模板和逻辑写在一个文件里总觉得不纯粹。但在Angular中模板被单独放一个html文件，组件用Class的语法写，我就莫名觉得爽快。

  - 大而全，这一点见仁见智，能接受的会觉得很舒服，并且团队做定制也特别容易（schematics、generators、builders），各种规范是真的能确保不会一人一个写法。

  - 学习成本，低情商：学Angular还要学TS和RxJS；高情商：学了Angular我就会TS和RxJS了！

    > 深入TS类型编程推荐我之前写的这篇 [TypeScript的另一面：类型编程]

- 具体的不做展开介绍了，真的让我滔滔不绝安利Ng这篇文章就收不住了，所以有兴趣的同学欢迎去体验下。





## 移动 & 桌面 & 跨端

- Taro，京东凹凸实验室出品，应该是我目前见到支持最多端的跨端框架，一直没有用Taro写过一个完整应用，有机会会试试的。
- Remax，腾讯的小程序跨端框架，基于React，亮点是运行时方案（大部分跨端方案都是编译时，还有Rax这种两套方案都支持的）
- Ionic，出现比较早的一个跨端方案，最开始只支持Angular，现在还支持了React和Vue，暂时没有使用过。目前的了解是性能与Vue支持上存在一些问题（Angular YES）。据说是曾经培训班的标配。
- Electron，不做介绍了。
- NwJS，微信小程序开发者工具就是用这个写的，似乎和Electron是同一个维护者。
- Flutter，



## NodeJS

- NestJS，一个大而全的Node框架，就像NodeJS里的Angular，实际上作者也是受到了Angular的影响，很多装饰器都和Ng中的同名。你可能同样在犹豫要不要学这玩意，我的意见是：**学**！因为确实NodeJS中目前没有特别能打的框架。NestJS基于Express（也有Fastify的适配），同样预置好了各种能力，并且能很好的兼容Express中间件生态。我正在捣鼓的新项目就是基于Angular + Nest，越写越爽。

  > 如果你打算Angular和Nest都学，我的建议是先学Nest，这样入门Angular的学习路线会更平滑一点。
  >
  > 如果你此前没有接触过依赖注入，可以瞅瞅我之前写的这篇：

- MidwayJS，淘系Node架构出品，整个阿里都在用的Node框架，同样基于装饰器体系，你可以理解为复杂度低于Nest但是高于Egg和Koa。

  - Midway-Serverless，支持阿里云/腾讯云的Serverless框架，个人觉得是目前最好用的一个Serverless框架了，虽然Serverless（框架，不是真·Serverless）支持微信扫码登录也很顶。
  - Midway-Hooks，见下面的介绍

- ts-node-dev + tsconfig-paths，你是否受够了ts-node的配置？是否难以忍受为了自动重启还需要为nodemon配置ts-node作为执行？请使用xxx这一行命令即可~

- TypeORM，最爱的ORM没有之一（装饰器 YES），也是目前NodeJS社区使用最多的两个ORM之一（另一个是Sequelize，但是TS支持只能说emmm，社区的TS实现也只能说一般）。Query Builder、级联、支持依赖注入，非常推荐试一试。

- PM2，NodeJS进程管理工具，零宕机重启、支持fork和cluster模式、blabla...，更🐂的地方在于提供了很geek的可视化界面，如我的服务器上截图：

- Prisma，下一代ORM，不仅仅是ORM。很新颖的使用方式（我是真的第一次见），TS支持非常好，Schema定义的方式也比传统ORM各个实体定义分开的方式清晰很多，有兴趣的可以瞅瞅我写的这个demo：【】

  > 文章在哪呢？当然是~~鸽~~在写了。

- Serverless，这个，就不做过多介绍了，懂的自然懂。（强烈建议至少了解一下）

- BFF，Backend For Frontend，这里不做介绍。



## GraphQL

~~夹带私货时间到~~ GraphQL是我稍微比较深入一点的方向，这里相关的类库也会多一些。

### Client

- Apollo-Client，来自ApolloGraphQL的作品，只有React版本是官方团队在维护，Vue版本的被挪到Vue团队了(VueUI有一部分就是基于Apollo-Client-Vue写的)，Angular版本的似乎是个人作品。强大的地方在于实现了一套GraphQL的缓存方案（GraphQL不像REST API那样可以用URL作为缓存的key，它只有单个schema，要缓存必须基于Schema拍平整个数据结构，然后再基于各个field进行缓存控制）。
- Relay，FaceBook出品，所以也比较受到推崇（我记得看到过原因是这样，GraphQL如果要改啥，才刚进入草案，Relay团队就已经提供了支持），但上手没有Apollo-Client那么容易。
- GraphQLURL，Hasura（介绍见下面的Engine部分）出品的客户端
- GraphQL-Zeus，小而美的GraphQL客户端



### Server

- Apollo-Server：ApolloGraphQL出品，提供了常见Node框架的实现（Koa/Express/Hapi/Fastify等），亮点是提供了getMiddleware这个方法，可以把整个GraphQL Server以中间件的形式挂载到一个Node应用上（我就是使用这种方式来同时提供REST和GraphQL两套API的，但需要注意某些中间件的配置需要ignore掉挂载的路径）
- GraphQL-Yoga，基于Apollo-Server，封装了一些特性，因此比Apollo-Server更容易上手，但功能却更强，比如原生支持文件上传这种。



### Libs

- TypeGraphQL，最爱的GraphQL工具库没有之一，让你用TS的Class和装饰器来定义GraphQL Type，和TypeORM Class-Validator一起用非常愉悦（当然，你需要能接受满屏的装饰器）。还提供了中间件（注意和服务端框架的中间件区分）、鉴权（推荐GraphQL API的鉴权只使用它提供的）、扩展、指令、联合类型等。
- GraphiQL，可视化的GraphQL API调试工具，直观的查看你的Schema、发起请求、查看问题，有一个增强版本是支持通过点击单选框生成查询语句。
- GraphQL-Playground，类似上一个，但是更美观一些，支持跟踪请求链路（Tracing）以及 Apollo Federation 插件的集成（Query Plan）。
- GraphQL-Code-Generator，很强大的工具，从`.graphql`文件到语言可以直接使用的方法/类型定义，这个思想实际上各个语言都有，如Dart和Ruby等。在TS中这个工具的主要能力就是生成TS的类型定义，同时它的插件体系还提供了更多的额外能力，如生成Apollo-Client可以直接使用的`useXXXQuery`等，前端连查询语句都不用写了；又或者基于Schema生成TypeGraphQL的Class定义，这一波反向生成我直接好家伙。
- DataLoader，解决GraphQL Resolver深度优先执行导致的N+1问题，详见【】
- GraphQL-Tools



### Engine

GraphQL Engine其实是一个非常神奇的





## 工程化

### 打包/构建工具

- Webpack5，新的缓存方案和模块联邦还是值得了解下的。
- Vite，关于Vite的文章太多了，我感觉只要入门了前端就肯定听说过。
- Parcel，最大的亮点是零配置，我在一些中小型项目使用过，很适合中小型规模以及只是想跑一下demo的场景，速度也挺快。（不会有人为了跑Demo还CRA从头建一个项目吧）
- SnowPack，原SkyPack，好像是最早应用ES Module特性到开发服务器的打包工具。
- ESBuild，基于Go写的打包工具，是真的非常快。但不支持装饰器语法的编译，所以我用的比较少。
- SWC，基于Rust的打包工具，同样非常快，但是没用过。
- Rollup，前端轮子哥Rich Harris的作品，我还挺喜欢这种插件的思想。我了解到的比较多的用途是用来打包Node库，亮点是摇树优化的支持。



### CI/CD

- GitHub Actions，个人觉得，CI/CD只需要这个就够了，上手也非常快，workflow、job、task、step，done！而且actions市场有各种大神们已经写好的action让你可以快速搭建一个严谨的工作流。比如：写入环境变量—使用NodeJS 10/12/14，Windows/Linux/MacOS 最新版本，每个组合跑一遍构建流程，确保在每个组合都能构建成功—跑一遍Lint+单元测试，上传测试覆盖率—跑一遍ssh sync action，把构建产物上传到自己服务器。
- TravisCI
- CircleCI
- GitLabCI，GitLab最大的优势是可以自建，Runner也是不错的设定~



### 静态页面托管

最常见的方式：使用这些服务托管静态页面，然后域名解析到自己的。恭喜，你可以不买服务器了！

- Vercel（原@zeit/now）
- Surge
- GitHub Pages
- Netlify



### 云平台

- Heroku，可以用来部署你的API（白嫖YYDS）
- Apollo Studio，ApolloGraphQL提供的GraphQL API管理工具，配合Apollo-Server的插件可以实现埋点统计、可视化分析等功能。
- Vercel Functions，可以理解为是只需要Vercel账号就能白嫖的Serverless Function，并且不需要f.yml这种配置。
- Netlify Functions，类似上一个，但是收费。
- Nx Cloud，Nx（详细介绍见下面）提供的云平台，主要功能是在项目达到一定规模，构建耗时比较长时，避免每个开发人员要重新在自己本地构建一次项目，而是从云端下载已构建完成的文件，以此来提高效率。



### Monorepo

- Nx，我在用这个作为业务项目的Monorepo管理，到目前感觉都挺好，尤其是Angular + Nest项目，基于后端的GraphQL Schema生成TypeScript的类型定义和函数，前端直接`import { QueryDocument } from "@app/graphql"`, 爽！还支持React、Gatsby、NextJS、普通Web应用等，甚至集成好了Jest、Cypress、StoryBook等。
- Lerna，我用这个作为工程项目的Monorepo管理。
- Yarn Workspace，Yarn提供的Monorepo工具，有看到实践是用Lerna来管理版本，Yarn Workspace管理依赖。
- PNPM，实际上是包管理工具，但内置了Monorepo支持，我也在用这个（强烈安利），想要了解可以看看三元的这篇文章：



## 一体化框架

一体化框架指的是， 你的前后端项目放在同一个repo里（后端是Node），同时前端直接调用在后端定义的方法，由框架在编译时去自动的把前端对后端的方法调用转换成HTTP请求。这是最近前端还挺火热的一个方向，主要的基于Node的一体化框架主要有这么几个：

- BlitzJS，前端NextJS，后端Prisma，中间基于GraphQL，但是实际上你不会直接去参与GraphQL Schema的编写，不需要定义Resolver、ObjectType这些东西，因为BlitzJS内部用useQuery和useMutation抹掉了中间的调用过程（和Apollo的hooks类似但不完全相同，Apollo的useQuery接收的是GraphQL Document，BlitzJS中的则接收的是后端方法，其中会直接`db.entity.create()`这样去写数据库）。
- RedwoodJS，基于React + Prisma + GraphQL，整体类似于Blitz，但文档全面的多。但是由于暂时对TypeScript支持不是很好，所以我还没体验过。简单来说，它和Blitz一样都是在JAMStack这一理念上的革新者。
- Midway-Hooks，这应该是三者中最适合国内场景的框架了，Serverless + Vue / React + Hooks，优势也不少：跨前端框架、跨Serverless平台、Hooks代码更好维护与复用等（NextJS的API Routing总感觉差了点什么）。





## 通用

- RxJS
  - Rxviz
  - Reactive.How
  - RxDB
- NgRx
- Web Components
- E2E：Cypress / PlayWright / Puppeteer
- StoryBook