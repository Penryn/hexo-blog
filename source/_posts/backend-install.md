---
title: 后端环境配置
date: 2024-07-19 19:53:02
img: ../picture/createblog/bg.jpg
summary: vscode、go、mysql安装
categories: 运维
tags:
  - golang
coverImg: ../picture/createblog/bg.jpg
---


# VSCode 及 Golang 插件的安装
![Untitled](https://bu.dusays.com/2023/07/30/64c6703ef0233.png)

在搜索引擎中搜索 vscode，进入官方下载网站 [https://code.visualstudio.com/](https://code.visualstudio.com/)

![Untitled](https://bu.dusays.com/2023/07/30/64c67041c793c.png)

直接单击最大的下载按钮即可进行下载。

如果下载速度太慢，可以尝试将下载链接中的域名( [az764295.vo.msecnd.net](https://az764295.vo.msecnd.net/stable/2ccd690cbff1569e4a83d7c43d45101f817401dc/VSCodeUserSetup-x64-1.80.2.exe) )替换为 [vscode.cdn.azure.cn](http://vscode.cdn.azure.cn)

双击下载的安装包，按照常规的安装流程进行安装
  
![Untitled](https://bu.dusays.com/2023/07/30/64c670442da57.png)


![Untitled](https://bu.dusays.com/2023/07/30/64c67045e0c8e.png)


![Untitled](https://bu.dusays.com/2023/07/30/64c6705048825.png)


在安装成功后弹出的主界面上，单击左侧栏第五个按钮打开插件管理器

![Untitled](https://bu.dusays.com/2023/07/30/64c67058948c8.png)

在搜索栏中先搜索chinese,安装中文语言包
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/10.webp)
安装成功后就会显示中文界面
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/11.webp)
然后继续到插件管理器搜索 go并安装

![Untitled](https://bu.dusays.com/2023/07/30/64c6705d3cc14.png)

# Golang 的安装与配置

下载链接：[https://golang.google.cn](https://golang.google.cn/)

正常下载安装

![Untitled](https://bu.dusays.com/2023/07/30/64c67062c4bf1.png)


![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/13.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/14.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/15.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/16.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/17.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/18.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/19.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/20.webp)
  
安装成功后，可以通过 `Win+R` 快捷键输入 cmd 打开终端，输入 go 并敲下回车，查看 Path 环境变量是否有被自动配置好


![Untitled](https://bu.dusays.com/2023/07/30/64c6707818591.png)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/22.webp)

或者可以输入`go version`显示当前go的版本
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/23.webp)
并顺势在终端复制以下命令配置境内的镜像源

```bash
go env -w GO111MODULE=on
go env -w GOPROXY=https://goproxy.cn,direct
```
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/24.webp)
配置完后重新打开 VSCode 按住 `Ctrl+Shift+P` 输入 `Go:Install/Update Tools`

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/25.webp)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/26.webp)
点击后全选

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/27.webp)


点击确定后等待安装完毕即可

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/28.webp)

# 编写第一个 Go 程序
+ 在本地新建一个文件夹，接着在该文件夹内鼠标右键新建文本文档，然后重命名为`main.go`的文件
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/29.webp)
+ 用vscode打开文件夹
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/30.webp)
+ 打开终端（终端->新建终端 或者 输入 Ctrl+Shift+\` 快捷键）
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/31.webp)
+ 输入 go mod init [name] 来初始化 Go 应用，name 名字可以自己取

然后在 main 文件中粘贴下面代码

```go
package main

import "fmt"

func main() {
    fmt.Println("Hello World!")
}
```

在终端输入 `go run main.go` 即可运行显示结果

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/32.webp)
# 安装 MySQL

推荐直接从下面两个镜像站下载 MySQL 的离线安装包

[https://mirrors.huaweicloud.com/mysql/Downloads/MySQLInstaller/](https://mirrors.huaweicloud.com/mysql/Downloads/MySQLInstaller/)

[https://mirrors.aliyun.com/mysql/MySQLInstaller/](https://mirrors.aliyun.com/mysql/MySQLInstaller/)
  

![Untitled](https://bu.dusays.com/2023/07/30/64c6708259c55.png)

请务必确保自己下载的是 `mysql-installer-community` ，不要下载 web 在线安装版本。

![Untitled](https://bu.dusays.com/2023/07/30/64c67086504f1.png)

刚点开安装包时可能会在这个界面卡很久，耐心等待即可

![Untitled](https://bu.dusays.com/2023/07/30/64c6708a6481d.png)

随后可能会弹出更新提示，直接选择 No 忽略即可

随后在安装程序的主页面，选择 Server only，然后安装示意图如下。

![Untitled](https://bu.dusays.com/2023/07/30/64c6708ecd42f.png)

![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/41.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/42.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/43.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/44.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/45.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/46.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/47.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/48.webp)
在这一步，千万千万要注意，不要忘记密码！！！
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/49.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/50.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/51.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/52.webp)
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/53.webp)

接着我们去找mysql的bin文件夹
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/54.webp)
随后我们需要将该文件夹的路径，即 `C:\Program Files\MySQL\MySQL Server 8.0\bin` 加入系统变量中

![Untitled](https://bu.dusays.com/2023/07/30/64c67095165e7.png)

右键我的电脑，选择属性

![Untitled](https://bu.dusays.com/2023/07/30/64c6709b2389d.png)

单击高级系统设置

![Untitled](https://bu.dusays.com/2023/07/30/64c6709de81cb.png)

选择环境变量

![Untitled](https://bu.dusays.com/2023/07/30/64c670a50890c.png)

双击当前用户的 Path 变量

![Untitled](https://bu.dusays.com/2023/07/30/64c670aaacc47.png)

单击新建，输入 `C:\Program Files\MySQL\MySQL Server 8.0\bin`

确定后即完成了 mysql 的 Path 变量配置

接着我们验证一下是否配置成功
我们重新按下`win+R`快捷键，输入`cmd`打开终端，接着输入`mysql -u root -p`,接着系统会要求你输入密码，也就是你刚刚设置的密码，如果你进入到以下这个界面就是成功了
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/61.webp)

然后我们尝试用vscode连接我们的数据库，它有图形化界面，可以减少我们初学者操作数据库的难度。
我们打开vscode，接着在插件库安装这两个插件。
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/62.webp)
点击`Create Connection`,选择mysql，主机名为`127.0.0.1`,端口为`3306`,用户名为`root`，密码为你刚才自己设置的密码，填写完成后点击下面的连接按钮
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/63.webp)
当我们看到右上角这一行时则代表我们连接成功了。
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/64.webp)
我们再点击这个小按钮，也可以显示我们刚刚终端显示的内容。
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/65.webp)
到此，我们成功使用vscode连接本地的mysql数据库了
# vscode的markdown阅读插件
比如此次授课的课程材料都是md为后缀的文件，这用markdown语法编写的文件，可以用vscode打开，但是此时还不便查看，因此我们可以再安装一个以下插件。
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/66.webp)
它的使用方法是这样的，可以显示内容和目录。
![Untitled](https://img.lonesome.cn/jhwl/class/2024/basic/67.webp)
# vscode常用快捷键

* 打开命令面板: Ctrl + Shift + P (Windows), Shift + Option + F (Mac)

通过命令面板可以快速访问VSCode的所有命令。

* 格式化代码: Shift + Alt + F (Windows), Cmd + Shift + F (Mac)

格式化当前文件的代码。
(ctrl+s/Cmd+s保存也可以自动执行格式化代码的命令)


* 更改所有匹配项：Ctrl+F2 (windows),Cmd + F2 (Mac)

可以同时更改所有匹配的字段


* 注释：Ctrl + / (windows),Cmd + / (Mac)
  
将所选内容注释或取消注释