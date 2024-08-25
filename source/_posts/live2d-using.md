---
title: hexo博客使用live2d看板娘
date: 2024-08-25 21:38:40
categories: 博客
tags: 
 - live2d
 - hexo
---


由于笔者想要给博客设置看板娘，但现在网上搜到的基本都是hexo-helper-live2d，同时因为它所引用的[love2d模型](https://github.com/xiazeyu/live2d-widget-models)版本过于老旧，不能够使用自己的模型，最后在我几经搜索，终于找到这两个不错的库。（笔者使用的是第二个，所以就写第二个的使用指南了）

1. [live2d-widget](https://github.com/stevenjoezhang/live2d-widget)

2. [oh-my-live2d](https://github.com/oh-my-live2d/oh-my-live2d)
## 使用指南
其实[官方文档](https://oml2d.com/guide/hexo.html)也写的很清楚，这里就简单赘述一下了

### 安装
``` sh
pnpm install hexo-oh-my-live2d
```

### 使用

在hexo根目录下的_config.yml增加以下代码，其中models.path是存放模型的路径，其位置是在source文件夹下的，而不是基于hexo根目录。
如果是最新版的live2d模型，则将path指向模型文件夹内`model3.json`后缀的文件
``` yml
# _config.yml
OhMyLive2d:
  enable: true
  CDN: https://registry.npmmirror.com/oh-my-live2d/latest/files
  option:
    # importType: 'cubism2' #  导入类型, 默认使用全量导入: complete , 可选值: complete, cubism2, cubism5
    libraryUrls: # 自定义 Cubism SDK 外部资源地址
      complete: https://registry.npmmirror.com/oh-my-live2d/latest/files/lib/complete.js
      cubism2: https://registry.npmmirror.com/oh-my-live2d/latest/files/lib/cubism2.js
      cubism5: https://registry.npmmirror.com/oh-my-live2d/latest/files/lib/cubism5.js
    # menus:
    # items: |
    #   (defaultItems)=>{
    #    return [
    #      ...defaultItems,
    #      {
    #        id: 'github',
    #        icon: 'github-fill',
    #        title: '我的github',
    #        onClick: ()=>window.open('https://github.com/hacxy')
    #      }
    #    ]
    #   }

    # items:
    #   - id: 'github'
    #     icon: 'github-fill'
    #     title: '我的github'
    #     onClick: ()=>window.open('https://github.com/hacxy')

    mobileDisplay: true # 是否在移动端显示
    models:
      - path: https://registry.npmmirror.com/live2d-widget-model-shizuku/1.0.5/files/assets/shizuku.model.json
        mobilePosition: [-10, 23] # 移动端时模型在舞台中的位置。 默认值: [0,0] [横坐标, 纵坐标]
        mobileScale: 0.1 # 移动端时模型的缩放比例 默认值: 0.1
        mobileStageStyle: # 移动端时舞台的样式
          width: 180
          height: 166
        motionPreloadStrategy: IDLE # 动作预加载策略 默认值: IDLE 可选值: ALL | IDLE | NONE
        position: [-10, 35] # 模型在舞台中的位置。 默认值: [0,0] [横坐标, 纵坐标]
        scale: 0.15 # 模型的缩放比例 默认值: 0.1
        # showHitAreaFrames: false # 是否显示点击区域 默认值: false
        stageStyle:
          width: 250
          height: 250
      - path: 'https://registry.npmmirror.com/live2d-widget-model-koharu/1.0.5/files/assets/koharu.model.json'
        scale: 0.12
        position: [0, 0]
        stageStyle:
          width: 250
        mobileScale: 0.08
        mobilePosition: [0, 0]
        mobileStageStyle: # 移动端时舞台的样式
          width: 180
      - path: 'https://registry.npmmirror.com/live2d-widget-model-haruto/1.0.5/files/assets/haruto.model.json'
        scale: 0.12
        position: [0, 0]
        mobileScale: 0.08
        mobilePosition: [0, 0]
        mobileStageStyle: # 移动端时舞台的样式
          width: 180
        stageStyle:
          width: 250
    parentElement: document.body #为组件提供一个父元素，如果未指定则默认挂载到 body 中
    primaryColor: 'var(--btn-bg)' # 主题色 支持变量
    sayHello: false # 是否在初始化阶段打印项目信息
    tips:
      style:
        width: 230
        height: 120
        left: calc(50% - 20px)
        top: -100px
      mobileStyle:
        width: 180
        height: 80
        left: calc(50% - 30px)
        top: -100px
      idleTips:
        interval: 15000
        # message:
        #   - 你好呀~
        #   - 欢迎来到我的小站~
        # 自定义提示语 需要 引入 axios 库 ,也可以使用其他方法
        message: |
          function(){
            return axios.get('https://v1.hitokoto.cn?c=i')
              .then(function (response) {
                return response.data.hitokoto ;
              })
              .catch(function (error) {
                console.error(error);
              });
          }
        # wordTheDay: true
        # 自定义  https://v1.hitokoto.cn  数据
        # wordTheDay: |
        #   function(wordTheDayData){
        #     return `${wordTheDayData.hitokoto}    by.${wordTheDayData.from}`;
        #   }
  # then: |
  #   (oml2d)=>{
  #      setTimeout(() => {
  #     oml2d.tipsMessage('hello world', 3000, 10);
  #   }, 8000);
  #   }
```

### 最终效果
![](https://qiuniu.phlin.top/bucket/202408252215159.png)