---
category: Learning
tags:
  - Node
  - GraphQL
date: 2020-11-19
title: Express-GraphQL 源码解读
---

## 前言

最近在“认真”的学习 GraphQL，感觉自己之前学的还是太浅了，很多现在看来是核心特性的当时都不知道...，比如 Subscription 操作，还有 TypeGraphQL 的强大能力（等我再强一点一定要给这个项目做贡献！翻译文档也行！）等等。

会想着看这东西源码是因为目前似乎我能看懂的就这个，其他无论是 Apollo-Server 还是 TypeGraphQL 都是大项目，更别说原生 GraphQLJS 了，真的是一个巨巨巨巨大的项目。

现在还在做两件 GraphQL 相关的事情，[GraphQL-Explorer](https://github.com/linbudu599/GraphQL-Explorer) 和 [GraphQL-Lessons](https://github.com/linbudu599/GraphQL-Article-Examples)，前者熟悉各个相关生态（Apollo、TypeGraphQL、TypeORM、TypeStack 等等）的能力使用，后者在准备系列文章的同时也把基础打扎实。

不过话说回来，GraphQL 的学习成本这么低，真的需要系列教程吗...

## fieldResolver

与 TypeGraphQL 中的思路类似，但实际效果不同。如果指定了 fieldResolver，就相当于你要自己处理 resolver 和 field 的字段对应关系了，还有联合类型、嵌套类型的情况也需要自己处理。唯一的用处是一个兜底作用的 resolver，也就是你查询的字段没有对应的 resolver（但仍然必须在 schema 中定义），所以我觉得在使用 Express-GraphQL 的情况下，如果没有对兜底 resolver 的强烈需求，不要指定这个函数，不然真的太太太麻烦了。

TypeGraphQL 中的`@FieldResolver`是和`@Query` `@Mutation`平级的操作，通常是某个需要额外操作（计算/请求数据）的字段，通常会和`@Root`一起使用，后者用来注入整个查询对象，比如：

```typescript
class UserResolver {
  @FieldResolver()
  async spAgeField(
    @Root() user: User,
    @Arg("param", { nullable: true }) param?: number
  ): Promise<number> {
    // ... do sth addtional here
    return user.age;
  }
}
```

> 简单的情况也可以直接定义在`ObjectType`里面，见[field-resolver](https://typegraphql.com/docs/resolvers.html#field-resolvers)

但在这里的 fieldResolver 就有点麻烦了：

```typescript
{
  // ...
  fieldResolver: (src, args, context, info) => {
    const isUnionType = ['A', 'B'].includes(info.path.typename);
    const isNestedType = ['Nested', 'NestedAgain'].includes(
      info.path.typename,
    );
    if (info.fieldName in src && !isUnionType && !isNestedType) {
      return src[info.fieldName]();
    } else if (isUnionType) {
      return info.path.typename;
    } else if (isNestedType) {
      return src[info.fieldName];
    }
    return 'DEFAULT_RESOLVER_RESULT';
  },
}
```

- `src`即为传入的 rootValue 值（也就是 resolver 组）

- 联合类型（`Union Type`）会被处理两次，首次 src 值为 rootValue，第二次为本次联合类型子类型的值，注意，`typeResolver`会在中间被调用！可以看到这里的处理是判断为联合类型的情况，就直接返回这个值（也就是`info.path.typename`）。

  比如首次是:

  ```js
  {
    hello: [Function: hello],
    // 联合类型
    guess: [Function: guess],
    nest: [Function: nest]
  }
  ```

  第二次就是：`{ fieldB: 'bbb' }`

- 嵌套类型类似，也会被处理多次（次数和层级有关），并且在最后一级时`src`就包括了值，直接返回即可。

- 嵌套类型和联合类型这里都需要根据`info.path.typename`进行判断，确实很不优雅，所以不建议使用这个。

## typeResolver

和 Apollo 中一样，但 Apollo 中是和 Query 和 Mutation 同级的，放在 resolvers 选项中。

使用方式一样，根据 resolver 返回的值判断是属于哪个类型（通常是通过包含的字段来判断）。

```typescript
{
  typeResolver: (value, ctx, info, absType) => {
      return value.fieldA ? 'A' : 'B';
    },
}
```

- `absType`，即`AbstractType`，本次待解析的联合类型。

## 源码全流程解析

分为几个部分：

- 整体架构
- 参数解析
- 执行
- GraphiQL 响应

### 整体架构

先看看它是怎么被使用的：

```typescript
import express from "express";
import { buildSchema } from "graphql";

import { graphqlHTTP } from "../src";

const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

const rootValue = {
  hello: () => "Hello world!",
};

const app = express();

app.use(
  "/graphql",
  graphqlHTTP({
    schema,
    rootValue,
    graphiql: true,
  })
);
app.listen(4000);
```

很明显，`graphqlHTTP()`方法返回一个 Express 中间件函数(`(req, res, next) => {}`这样)，并且只在`/graphql`下生效。

它接收`schema`、`rootValue`、`graphiql`参数，这里只有`rootValue`可能会让你感到困惑，实际上你就把它理解为`resolvers`（Apollo 中的那样）就好了。

顺便把它能接受的参数都看看:

- schema
- context: 在所有 resolver（包括 typeResolver 和 fieldResolver）、extensions 的函数中共享的上下文。**不要在任意一个地方去修改它**
- rootValue: Apollo 中的 rootValue 和这里的完全不一样。Apollo 中此参数会被作为 resolvers 链的首个成员的 parent 参数（后续成员的 parent 参数则是上一级的 resolver 返回值）。
  > rootValue 是`{ [key:string]: Function }`的形式，它的函数只有三个参数（少了 parent）：`args` `context` `info`
- pretty: 是否格式化输出
- validationRules customValidateFn，schema 逻辑验证相关
- customExecuteFn: 这个有丶 🐂，直接覆盖原生 GraphQL 的`execute`方法
- customFormatErrorFn formatError: 错误处理相关
- customParseFn: 覆盖 GraphQL 的 SDL 解析函数
- extensions: 没啥好说的，就是原生`extensions`
- graphiql: 是否开启 GraphiQL 调试面板，没有 Apollo 的 playground 好用
  > Gatsby 的 GraphiQL 是在原生基础上增强的，提供了点击字段来添加到查询语句的能力
- fieldResolver 与 typeResolver 见上面的

入口方法:

> 接下来的逻辑大部分都在这个方法内

```typescript
export function graphqlHTTP(options: Options): Middleware {
  return async function graphqlMiddleware(
    request: Request,
    response: Response
  ): Promise<void> {};
}
```

首先配置参数：

```typescript
let params: GraphQLParams | undefined;
let showGraphiQL = false;
let graphiqlOptions;
// 这一方法来自于原生GraphQL导出
let formatErrorFn = formatError;
let pretty = false;
let result: ExecutionResult;
```

解析参数：`getGraphQLParams`方法

会把整个请求体塞进来解析、提取、格式化信息，最后返回能交给 GraphQLJS 处理的参数格式。
这里就是普通的请求处理逻辑

```typescript
params = await getGraphQLParams(request);

export async function getGraphQLParams(
  request: Request
): Promise<GraphQLParams> {
  const urlData = new URLSearchParams(request.url.split("?")[1]);
  const bodyData = await parseBody(request);

  // 查询语句
  let query = urlData.get("query") ?? (bodyData.query as string | null);
  if (typeof query !== "string") {
    query = null;
  }

  // 变量
  let variables = (urlData.get("variables") ?? bodyData.variables) as {
    readonly [name: string]: unknown;
  } | null;
  if (typeof variables === "string") {
    try {
      variables = JSON.parse(variables);
    } catch {
      throw httpError(400, "Variables are invalid JSON.");
    }
  } else if (typeof variables !== "object") {
    variables = null;
  }

  // 操作名称
  let operationName =
    urlData.get("operationName") ?? (bodyData.operationName as string | null);
  if (typeof operationName !== "string") {
    operationName = null;
  }

  // 原始信息
  const raw = urlData.get("raw") != null || bodyData.raw !== undefined;

  return { query, variables, operationName, raw };
}
```

请求解析：`parseBody`

```typescript
export async function parseBody(
  req: Request
): Promise<{ [param: string]: unknown }> {
  const { body } = req;
  //  contentType.parse(req.headers['content-type'])的简写
  // 解析结果包括type与parameters 如
  // 'image/svg+xml; charset=utf-8' -> { type: 'image/svg+xml', parameters: {charset: 'utf-8'} }
  const typeInfo = contentType.parse(req);

  // application/graphql似乎不是常用的MIME类型 官方文档也把这个说明移除了
  // 应当被appilication/json替代
  if (typeof body === "string" && typeInfo.type === "application/graphql") {
    return { query: body };
  }

  // 获取原始body内容，对不同的请求头使用不同的解析方式
  const rawBody = await readBody(req, typeInfo);
  switch (typeInfo.type) {
    case "application/graphql":
      return { query: rawBody };
    case "application/json":
      if (jsonObjRegex.test(rawBody)) {
        try {
          return JSON.parse(rawBody);
        } catch {
          // Do nothing
        }
      }
      // status error properties
      throw httpError(400, "POST body sent invalid JSON.");
    case "application/x-www-form-urlencoded":
      // parse(str) foo=bar&abc=xyz&abc=123 ->
      // {
      //   foo: 'bar',
      //   abc: ['xyz', '123']
      // }
      return querystring.parse(rawBody);
  }

  return {};
}
```

获取原始 body 内容：readBody

```typescript
async function readBody(
  req: Request,
  // {type:"xxx", parameters:"xxx"}
  typeInfo: ParsedMediaType
): Promise<string> {
  // 获取mime的chartset属性
  const charset = typeInfo.parameters.charset?.toLowerCase() ?? "utf-8";

  // Get content-encoding (e.g. gzip)
  // 内容编码格式 gzip deflate identity(没有对实体进行编码) ...
  // 服务器会依据此信息进行解压
  // 服务端返回未压缩的正文时 不允许返回此字段
  const contentEncoding = req.headers["content-encoding"];

  const encoding =
    typeof contentEncoding === "string"
      ? contentEncoding.toLowerCase()
      : // 这种情况是没有带上content-enconding头 也就是没有处理
        "identity";

  // 正文未压缩时直接读取正文长度
  const length = encoding === "identity" ? req.headers["content-length"] : null;
  const limit = 100 * 1024; // 100kb

  // 这个方法把请求解压后塞到流里
  const stream = decompressed(req, encoding);

  // 再从流里读出来请求体内容
  try {
    // charset 默认为utf-8 使用对应的content-encoding解码
    // length 流的长度 目标长度没有达到时会报400错误 默认为null 在编码identity时为content-length的值
    // limit 100kb body的字节数限定 如果body超出这个大小 会报413错误
    return await getBody(stream, { encoding: charset, length, limit });
  } catch (rawError) {
    const error = httpError(
      400,
      rawError instanceof Error ? rawError : String(rawError)
    );

    error.message =
      error.type === "encoding.unsupported"
        ? `Unsupported charset "${charset.toUpperCase()}".`
        : `Invalid body: ${error.message}.`;
    throw error;
  }
}

// 解压流
function decompressed(
  req: Request,
  encoding: string
): Request | Inflate | Gunzip {
  switch (encoding) {
    case "identity":
      return req;
    case "deflate":
      // readable.pipe(writable)
      return req.pipe(zlib.createInflate());
    case "gzip":
      return req.pipe(zlib.createGunzip());
  }
  throw httpError(415, `Unsupported content-encoding "${encoding}".`);
}
```

到这里已经 get 了本次请求的参数，并转化为了 GraphQL 能够解析的格式。

解析配置：

```typescript
// 有可能接收Promise类型或返回Promise类型的参数 这里就是简单地等待其执行完毕
// 比如TypeGraphQL的buildSchem默认就是异步的
const optionsData: OptionsData = await resolveOptions(params);

const schema = optionsData.schema;
const rootValue = optionsData.rootValue;
const validationRules = optionsData.validationRules ?? [];
// ... 类似的逻辑
```

判断请求方法：只支持 GET 和 POST 方法：

```typescript
if (request.method !== "GET" && request.method !== "POST") {
  throw httpError(405, "GraphQL only supports GET and POST requests.", {
    headers: { Allow: "GET, POST" },
  });
}
```

判断下是否要返回 GraphiQL（或者说通过 GraphiQL 进行数据返回） 这里在后面的专门部分讲

```typescript
const { query, variables, operationName } = params;

showGraphiQL = canDisplayGraphiQL(request, params) && graphiql !== false;
if (typeof graphiql !== "boolean") {
  graphiqlOptions = graphiql;
}

if (query == null) {
  if (showGraphiQL) {
    return respondWithGraphiQL(response, graphiqlOptions);
  }
  throw httpError(400, "Must provide query string.");
}
```

验证 schema 是否合法、解析 AST、验证 AST 是否合法，这里就不展示代码了。

> 自定义规则会和内置规则进行合并

对于请求方法为 GET 的情况再进行一次处理

> 只有 query 操作可以通过 GET 执行，但通常也不会使用

这里的逻辑主要是检测操作是否是除了 query 以外的类型，如果不是 query，就直接把 params 塞进 GraphiQL
返回，给请求者自己执行（在其中执行操作都是以 POST 请求）。

如果不能展示 GraphiQL，就报错

```typescript
// Only query operations are allowed on GET requests.
// GET请求只能走query操作，类似RESTFul规范
if (request.method === "GET") {
  // Determine if this GET request will perform a non-query.
  const operationAST = getOperationAST(documentAST, operationName);
  if (operationAST && operationAST.operation !== "query") {
    // If GraphiQL can be shown, do not perform this query, but
    // provide it to GraphiQL so that the requester may perform it
    // themselves if desired.
    // PUZZLE: 如果此时开启了GraphiQL选项 那么就把内容返回给GraphiQL 供请求者自己执行
    if (showGraphiQL) {
      return respondWithGraphiQL(response, graphiqlOptions, params);
    }

    // Otherwise, report a 405: Method Not Allowed error.
    throw httpError(
      405,
      `Can only perform a ${operationAST.operation} operation from a POST request.`,
      { headers: { Allow: "POST" } }
    );
  }
}
```

然后就是最最最重要的执行部分了，这里的代码反而很少，因为要么执行成功拿到结果，要么执行失败报错就完事了

类似的，`extension`处理起来也很简单。

```typescript
try {
  result = await executeFn({
    schema,
    document: documentAST,
    rootValue,
    contextValue: context,
    variableValues: variables,
    operationName,
    fieldResolver,
    typeResolver,
  });
} catch (contextError) {
  throw httpError(400, "GraphQL execution context error.", {
    graphqlErrors: [contextError],
  });
}

if (extensionsFn) {
  const extensions = await extensionsFn({
    document: documentAST,
    variables,
    operationName,
    result,
    context,
  });

  if (extensions != null) {
    result = { ...result, extensions };
  }
}
```

然后后面主要就是错误处理了，有几个地方还是需要注意一下：

```typescript
// 空数据表示运行时查询错误
if (response.statusCode === 200 && result.data == null) {
  response.statusCode = 500;
}

// 请求中可能带着错误，比如部分字段查询错误
const formattedResult: FormattedExecutionResult = {
  ...result,
  errors: result.errors?.map(formatErrorFn),
};

// 在能显示GraphiQL时通过其返回
if (showGraphiQL) {
  return respondWithGraphiQL(
    response,
    graphiqlOptions,
    params,
    formattedResult
  );
}
```

然后就可以返回请求了:

```typescript
if (!pretty && typeof response.json === "function") {
  response.json(formattedResult);
} else {
  const payload = JSON.stringify(formattedResult, null, pretty ? 2 : 0);
  sendResponse(response, "application/json", payload);
}

function sendResponse(response: Response, type: string, data: string): void {
  const chunk = Buffer.from(data, "utf8");
  response.setHeader("Content-Type", type + "; charset=utf-8");
  response.setHeader("Content-Length", String(chunk.length));
  response.end(chunk);
}
```

然后就 done~

#### GraphiQL

这个确实牛皮，比如`loadFileStaticallyFromNPM`这个方法，在返回的模板字符串里面直接执行：

核心还是来自于`graphiql`这个包，我还以为是写在里面的...

```typescript
export function renderGraphiQL(
  data: GraphiQLData,
  options?: GraphiQLOptions,
): string {
  // ...
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    /* graphiql/graphiql.css */
    ${loadFileStaticallyFromNPM('graphiql/graphiql.css')}
  </style>
  <script>
    // promise-polyfill/dist/polyfill.min.js
    ${loadFileStaticallyFromNPM('promise-polyfill/dist/polyfill.min.js')}
  </script>
  <script>
    // unfetch/dist/unfetch.umd.js
    ${loadFileStaticallyFromNPM('unfetch/dist/unfetch.umd.js')}
  </script>
  <script>
    // react/umd/react.production.min.js
    ${loadFileStaticallyFromNPM('react/umd/react.production.min.js')}
  </script>
  <script>
    // react-dom/umd/react-dom.production.min.js
    ${loadFileStaticallyFromNPM('react-dom/umd/react-dom.production.min.js')}
  </script>
  <script>
    // graphiql/graphiql.min.js
    ${loadFileStaticallyFromNPM('graphiql/graphiql.min.js')}
  </script>
</head>`

```

然后在这之间其实还进行了一些逻辑：

```typescript
// data 供渲染的数据
const queryString = data.query;
// 这里的变量与结果是用于呈现的
const variablesString =
  data.variables != null ? JSON.stringify(data.variables, null, 2) : null;
const resultString =
  data.result != null ? JSON.stringify(data.result, null, 2) : null;
const operationName = data.operationName;
const defaultQuery = options?.defaultQuery;
const headerEditorEnabled = options?.headerEditorEnabled;
```

返回的 html 中实际上包括了 JS：

```js
    var parameters = {};

    // 处理URL中的参数，比如在IQL加载时URL就带着query参数的
    window.location.search.substr(1).split('&').forEach(function (entry) {
      var eq = entry.indexOf('=');
      if (eq >= 0) {
        parameters[decodeURIComponent(entry.slice(0, eq))] =
          decodeURIComponent(entry.slice(eq + 1));
      }
    });

    // 组装成一次本地查询
    function locationQuery(params) {
      return '?' + Object.keys(params).filter(function (key) {
        return Boolean(params[key]);
      }).map(function (key) {
        return encodeURIComponent(key) + '=' +
          encodeURIComponent(params[key]);
      }).join('&');
    }


    var graphqlParamNames = {
      query: true,
      variables: true,
      operationName: true
    };

    var otherParams = {};
    for (var k in parameters) {
      if (parameters.hasOwnProperty(k) && graphqlParamNames[k] !== true) {
        otherParams[k] = parameters[k];
      }
    }
    var fetchURL = locationQuery(otherParams);


    // 负责获取数据的函数
    function graphQLFetcher(graphQLParams, opts) {
      return fetch(fetchURL, {
        method: 'post',
        headers: Object.assign(
          {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          opts && opts.headers,
        ),
        body: JSON.stringify(graphQLParams),
        credentials: 'include',
      }).then(function (response) {
        return response.json();
      });
    }

    function onEditQuery(newQuery) {
      parameters.query = newQuery;
      updateURL();
    }

    function onEditVariables(newVariables) {
      parameters.variables = newVariables;
      updateURL();
    }

    function onEditOperationName(newOperationName) {
      parameters.operationName = newOperationName;
      updateURL();
    }

    function updateURL() {
      history.replaceState(null, null, locationQuery(parameters));
    }

    // 渲染GraphiQL组件 好家伙！
    ReactDOM.render(
      React.createElement(GraphiQL, {
        fetcher: graphQLFetcher,
        onEditQuery: onEditQuery,
        onEditVariables: onEditVariables,
        onEditOperationName: onEditOperationName,
        query: ${safeSerialize(queryString)},
        response: ${safeSerialize(resultString)},
        variables: ${safeSerialize(variablesString)},
        operationName: ${safeSerialize(operationName)},
        defaultQuery: ${safeSerialize(defaultQuery)},
        headerEditorEnabled: ${safeSerialize(headerEditorEnabled)},
      }),
      document.getElementById('graphiql')
    );
```
