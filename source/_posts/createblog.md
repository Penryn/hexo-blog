---
title: 手把手教你搭建属于你自己的hexo博客，并布置在github page上
date: 2023-11-11 11:35:32
author: phlin
categories: 博客
tags: hexo
---
Hexo 是一个快速、简洁且高效的博客框架。Hexo 使用 Markdown（或其他渲染引擎）解析文章，在几秒内，即可利用靓丽的主题生成静态网页。

---
## 1.环境配置

* Node.js
* Git
* 修改npm为淘宝镜像源，并设置cnpm

1. 环境的下载只需点开网站找到适合自己的版本安装即可，这里不赘述。
   
2. 安装完毕后可以通过cmd命令行输入node -v,npm -v和git --version来验证，如果出现下图则安装成功。
  ![图片](https://qiuniu.phlin.top/bucket/1.png)
3. 修改npm的镜像源为在国内更为稳定的淘宝镜像源（建议永久设置）
```git
  临时改变镜像源 
  npm --registry=https://registry.npmmirror.com

  永久设置为淘宝镜像源
  npm config set registry https://registry.npmmirror.com

  cnpm安装，在国外服务器不佳时就可以用cnpm代替npm命令
  npm install -g cnpm --registry=https://registry.npmmirror.com
```
---
## 2.github准备
1. 打开[github](https://github.com/),并登录或注册你的账号

2. 新建一个格式为你的用户名.github.io的仓库，并设置为公开
 ![图片](https://qiuniu.phlin.top/bucket/2.png)
 ![图片](https://qiuniu.phlin.top/bucket/3.png)

3. 创建成功后在桌面点击右键，Git Bash Here，打开Git的命令行输入这两行代码
```
  git config --global user.name "此处填写你注册github时的用户名"
  git config --global user.email "此处填写你注册github时的邮箱"
```

4. 然后就可以在C:/Users/[电脑登录的用户名]/下找到.gitconfig文件（如果没能找到，请打开显示windows显示隐藏文件的功能），用编辑器打开看到以下内容代表配置成功。
![图片](https://qiuniu.phlin.top/bucket/5.png)
---

## 3.安装Hexo
1. 首先新建一个文件夹👀作为你的博客文件的存放位置，点进去打开Git命令行分别输入
```
  # hexo框架的安装
  npm install -g hexo-cli
  
  # 等上一个命令完成后，再输入下面的命令
  hexo init
    
  # 安装博客所需要的依赖文件(如果上面安装了cnpm则可以把下面的npm换成cnpm)
  npm install
```
2. 等待运行完成，你会发现此时文件夹内多了好多文件。此时本地搭建完成，我们来运行一下试试看，输入以下命令.
```
  hexo g           
  hexo s                                          
```
![图片](https://qiuniu.phlin.top/bucket/4.png)
3. 根据提示我们打开 [http://localhost:4000](http://localhost:4000) ，就可以看到生成的网页，说明Hexo已经成功在本地运行.
---
## 4.发布到github
我们已经完成了Hexo下载安装和本地运行，接下来将本地博客发布到Github让别人也能通过网址访问你的博客。
1. 在博客所在文件夹下打开Git命令行，分别输入以下命令(如果上面安装了cnpm则可以把下面的npm换成cnpm)
```
  # 安装用来发布的插件
  npm install hexo-deployer-git --save
 ​
  # 将本地目录与Github关联起来
  # 这步输入后一直回车即可
  ssh-keygen -t rsa -C "你的邮箱地址"
```

2. 在 C:/Users/[电脑登录的用户名] 目录下找到名为.ssh 的文件夹，打开其中的 id_rsa.pub，复制里面的的内容。 然后打开 Github，点击右上角的头像 Settings 选择 SSH and GPG keys。
![图片](https://qiuniu.phlin.top/bucket/6.png)
![图片](https://qiuniu.phlin.top/bucket/7.png)

3. 点击 New SSH key 将之前复制的内容粘帖到 Key 的框中，Title 可以随意，点击 Add SSH key 完成添加
![图片](https://qiuniu.phlin.top/bucket/8.png)

4. 回到命令行界面测试是否与Github连接成功，输入ssh -T git@github.com，出现一个询问内容输入yes，出现You’ve successfully …说明连接成功。

5. 进入博客站点目录，用文本编辑器打开_config.yml，这个_config.yml 是博客的配置文件，在以后会经常使用到，修改如下图的几个地方：
![图片](https://qiuniu.phlin.top/bucket/9.png)

6. 然后滑到文件最底部deploy处添加如下代码：
```
  type: git
  repo: git@github.com:github用户名/github用户名.github.io.git          
  branch: master     (或者是main)
```

7.最后一步，生成页面并发布，我们执行如下命令
```
  # generate, Hexo会根据配置文件渲染出一套静态页面
  hexo g
 ​
  # deploy, 将上一步渲染出的一系列文件上传至至Github Pages
  hexo d
 ​
  # 或者也可以直接输入此命令，直接完成渲染和上传
  hexo g -d
```
上传完成后，在浏览器中打开网址 你的github用户名.github.io，查看上传的网页。如果页面变成了之前本地调试时的样子，说明上传完成了。没变的话查看一下上传时命令行窗口的信息有没有错误信息，没有的话等一下或按ctrl+f5刷新清除一下浏览器缓存试试。