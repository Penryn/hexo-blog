---
title: hexo框架添加rss订阅
date: 2024-08-19 16:11:14
categories: 博客
tags:
  - hexo
  - rss
---


由于我的博客主题没有默认附带rss订阅，于是得自己手动再装一个。

首先下载`hexo-generator-feednpm`包 ：
``` bash
npm install hexo-generator-feed --save
```

接着在hexo主配置文件`_config.yml`添加一下命令
``` vim
feed:
  type: rss2                //你可以选择 atom 或 rss2（atom好像有问题，建议用rss2）。
  path: rss2.xml            //生成的 RSS 文件的路径。可以使用 atom.xml 或 rss2.xml。
  limit: 20                 //限制显示的文章数量，默认是 20 篇文章。
  hub:                      //可选项，用于添加 WebSub（以前的 PubSubHubbub）hub URL。
  content:                  //可选项，设置是否在 feed 中显示文章内容。留空表示显示完整内容。
  content_limit:            //可选项，用于限制文章内容的字数。
  content_limit_delim: ' '  //当文章内容超出 content_limit 时的截断符。
  order_by: -date           //定义文章排序规则，默认为按日期倒序。
```

然后重新生成并部署一下
```bash
hexo clean

hexo g

hexo s
```

最后通过以下url访问 RSS 订阅链接，所以添加rss订阅也就是设置一个能跳转到一下该url的按钮就行
```
Atom Feed: https://your-domain.com/atom.xml

RSS 2.0: https://your-domain.com/rss2.xml
//将其中的 your-domain.com 替换为你的实际域名。
```