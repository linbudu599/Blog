---
date: 2021-3-3
title: 写在2021 值得关注/学习的前端框架和工具库
---

## 前言

![olivier-miche-OZACaaUskhg-unsplash](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/olivier-miche-OZACaaUskhg-unsplash.jpg)

最近在知乎看到了这么个问题：[学完Vue还有必要学习React和Node吗？](https://www.zhihu.com/question/446723495/answer/1756515485)， 有很奇妙的感觉，因为我在最开始入门前端时，也是以Vue入的门，在“学完”Vue之后， 我也有了这个疑问，但当时的我没多想，觉得“技多不压身”，反正都是前端，以后肯定用得上，那就学呗——

结果我一路到现在都是处于这么一种状态：**看到一个新的框架—看看文档和场景—嗯哼，不错—学！** 虽然这样也造成我目前没有特别深入的方向，比如21届的大佬们在工程化、微前端、AST、NodeJS等等方向都已经开始深耕，我还在~~当弟弟~~追着各种新框架学，但不得不说，在学习新事物的过程中，你会逐渐**对这些框架进行分类（比如我下面进行的归类）**，**提取他们的共同点**，这样在开始学习一个新东西时，你通常已经拥有了**可复用的经验**（比如在之前我感兴趣的研究了一些装饰器相关，使得后面入门Nest/Angular等都特别快），所以**你的学习能力通常会是越来越强的**。

这个问题的题主很明显遇到了大部分同学入门前端时会遇到的困惑：**怎么这个还没学完又看到说那个才是主流的**，**怎么这个版本还没吃透又来了一个break change的新版本**，**怎么前端出框架的速度这么快**？？

很简单，如果学有余力，学就是了。如果学不动了，就完全没必要盯着前沿方向学（虽然前端网红圈不是吹的），不要被“**2021前端必备！再不学你就out了！**” “**学会这些，立刻月薪30k！**”此类的标题迷花了眼，觉得不学就被人卷死了。就盯着一个方向甚至是一个框架吃透，在简历上，“了解过A、B、C，使用过D、E、F” 绝对不如 “深入了解A原理，精通B架构实现，C的collaborator/maintainer之一”。

但有一点请注意，**学有余力不是因为当前方向浅尝辄止而学有余力，是在当前方向足够深入同时还学有余力~**

对于不知道学啥的同学，就有了这篇文章，我会在接下来罗列我**深入/尝试/了解过的**，认为**值得学习**的各个方向框架与工具类库，并且对它们做一个简要介绍。

>  对于我认为较为主流的则不会包含（如Vue与React框架本身这种~）。



## Web

### React

#### 状态管理

- [Jotai](https://github.com/pmndrs/jotai)，原子化的状态管理思路（就像React官方的Recoil），亮点是API比Recoil简洁很多，对Suspense模式支持好，可以考虑用来代替useContext + useReducer。
- [IceStore](https://github.com/ice-lab/icestore)，淘系Ice团队出品的状态管理库，我在日常业务中使用最多的一个状态管理方案，亮点是基于Immer来实现数据不可变，整体的使用方案类似Dva，state + reducer + effects，支持React Hooks写法，TypeScript支持好。
- [XState](https://github.com/davidkpiano/xstate)，不止适用于React，可以和Vue/Svelte/Ember这样的框架一起，也可以和RxJS这样的响应式库一起用。它对自己的定义也不包含状态管理的字样，而是**有穷状态机( [finite state machines](https://en.wikipedia.org/wiki/Finite-state_machine) )**。暂时没有使用过，不做展开介绍。
- [SWR](https://github.com/vercel/swr)、[React-Query](https://github.com/tannerlinsley/react-query)、[useRequest](https://github.com/alibaba/hooks)，网络请求的状态管理、缓存、竞态处理等。

#### 生态

- [GatsbyJS](https://github.com/gatsbyjs/gatsby)，基于React的静态页面生成器，非常快。优点是有非常多的插件（plugin）和模板（starter），并且支持很多CMS（如Contentful、Neltify等），适合喜欢在线写文档的。我正在考虑把博客迁移到GatsbyJS + CMS的方案，这样随便找一台电脑就能写博客了。
- [React-Testing-Library](https://github.com/testing-library/react-testing-library)，React测试库，个人感觉和Enzyme代表了两个不同方向，而RTL更符合直觉。RTL还提供了Hooks的测试库，给力奥。
- [AHooks](https://github.com/alibaba/hooks)，阿里的React Hooks库，我日常开发经常用到其中的Hooks。
- [Huse](https://github.com/ecomfe/react-hooks)，百度工程效能团队的Hooks库，同样很强大，里面的很多实现都比较hack（大量使用了useRef等），适合进阶阅读。
- [Dumi](https://github.com/umijs/dumi)，蚂蚁出品的React文档生成器。
- [Immer](https://github.com/immerjs/immer)，思路巧妙的数据不可变方案。



### Angular！

- [Angular](https://angular.cn/) 是我最近正在学的框架，在开始前我其实是拒绝的，但写了两个例子之后我觉得真香！你可能听过它不好的一面：笨重、学习成本高、断崖式更新...， 可能也听过它好的一面：不需要再自己挑选路由、状态管理方案、请求库等、依赖注入很香适合后端程序员快速上手...。在最开始我就是处在这么个情况，直到我跟着官方教程走完第一个demo，我觉得我一段时间内不会再学Vue3了（对不起尤大）。整体的感受非常舒服：

  - 模块划分，我本人非常喜欢模块化的思想（个人认为React的是组件化而不是模块化），各个模块完全自己干自己的，不管是多级路由还是复杂数据流都显得结构清晰。

  - 模板语法，在用Vue的时候我没有感觉到模板语法有多好，可能是因为模板和逻辑写在一个文件里总觉得不纯粹。但在Angular中模板被单独放一个html文件，组件用Class的语法写，我就莫名觉得爽快。

  - 大而全，这一点见仁见智，能接受的会觉得很舒服，并且团队做定制也特别容易（schematics、generators、builders），各种规范是真的能确保不会一人一个写法。

  - 学习成本，低情商：学Angular还要学TS和RxJS；高情商：学了Angular我就会TS和RxJS了！

    > 深入TS类型编程推荐我之前写的这篇 [TypeScript的另一面：类型编程](https://linbudu.top/posts/2020/10/19/typescript%E7%B1%BB%E5%9E%8B%E7%BC%96%E7%A8%8B.html)

- 具体的不做展开介绍了，真的让我滔滔不绝安利Ng这篇文章就收不住了，所以有兴趣的同学欢迎去体验下。



## 跨端

- [Taro](https://github.com/NervJS/taro)，京东凹凸实验室出品，应该是我目前见到支持最多端的跨端框架（但问题也不少，这个没办法），一直没有用Taro写过一个完整应用，有机会会试试的。
- [Rax](https://github.com/alibaba/rax)，淘系Ice团队出品，轻量、易用、高性能。同样是淘系到集团广泛使用的跨端方案。
- [Remax](https://remaxjs.org/)，小程序跨端框架，基于React，亮点是运行时方案（大部分跨端方案都是编译时，还有Rax这种两套方案都支持的）。
- [Ionic](https://github.com/ionic-team/ionic-framework)，出现比较早的一个跨端方案，最开始只支持Angular，现在还支持了React和Vue，暂时没有使用过。目前的了解是性能与Vue支持上存在一些问题（所以Angular YES）。据说是曾经培训班的标配？
- [Electron](https://github.com/electron/electron)，不做介绍。
- [NwJS]()，微信小程序开发者工具就是用这个写的，和Electron是同一个维护者([zcbenz](https://www.zhihu.com/people/zcbenz))。
- [Flutter](https://github.com/flutter/flutter)，不做介绍。



## NodeJS

- [NestJS](https://nestjs.com/)，一个大而全的Node框架，就像NodeJS里的Angular，实际上作者也是受到了Angular的影响，很多装饰器都和Ng中的同名。你可能同样在犹豫要不要学这玩意，我的意见是：**学**！

  因为确实NodeJS中目前没有特别全面的框架（虽然NestJS在Spring面前也是弟弟）。NestJS基于Express（也有Fastify的适配），同样预置好了各种能力，并且能很好的兼容Express中间件生态。我正在捣鼓的新项目就是基于Angular + Nest，越写越爽。

  > 如果你打算Angular和Nest都学，我的建议是先学Nest，这样入门Angular的学习路线会更平滑一点。
  >
  > 如果你此前没有接触过依赖注入，可以瞅瞅我之前写的这篇：[走近MidwayJS：初识TS装饰器与IoC机制](https://linbudu.top/posts/2020/08/10/midway-initial.html)

- [MidwayJS](https://github.com/midwayjs/midway)，淘系Node架构出品，整个阿里都在用的Node框架，同样基于装饰器体系，你可以理解为复杂度与完善性方面低于NestJS，但是高于Egg和Koa。

  - [Midway-Serverless](https://www.yuque.com/midwayjs/faas)，支持阿里云/腾讯云的Serverless框架，个人觉得是目前最好用的一个Serverless框架了，虽然[Serverless](https://github.com/serverless/serverless)（框架，不是真·Serverless）支持微信扫码登录也很顶。
  - [Midway-Hooks](https://github.com/midwayjs/hooks)，见下面的介绍

- [ts-node-dev](https://github.com/wclr/ts-node-dev) + [tsconfig-paths](https://github.com/dividab/tsconfig-paths)，你是否受够了ts-node的配置？是否难以忍受为了自动重启还需要为nodemon配置ts-node作为执行？请使用`ts-node-dev -r tsconfig-paths/register xxx/index.ts`这一行命令即可~

- [TypeORM](https://github.com/typeorm/typeorm)，最爱的ORM没有之一（装饰器 YES），也是目前NodeJS社区使用最多的两个ORM之一（另一个是Sequelize，但是TS支持只能说emmm，社区的TS实现也只能说一般）。Query Builder、级联、支持依赖注入，非常推荐试一试。

- [PM2](https://github.com/Unitech/pm2)，NodeJS进程管理工具，零宕机重启、支持fork和cluster模式、blabla...，更🐂的地方在于提供了很geek的可视化界面，如我的服务器上截图：

  ![image-20210304101632590](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210304101632590.png)

- Prisma，下一代ORM，不仅仅是ORM。很新颖的使用方式（我是真的第一次见），TS支持非常好，Schema定义的方式也比传统ORM各个实体定义分开的方式清晰很多，有兴趣的可以瞅瞅我写的这个demo：[Prisma-Article-Example](https://github.com/linbudu599/Prisma-Article-Example)

  > 文章在哪呢？当然是~~鸽~~在写了。

- Serverless，这个，就不做过多介绍了，懂的自然懂。（强烈建议至少了解一下）

- BFF，Backend For Frontend，这里不做介绍。



## GraphQL

~~夹带私货时间到~~ GraphQL是我稍微比较深入一点的方向，这里相关的类库也会多一些。

### Client

- [Apollo-Client](https://github.com/apollographql/apollo-client)，来自[ApolloGraphQL](https://www.apollographql.com/)的作品，只有React版本是官方团队在维护，Vue版本的被挪到Vue团队了(VueUI有一部分就是基于[Apollo-Client-Vue](https://github.com/vuejs/vue-apollo)写的)，[Angular版本](https://github.com/kamilkisiela/apollo-angular)的似乎是个人作品。强大的地方在于实现了一套GraphQL的缓存方案（GraphQL不像REST API那样可以用URL作为缓存的key，它只有单个schema，要缓存必须基于Schema拍平整个数据结构，然后再基于各个field进行缓存控制）。
- [Relay](https://github.com/facebook/relay)，FaceBook出品，所以也比较受到推崇（我记得看到过原因是这样，GraphQL如果要改啥，才刚进入草案，Relay团队就已经提供了支持），但上手没有Apollo-Client那么容易。
- [GraphQURL](https://github.com/hasura/graphqurl)，Hasura（介绍见下面的Engine部分）出品，没使用过。
- [GraphQL-Zeus](https://github.com/graphql-editor/graphql-zeus)，小而美的GraphQL客户端，集成了Code-Generator能力。



### Server

- [Apollo-Server](https://github.com/apollographql/apollo-server)：ApolloGraphQL出品，提供了常见Node框架的实现（Koa/Express/Hapi/Fastify等），亮点是提供了getMiddleware这个方法，可以把整个GraphQL Server以中间件的形式挂载到一个Node应用上（我就是使用这种方式来同时提供REST和GraphQL两套API的，但需要注意某些中间件的配置需要ignore掉挂载的路径）
- [GraphQL-Yoga](https://github.com/prisma-labs/graphql-yoga)，Prisma团队出品，基于Apollo-Server，封装了一些特性，因此比Apollo-Server更容易上手，但功能却更强，比如原生支持文件上传这种。



### Libs

- [TypeGraphQL](https://github.com/MichalLytek/type-graphql)，最爱的GraphQL工具库没有之一，让你用TS的Class和装饰器来定义GraphQL Type，和TypeORM Class-Validator一起用非常愉悦（当然，你需要能接受满屏的装饰器）。还提供了中间件（注意和服务端框架的中间件区分）、鉴权（推荐GraphQL API的鉴权只使用它提供的）、扩展、指令、联合类型等。作者也很厉害，提供了和NestJS以及Prisma各自的集成包。
- [GraphiQL](https://github.com/graphql/graphiql)，可视化的GraphQL API调试工具，直观的查看你的Schema、发起请求、查看问题，有一个增强版本是支持通过点击单选框生成查询语句，一时没找到。
- [GraphQL-Playground](https://github.com/graphql/graphql-playground)，类似上一个，但是更美观一些，支持跟踪请求链路（Tracing）以及 [Apollo Federation](https://www.apollographql.com/docs/federation) 插件的集成（Query Plan）。
- [GraphQL-Code-Generator](https://github.com/dotansimha/graphql-code-generator)，很强大的工具，从`.graphql`文件到语言可以直接使用的方法/类型定义，这个思想实际上各个语言都有，如Dart和Ruby等。在TS中这个工具的主要能力就是生成TS的类型定义，同时它的插件体系还提供了更多的额外能力，如Apollo-Client的插件，让你可以直接使用封装好的的`useXXXQuery`等，前端连查询语句都不用写了；又或者基于Schema生成TypeGraphQL的Class定义，这一波反向生成我直接好家伙。
- [DataLoader](https://github.com/graphql/dataloader)，解决GraphQL Resolver深度优先执行导致的N+1问题，详见[GraphQL N+1 问题到DataLoader源码解析](https://linbudu.top/posts/2021/01/29/dataloader%E6%BA%90%E7%A0%81.html)
- [GraphQL-Tools](https://www.graphql-tools.com/)，提供了一堆让你对GraphQL Schema为所欲为的方法，从Directive到Resolver到Schema，都给你安排的明明白白。但我只是比较简单的使用过，用于和TypeGraphQL一起实现自定义指令，详见 [这里](https://github.com/linbudu599/GraphQL-Explorer-Server/blob/master/server/directives/restrictions.ts)



### Engine

GraphQL Engine其实是一个非常神奇的方向，有点像REST那边的各种自动生成REST API的工具。简单地说，你提供一个数据库，GraphQL Engine会为你基于数据库的结构（可能这就是目前都支持PostgreSQL的原因？）生成GraphQL Schema、API、查询语句（Query/Mutation/Subscription都支持，并且是根据你的Schema组合来的）等，可以说是非常猛了。

- [Hasura](https://hasura.io/)，功能比较全的一款，支持PostgreSQL和MSSQL，除了上面提到的以外还提供鉴权与触发器（类似Serverless中的触发器），以及把外部已经独立部署的GraphQL API也纳入管控。它提供的GraphiQL就是我上面提到的增强版本：

  ![image-20210304104225150](https://budu-oss-store.oss-cn-shenzhen.aliyuncs.com/image-20210304104225150.png)

  Hasura还提供了前面说的GraphQURL作为client，hasura-code-gen来从Hasura服务生成TS代码，所以基本上可以用Hasura的生态做为一套方案了，包括我也有看到过一些创业公司就在使用Hasura（有提供企业级支持）。

- [PostGraphile](https://www.graphile.org/)， 只支持PostgreSQL，优势在于性能与插件系统来实现高度定制，还提供了数据库工具。和Hasura一样能自动基于级联关系生成CRUD操作，同样提供了企业级支持。



## 工程化

### 打包/构建工具

- [Webpack5](https://github.com/webpack/webpack)，新的缓存方案和模块联邦还是值得了解下的。
- [Vite](https://github.com/vitejs/vite)，关于Vite的文章太多了，我感觉只要入门了前端就肯定听说过。
- [Parcel](https://parceljs.org/)，最大的亮点是零配置，我在一些中小型项目使用过，很适合中小型规模以及只是想跑一下demo的场景，速度也挺快。（不会有人为了跑Demo还CRA从头建一个项目吧）
- [SnowPack](https://github.com/snowpackjs/snowpack)，原SkyPack，好像是最早应用ES Module特性到开发服务器的打包工具。
- [ESBuild](https://github.com/evanw/esbuild)，基于Go，是真的非常快。但[不支持装饰器语法](https://esbuild.github.io/content-types/#emit-decorator-metadata)，所以我用的比较少。
- [SWC](https://github.com/swc-project/swc)，基于Rust，同样非常快，但是没用过。
- [Rollup](https://github.com/rollup/rollup)，前端轮子哥[Rich Harris](https://github.com/Rich-Harris)的作品，我还挺喜欢它的思想。了解到的比较多的用途是用来打包NodeJS的库。



### CI/CD

- [GitHub Actions](https://docs.github.com/en/actions)，个人觉得，CI/CD只需要这个就够了，上手也非常快，workflow、job、task、step，done！而且actions市场有各种大神们已经写好的action让你可以快速搭建一个严谨的工作流。比如：**写入环境变量—使用NodeJS 10/12/14，Windows/Linux/MacOS 最新版本，每个组合跑一遍构建流程，确保在每个组合都能构建成功—跑一遍Lint+单元测试，上传测试覆盖率—跑一遍ssh sync action，把构建产物上传到自己服务器**。
- [TravisCI](https://travis-ci.com/)
- [CircleCI](https://circleci.com/)
- [GitLabCI](https://about.gitlab.com/stages-devops-lifecycle/continuous-integration/)，GitLab最大的优势是可以自建，Runner也是不错的设定~



### 静态页面托管

最常见的方式：使用这些服务托管静态页面，然后域名解析到自己的。

- [Vercel（原@zeit/now）](https://vercel.com/)
- [Surge](https://surge.sh/)
- [GitHub Pages](https://docs.github.com/en/github/working-with-github-pages/getting-started-with-github-pages)
- [Netlify](https://www.netlify.com/)



### 云平台

- [Heroku](https://dashboard.heroku.com/)，可以用来部署你的API（白嫖YYDS）
- [Apollo Studio](https://www.apollographql.com/docs/studio/)，ApolloGraphQL提供的GraphQL API管理工具，配合Apollo-Server的插件可以实现埋点统计、可视化分析等功能。
- [Vercel Functions](https://vercel.com/docs/serverless-functions/introduction)，可以理解为是只需要Vercel账号就能白嫖的Serverless Function，并且不需要f.yml这种配置。
- [Netlify Functions](https://docs.netlify.com/functions/overview/)，类似上一个，但是收费。
- [Nx Cloud](https://nx.app/)，Nx（详细介绍见下面）提供的云平台，主要功能是在项目达到一定规模，导致构建耗时较长时，避免每个开发人员要重新在自己本地构建一次项目，而是从云端下载已构建完成的文件，以此来提高效率。



### Monorepo

- [Nx](https://github.com/nrwl/nx)，我在用这个作为业务项目的Monorepo管理，到目前感觉都挺好，尤其是Angular + Nest项目，基于后端的GraphQL Schema生成TypeScript的类型定义和函数（GraphQL-Code-Generator），前端直接`import { QueryDocument } from "@app/graphql"`, 爽！还支持React、Gatsby、NextJS、普通Web应用等，甚至集成好了Jest、Cypress、StoryBook等。
- [Lerna](https://github.com/lerna/lerna)，我用这个作为工程项目的Monorepo管理。
- [Yarn Workspace](https://yarn.bootcss.com/docs/workspaces/)，Yarn提供的Monorepo工具，有看到实践是用Lerna来管理版本，Yarn Workspace管理依赖。
- [PNPM](https://github.com/pnpm/pnpm)，实际上是包管理工具，但内置了Monorepo支持，我也在用这个（强烈安利），想要了解可以看看三元的这篇文章：[为什么现在我更推荐pnpm而不是 npm/yarn ？](https://mp.weixin.qq.com/s/aCS4Ku34nDe3A-WT5hdx7A)



## 一体化框架

一体化框架指的是， 你的前后端项目放在同一个repo里（后端是Node），同时前端直接调用在后端定义的方法，由框架在编译时去自动的把前端对后端的方法调用转换成HTTP请求。这是最近前端还挺火热的一个方向，主要的基于Node的一体化框架主要有这么几个：

- [BlitzJS](https://blitzjs.com/)，前端NextJS，后端Prisma，中间基于GraphQL，但是实际上你不会直接去参与GraphQL Schema的编写，不需要定义Resolver、ObjectType这些东西，因为BlitzJS内部用useQuery和useMutation抹掉了中间的调用过程（和Apollo的hooks类似但不完全相同，Apollo的useQuery接收的是GraphQL Document，BlitzJS中的则接收的是后端方法，其中会直接`db.entity.create()`这样去写数据库）。
- [RedwoodJS](https://redwoodjs.com/)，基于React + Prisma + GraphQL，整体类似于Blitz，但文档全面的多，最佳实践、测试、迁移、路线规划都有非常详细的介绍，甚至还介绍了框架名字的由来。但是由于暂时对TypeScript支持不是很好，所以我还没体验过。简单来说，它和BlitzJS一样都是在JAMStack这一理念上的革新者。
- [Midway-Hooks](https://github.com/alibaba/hooks)，[繁易](https://github.com/Lxxyx) 学长的作品，同样是淘系乃至阿里集团内广泛使用的框架。应该是三者中最适合国内场景的框架了，Serverless + Vue / React + Hooks，优势也不少：跨前端框架、跨Serverless平台、Hooks代码更好维护与复用、更符合直觉的API定义 （NextJS的[API Routes](https://nextjs.org/docs/api-routes/introduction)总感觉差了点什么）。





## 通用

- [RxJS](https://github.com/ReactiveX/rxjs)，ReactiveX实际上是一个“理念”，在各个语言都有相关的实现，如[RxDart](https://github.com/ReactiveX/rxdart) [RxJava](https://github.com/ReactiveX/RxJava) [RxPy](https://github.com/ReactiveX/RxPY) [RxGo](https://github.com/ReactiveX/RxGo) 等等，在对于异步的处理上是非常有帮助的一个库，但有一定的学习成本，比如海量的操作符与操作符组合，想要熟练的搭配出适合当前场景的操作符组合需要一定的使用经验，我也还在入门阶段。
  - [Redux-Observable](https://github.com/redux-observable/redux-observable)， Redux的RxJS中间件。
  - [Reactive.How](https://reactive.how/)，生动的展示RxJS Observable在操作符管道中的流动，入门期间使用有奇效。
- [NgRx](https://ngrx.io/)，很好用的Angular的状态管理方案，写法和Redux非常像，也是action >>> reducer >>> state，所以几乎可以没有什么成本的上手。秉承了Angular的思想，提供了一整套的集成：和Angular Router的集成：`@ngrx/router-store`；对于集合类型的适配：`@ngrx/entity`；副作用管理：`@ngrx/effects`，以及必不可少的schematics：`@ngrx/schematics`等，最大的优势是和RxJS的深度集成。
- E2E测试：[Cypress](https://github.com/cypress-io/cypress) / [PlayWright](https://github.com/microsoft/playwright)，说实话很少能看到业务项目有完备的单元测试和集成测试，更不要说E2E测试了，因为的确要花不少时间。但还是推荐了解一下，毕竟我个人是喜欢这种稳定性保障的工作的，并且看着一个个测试用例通过也很有成就感。
- [StoryBook](https://github.com/storybookjs/storybook)，UI组件的测试库，亮点在提供隔离的沙盒来为组件进行测试，支持大部分的Web框架。
- [Babel](https://github.com/babel/babel)，我下一个准备开始学习的方向之一，因为想通过Babel来简单了解一下前端世界中的AST。
- [Tailwind](https://tailwindcss.com/)，原子化CSS的集大成者，喜欢的人爱不释手。
- [Husky](https://github.com/typicode/husky)，快速配置Git Hooks，多人团队协作中确保规范的重要手段，通常会这样使用：`pre-commit`执行linter和prettier，`commit-msg`检查commit信息，`pre-push`构建、打tag、发包、运行测试等等。
- [LowDB](https://github.com/typicode/lowdb)，demo中常用的JSON数据库，亮点在使用Lodash的API来操作数据库。
- [JSON-Server](https://github.com/typicode/json-server)，写demo神器，从JSON文件快速得到一个REST API，和Husky、LowDB同一个作者。
- [TypeStack](https://github.com/typestack)，包括[Class-Validator](https://github.com/typestack/class-validator)（校验）、[Class-Transformer](https://github.com/typestack/class-transformer)（TS类与普通对象之间的转化、操作）、[TypeDI](https://github.com/typestack/typedi)（一个实现极简的依赖注入库）、[Routing-Controllers](https://github.com/typestack/routing-controllers)（装饰器路由）等一组TS工具库，均基于装饰器体系。
- [GenQL](https://genql.now.sh/docs)，从GraphQL Schema生成Query Builder，比较新所以还不怎么火，我挺看好这个库的。
- [GraphQL-Voyager](https://github.com/APIs-guru/graphql-voyager)，可视化你的GraphQL API，比如我的这个demo: [Voyager](http://voyager.linbudu.top/)。
- [Majestic](https://github.com/Raathigesh/majestic)，Jest的GUI，直观的查看你的测试用例。

- [scully](https://github.com/scullyio/scully)，Angular的静态页面生成框架（我原本以为会叫NgxtJS?）



以上就是我 **关注/接触/尝试/深度使用** 过的大部分框架与工具库了，如果你恰好学有余力又不知道该学啥，不妨就从这里找找感兴趣的，最后再打个广告，我所在的组（**阿里巴巴-淘系技术部-前端架构**）正在招**2022级的前端实习生**，如果你有兴趣或恰好知道身边有这样的同学，欢迎投递简历到我的邮箱：**linbudu@qq.com**。