---
category: Learning
tags:
  - Nx
date: 2021-4-18
title: Nx Plugin
---

## 大纲

- Nx的插件组成：generator与executor
- 对比Angular的schematic与builder
- 本地插件开发
  - pnpm link
  - nx g @nrwl/nx-plugin:generator x --project=plugin1
  - 本地lib：nx g @nrwl/node:lib plugin1 --publishable --importPath=plugin1
- 思路：
  - 与bundler的集成：ESBuild / SWC / Vite / Snowpack （其实ESBuild SWC和另外两个不太一样）
  - 与高阶框架的集成：Umi
  - 与库的集成：TypeGraphQL / Prisma
  - 使用nx官方的executor：Koa
  - 与命令行工具集成：Serverless
  - 与静态文档生成器集成：Dumi / Vuepress