---
category: Learning
tags:
  - Other
date: 2020-6-18
title: 还不错的Webpack插件合集
---

## Webpack Plugin

### 性能/编译相关

- [clean-webpack-plugin](https://github.com/johnagan/clean-webpack-plugin)

  在每次build后移除你的`dist`目录（可配置），默认情况下它会读取webpack配置的`output.path`。

- [copy-webpack-plugin](https://github.com/webpack-contrib/copy-webpack-plugin)

  用于将静态文件拷贝到你的输出目录下，有时一些文件并没有适用的loader或者是不需要经过处理，原样复制的文件。

- [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)

  这个大部分人应该都知道，自动创建HTML模板供Webpack打包结果使用，功能还是蛮强大的，包括文件名称 模板参数 meta标签配置 压缩等等。SPA与MPA都会使用到。

- [ lodash-webpack-plugin](https://github.com/lodash/lodash-webpack-plugin)

  这个的话，忘记是不是能被摇树优化或者`babel-plugin-import`替换掉了，用来实现Lodash的按需加载。

- [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin)

  用来将行内CSS抽离成`.css`文件，支持按需加载和SourceMap，性能也比`extract-text-webpack-plugin`更好

- [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin)

  优化 & 压缩CSS文件，可以选择使用的CSS预处理器（默认是`cssnano`）

- [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin)

  一个使用[terser](https://github.com/terser/terser)来压缩JS文件的插件，支持多进程压缩和Terser选项配置。
  
- [hard-source-webpack-plugin](https://github.com/mzgoddard/hard-source-webpack-plugin)

  webpack5的亮点之一，卖点是缓存效果，第二次打包最高可以减少95%以上的时间，但好像还有点坑没解决掉，观望中。webpack5应该是内置它的。

- [npm-install-webpack-plugin](https://github.com/webpack-contrib/npm-install-webpack-plugin)

  自动安装并保存依赖，这样就不用每次暂停掉编译进程了，和Parcel的思路相同，自动安装缺失的loader等等。

- [prepack-webpack-plugin](https://github.com/gajus/prepack-webpack-plugin)

  为[prepack](https://prepack.io/)打造的webpack插件

- [ dotenv-webpack](https://github.com/mrsteele/dotenv-webpack)

  用于控制环境变量注入，感觉是`dotenv`的融合版

- [react-refresh-webpack-plugin](https://github.com/pmmmwh/react-refresh-webpack-plugin)

  React的项目的热重载

### 效率/排查/美化相关

- [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

  分析产物大小，感觉比较直观

  ![webpack bundle analyzer zoomable treemap](https://cloud.githubusercontent.com/assets/302213/20628702/93f72404-b338-11e6-92d4-9a365550a701.gif)

- [ friendly-errors-webpack-plugin](https://github.com/geowarin/friendly-errors-webpack-plugin)

  应该大部分官方的cli工具都集成了它，因为的确好看

  ![lint](https://camo.githubusercontent.com/8d8e98c4430a5f6ccabe0604318e47ae2800a30f/687474703a2f2f692e696d6775722e636f6d2f7859526b6c64722e676966)

  ![babel](https://camo.githubusercontent.com/2e42570a995dd411ac49739cd02ebabf447b559b/687474703a2f2f692e696d6775722e636f6d2f4f6976573441732e676966)

- [webpackbar](https://github.com/nuxt/webpackbar)

  芜湖，我最爱的插件！最开始是在Vuepress见到的，当时还不知道这是一个独立的模块。webpack进度条，配合chalk啊还有上面的插件，给你炫酷的编译过程~

  ![img](https://github.com/nuxt/webpackbar/raw/master/assets/screen1.png)

- [webpackmonitor](https://github.com/webpackmonitor/webpackmonitor)

  ![webpack monitor analysis tool](https://camo.githubusercontent.com/acb0c92759578da7cbbdcd38a57fa682bedcc83b/68747470733a2f2f726f6163686a632e6769746875622e696f2f6d61696e332e676966)

  也是很炫酷的一个插件~ 但是现在已经不维护了，所以慎重使用。
