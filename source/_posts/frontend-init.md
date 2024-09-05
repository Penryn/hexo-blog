---
title: 前端学习体会及项目初始化
date: 2024-08-19 14:07:40
categories: 开发
tags:
  - vue
---

## 学习体会和路线分享
这个暑假想简单学一下前端，想简单成为一个~~全栈~~工程师，于是打算把大作业写完。

由于是有一点点去年仅剩的三件套的认识，于是自己先前几天简单速通了一下`js`和`html`的语法，然后先试着用简单的三件套写了一下登录和新建并查看帖子，大概熟悉了一下简单的页面编写。

接着想要编写修改帖子时，被告知要接后端，虽说`Ajax`也行，但后续更多使用的还是`Axios`，于是调转枪头开始学习vue了，这里不得不提，vue的官方教程是真不错啊，[代码互动](https://cn.vuejs.org/tutorial/#step-1)满分，去年我记得没怎么搞懂的vue语法，很快就理解了。

然后开始跟着去年tiancy学长的[前端课程](https://www.bilibili.com/video/BV1dm4y1W7z1/?spm_id_from=333.788&vd_source=092e077c0b01da14fa19effa14a36a19)开始学习，发现是vue+ts的，于是开始速通ts,然后跟着视频学习vue-router、pinia、axios、element-ui

## 前端初始化(~~踩坑指南~~)
### 配置前提
安装[node.js](https://nodejs.org/zh-cn),安装完就有npm了
注：npm (Node Package Manager) 是 JavaScript 的包管理工具和软件包管理器，主要用于管理和分享 JavaScript 代码包。它是 Node.js 的默认包管理器，并且是全球最大的开源库之一。
输入以下代码看一下安装好了吗
```sh
node -v

npm -v
```
切换npm镜像源，正常官方镜像源太慢，换成淘宝源
```sh
  临时改变镜像源 
  npm --registry=https://registry.npmmirror.com

  永久设置为淘宝镜像源
  npm config set registry https://registry.npmmirror.com
```
如果速度太慢，可以换一个包管理器（cnpm/pnpm）,选一个就行
```sh
  npm install -g cnpm 
  cnpm -v

  npm install -g pnpm
  pnpm -v
```

由于笔者使用的是pnpm，所以下面用pnpm为例

去年我好像也配了前端环境来着，不知道为什么，刚开始报错了，于是把`pnpm`重新安装了一遍。
由于我们前端项目使用的技术栈是`vue`+`ts`+`vite`+`pinia`+`elementUI`+`axios`。
以下是vue+[vite](https://cn.vitejs.dev/guide/)的项目初始化，如果安装了其他包管理器，可以把npm换掉
```
npm create vite {{name}} --template vue

###安装依赖
npm i

##启动项目
npm run dev
```

### 初始化项目目录介绍
```
├── .vscode                    // 配置文件夹
├── public                     // 公共文件夹，里面只有一个 SVG 图标（不用管）
├── src                        // 资源文件夹，大多数你写的代码存放的地方
│   └── ...                    // 包括各种执行的 Vue/ts 文件
├── .gitignore                 // 在你 Git 的时候把不需要的依赖给省略，用于减少 Git 量或省略需要保密的文件
├── index.html                 // 整个 Vue 项目的起始文件
├── package.json               // 表明了你项目中的依赖项，方便他人使用 pnpm i 来安装
├── README.md                  // 项目简介文件，可以把对项目的描述写在这里
├── vite.config.js             // Vite 的配置文件
```
如果是要ts编写项目，则要把默认生成的js文件改成ts，同时在`setup`加上`lang="ts"`。
### ts报错
但是在这个地方，我的项目一直报错，显示`某某vue文件找不到`，后面配置了以下命令就正常了
``` bash
pnpm install typescript -g

tsc --init
```
### eslint报错
在后面又在给项目创建eslint的时候，显示学长的配置文件有误，后面发现是eslint的最新版本有问题，最终调成8.6就正常了。
可以使用下面这个这个配置文件`.eslintrc.cjs`，也可以使用网课tiancy学长讲的配置文件。
```cjs
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    "vue/multi-word-component-names": 0,
    "vue/require-v-for-key": 0
  }
}
```

### `pinia`+`elementUI`+`axios`学习
这部分内容直接看[去年精弘前端网课](https://www.bilibili.com/video/BV1Qj411z75n/?spm_id_from=333.788)就行，讲的挺好。

### 处理跨域
后面基本就很正常了，一路到了发起请求给后端处理跨域时，本来要尝试我的博客里的东西，结果发现我博客的方法是webpack打包的好像，后面学会了用vite挂代理处理，具体可看[这篇文章](https://blog.phlin.top/2024/08/03/cross-origin/)的前端处理办法。

### ui心得
这次用的是element-plus，ui调整主要靠的是gpt,真·面向gpt编程，个人感觉效果还算不错。


### 路由守卫报错
最后这个地方也有报错，具体是pinia和router先后引入的问题，好像系统是先引入router再pinia，因此要调用pinia的全局信息时，要么先提前引入pinia，要么全局信息等声明后再获取。

