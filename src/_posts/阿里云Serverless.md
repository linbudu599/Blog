---
category: Learning
tags:
  - Other
date: 2020-4-12
title: 快速入门阿里云Serverless
---

## 前言

网络上`Serverless`相关的文章非常多, 但大部分是讲述其概念以及发展历程的, 光知道这些可没法说自己实践过`Serverless`. 还有, 我发现阿里云在这方面的案例也是少之又少, 大部分能找到的实操都是基于`Serverless Framework`与腾讯云的(**命令行微信扫码可太可爱了**), 让我感到一丝淡淡的忧伤. 这篇文章主要分为以下几个部分介绍`Serverless`与`Ali Cloud`的协作:

- 创建FaaS服务, 事件函数与HTTP函数
- 调用函数, 通过API/SDK, 冷启动优化
- 触发器, OSS/HTTP/API/时间等
- 进阶使用, 第三方依赖&伸缩控制等玩法

> ps: 我知道`Serverless`不止是FaaS, 但是BaaS好像并没有免费体验的功能, 略贵, 略贵:-(

官方文档虽然很详细, 但是我觉得可能不太适合我的思路, 即一个完整的使用周期讲述被拆分到多个目录下了, 需要这里瞅瞅那里翻翻.

## 创建基本的FaaS服务

> 官方提供了 **控制台**/**Fun**/**VS Code扩展**的方式来创建一个云函数, 这里只介绍后两者.

### 通过Fun创建云函数

安装

```bash
npm install @alicloud/fun -g
```

配置

```bash
fun config
```

依次配置:

- AccountID
- AccessKey ID
- Secret AccessKey
- Default Region Name

这些信息的获取请参考[官方文档-配置Fun](https://help.aliyun.com/document_detail/155100.html?spm=a2c4g.11186623.6.555.628c3ab6IihPvV)

选择一个模板来进行初始化

```bash
fun init
```

在这里主要有`event-`开头的 **事件函数** 以及 `http-trigger-`开头的 **HTTP函数**, 在这里选择`event-nodejs10`模板进行初始化

我们会得到以下两个主要文件:

```javascript
// index.js
module.exports.handler = function(event, context, callback) { 
  console.log('hello world');
  callback(null, 'hello world'); 
};
```

```yaml
# template.yml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  Serverless-Pratice:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: helloworld
    Serverless-Pratice:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: nodejs10
        CodeUri: ./
```

事件函数的入参包括: **事件** **上下文** **回调函数**

- 事件, 类型为Buffer, 是我们调用这个函数时传入的数据, 如果传入字符串类型也会被转为Buffer, 因为这个函数可能接收到文件类型参数.

- 上下文, 包含函数运行信息:

  在 `context` 中包含了以下信息：

  | 信息类型    | 信息类型说明                                                 |
  | ----------- | ------------------------------------------------------------ |
  | requestId   | 本次调用请求的唯一 ID，您可以把它记录下来在出现问题的时候方便查询。 |
  | function    | 当前调用的函数的一些基本信息，例如函数名、函数入口、函数内存和超时时间。 |
  | credentials | 函数计算服务通过扮演您提供的[服务角色](https://help.aliyun.com/document_detail/52885.html)获得的一组临时密钥，其有效时间是 6 小时。您可以在代码中使用 credentials 去访问相应的服务（ 例如 OSS ），这就避免了您把自己的 AK 信息写死在函数代码里。 |
  | service     | 当前调用的函数所在的 service 的信息，包含 service 的名字、接入的 SLS 的 logProject 和 logStore 信息、service 的版本信息、 qualifier 和 version_id。其中 qualifier 表示调用函数时指定的 service 版本或别名，version_id 表示实际调用的 service 版本。 |
  | region      | 当前调用的函数所在区域，例如 cn-shanghai。                   |
  | accountId   | 当前调用函数用户的阿里云 Account ID。                        |

  你可以使用`credentials`组中的密钥访问相应服务, 如`KeyId`/`KeySecret`/`securityToken`用于访问内网OSS服务.

- 回调函数, 返回调用函数的结果, 风格同NodeJS回调函数, 当正常运行时第一个参数(`err`)为null.



`template.yml`文件告知`fun`如何创建一个云函数.

主要关注 `Handler` / `RunTime` / `CodeUri` / `MemorySize` / `TimeOut` / `EnvironmentVariables` / `Event` 字段, 具体参见 [Serverless Application Model.](https://github.com/alibaba/funcraft/blob/master/docs/specs/2018-04-03-zh-cn.md?spm=a2c4g.11186623.2.22.772318b1pK8qjW&file=2018-04-03-zh-cn.md)

注意:

- `Handler`字段必须是`文件名.函数名`的形式
- `CodeUri`指明了函数文件的路径
- `EnvironmentVariables`字段用于注入环境变量



本地调试(需要安装并启动Docker), 还需要在Docker配置中开启共享磁盘.

```bash
fun local invoke <function name>
```



部署(上传到云)

```bash
fun deploy
```

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414134013.png)



### 通过VS Code插件创建云函数

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414134142.png)

安装后, 可以在 **活动栏** 中找到这个图标.

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414134243.png)

具体功能简单摸索即可掌握, 或者参见[使用VSCode插件创建函数](https://help.aliyun.com/document_detail/155679.html?spm=a2c4g.11186623.6.556.db4418b1cVVhJf)

(真的很简单, 就几个核心功能)

## 调用事件函数

现在把函数上传完成后, 就该琢磨怎么调用它了. 这里有一点要注意, 一个具体的函数是需要通过服务名与函数名定位的, 即函数被储存在服务单位下.

在控制台中可以很清楚的看到:

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414134556.png)

在控制台-概览的右上角, 你会看到几个调用时需要用到的信息:

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414134755.png)

接下来首先安装NodeJS版本的SDK:

```js
npm i @alicloud/fc2 -S
```



```js
const FCClient = require("@alicloud/fc2");

const client = new FCClient('<account id>', {
  accessKeyID: '<access key id>',
  accessKeySecret: '<access key secret>',
  region: '<region>',
});

const serviceName = "VsCode-FC-Test";
const funcName = "test";

(async function invokeCloudFunction() {
  try {
    const param = JSON.stringify({
      key: "value",
    });
    const res = await client.invokeFunction(serviceName, funcName, param);
    console.log("Invoke Function: %j", res);
  } catch (e) {
    console.log(e);
  }
})();
```

首先创建一个`FCClient`, 使用自己的信息进行初始化即可调用挂载在上面的各个API, 如这里调用了`invokeFunction()`, 并传入了 **服务名** & **函数名** & **入参**, 得到的结果:

```json
Invoke Function: {"headers":{"access-control-expose-headers":"Date,x-fc-request-id,x-fc-error-type,x-fc-code-checksum,x-fc-invocation-duration,x-fc-max-memory-usage,x-fc-log-result,x-fc-invocation-code-version","x-fc-request-id":"252f75b8-bc8e-432c-b1c9-cc8781e75538","date":"Tue, 14 Apr 2020 05:52:20 GMT","content-length":"0","content-type":"text/plain; charset=utf-8"},"data":""}
```

(这里不知道为什么不能正确返回入参, 待研究)

其中`data`字段即为函数返回的结果.

这样就完成了一次函数的调用. SDK不仅可以调用函数, 还可以创建/列举/更新/删除账号下的服务/函数/触发器. [完整API地址](https://help.aliyun.com/document_detail/52877.html).

## 事件函数-进阶

> 与OSS/云数据库等内网服务协作

在这一节开始前, 你需要先了解 **触发器** 的概念, 假设你并不想每次都去手动用SDK调用云函数, 而是想让特定事件发生时自动触发这个函数并依据配置&入参进行调用, 并返回结果. 以OSS触发器为例, 你可以设置在一张图片被用户上传到OSS存储桶时自动调用预先设定好的某个函数, 这个函数会下载本次上传的图片, 并进行处理后将结果存入另外一个存储桶. 这个过程完全不需要你手动进行任何一步.

### 触发器的基本信息

- `triggerName`, 触发器名称
- `triggerType`, 类型, 如oss/timer/http
- `sourceArn`, 资源描述符, 如上面的OSS触发器需要格式为 `acs:oss:region:accountId:bucketName`来正确获得权限与信息.
- `invocationRole`, 触发角色, 触发器事件源需要扮演一个角色来执行函数, 这个角色的权限关系到云函数的权限.
- `qualifier`, 别名/版本
- `triggerConfig`, 触发器配置信息 

### OSS触发器实例

> 本例设置当预设的存储桶指定目录下新增上传照片时, 打印本次信息

首先新建存储桶及`source`目录, 确保函数与存储桶地域相同, 否则无法设置触发器

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200416130428.png)

这样配置的事件即为**该存储桶的`/source`目录下有新文件对象变动时**, 触发该函数.

接下来我们写一个函数, 它能够将图片裁剪成指定尺寸, 并调用OSS的SDK新建一个目录存放结果.

```js
 'use strict';
 console.log('Loading function ...');
 var oss = require('ali-oss').Wrapper;
 var fs = require('fs');
 var jimp = require("jimp");
 module.exports.resize = function (eventBuf, ctx, callback) {
     console.log('Received event:', eventBuf.toString());
     var event = JSON.parse(eventBuf);
     var ossEvent = event.events[0];
     // Required by OSS sdk: OSS region is prefixed with "oss-", e.g. "oss-cn-shanghai"
     var ossRegion = "oss-" + ossEvent.region;
     // Create oss client.
     var client = new oss({
         region: ossRegion,
         // Credentials can be retrieved from context
         accessKeyId: ctx.credentials.accessKeyId,
         accessKeySecret: ctx.credentials.accessKeySecret,
         stsToken: ctx.credentials.securityToken
     });
     // Bucket name is from OSS event
     client.useBucket(ossEvent.oss.bucket.name);
     // Processed images will be saved to processed/
     var newKey = ossEvent.oss.object.key.replace("source/", "processed/");
     var tmpFile = "/tmp/processed.png";
     // Get object
     console.log('Getting object: ', ossEvent.oss.object.key)
     client.get(ossEvent.oss.object.key).then(function (val) {
         // Read object from buffer
         jimp.read(val.content, function (err, image) {
             if (err) {
                 console.error("Failed to read image");
                 callback(err);
                 return;
             }
             // Resize the image and save it to a tmp file
             image.resize(128, 128).write(tmpFile, function (err) {
                 if (err) {
                     console.error("Failed to write image locally");
                     callback(err);
                     return;
                 }
                 // Putting object back to OSS with the new key
                 console.log('Putting object: ', newKey);
                 client.put(newKey, tmpFile).then(function (val) {
                     console.log('Put object:', val);
                     callback(null, val);
                     return;
                 }).catch(function (err) {
                     console.error('Failed to put object: %j', err);
                     callback(err);
                     return
                 });
             });
         });
     }).catch(function (err) {
         console.error('Failed to get object: %j', err);
         callback(err);
         return
     });
 }; 
```

(上传第三方依赖请参见下一小节)

你可以在控制台中创建一个mock用的OSS事件源, 信息如下

```json
{
  "events": [
    {
      "eventName": "ObjectCreated:PutObject",
      "eventSource": "acs:oss",
      "eventTime": "2017-04-21T12:46:37.000Z",
      "eventVersion": "1.0",
      "oss": {
        "bucket": {
          "arn": "acs:oss:<region>:<accountID>:<bucket name>",
          "name": "<bucket name>",
          "ownerIdentity": "1946652474196584",
          "virtualBucket": ""
        },
        "object": {
          "deltaSize": 122539,
          "eTag": "688A7BF4F233DC9C88A80BF985AB7329",
          "key": "source/serverless.jpg",
          "size": 122539
        },
        "ossSchemaVersion": "1.0",
        "ruleId": "9adac8e253828f4f7c0466d941fa3db81161e853"
      },
      "region": "cn-hangzhou",
      "requestParameters": {
        "sourceIPAddress": "140.205.128.221"
      },
      "responseElements": {
        "requestId": "58F9FF2D3DF792092E12044C"
      },
      "userIdentity": {
        "principalId": "262561392693583141"
      }
    }
  ]
}
```

注意, 由于是mock事件源, 函数执行时不会获得`credentials`, 实际上不能正确执行. 你可以向OSS存储桶手动上传一张照片来测试函数.



### 上传第三方依赖

以上一小节的代码为例, 在handler中使用了`jimp`第三方包, 实际上在本地没有什么不同, 仍然是`fun init`后修改函数即可, 这时`fun deploy`会自动压缩代码并上传.

参见 [安装第三方依赖](https://help.aliyun.com/document_detail/74571.html?spm=a2c4g.11186623.6.615.436229111R1HsJ)



### CDN触发器

> 摸索中



### 定时触发器

- 配置

  ```json
  {
      payload:"payload"
      cronExpression: "cronExpression"
      enable: true|false
  }
  ```

  **payload**: 载荷

  **cronExpression**: 触发时间, 可为`@every`或者CRON标识(类似GitHub Actions的配置),  

  `@every Value Unit`:

  | Example                       | Expression   |
  | :---------------------------- | :----------- |
  | 每5分钟触发一次函数运行       | @every 5m    |
  | 每1.5小时触发一次函数运行     | @every 1.5h  |
  | 每2小时45分钟触发一次函数运行 | @every 2h45m |

  CRON表达式:

  `cron(Seconds Minutes Hours Day-of-month Month Day-of-week )`，即标准的cron表达式的形式

  > 注意：Cron以UTC时间运行，即北京时间减去8个小时

  | 字段名       | 允许的值        | 允许的特殊字符 |
  | :----------- | :-------------- | :------------- |
  | Seconds      | 0-59            |                |
  | Minutes      | 0-59            | , - * /        |
  | Hours        | 0-23            | , - * /        |
  | Day-of-month | 1-31            | , - * ？/      |
  | Month        | 1-12 or JAN-DEC | , - * /        |
  | Day-of-week  | 1-7 or SUN-SAT  | , - * ?        |

- 函数接收事件格式

  ```json
  {
      "triggerTime":"2018-02-09T05:49:00Z",
      "triggerName":"my_trigger",
      "payload":"awesome-fc"
  }
  ```

- 控制台创建, 比较简单

- 命令行工具Fun, 示例配置

  ```yaml
  ROSTemplateFormatVersion: '2015-09-01'
  Transform: 'Aliyun::Serverless-2018-04-03'
  Resources:
    FunDemo:
      Type: 'Aliyun::Serverless::Service'
      timedemo:
        Type: 'Aliyun::Serverless::Function'
        Properties:
          Handler: index.handler
          Runtime: nodejs8
          CodeUri: './'
        Events:
          TmTrigger:
            Type: Timer
            Properties: 
              Payload: "awesome-fc"
              CronExpression: "0 0 8 * * *"  # utc 时间，北京时间减8小时
              Enable: true
  ```

- 通过SDK创建

  > type: "timer"

  ### Trigger

  | Name                          | Description                                                  | Schema |
  | :---------------------------- | :----------------------------------------------------------- | :----- |
  | **invocationRole** *required* | event source，如OSS，使用该role去invoke function **Example** : `"acs:ram::1234567890:role/fc-test"` | string |
  | **sourceArn** *required*      | event source的Aliyun Resource Name（ARN） **Example** : `"acs:oss:cn-shanghai:12345:mybucket"` | string |
  | **triggerConfig** *required*  | trigger配置，针对不同的trigger类型，trigger配置会有所不同    | object |
  | **triggerName** *required*    | trigger名称 **Example** : `"image_resize"`                   | string |
  | **triggerType** *required*    | trigger类型 **Example** : `"oss"`                            | string |
  | **qualifier** *optional*      | service版本 **Example** : `"LATEST"`                         | string |



## 创建并触发HTTP函数

> 我觉得可以把HTTP函数理解为类似于Express/Koa这样的Web应用模块, 在我们完成编写并部署到云上后, 只要设置好函数对应的HTTP触发器, 即可直接处理对应的HTTP请求.
>
> 这里提到的HTTP触发器, 你可以这样理解: 当你向某个配置好的域名发送了一个请求, 它会触发事先配置好的函数(有可能与路径/方法对应), 由这个函数将计算结果返回给你.

HTTP函数的创建过程与事件函数类似, 它也有对应的模板(以`http-trigger-`开头)

[详细文档-NodeJS HTTP函数](https://help.aliyun.com/document_detail/74757.html?spm=a2c4g.11186623.6.562.53ea3043B2zvNs)

**index.js**

```js
const getRawBody = require('raw-body');

module.exports.handler = function(req, resp, context) {
    console.log('hello world');

    const params = {
        path: req.path,
        queries: req.queries,
        headers: req.headers,
        method : req.method,
        requestURI : req.url,
        clientIP : req.clientIP,
    }
        
    getRawBody(req, function(err, body) {
        resp.setHeader('content-type', 'text/plain');

        for (let key in req.queries) {
          let value = req.queries[key];
          resp.setHeader(key, value);
        }
        params.body = body.toString();
        resp.send(JSON.stringify(params, null, '    '));
    }); 
}
```

(注意, 由于函数需要兼容HTTP请求, 因此没有提供额外的`body`字段, 需要使用第三方包来进行获取)

**template.yml**

```yaml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  http:
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: 'helloworld'
    http:
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: nodejs10
        CodeUri: './'
      Events:
        httpTrigger:
          Type: HTTP
          Properties:
            AuthType: ANONYMOUS
            Methods: ['POST', 'GET']
```



HTTP函数不同于事件函数, 它没有必要使用SDK进行调用, 而是直接访问HTTP触发器来进行调用. 如这个网址: https://1946652474196584.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/http/http/ (由于是系统提供的域名, 直接在浏览器访问会拉起下载, 建议使用`POSTMan`等工具 )

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414141201.png)

你也可以在 **控制台-服务-函数-<服务名>-<函数名>-代码执行** 中进行调用并配置触发器.

## 迁移Next.js项目

> Fun脚手架还提供了一个功能, 即将非使用fun初始化的项目配置为可被部署的云的项目, 包括Express项目与Koa项目, 甚至还包含Next.js项目

```bash
npm init next-app
cd <folder>
npm run build
```

完成编译后, 运行

```bash
fun deploy
```

重点看一下初始化得到`template.yml`文件

```yaml
ROSTemplateFormatVersion: '2015-09-01'
Transform: 'Aliyun::Serverless-2018-04-03'
Resources:
  my-app: # service name
    Type: 'Aliyun::Serverless::Service'
    Properties:
      Description: This is FC service
      LogConfig: Auto
    my-app: # function name
      Type: 'Aliyun::Serverless::Function'
      Properties:
        Handler: index.handler
        Runtime: custom
        CodeUri: ./
        MemorySize: 1024
        InstanceConcurrency: 5
        Timeout: 120
      Events:
        httpTrigger:
          Type: HTTP
          Properties:
            AuthType: ANONYMOUS
            Methods: ['GET', 'POST', 'PUT']
  Domain:
    Type: Aliyun::Serverless::CustomDomain
    Properties:
      DomainName: Auto
      Protocol: HTTP
      RouteConfig:
        Routes:
          "/*":
            ServiceName: my-app
            FunctionName: my-app
  
```



关注 **Domain-Properties-RouteConfig-Routes** 属性, **在这里配置你的域名路径与对应的处理函数**. 以上面的配置为例, `/*`形式的域名会被交由`my-app`服务下的`my-app`函数处理.



![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414142119.png)



然后你就可以访问临时域名来查看效果了. 重点讲一下自定义域名, 首先在云解析中配置CNAME,

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414142226.png)

然后在函数计算-自定义域名中进行配置:

![](https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/TIM截图20200414142548.png)

然后即可使用[自定义域名](http://serverless-next.linbudu.top/)访问服务了.

> HTTPS待更新



## 监控报警

> 待更新

## 场景案例

> 待更新

## FaaS机理

> 来自[秦粤老师的Serverless课程](https://time.geekbang.org/column/article/227454)

![](https://static001.geekbang.org/resource/image/08/fd/084b55574ca1588097383571c57c1dfd.png)

用户第一次访问HTTP触发器(域名), 触发器会 **Hold** 住用户的HTTP请求, 并产生一个HTTP Request, 通知函数服务. 函数服务检查是否有闲置的函数实例(这里有点好奇, 闲置指的是这个实例刚处理完上一个用户的还未被销毁?), 如果没有就去代码仓库拉取函数代码, 初始化并启动一个函数示例, 执行这个函数, 用请求(HTTP Request)作为入参去执行函数.

再执行完毕后, 会将HTTP Response返回函数触发器, 再由触发器返回给客户端.



![](https://static001.geekbang.org/resource/image/53/28/53d9831798509d2b8cd66e1714ab8428.png)

> 现在的云服务商，基于不同的语言特性，冷启动平均耗时基本在 100～700 毫秒之间。得益于 Google 的 JavaScript 引擎 Just In Time 特性，Node.js 在冷启动方面速度是最快的。

FaaS从0开始启动并执行完一个函数, 只需要100毫秒, 所以敢缩容到0.

> 云服务商还会不停地优化自己负责的部分，毕竟启动速度越快对资源的利用率就越高，例如冷启动过程中耗时比较长的是下载函数代码。所以一旦你更新代码，云服务商就会偷偷开始调度资源，下载你的代码构建函数实例的镜像。请求第一次访问时，云服务商就可以利用构建好的缓存镜像，直接跳过冷启动的下载函数代码步骤，从镜像启动容器，这个也叫预热冷启动。所以如果我们有些业务场景对响应时间比较敏感，我们就可以通过预热冷启动或预留实例策略[1]，加速或绕过冷启动时间

![img](https://static001.geekbang.org/resource/image/a8/69/a82eef4cb307dfe42040ffb7d4852a69.png)

FaaS的俩种模型

- 用完即毁型：函数实例准备好后，执行完函数就直接结束。这是 FaaS 最纯正的用法。
- 常驻进程型：函数实例准备好后，执行完函数不结束，而是返回继续等待下一次函数被调用。这里需要注意，即使 FaaS 是常驻进程型，如果一段时间没有事件触发，函数实例还是会被云服务商销毁。

![img](https://static001.geekbang.org/resource/image/84/20/84a81773202e2599474f9c9272a65d20.png)

常驻进程型适用于迁移传统MVC架构

> 而在 FaaS 常驻进程型模式下，首先我们要改造一下代码，Node.js 的 Server 对象采用 FaaS Runtime 提供的 Server 对象；然后我们把监听端口改为监听 HTTP 事件；启动 Web 服务时，主进程初始化连接 MongoDB，初始化完成后，持续监听 HTTP 事件，直到被云服务商控制的父进程关闭回收。



基于Serverless的BFF: Serverless For Frontend

> 前端的一个数据请求过来，函数触发器触发我们的函数服务；我们的函数启动后，调用后端提供的元数据接口，并将返回的元数据加工成前端需要的数据格式；我们的 FaaS 函数完全就可以休息了。具体如下图所示。

![img](https://static001.geekbang.org/resource/image/43/4b/43d5ae274d0169bbc0cc4aece791054b.png)