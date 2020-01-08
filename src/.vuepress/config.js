module.exports = {
  title: "林不渡",
  serviceWorker: true,
  description: "Linbudu's Blog",
  //额外的需要被注入到当前页面<head>中的标签
  locales: {
    "/": {
      lang: "zh-CN"
    }
  },
  theme: "meteorlxy",
  head: [
    // [tagName, { attrName: attrValue }, innerHTML?]
    ["link", { rel: "icon", href: "." }],
    [
      "meta",
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1.0, user-scalable=no"
      }
    ]
    // ["meta", { charset: "UTF-8" }]
    // ['link', { rel: 'manifest', href: '/manifest.json' }],
  ],
  // base: "./",
  //host:dev server的主机名
  host: "localhost",
  //端口名
  port: "9999",
  //dest vuepress build的输出目录
  dest: "./dist",
  //extraWatchFiles,指定额外的需要被监听的文件。
  // 你可以监听任何想监听的文件，文件变动将会触发
  // vuepress 重新构建，并实时更新。
  extraWatchFiles: [],

  //主题配置

  themeConfig: {
    lang: "zh-CN",
    personalInfo: {
      nickname: "林不渡",
      description: "未来的不可知，是前进的原动力",
      email: "linbudu@qq.com",
      avatar: "https://linbudu.top/assets/img/icon1.png",
      sns: {
        // Github 帐号和链接
        github: {
          account: "Linbudu",
          link: "https://github.com/linbudu599"
        }
      }
    },
    header: {
      // header 的背景，可以使用图片，或者随机变化的图案（geopattern）
      background: {
        // 使用图片的 URL，如果设置了图片 URL，则不会生成随机变化的图案，下面的 useGeo 将失效
        url: "https://linbudu.top/assets/img/jp-valery-734900-unsplash.jpg",

        // 使用随机变化的图案，如果设置为 false，且没有设置图片 URL，将显示为空白背景
        useGeo: true
      },

      // 是否在 header 显示标题
      showTitle: true
    },
    footer: {
      powerdBy: true,
      powerdByTheme: true,
      custom:
        'Copyright 2019-present <a href="https://github.com/linbudu599" target="_blank">不渡</a> | MIT License'
    },
    infoCard: {
      // 卡片 header 的背景，可以使用图片，或者随机变化的图案（geopattern）
      headerBackground: {
        // 使用图片的 URL，如果设置了图片 URL，则不会生成随机变化的图案，下面的 useGeo 将失效
        url:
          "https://linbudu.top/assets/img/thomas-tixtaaz-119883-unsplash.jpg",

        // 使用随机变化的图案，如果设置为 false，且没有设置图片 URL，将显示为空白背景
        useGeo: true
      }
    },
    //导航栏配置
    nav: [
      { text: "主页", link: "/", exact: true },
      {
        text: "往期博文",
        link: "/posts/",
        exact: false
      },
      { text: "关于我", link: "/about/", exact: false }
    ],
    comments: {
      platform: "github",
      owner: "linbudu599",
      repo: "linbudu599.github.io",
      clientId: "480706d297ed39192d4b",
      clientSecret: "c302b0638a0e4e85a6712a662254c52b3ca0270d"
    },
    lastUpdated: "Last Updated",
    comments: false
  }
};
