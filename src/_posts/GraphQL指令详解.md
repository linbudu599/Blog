---
category: Learning
tags:
  - GraphQL
date: 2021-2-3
title: GraphQL Directives详解
---

## 大纲

- GraphQL Directives(以下简称GD) 作用
- GD可用的location(源码见https://github.com/graphql/graphql-js/blob/a62eea88d5844a3bd9725c0f3c30950a78727f3e/src/language/directiveLocation.js#L22-L33 )
- GraphQL 内置指令实现(https://github.com/graphql/graphql-js/blob/a546aca77922beb2fee949ea0ad7c9234f7006fd/src/type/directives.js)
- Apollo-Server中指令相关源码(https://github.com/apollographql/apollo-server/blob/b7a91df76acef748488eedcfe998917173cff142/packages/apollo-server-core/src/utils/isDirectiveDefined.ts)
  - GraphQL Tools使用部分
- 实现常用指令
  - TypeGraphQL局限
  - 原生指令实现与基于SchemaDirectiveVisitor实现
- GD的思想