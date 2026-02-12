---
title: hexo博客的fluid主题使用waline评论功能
date: 2024-08-25 22:11:41
keywords:
  - "waline"
  - "hexo"
  - "博客"
updated: 2024-08-25 22:11:41
description: "一开始搞的是https://discuss.js.org/,但是不知道为什么全都部署好了，配置文件也更新了，但博客就还是用不了评论，于是又重新换成了waline。"
categories: 博客
tags: 
 - waline
 - hexo
---
一开始搞的是[discuss](https://discuss.js.org/),但是不知道为什么全都部署好了，配置文件也更新了，但博客就还是用不了评论，于是又重新换成了waline。

## 介绍

[Waline](https://waline.js.org/)是一款基于 Valine 衍生的简洁、安全的评论系统。

- 相对于 Valine 有一些后天的优势：

| 优势     | 描述                                  |
| ------ | ----------------------------------- |
| 自由评论   | 完全的 Markdown 支持，同时包含表情、数学公式、HTML 嵌入 |
| 轻量     | 54kB gzip 的完整客户端大小                              |
| 强大的安全性 | 内容校验、防灌水、保护敏感数据等                     |
| 登录支持   | 在允许匿名评论的基础上，支持账号注册，保持身份          |
| 完全免费部署 | 可免费部署在 Vercel 上                               |
| 易于部署   | 多种部署部署方式和存储服务支持                           |
## 使用

###  LeanCloud 设置 (数据库)

1. [`LeanCloud 国际版`](https://console.leancloud.app/login?from=%2Fapps) 并进入 控制台在新窗口打开
2. 点击左下角创建应用并起一个你喜欢的名字 (请选择免费的开发版):
3. 进入应用，选择左下角的 `设置` > `应用 Key`。你可以看到你的 `APP ID`,`APP Key` 和 `Master Key`。后续我们会用到这三个值。
4. **注意**: 如果你正在使用 Leancloud 国内版，我们推荐你切换到国际版。否则，你需要为应用额外绑定**已备案**的域名:
	- 登录国内版并进入需要使用的应用
	- 选择 `设置` > `域名绑定` > `API 访问域名` > `绑定新域名` > 输入域名 > `确定`。
	- 按照页面上的提示按要求在 DNS 上完成 CNAME 解析。

### vercel部署waline

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/walinejs/waline/tree/main/example)

1. 点击上方按钮，跳转至 Vercel 进行 Server 端部署。
2. 如果你未登录的话，Vercel 会让你注册或登录，请使用 GitHub 账户进行快捷登录。
3. 输入一个你喜欢的 Vercel 项目名称并点击 `Create` 继续:
4. 此时 Vercel 会基于 Waline 模板帮助你新建并初始化仓库，仓库名为你之前输入的项目名。
5. 部署成功后此时点击 `Go to Dashboard` 可以跳转到应用的控制台。
6. 点击顶部的 `Settings` - `Environment Variables` 进入环境变量配置页，并配置三个环境变量`LEAN_ID`, `LEAN_KEY` 和 `LEAN_MASTER_KEY` 。它们的值分别对应上一步在 LeanCloud 中获得的 `APP ID`, `APP KEY`, `Master Key`。
**提示**：如果你使用 LeanCloud 国内版，请额外配置 `LEAN_SERVER` 环境变量，值为你绑定好的域名。
7. 环境变量配置完成之后点击顶部的 `Deployments` 点击顶部最新的一次部署右侧的 `Redeploy` 按钮进行重新部署。该步骤是为了让刚才设置的环境变量生效，然后静待服务部署完成
8. 此时请点击 `Visit` ，即可跳转到部署好的网站地址，此地址即为你的`服务端地址`。


### fluid配置文件设置
在主题的_config.yml下
1. 设置主题配置文件 `comments -> type` 值为 `waline`
```
  # 评论插件
  # Comment plugin
  comments:
    enable: true
    type: waline
```
2. 配置 waline 相关信息。主要是`serverURL`的填写
```
# Waline
# 从 Valine 衍生而来，额外增加了服务端和多种功能
# Derived from Valine, with self-hosted service and new features
# See: https://waline.js.org/

waline:
  serverURL: '你的服务端地址'
  path: window.location.pathname
  meta: ['nick', 'mail', 'link']
  requiredMeta: ['nick']
  lang: 'zh-CN'
  emoji: ['https://cdn.jsdelivr.net/gh/walinejs/emojis/weibo']
  dark: 'html[data-user-color-scheme="dark"]'
  wordLimit: 0
  pageSize: 10
```
3. 最终效果
![hexo博客的fluid主题使用waline评论功能配图](https://qiuniu.phlin.cn/bucket/202408252209585.png)

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%8D%9A%E5%AE%A2/)
