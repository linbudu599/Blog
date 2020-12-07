---
category: Article
tags:
  - GraphQL
  - Apollo-Server
date: 2020-12-07
title: Apollo-Server-Vercel 源码浅析
---

> 直接讲解, 过渡 & 人话 & 介绍 & 总结 明天补上

总共就四个文件:

- index.ts 从 ApolloServer.ts 导出ApolloServer, 供使用`server.createHandler`
- ApolloServer.ts
- setHeaders.ts
- vercelApollo.ts



## ApolloServer.ts

> 先去掉了文件上传相关的代码实现

继承了`apollo-server`中导出的`ApolloServerBase`类, 然后实现了`createGraphQLServerOptions`与`createHandler`方法, 第一个:

```typescript
createGraphQLServerOptions(req: NowRequest, res: NowResponse): Promise<GraphQLOptions> {
    return super.graphQLServerOptions({ req, res });
  }
```

~~暂时没搞懂这是用来干啥的, 全局只有这个~~

文件上传相关的, 暂时跳过. `graphQLServerOptions`这个方法的作用是从对象中生成graphql options, 对象包括请求(`http.IncomingRequests`)以及特定实现的选项, 这里的选项应该是指像`Apollo-Server-Koa`中传入的选项那样, 因为这个方法定义在`Apollo-Server-Core`里面.

`createHandler`, 绝大部分是在处理cors...

首先生成一个空的Header类:

```typescript
// Headers 类来自于node-fetch
const corsHeaders = new Headers();
```

然后判断创建句柄(Handler)时是否传入了`cors`选项:

```typescript
 if (cors) {
      if (cors.methods) {
        // 设置 access-control-allow-methods字段
      }

      if (cors.allowedHeaders) {
       // 设置 access-control-allow-headers 字段
      }

      if (cors.exposedHeaders) {
       // 设置 access-control-expose-headers 字段
      }

      if (cors.credentials) {
        corsHeaders.set(`access-control-allow-credentials`, `true`);
      }
      if (typeof cors.maxAge === `number`) {
        corsHeaders.set(`access-control-max-age`, cors.maxAge.toString());
      }
    }
```

其实这里有个思路, 比如我实现一个`Apollo-Server-Koa-Vercel`, 那是不是可以用中间件的形式来配置cors就好了.

然后返回一个异步函数, 即`Vercel Functions`的规范:

```typescript
return async (req: NowRequest, res: NowResponse) => {
    // ...
}
```

内部, 首先使用上面的cors头字段来配置请求头:

```typescript
const requestCorsHeaders = new Headers(corsHeaders);
```

对`cors.origin`做处理:

```typescript 
if (cors && cors.origin) {
        const requestOrigin = req.headers.origin;
        if (typeof cors.origin === `string`) {
          requestCorsHeaders.set(`access-control-allow-origin`, cors.origin);
        } else if (
          requestOrigin &&
          (typeof cors.origin === `boolean` ||
            (Array.isArray(cors.origin) && requestOrigin && cors.origin.includes(requestOrigin as string)))
        ) {
          requestCorsHeaders.set(`access-control-allow-origin`, requestOrigin as string);
        }

        const requestAccessControlRequestHeaders = req.headers[`access-control-request-headers`];
        if (!cors.allowedHeaders && requestAccessControlRequestHeaders) {
          requestCorsHeaders.set(`access-control-allow-headers`, requestAccessControlRequestHeaders as string);
        }
      }
```

然后将其拼装为对象:

```typescript
  const requestCorsHeadersObject = Array.from(requestCorsHeaders).reduce<Record<string, string>>(
        (headersObject, [key, value]) => {
          headersObject[key] = value;
          return headersObject;
        },
        {}
      );
```

这一部分我的理解是对请求做处理, 这样在前端跨域调用faas的时候就不会被拦截了.

然后快速通过OPTIONS请求:

```typescript
if (req.method === `OPTIONS`) {
        setHeaders(res, requestCorsHeadersObject);
        return res.status(204).send(``);
      }

```

下面还对`req.url = '/.well-known/apollo/server-health'`这种情况做了处理, 这应该是Apollo的onHealthCheck相关的, 也跳过.

在最后一部分是对`graphql-playground`的处理:

```typescript
 if (this.playgroundOptions && req.method === `GET`) {
        const acceptHeader = req.headers.Accept || req.headers.accept;
        if (acceptHeader && acceptHeader.includes(`text/html`)) {
          const path = req.url || `/`;
          const playgroundRenderPageOptions: PlaygroundRenderPageOptions = {
            endpoint: path,
            ...this.playgroundOptions
          };

          setHeaders(res, {
            "Content-Type": `text/html`,
            ...requestCorsHeadersObject
          });
          return res.status(200).send(renderPlaygroundPage(playgroundRenderPageOptions));
        }
      }
```

这里的逻辑主要是判断出本次请求是在请求playground, 就渲染并返回

```typescript
          return res.status(200).send(renderPlaygroundPage(playgroundRenderPageOptions));
```

`renderPlaygroundPage`函数来自于`@apollographql/graphql-playground-html`包, 应该是类似express-graphql中对graphiql的处理.



## setHeaders.ts

这里导出了`setHeaders`方法, 在预检处理 onHealthCheck 还有playground的响应中都进行了调用, 先盲猜一手这个是设置响应头的, 因为调用方式是这样的:

```typescript
 setHeaders(res, {
            "Content-Type": `text/html`,
            ...requestCorsHeadersObject
          });
```

这个文件其实也很简单...

```typescript
import { NowResponse } from "@vercel/node"

export const setHeaders = (
  res: NowResponse,
  headers: Record<string, any>
): void => {
  for (const [name, value] of Object.entries(headers)) {
    res.setHeader(name, value)
  }
}
```

2333 这个猜不对感觉可以转行了

## VercelApollo.ts

这个文件应该是负责文件上传的, 暂时跳过



这样看下来可以魔改一个`koa`的实现啊!