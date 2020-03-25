module.exports = {
  title: "Penumbra",
  serviceWorker: true,
  description: "Penumbra's Blog",
  //额外的需要被注入到当前页面<head>中的标签
  locales: {
    "/": {
      lang: "zh-CN"
    }
  },
  theme: "meteorlxy",
  plugins: [
    [
      "@vuepress/google-analytics",
      {
        ga: "UA-156898689-1"
      }
    ]
  ],
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
  ],
  host: "localhost",
  port: "9999",
  dest: "./dist",
  themeConfig: {
    lang: "zh-CN",
    personalInfo: {
      nickname: "Penumbra",
      description: "未来的不可知，是前进的原动力",
      email: "linbudu@qq.com",
      avatar:
        "https://linbudu-img-store.oss-cn-shenzhen.aliyuncs.com/img/48507806.jfif",
      sns: {
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
        '©Copyright 2019-2021 <a href="https://github.com/linbudu599" target="_blank">Penumbra</a> | <a href="http://www.beian.miit.gov.cn/?spm=a2c4g.11186623.2.31.35e37243qB3txy" target="_blank">闽ICP备19021283号-2</>'
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
