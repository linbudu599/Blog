---
category: Learning
tags:
  - GraphQL
date: 2021-5-29
title: 你不知道的GraphQL Directives
---

这篇文章来自数月前的随手记录，由于觉得内容较为小众（GraphQL接触的人已经不多了，其中的Directive了解的人更少）就没有发出来。这次心血来潮炒个冷饭。实际上我一直很想出一系列GraphQL的文章，涵盖入门到实战再到原理，奈何一直没有动力，也许要到今年入职以后才会尝试开始吧。


## 基本定义

GraphQL Directives是被注入到(或者说书写在)GraphQL Schema中的特殊语法，以`@`开头，例如：

```gql
directive @camelCase on FIELD_DEFINITION
directive @date(format: String = "DD-MM-YYYY") on FIELD_DEFINITION
directive @auth(
  requires: Role = ADMIN，
) on OBJECT | FIELD_DEFINITION

enum Role {
  ADMIN
  REVIEWER
  USER
  UNKNOWN
}

query {
  user @auth(requires: LOGIN){
    name
    date @formatDate(template: "YYYY-MM-DD")
    desc @camelCase
  }
}
```

它可以携带参数(如`@auth(requires: LOGIN)`)，也可以直接调用(如`@camelCase`)。对于这两种指令的区分是在实现时就已经确定了的，比如格式化日期的指令formatDate，既可以`@formatDate`，也可以`@formatDate(template: "YYYY-MM-DD")`。 在指令实现中，只需要指定一个默认参数即可，如

```typescript
const { format = defaultFormat } = this。args;
```

### 源码定义

GraphQL Directives在源码中的定义:

```typescript
export class GraphQLDirective {
  name: string;
  description: Maybe<string>;
  locations: Array<DirectiveLocationEnum>;
  isRepeatable: boolean;
  args: Array<GraphQLArgument>;
  extensions: Maybe<Readonly<GraphQLDirectiveExtensions>>;
  astNode: Maybe<DirectiveDefinitionNode>;

  constructor(config: Readonly<GraphQLDirectiveConfig>);

  toConfig(): GraphQLDirectiveConfig & {
    args: GraphQLFieldConfigArgumentMap;
    isRepeatable: boolean;
    extensions: Maybe<Readonly<GraphQLDirectiveExtensions>>;
  };

  toString(): string;
  toJSON(): string;
  inspect(): string;
}

export interface GraphQLDirectiveConfig {
  name: string;
  description?: Maybe<string>;
  locations: Array<DirectiveLocationEnum>;
  args?: Maybe<GraphQLFieldConfigArgumentMap>;
  isRepeatable?: Maybe<boolean>;
  extensions?: Maybe<Readonly<GraphQLDirectiveExtensions>>;
  astNode?: Maybe<DirectiveDefinitionNode>;
}
```

大概解释一下各个参数:

- name 指令名，也就是最终在schema中使用的名字
- description 功能描述
- locations 指令生效区域:

  ```typescript
  export const DirectiveLocation: {
    // Request Definitions
    // "根级别"
    QUERY: 'QUERY';
    MUTATION: 'MUTATION';
    SUBSCRIPTION: 'SUBSCRIPTION';
    FIELD: 'FIELD';
    FRAGMENT_DEFINITION: 'FRAGMENT_DEFINITION';
    FRAGMENT_SPREAD: 'FRAGMENT_SPREAD';
    INLINE_FRAGMENT: 'INLINE_FRAGMENT';
    VARIABLE_DEFINITION: 'VARIABLE_DEFINITION';
  
    // Type System Definitions
    // 各种类型中的级别
    SCHEMA: 'SCHEMA';
    SCALAR: 'SCALAR';
    OBJECT: 'OBJECT';
    FIELD_DEFINITION: 'FIELD_DEFINITION';
    ARGUMENT_DEFINITION: 'ARGUMENT_DEFINITION';
    INTERFACE: 'INTERFACE';
    UNION: 'UNION';
    ENUM: 'ENUM';
    ENUM_VALUE: 'ENUM_VALUE';
    INPUT_OBJECT: 'INPUT_OBJECT';
    INPUT_FIELD_DEFINITION: 'INPUT_FIELD_DEFINITION';
  };
  
  export type DirectiveLocationEnum = typeof DirectiveLocation[keyof typeof DirectiveLocation];
  
  ```
### 基于GraphQL-Tools操作指令

  在GraphQL-Tools中，使用了一系列`VisitXXX`方法来达到这个效果，如:
  ```typescript
  import { SchemaDirectiveVisitor } from "graphql-tools";
  
  export class DeprecatedDirective extends SchemaDirectiveVisitor {
    visitSchema(schema: GraphQLSchema) {}
    visitObject(object: GraphQLObjectType) {}
    visitFieldDefinition(field: GraphQLField<any， any>) {}
    visitArgumentDefinition(argument: GraphQLArgument) {}
    visitInterface(iface: GraphQLInterfaceType) {}
    visitInputObject(object: GraphQLInputObjectType) {}
    visitInputFieldDefinition(field: GraphQLInputField) {}
    visitScalar(scalar: GraphQLScalarType) {}
    visitUnion(union: GraphQLUnionType) {}
    visitEnum(type: GraphQLEnumType) {}
    visitEnumValue(value: GraphQLEnumValue) {}
    
    // 还有三个静态方法
    // getDirectiveDeclaration
    // implementsVisitorMethod
    // visitSchemaDirectives
  }
  ```

  这里的11个方法对应着`DirectiveLocation`中的11种类型级别定义(根级别的是GraphQL运行时内置使用的)

- args，这里是一个k-v的map，类型定义如下:

  ```typescript
  export interface GraphQLFieldConfigArgumentMap {
    [key: string]: GraphQLArgumentConfig;
  }
  export interface GraphQLArgumentConfig {
    description?: Maybe<string>;
    type: GraphQLInputType;
    defaultValue?: any;
    deprecationReason?: Maybe<string>;
    extensions?: Maybe<Readonly<GraphQLArgumentExtensions>>;
    astNode?: Maybe<InputValueDefinitionNode>;
  }
  ```

  定义了参数相关的配置。

  注意，这里的`deprecationReason`应该是参数的废弃原因说明，因为我发现只有`GraphQLField`等少数类型上有`isDeprecated`和`deprecationReason`，也就是只有`visitFieldDefinition`等少数方法(`GraphQLField`是此方法的参数之一)可以废弃掉字段(毕竟不能废弃掉整个对象类型甚至整个schema吧)

  也可以看一下GraphQL内置指令`@include`中的实现:

  ```javascript
  export const GraphQLIncludeDirective = new GraphQLDirective({
    name: 'include'，
    description:
      'Directs the executor to include this field or fragment only when the `if` argument is true。'，
    locations: [
      DirectiveLocation。FIELD，
      DirectiveLocation。FRAGMENT_SPREAD，
      DirectiveLocation。INLINE_FRAGMENT，
    ]，
    args: {
      if: {
        type: new GraphQLNonNull(GraphQLBoolean)，
        description: 'Included when true。'，
      }，
    }，
  });
  ```

  这里的`args。if`就是参数~

  > 我本来想顺便看看内置指令是怎么解析的，但搜`include`没找到相关代码

- isRepeatable，指令是否可以重复，同一location上能否有多个同名指令。

- extensions，指令扩展信息，修改这个参数不会反馈到响应的extensions中。

- astNode，指令最终生成的ast节点信息。

## 实际应用

### 变更resolver

指令最重要的作用就是在运行时动态的去修改返回的数据格式，包括值以及字段结构等都能改变，举例来说，在`visitFieldDefinition`方法中，我们可以直接修改`field。resolve`方法，来修改字段的解析结果，如:

```typescript
export class DateFormatDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any， any>) {
    const { resolve = defaultFieldResolver } = field;
    const { format = defaultFormat } = this。args;

    field。resolve = async (。。。args) => {
      console。log(
        `@date invoked on ${args[3]。parentType}。${args[3]。fieldName}`
      );
      const date = await resolve。apply(this， args);
      return DateFormatter(date， format);
    };

    field。type = GraphQLString;
  }
}
```

> 在这个例子中我们格式化了返回的Date格式，由于Date并非内置的标量格式，一部分三方库提供的DateScalarType通常会把Date解析为时间戳，也就是Int类型，因此在这里如果修改为"2021-02-06"的格式，就需要修改字段类型来防止出错。

field上还存在一些关键信息，如`subscribe`(订阅操作的解析函数)，以及`extensions`(这里应该就是字段附加的扩展了?)等等。

在GraphQLObject(即`visitObject`方法的参数)上，我们甚至可以拿到这个对象类型的所有字段(getFields)以及其实现的接口(getInterfaces)等等(其实字段级别的指令也能够访问父级类型，field。objectType即可)，完全可以说是为所欲为。

### 实战：@auth指令

指令还有个重要作用就是类似TS装饰器的元数据功能，一个装饰器添加元数据，执行顺序靠后的装饰器收集元数据来使用(就像类装饰器中可以拿到方法/属性/参数装饰器添加的元数据)，比如`@auth`指令，实际上就是拿到当前对象类型的所有字段上定义的所需权限，比对用户权限(通常存放在resolve的context参数中)，判断是否放行。

```typescript
export const enum AuthDirectiveRoleEnum {
  ADMIN，
  REVIEWER，
  USER，
  UNKNOWN，
}

type AuthEnumMembers = keyof typeof AuthDirectiveRoleEnum;

type AuthGraphQLObjectType = GraphQLObjectType & {
  _requiredAuthRole: AuthEnumMembers;
  _authFieldsWrapped: boolean;
};

type AuthGraphQLField<T， K> = GraphQLField<T， K> & {
  _requiredAuthRole: AuthEnumMembers;
};

const getUser = async (token: string): Promise<AuthEnumMembers[]> => {
  return ["USER"];
};

export class AuthDirective extends SchemaDirectiveVisitor {
  visitObject(type: AuthGraphQLObjectType) {
    console。log(`@auth invoked at visitObject ${type。name}`);
    this。ensureFieldsWrapped(type);
    type。_requiredAuthRole = this。args。requires;
  }

  visitFieldDefinition(
    field: AuthGraphQLField<any， any>，
    details: {
      objectType: AuthGraphQLObjectType;
    }
  ) {
    console。log(`@auth invoked at visitFieldDefinition ${field。name}`);

    this。ensureFieldsWrapped(details。objectType);
    field。_requiredAuthRole = this。args。requires;
  }

  ensureFieldsWrapped(objectType: AuthGraphQLObjectType) {
    if (objectType。_authFieldsWrapped) return;
    objectType。_authFieldsWrapped = true;

    const fields = (objectType。getFields() as unknown) as AuthGraphQLField<
      any，
      any
    >[];

    Object。keys(fields)。forEach((fieldName) => {
      const field = fields[fieldName] as AuthGraphQLField<any， any>;
      const { resolve = defaultFieldResolver } = field;
      field。resolve = async (。。。args) => {
        const requiredRole =
          field。_requiredAuthRole || objectType。_requiredAuthRole;

        console。log("requiredRole: "， requiredRole);

        if (!requiredRole) {
          return resolve。apply(this， args);
        }

        // const context = args[2];
        // const userRoles = await getUser(context?。headers?。authToken ?? "");

        // if (!userRoles。includes(requiredRole)) {
        //   throw new Error("not authorized");
        // }

        return resolve。apply(this， args);
      };
    });
  }

  public static getDirectiveDeclaration(
    directiveName: string，
    schema: GraphQLSchema
  ): GraphQLDirective {
    console。log(directiveName);
    const previousDirective = schema。getDirective(directiveName);
    console。log("previousDirective: "， previousDirective);
    if (previousDirective) {
      previousDirective。args。forEach((arg) => {
        if (arg。name === "requires") {
          arg。defaultValue = "REVIEWER";
        }
      });

      return previousDirective;
    }

    return new GraphQLDirective({
      name: directiveName，
      locations: [DirectiveLocation。OBJECT， DirectiveLocation。FIELD_DEFINITION]，
      args: {
        requires: {
          type: schema。getType("AuthDirectiveRoleEnum") as GraphQLEnumType，
          defaultValue: "USER"，
        }，
      }，
    });
  }
}
```

这里有不少细节:

- `@auth`既可以放在field，也可以放在objectType上，当一个对象类型被标记后，由于它包含的字段在解析时依赖的也是对象类型的元数据，因此不会重复标记而是直接使用。

- `getDirectiveDeclaration`这个方法通常使用在Schema被多人添加过指令，这个时候你不能确定你所添加的指令是否已经存在了。 那么你就需要使用这个方法显式的声明最终生成的指令。

  - 如果指令已经存在，比如这里的`@auth`，但是可能你需要使用的参数默认值或者其他信息变化了，又不想把每个schema中的指令都找出来改一遍，只要直接在这里修改参数信息即可。

    ```typescript
     if (previousDirective) {
          previousDirective。args。forEach((arg) => {
            if (arg。name === "requires") {
              arg。defaultValue = "REVIEWER";
            }
          });
          return previousDirective;
        }
    ```

  - 否则，你应该返回一个全新的指令实例(当然这完全不是必须的，`SchemaDirectiveVisitor`方法会自动生成)

    ```typescript
    return new GraphQLDirective({
          name: directiveName，
          locations: [DirectiveLocation。OBJECT， DirectiveLocation。FIELD_DEFINITION]，
          args: {
            requires: {
              type: schema。getType("AuthDirectiveRoleEnum") as GraphQLEnumType，
              defaultValue: "USER"，
            }，
          }，
        });
    ```

    由于这里实际上是使用的原生GraphQL方法，所以需要直接使用其内部的相关API比如`DirectiveLocation`等等。

- 这里的`AuthDirectiveRoleEnum`实际上我们已经通过`TypeGraphQL。registerEnum`注册过了，但还需要确保Schema中使用了这个枚举，它才会被添加到生成的Schema中。

  而且，如果为了确保类型的可靠，还需要重新写一遍这个Enum。

  ```typescript
  export const enum AuthDirectiveRoleEnum {
    ADMIN，
    REVIEWER，
    USER，
    UNKNOWN，
  }
  
  type AuthEnumMembers = keyof typeof AuthDirectiveRoleEnum;
  
  type AuthGraphQLObjectType = GraphQLObjectType & {
    _requiredAuthRole: AuthEnumMembers;
    _authFieldsWrapped: boolean;
  };
  
  type AuthGraphQLField<T， K> = GraphQLField<T， K> & {
    _requiredAuthRole: AuthEnumMembers;
  };
  ```

 **因为常量枚举不能被作为参数传给注册函数。**



TypeGraphQL由于是用TypeScript的Class和Decorator来书写GraphQL Schema，因此必然没有原生的SDL那么自由，比如没法将枚举应用在联合类型（Union）、枚举、枚举值上。 这一点估计要等作者着手解决这个问题，比如在registerEnum的选项中新增指令相关的配置。

### 实战：@fetch

当GraphQL API涉及到第三方的DataSource时（如作为BFF），一种方案是采用类似Apollo-DataSource的库，将第三方的数据源相关获取方法挂载到Context中，然后由resolver负责调用。另一种方案就是使用指令，因为前面也提到了，指令能够动态的修改resolver的执行逻辑。

`@fetch`的实现也较为简单，拿到参数中的url，调用fetch方法即可。通常情况下这一指令只能用来实现较为简单的请求逻辑，因此并不推荐大面积使用。

```typescript
import { defaultFieldResolver， GraphQLField } from "graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import fetch from "node-fetch";

export class FetchDirective extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any， any>) {
    const { resolve = defaultFieldResolver } = field;
    const { url } = this。args;
    field。resolve = async (。。。args) => {
      const fetchRes = await fetch(url);
      console。log(
        `@fetch invoked on ${args[3]。parentType}。${args[3]。fieldName}`
      );
      console。log(`Fetch Status: ${fetchRes。status}`);
      const result = await resolve。apply(this， args);
      return result;
    };
  }
}
```

### 实战：字符串处理指令

字符串相关的指令是最广泛使用的类型之一，如Uppercase、Lowercase、Capitalize等等。Lodash提供了很多这一类的处理方法，因此我们直接使用即可。

在开始前其实可以多一个考虑，我们肯定不能把所有case都放进同一个指令，然后通过参数指定逻辑，比如`@string(Uppercase)`、`@string(Lowercase)`这样。正确的做法是为每种处理指定一个独立的指令，如`@upper` `lower`等。并且，由于这些指令的内置逻辑其实是类似的（获取解析结果-应用变更-返回新的结果），所以把相同逻辑解耦出来。

这里我们使用Mixin的方式，基类接收指令名（如`upper`）与转换方法（来自lodash）。

```typescript
export type StringTransformer = (arg: string) => string;

const CreateStringDirectiveMixin = (
  directiveNameArg: string，
  transformer: StringTransformer
): typeof SchemaDirectiveVisitor => {
  class StringDirective extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<any， any>) {
      const { resolve = defaultFieldResolver } = field;
      field。resolve = async (。。。args) => {
        console。log(
          `@${directiveNameArg} invoked on ${args[3]。parentType}。${args[3]。fieldName}`
        );
        const result = await resolve。apply(this， args);
        if (typeof result === "string") {
          return transformer(result);
        }

        return result;
      };
    } 

    public static getDirectiveDeclaration(
      directiveName: string，
      schema: GraphQLSchema
    ): GraphQLDirective {
      const previousDirective = schema。getDirective(directiveName);

      if (previousDirective) {
        return previousDirective;
      }

      return new GraphQLDirective({
        name: directiveNameArg，
        locations: [DirectiveLocation。FIELD_DEFINITION]，
      });
    }
  }

  return StringDirective;
};
```

一次性创建一批：
```typescript
import {
  lowerCase，
  upperCase，
  camelCase，
  startCase，
  capitalize，
  kebabCase，
  trim，
  snakeCase，
} from "lodash";

export const UpperDirective = CreateStringDirectiveMixin("upper"， upperCase);

export const LowerDirective = CreateStringDirectiveMixin("lower"， lowerCase);

export const CamelCaseDirective = CreateStringDirectiveMixin(
  "camelCase"，
  camelCase
);

export const StartCaseDirective = CreateStringDirectiveMixin(
  "startCase"，
  startCase
);

export const CapitalizeDirective = CreateStringDirectiveMixin(
  "capitalize"，
  capitalize
);

export const KebabCaseDirective = CreateStringDirectiveMixin(
  "kebabCase"，
  kebabCase
);

export const TrimDirective = CreateStringDirectiveMixin("trim"， trim);

export const SnakeCaseDirective = CreateStringDirectiveMixin(
  "snake"，
  snakeCase
);
```

