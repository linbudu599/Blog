---
category: Source
tags:
  - Node
  - GraphQL
  - React
date: 2021-1-6
title: Next-Apollo 源码解析
---

## 前言

最近在搞GraphQL相关的东西, 发现社区里的东西真的五花八门, 玩都玩不过来, 举几个例子:

- 下一代ORM Prsima, 挺神奇的一个工具, "不仅仅是ORM", 和GraphQL倒不是强关联的, 但放一起就是异样的合拍.

- Apollo-Server-Vercel, 让你可以直接编写GraphQL API然后部署到Vercel Functions, 源码比较简单, 见[], 例子可以直接参见作者的demo.

- PostGraphile, 结合PostgreSQL和GraphQL的工具, 主要特点是直接抹消了GraphQL的N+1问题, 以及直接生成CRUD的mutation操作(简直amazing), 具体的特点由于我还没开始玩, 暂时不太清楚.

- BlitzJS, 这个框架我是在知乎上 [下一代前端框架会去解决什么问题?](https://www.zhihu.com/question/433673833) 的回答里看到的,  前端基于NextJS, 后端基于Prisma2的一个一体化开发框架, 很神奇的地方是直接把中间的GraphQL层隐藏掉了, 作者提供的useQuery和useMutation方法(不同于Apollo-Client的同名方法)直接隐藏掉了http请求调用的过程.

  > 关于一体化框架, 可以简单理解为, 在开发时前后端在同一个目录下, 前端直接从后端导入函数, 然后在构建时来进行剥离, 使得前端调用后端函数的行为变为http请求. 目前国内也有此类方案, 比如[淘系前端NodeJS架构组]的作品[Midway-Serverless]

- TypeGraphQL, 应该是GraphQL生态中我最喜爱的一样工具, 主要能力就是让你通过TypeScript装饰器的形式来定义GraphQL Schema, 并且提供了中间件/鉴权/拦截器等等能力, 有兴趣的同学可以看一看我写的这个Demo: [GraphQL-Explorer-Server](https://github.com/linbudu599/GraphQL-Explorer-Server)

- Next-Apollo, 就是本篇文章的主角, 使得你能够在NextJS应用中使用Apollo-Client. 如果你对于二者都不太了解也没关系, 在开始前我会简单介绍二者.



## Apollo-Client

[Apollo-GraphQL]是目前GraphQL NodeJS社区的中流砥柱之一, 他们的作品涵盖了几乎所有场景, 服务端框架Apollo-Server(包含Express/Koa/Hapi/Fastify等实现), 网关层Apollo-Federation, 前端React与Vue的集成(目前Apollo-Client只指React实现, Vue实现已经交由Vue社区维护, 见[Vue-Apollo](https://github.com/vuejs/vue-apollo)), 以及安卓/IOS客户端的对应实现, 甚至还包括一个GraphQL视图管理工具Apollo-Studio, 说Apollo撑起了GraphQL NodeJS社区的半边天也不为过.

> GraphQL的提出者FaceBook也有自己的GraphQL Client方案Relay, 但用起来有点繁琐...  

你可能会想, 为什么用GraphQL还需要前端用专门的client? 这东西不是后端改造就行了嘛? 前端直接 React/Vue 简简单单少点套路不好吗?

实际上你完全可以在前端只使用请求库如axios/swr/react-query等等来进行和GraphQL Server的通信, 这样是完全OK的, 但是这意味着, 你需要自己处理Apollo-Client开发中最重要的几个问题:

- 状态管理
- 缓存控制
- 本地的GraphQL(Local Schema)



前面两点都涉及到GraphQL的图式结构, 一个典型的GraphQL查询语句可能是这样的:

```gql
query UserQuery {
	User {
		UserProfile {
			name
			description
			level
			PreferItems {
				Book {
					bookId
					bookName
					bookPublishDate
				}
				Author {
					authorName
					AuthorWorks {
						bookName
						bookPublishDate
					}
				}
			}
		}
		UserOrders {
			commodityId
			commodityPrice
			commodityDate
			commodityType {
				isOnSale
				category
			}
		}
	}
}
```

> 你也可以阅读 [GitHub GraphQL API文档](https://docs.github.com/cn/free-pro-team@latest/graphql) 来了解更多复杂Schame架构

可以看到





## NextJS

关于NextJS, 应该很多人都使用过, 直接简单介绍下他的特性即可:

- 屏蔽了Webpack配置, 内置的配置已经经过一系列调优, 包括Babel和TSConfig, 代码分割等
- 服务端渲染SSR和静态页面生成SSG
- 约定式路由, 但如果是动态路由还是最好用自定义服务器来直出页面
- 支持自定义服务器集成, 可以换成任意你喜欢的NodeJS服务框架
- API路由, 这个特性在我最初使用NextJS的时候似乎并没有, 我是在BlitzJS的文档中看到才发现这个新功能的, 个人感觉用处主要是做BFF一类的, 因为虽然你能在这个前端项目中构建API, 但通常不会在这个纯前端项目中去连接数据库啥的, 如果你有这种需求, 还是用BlitzJS吧~ 也就说这里的API应该主要是调用已存在的后端服务, 裁剪/清洗/聚合后再返回给前端.



## Next-Apollo

知道了NextJS和Apollo-Client的作用后, Next-Apollo的出现也就理所当然了, NextJS对你的后端API没有任何要求, 如果恰好你的后端API是GraphQL, 那么此时再加上Apollo-Client无疑能够让你的开发更加畅快.

先简单看看如何使用:

> 完整例子见作者的 [Next-Apollo-Example](https://github.com/adamsoffer/next-apollo-example)

```javascript
// lib/apollo.js
import { withApollo } from "next-apollo";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const apolloClient = new ApolloClient({
  ssrMode: typeof window === "undefined",
  link: new HttpLink({
    uri: "https://your-graphql-server.com/graphql",
  }),
  cache: new InMemoryCache()
});

export default withApollo(apolloClient);
```

> 简单说一下选项:
>
> - link和HttpLink, 之所以设计成这样是因为你可以更自由的定制client与server之间的数据流, 比如使用多个不同职责的Link实例来传递数据, 以及为每个Link配置不同的请求头等信息.
> - cache和InMemoryCache, 缓存之所以这么重要, 就是因为我们上面说的GraphQL的特殊性. Apollo-Client提供的缓存是非常强大的, 包括读写缓存以及字段级别的缓存控制.
> - ssrMode, 我们知道NextJS的重要功能之一就是SSR, Apollo-Client的SSR主要侧重于避免冗余的对Server的查询操作, 以及启用`getDataFromTree`这一API, 关于SSR以及相关处理是Next-Apollo源码中的重要部分, 我们会在后面讲到.

可以看到withApollo实际上就是一个HOC即高阶组件, 它接收一个ApolloClient实例, 并且很明显的, 这个实例会是全局唯一的. 注意, 这里导出的`withApollo(apolloClient)`仍然是一个接收参数的高阶组件, 使用是这样的:

```JavaScript
// pages/index.js
import Main from "../lib/layout";
import Header from "../components/Header";
import Submit from "../components/Submit";
import PostList from "../components/PostList";
import withApollo from "../lib/apollo";

const Home = props => {
  return (
    <Main>
      <Header />
      <Submit />
      <PostList />
    </Main>
  );
};

export default withApollo({ ssr: true })(Home);
```

`<Header />` `<Submit />` `<PostList />` 组件内都可以直接调用Apollo-Client的useQuery和useMutation方法, 它们的缓存控制总线即是最初传入的ApolloClient实例, 以比较简单的`<PostList />`为例:

```JavaScript
import { gql, useMutation } from "@apollo/client";
import { Button } from "./styles";

const UPDATE_POST = gql`
  mutation votePost($id: String!) {
    votePost(id: $id) {
      id
      votes
      __typename
    }
  }
`;

export default function PostUpvoter({ id, votes }) {
  const [updatePost, { error, data }] = useMutation(UPDATE_POST, {
    variables: { id, votes: votes + 1 },
    optimisticResponse: {
      __typename: "Mutation",
      votePost: {
        __typename: "Post",
        id,
        votes: votes + 1
      }
    }
  });
  return <Button onClick={() => updatePost()}>{votes}</Button>;
}
```

这个组件比较简单, 并不涉及缓存相关的操作, 在`useMutation`中直接做了乐观响应处理.



接下来我们可以开始看看Next-Apollo的源码了, 源码其实只有一个两百多行的`withApollo.tsx`文件, 并且贴心的作者还仔细写了几十行注释. 所以看懂是没有啥压力的, 重点是作者的思路值得借鉴, 比如你可以试试用NuxtJS + Vue-Apollo 写一个 Nuxt-Apollo 这种.

从作为默认导出的`withApollo`函数开始:

```tsx
type ApolloClientParam =
  | ApolloClient<NormalizedCacheObject>
  | ((ctx?: NextPageContext) => ApolloClient<NormalizedCacheObject>);

export default function withApollo<P, IP>(ac: ApolloClientParam) {
  return ({ ssr = false } = {}) => (PageComponent: NextPage<P, IP>) => {
    const WithApollo = (pageProps: P & WithApolloOptions) => {
      let client: ApolloClient<NormalizedCacheObject>;
      if (pageProps.apolloClient) {
        client = pageProps.apolloClient;
      } else {
        client = initApolloClient(ac, pageProps.apolloState, undefined);
      }

      return (
        <ApolloProvider client={client}>
          <PageComponent {...pageProps} />
        </ApolloProvider>
      );
    };

    if (process.env.NODE_ENV !== "production") {
      const displayName =
        PageComponent.displayName || PageComponent.name || "Component";
      WithApollo.displayName = `withApollo(${displayName})`;
    }

    if (ssr || PageComponent.getInitialProps) {
      WithApollo.getInitialProps = async (ctx: ContextWithApolloOptions) => {
        const inAppContext = Boolean(ctx.ctx);
        const { apolloClient } = initOnContext(ac, ctx);

        let pageProps = {};
        if (PageComponent.getInitialProps) {
          pageProps = await PageComponent.getInitialProps(ctx);
        } else if (inAppContext) {
          pageProps = await App.getInitialProps(ctx);
        }

        if (typeof window === "undefined") {
          const { AppTree } = ctx;
          if (ctx.res && ctx.res.writableEnded) {
            return pageProps;
          }

          if (ssr && AppTree) {
            try {
              const { getDataFromTree } = await import(
                "@apollo/client/react/ssr"
              );
              let props;
              if (inAppContext) {
                props = { ...pageProps, apolloClient };
              } else {
                props = { pageProps: { ...pageProps, apolloClient } };
              }
              // @ts-ignore
              await getDataFromTree(<AppTree {...props} />);
            } catch (error) {
              console.error("Error while running `getDataFromTree`", error);
            }
            Head.rewind();
          }
        }

        return {
          ...pageProps,
          apolloState: apolloClient.cache.extract(),
          apolloClient: ctx.apolloClient,
        };
      };
    }

    return WithApollo;
  };
}
```

说实话, 我觉得这种

```tsx
export default function withApollo(){
  return (options) => (Component) => {
    const withApollo = (pageProps) => {
      return withApollo
    }
  }
}
```

函数直接套函数的代码可读性挺差的, 虽然真的很简洁, 但就是有一种诡异感觉. 将整体逻辑简化到这里, 就很容易明白其使用方式

```tsx
withApollo({ ssr: true })(Home)
```

代表的含义了.

这个函数代码可以分成这么几块:

```tsx
export default function withApollo(){
  return (options) => (PageComponent) => {
    const WithApollo = (pageProps) => {
      // ...
      return withApollo
    }
    
    if(process.env.NODE_ENV !== "production"){
      // ...
    }
    
    if(ssr | PageComponent.getInitialProps){
      WithApollo.getInitialProps = async (ctx) => {
        // ...
      }
    }
  }
}
```

拆开来看很容易理解各个部分:

```tsx
    type WithApolloOptions = {
      apolloClient: ApolloClient<NormalizedCacheObject>;
      apolloState: NormalizedCacheObject;
    };

		const WithApollo = (pageProps: P & WithApolloOptions) => {
      let client: ApolloClient<NormalizedCacheObject>;
      
      if (pageProps.apolloClient) {
        client = pageProps.apolloClient;
      } else {
        client = initApolloClient(ac, pageProps.apolloState, undefined);
      }

      return (
        <ApolloProvider client={client}>
          <PageComponent {...pageProps} />
        </ApolloProvider>
      );
    };
```

`WithApollo` 就像前面说的一样是个高阶组件, 它确保了当前这个页面被`<ApolloProvider >`包裹, 同时其传入了client.

这里的pageProps, 即是你的组件的属性. 注意这里的`pageProps.apolloClient`判断, 为true的情况发生在SSR的情况下, 因为此时apolloClient已经完成初始化被注入到页面属性中, 直接获取即可. false时发生在CSR阶段, 此时需要调用`initApolloClient`方法来创建client, 来看看这个方法:

```tsx
let globalApolloClient: ApolloClient<NormalizedCacheObject> | null = null;

type ApolloClientParam =
  | ApolloClient<NormalizedCacheObject>
  | ((ctx?: NextPageContext) => ApolloClient<NormalizedCacheObject>);

const initApolloClient = (
  acp: ApolloClientParam,
  initialState: NormalizedCacheObject,
  ctx: NextPageContext | undefined
) => {
  const apolloClient =
    typeof acp === "function"
      ? acp(ctx)
      : (acp as ApolloClient<NormalizedCacheObject>);

  if (typeof window === "undefined") {
    return createApolloClient(apolloClient, initialState, ctx);
  }

  if (!globalApolloClient) {
    globalApolloClient = createApolloClient(apolloClient, initialState, ctx);
  }

  return globalApolloClient;
};
```

在withApollo.tsx的第一行逻辑代码就是全局变量globalApolloClient的声明, 目的就是为了在客户端保持client唯一(不然在你切换页面时就会重新初始化client).

- 首先获取apolloClient
- 对于来自服务端的请求, 需要为每次请求创建一个新的client
- 对于客户端, 则直接使用当前已有的client(如果没有就先创建一个)

至于createApolloClient方法也很简单:

```tsx
const createApolloClient = (
  acp: ApolloClientParam,
  initialState: NormalizedCacheObject,
  ctx: NextPageContext | undefined
) => {
  const apolloClient =
    typeof acp === "function"
      ? acp(ctx)
      : (acp as ApolloClient<NormalizedCacheObject>);

  (apolloClient as ApolloClient<NormalizedCacheObject> & {
    ssrMode: boolean;
  }).ssrMode = Boolean(ctx);
  
  apolloClient.cache.restore(initialState);

  return apolloClient;
};
```

在这里去控制创建ApolloClient时的ssrMode属性, 同时使用initialState来写入当前client缓存.



withApollo的第二部分很简单, 就是判断是否在生产环境然后决定是否展示组件名:

```tsx
if (process.env.NODE_ENV !== "production") {
      const displayName =
        PageComponent.displayName || PageComponent.name || "Component";
      WithApollo.displayName = `withApollo(${displayName})`;
    }
```



最后一个部分:

```tsx
if (ssr || PageComponent.getInitialProps) {
      WithApollo.getInitialProps = async (ctx: ContextWithApolloOptions) => {
        const inAppContext = Boolean(ctx.ctx);
        const { apolloClient } = initOnContext(ac, ctx);

        let pageProps = {};
        if (PageComponent.getInitialProps) {
          pageProps = await PageComponent.getInitialProps(ctx);
        } else if (inAppContext) {
          pageProps = await App.getInitialProps(ctx);
        }

        if (typeof window === "undefined") {
          const { AppTree } = ctx;
          if (ctx.res && ctx.res.writableEnded) {
            return pageProps;
          }

          // Only if dataFromTree is enabled
          if (ssr && AppTree) {
            try {
              const { getDataFromTree } = await import(
                "@apollo/client/react/ssr"
              );

              let props;
              if (inAppContext) {
                props = { ...pageProps, apolloClient };
              } else {
                props = { pageProps: { ...pageProps, apolloClient } };
              }
              // @ts-ignore
              await getDataFromTree(<AppTree {...props} />);
            } catch (error) {
              console.error("Error while running `getDataFromTree`", error);
            }
            Head.rewind();
          }
        }

        return {
          ...pageProps,
          apolloState: apolloClient.cache.extract(),
          apolloClient: ctx.apolloClient,
        };
      };
    }
```



写不动了  改天再写

