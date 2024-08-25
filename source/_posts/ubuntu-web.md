---
title: Ubuntu系统部署Golang-Vue前后端分离项目
date: 2024-08-25 22:25:46
categories: 运维
tags: 
 - ubuntu
 - golang
 - vue
 - nginx
---
本文来源于惜寞学长所写的[部署文章](https://www.lonesome.cn/posts/ubuntu-deploy-gin-and-vue-project),只是为了部署时贪图方便，特在此转载一下，以下内容因贪图方便，没有图片，如果有图片需要，可以到[原文章](https://www.lonesome.cn/posts/ubuntu-deploy-gin-and-vue-project)阅读。


## 后端

### 部署

#### Go 项目打包

Go 支持跨平台编译，因此我们可以很轻松的将当前平台的 Go 项目打包成能够在 Linux 运行的文件  
进入到 main.go 的文件目录下，执行以下命令（打包前记得将环境或者配置修改为服务器的）

##### Windows 系统下
``` sh
SET CGO_ENABLE=0  
SET GOOS=linux  
SET GOARCH=amd64  
go build main.go
```
注：在 cmd 中执行，PowerShell 中不知道为什么不起作用（编译出来还是 Windows 下的 .exe 文件）

##### Mac 系统下
``` sh
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build main.go
```
##### Linux 系统下
```sh
go build main.go
```
##### 参数说明
```
CGO_ENABLE 是否开启 CGO，默认为 1 开启 CGO（不支持交叉编译），0 表示关闭  
GOARCH 表示目标平台的体系架构  
GOOS 表示目标平台的操作系统 Linux、Windows、Darwin（Mac）
```
等待编译完成后就可以得到一个**不带后缀**的二进制文件，默认名为`main`  
如果想要指定输出的文件名，可以在 go build 时加上 `-o` 参数，如
```sh
go build -o xxx main.go
```
`xxx`就是我指定输出的文件名，也是我本次部署使用的打包文件

#### 将打包文件上传到服务器

可以使用 xftp 上传打包文件至服务器，也可以使用对应云服务器厂商自带的 WebShell（我使用的是腾讯云的 OrcaTerm）  
这边将打包好的 cms 文件上传到`/opt/go/cms`文件夹下（文件路径可以自己选择）  
**注：如果有配置文件也需要一起上传**  

#### 修改文件权限

想要运行该文件，我们至少需要拥有执行该文件的权利，执行下面的命令
``` sh
chmod 740 xxx
```
将执行权限赋予 root 用户（实际根据自己需求赋予不同用户组权限）  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)  
这时候我们其实已经可以运行了，输入`./xxx`去运行我们编译好的文件  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)  
没有报错说明已经启动成功了  
没有别的信息显示是因为部署在正式环境中，设置了`gin.SetMode(gin.ReleaseMode)`（Gin 的生产环境模式）  

#### 云服务器放行端口

想要访问后端服务，需要将服务对应运行的端口（比如我这边就是默认跑在`8080`端口）放开，不然在外部是访问不到服务器上的后端服务的  
在云服务器厂商找到对应云服务器的防火墙，并放行 8080 端口（对应你自己后端服务的运行端口）  

#### 测试访问

可以通过 Apifox 测试能否正常访问 ,发送请求也可以在服务器终端上看到 Gin 自己 Logger 中间件的日志

#### 使用 Systemd 守护进程

现在我们希望我们的后端服务能在后台运行，并且不会随着我们终端的关闭而退出，这里就需要用到守护进程，守护进程是一个在后台运行并且不受任何终端控制的进程，这里我们选择使用 systemd 守护进程  
**注：本文不详细讲解 systemd，建议自行查阅相关知识**

##### 创建 service 文件

先`CTRL+C`结束启动的服务回到 linux 命令行  
在`/etc/systemd/system`路径下新建一个`xxx.service`文件，文件名可以自己取，**文件后缀`.service`**
```sh
touch /etc/systemd/system/xxx.service
```

##### 编辑 service 文件

使用 vim 打开编辑该文件
```vim
vim /etc/systemd/system/xxx.service
```
输入`i`进入编辑模式（在英文输入法下）
```vim
[Unit]  
Description=xxx（contact manager system）backend server daemon  
  
[Service]  
Type=simple  
ExecStart=/opt/go/xxx/xxx  
WorkingDirectory=/opt/go/xxx 
Restart=always  
RestartSec=10s  
  
[Install]  
WantedBy=multi-user.target
```
参数解释（想要了解更多参数和配置可以参考这篇 [利用 Systemd 守护进程 | 派大星的石头屋](https://blog.cnpatrickstar.com/all/systemd/)）

- Unit
    - `Description`：简短描述
- Service
    - `Type`：启动类型，`simple`表示`ExecStart`字段启动的进程为主进程
    - `ExecStart`：启动当前服务的命令，即打包文件的具体路径
    - `WorkingDirectory`：指定服务运行目录，即打包文件所在的文件夹
    - `Restart`：定义何种情况 Systemd 会自动重启当前服务，`always`表示总是重启
    - `RestartSec`：自动重启当前服务间隔的秒数
- Install
    - `WantedBy`：它的值是一个或多个 Target，当前 Unit 激活时（enable）符号链接会放入`/etc/systemd/system`目录下面以 Target 名 + `.wants`后缀构成的子目录中

将`Description`、`ExecStart`和`WorkingDirectory`修改为自己的即可  
然后将修改完的代码粘贴到我们正在编辑的文件中  
按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

##### 启动 service

输入下面命令即可启动后端服务
```sh
sudo systemctl start xxx ## xxx 对应修改为你之前创建的 service 文件名
```
然后可以通过下面命令查看服务状态
```sh
sudo systemctl status xxx ## xxx 对应修改为你之前创建的 service 文件名
```
`active (running)`说明服务已经成功启动，即我们的后端服务已经在后台运行了  
附上其他相关命令
```sh
## 停止  
sudo systemctl stop xxx ## xxx 对应修改为你之前创建的 service 文件名  
## 重启  
sudo systemctl restart xxx ## xxx 对应修改为你之前创建的 service 文件名  
## 设置开机自启动  
sudo systemctl enable xxx ## xxx 对应修改为你之前创建的 service 文件名  
## 取消开机自启动  
sudo systemctl disable xxx ## xxx 对应修改为你之前创建的 service 文件名
```
### Nginx 反向代理，将域名映射到 ip:port（可选）

完成部署后后端服务已经可以通过服务器的 ip 地址和端口进行访问  
如果想实现将某个域名映射到 ip:port，即通过访问域名实现对后端服务的访问，我们需要用 Nginx 进行一个反代（因为域名只能绑定 ip）  
**注：本文不详细讲解 Nginx，建议自行查阅相关知识**

#### 前提

需要有一个解析到该服务器的域名，可以创建一个子域名

#### 安装 Nginx

Ubuntu 下输入下面命令即可安装 Nginx
```sh
sudo apt install nginx
```
中间会询问是否继续安装，输入`y`回车即可  
等待安装完成，可以输入下面命令查看 Nginx 服务状态
```sh
sudo systemctl status nginx
```
安装完成后，Nginx 服务会自己启动，可以看到 Nginx 服务已经正常运行

#### 配置文件部分说明

Nginx 配置文件路径默认在`/etc/nginx`  
可以输入下面命令查看 Nginx 配置文件位置
```sh
nginx -t
```
`cd /etc/nginx`到 Nginx 目录下，`ls`查看结构  
- nginx.conf 即 Nginx 的主要配置文件，可以直接在该文件中进行修改（大多数教程也是这么做的），但是如果以后部署的服务多起来，都放在一个配置文件中会显得混乱和臃肿
- 新版本的 Nginx 允许我们在 nginx.conf 中导入其他文件夹中的 .conf 文件，因此我们可以针对不同的服务，建立不同的 conf 配置文件，方便管理
- 而 Nginx 已经为我们建好了一个文件夹，并且导入到了配置文件中，即 conf.d 文件夹，我们可以直接在该文件夹下新建和添加配置文件
- 注：nginx.conf 中有关于 Nginx 整体的相关配置，但这里不多介绍，我们也不去修改

#### 新建配置文件

在`/etc/nginx/conf.d`路径下新建一个`xxx.conf`文件，文件名可以自己取，**文件后缀`.conf`**
```sh
touch /etc/nginx/conf.d/xxx.conf
```

#### 编辑配置文件

使用 vim 打开编辑该文件
```sh
vim /etc/nginx/conf.d/xxx.conf
```
输入`i`进入编辑模式（在英文输入法下）
```vim
server {  
    listen 80;  
    ## 服务端绑定的域名  
    server_name phlin.top;  
  
    location / {  
        ## 需要映射到的后端服务端口  
        proxy_pass http://localhost:8080;  
    }  
}
```
- 在`server_name`填入你要绑定的域名，比如我这边就是`phlin.top`
- 在`proxy_pass`填入你需要映射到的端口，比如我需要的是 8080 端口
- `listen 80`表示的是监听的端口，因为 http 请求默认访问的是 80 端口，举例来说当我们在访问`www.baidu.com`的时候其实访问的是`www.baidu.com:80`，不过 80 可以省略

将上面的代码理解一下就是当我直接访问`phlin.top`时，Nginx 会监听到 80 端口有请求，然后做一个反向代理将这个请求发送到 8080 端口，实现将对域名的请求映射到 ip:port  
将修改完的代码粘贴进配置文件  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)  
按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

#### 重启 Nginx

输入下面命令重启 Nginx 以应用修改后的配置文件
```sh
sudo nginx -s reload
```


#### 测试访问

**注：需要确保云服务器 80 端口放开**  
依旧是利用 Apifox 进行测试  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)  
可以看到能够直接用域名进行访问了

#### 配置 SSL 证书（可选）

前面只能用 http 进行访问，现在我想要用 https 进行访问，并且在使用 http 访问时强制跳转 https

##### 前提

- 有对应域名的 SSL 证书，可以去申请免费的 SSL 证书
- 转换 SSL 证书，主要需要`.crt`和`.key`文件，具体可以自行搜索

##### 上传证书文件

在`/etc/nginx`目录下新建一个 cert 文件夹存放证书
```sh
## 在 /etc/nginx 路径下执行  
mkdir cert
```
将转换得到的`.crt`和`.key`文件上传到服务器的`/etc/nginx/cert`文件夹下  

##### 编辑配置文件

依旧是编辑`/etc/nginx/conf.d/xxx.conf`文件
```sh
vim /etc/nginx/conf.d/xxx.conf
```
输入`i`进入编辑模式（在英文输入法下）
```vim
server {  
    listen 80;  
    ## 服务端绑定的域名  
    server_name phlin.top;  
    ## 强制跳转https  
    rewrite ^/(.*) https://$server_name$request_uri? permanent;  
}  
  
server {  
    ## SSL 默认访问端口号为 443  
    listen 443 ssl;  
    ## 请填写绑定证书的域名  
    server_name phlin.top;  
    ## 请填写证书文件的相对路径或绝对路径  
    ssl_certificate /etc/nginx/cert/xxx.crt;  
    ## 请填写私钥文件的相对路径或绝对路径  
    ssl_certificate_key /etc/nginx/cert/xxx.key;  
    ssl_session_timeout 5m;  
    ## 请按照以下协议配置  
    ssl_protocols TLSv1.2 TLSv1.3;  
    ## 请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。  
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;  
    ssl_prefer_server_ciphers on;  
  
    location / {  
        ## 请填写后端运行的端口  
        proxy_pass http://localhost:8080;  
    }  
}
```
用上述代码覆盖原先的配置  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)  
并将红框部分修改为你自己的配置  
然后按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

##### 重启 Nginx

先检查配置有无问题
```sh
nginx -t
```
没有问题则`sudo nginx -s reload`重启 Nginx 以应用修改

##### 测试访问

**注：需要确保云服务器 80 和 443 端口放开**  
实际在访问 http 时也会强制跳转到 https，这里就不做演示了

## 前端

### 前提

已经部署完后端并且能够正常访问

### Vue 项目打包

在 Vue 项目的根目录执行下面的命令，打包成 dist 目录（打包前记得将环境或者配置修改为服务器的）
```sh
npm run build
```
将 dist 目录重命名为 xxx（名字自取）

### 将打包文件上传到服务器

可以使用 xftp 上传打包文件至服务器，也可以使用对应云服务器厂商自带的 WebShell
这边将打包好的 xxx 文件上传到`/var/www`文件夹下（文件路径可以自己选择）  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAABGdBTUEAALGPC/xhBQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAADa6r/EAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=)

### 修改文件权限

将 cms 目录的权限修改为 755，确保 Nginx 对该文件有访问权限
```sh
cd /var/www  
chmod -R 755 xxx
```

### 安装 Nginx

**注：如果是从后端 Nginx 部分看过来的，可以直接跳到编辑配置文件，将内容添加到原有配置的后面即可**  
Ubuntu 下输入下面命令即可安装 Nginx
```sh
sudo apt install nginx
```
中间会询问是否继续安装，输入`y`回车即可  
等待安装完成，可以输入下面命令查看 Nginx 服务状态
```sh
sudo systemctl status nginx
```
安装完成后，Nginx 服务会自己启动，可以看到 Nginx 服务已经正常运行

### 配置文件部分说明

Nginx 配置文件路径默认在`/etc/nginx`  
可以输入下面命令查看 Nginx 配置文件位置
```sh
nginx -t
```

红框中即 Nginx 主要配置文件所在的位置  
`cd /etc/nginx`到 Nginx 目录下，`ls`查看结构  
- nginx.conf 即 Nginx 的主要配置文件，可以直接在该文件中进行修改（大多数教程也是这么做的），但是如果以后部署的服务多起来，都放在一个配置文件中则会显得混乱和臃肿
- 新版本的 Nginx 允许我们在 nginx.conf 中导入其他文件夹中的 .conf 文件，因此我们可以针对不同的服务，建立不同的 conf 配置文件，方便管理
- 而 Nginx 已经为我们建好了一个文件夹，并且导入到了配置文件中，即 conf.d 文件夹，我们可以直接在该文件夹下新建和添加配置文件
- 注：nginx.conf 中有关于 Nginx 整体的相关配置，但这里不多介绍，我们也不去修改

### 新建配置文件

在`/etc/nginx/conf.d`路径下新建一个xxx.conf`文件，文件名可以自己取，**文件后缀`.conf`**
```sh
touch /etc/nginx/conf.d/xxx.conf
```

### 编辑配置文件

使用 vim 打开编辑该文件
```sh
vim /etc/nginx/conf.d/xxx.conf
```
输入`i`进入编辑模式（在英文输入法下）

``` vim
server {  
    ## 监听的端口号（即想要访问的前端服务的端口）  
    listen 5173;  
    server_name localhost;  
  
    location / {  
        ## 打包文件的路径  
        root /var/www/xxx;  
        index index.html;  
        ## 此处的 @router 实际上是引用下面的转发，否则在 Vue 路由刷新时可能会抛出 404  
        try_files $uri $uri/ @router;  
    }  
  
    ## 由于路由的资源不一定是真实的路径，无法找到具体文件  
    ## 所以需要将请求重写到 index.html 中，然后交给真正的 Vue 路由处理请求资源  
    location @router {  
        rewrite ^.*$ /index.html last;  
    }  
  
    ## 将所有 ip:port/api 的请求转发到对应的后端地址（根据自己实际情况修改）  
    location /api {  
	    ## 填写后端服务的端口（如果不是同一台服务器则填写对应服务器的地址）  
        proxy_pass http://localhost:8080;  
    }  
}
```


再把前面后端的配置文件补充到同一个配置文件就成了。
按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

### 重启 Nginx

输入下面命令重启 Nginx 以应用修改后的配置文件
```sh
sudo nginx -s reload
```


### 云服务器放行端口

想要访问前端页面，需要将服务对应运行的端口（比如我这边就是在`5173`端口）放开，不然直接访问是访问不到的  
在云服务器厂商找到对应云服务器的防火墙，并放行 5173 端口（对应你自己前端的运行端口）  


### 测试访问

在浏览器输入`ip:5173`（对应你自己的`ip:port`），就可以看到能正常访问

### 绑定域名（可选）

前面是直接使用 ip:port 去访问前端，现在我想要通过域名去访问

#### 前提

需要有一个解析到该服务器的域名（可以创建一个子域名）

#### 编辑配置文件

依旧是编辑`/etc/nginx/conf.d/xxx.conf`文件
```sh
vim /etc/nginx/conf.d/xxx.conf
```
输入`i`进入编辑模式（在英文输入法下）
```vim
server {  
    listen 80;  
    ## 前端绑定的域名  
    server_name phlin.top;  
  
    location / {  
        ## 打包文件的路径  
        root /var/www/xxx;  
        index index.html;  
        ## 此处的 @router 实际上是引用下面的转发，否则在 Vue 路由刷新时可能会抛出 404  
        try_files $uri $uri/ @router;  
    }  
  
    ## 由于路由的资源不一定是真实的路径，无法找到具体文件  
    ## 所以需要将请求重写到 index.html 中，然后交给真正的 Vue 路由处理请求资源  
    location @router {  
        rewrite ^.*$ /index.html last;  
    }  
  
    ## 将所有 ip:port/api 的请求转发到对应的后端地址（根据自己实际情况修改）  
    location /api {  
	    ## 填写后端服务的端口（如果不是同一台服务器则填写对应服务器的地址）  
        proxy_pass http://localhost:8080;  
    }  
}
```
在原先的基础上修改

- `listen`修改为 80，表示的是监听的端口，因为 http 请求默认访问的是 80 端口，举例来说当我们在访问`www.baidu.com`的时候其实访问的是`www.baidu.com:80`，不过 80 可以省略
- 在`server_name`填入你要绑定的域名，比如我这边就是phlin.top`

修改完后按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

#### 测试访问

`sudo nginx -s reload`重启 Nginx 以应用修改  
**注：需要确保云服务器 80 端口放开**  
在浏览器输入`http://phlin.top`（对应你自己的域名）  
可以看到能正常访问

#### 配置 SSL 证书（可选）

前面只能用 http 进行访问，现在我想要用 https 进行访问，并且在使用 http 访问时强制跳转 https

##### 前提

- 有对应域名的 SSL 证书，可以去申请免费的 SSL 证书
- 转换 SSL 证书，主要需要`.crt`和`.key`文件，具体可以自行搜索
- **注：如果配置了后端域名的 SSL 证书，需要另外再申请一个给当前前端的域名**

##### 上传证书文件

在`/etc/nginx`目录下新建一个 cert 文件夹存放证书
```sh
## 在 /etc/nginx 路径下执行  
mkdir cert
```
将转换得到的`.crt`和`.key`文件上传到服务器的`/etc/nginx/cert`文件下  

##### 编辑配置文件

依旧是编辑`/etc/nginx/conf.d/xxx.conf`文件
```sh
vim /etc/nginx/conf.d/xxx.conf
```
输入`i`进入编辑模式（在英文输入法下）
```vim
server {  
    listen 80;  
    ## 前端绑定的域名  
    server_name phlin.top;  
    ## 强制跳转https  
    rewrite ^/(.*) https://$server_name$request_uri? permanent;  
}  
  
server {  
    ## SSL 默认访问端口号为 443  
    listen 443 ssl;  
    ## 请填写绑定证书的域名  
    server_name phlin.top;  
    ## 请填写证书文件的相对路径或绝对路径  
    ssl_certificate /etc/nginx/cert/xxx.crt;  
    ## 请填写私钥文件的相对路径或绝对路径  
    ssl_certificate_key /etc/nginx/cert/xxx.key;  
    ssl_session_timeout 5m;  
    ## 请按照以下协议配置  
    ssl_protocols TLSv1.2 TLSv1.3;  
    ## 请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。  
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;  
    ssl_prefer_server_ciphers on;  
  
    location / {  
        ## 打包文件的路径  
        root /var/www/xxx;  
        index index.html;  
        ## 此处的 @router 实际上是引用下面的转发，否则在 Vue 路由刷新时可能会抛出 404  
        try_files $uri $uri/ @router;  
    }  
  
    ## 由于路由的资源不一定是真实的路径，无法找到具体文件  
    ## 所以需要将请求重写到 index.html 中，然后交给真正的 Vue 路由处理请求资源  
    location @router {  
        rewrite ^.*$ /index.html last;  
    }  
  
    ## 将所有 ip:port/api 的请求转发到对应的后端地址（根据自己实际情况修改）  
    location /api {  
	    ## 填写后端服务的端口（如果不是同一台服务器则填写对应服务器的地址）  
        proxy_pass http://localhost:8080;  
    }  
}
```
用上述代码覆盖原先的配置,再把后端配置同步一下。
然后按`Esc`退出编辑模式，输入`:wq`（包括`:`，在英文输入法下）后回车即保存退出

##### 测试访问

`sudo nginx -s reload`重启 Nginx 以应用修改  
**注：需要确保云服务器 80 和 443 端口放开**  
在浏览器输入`https://phlin.top`（对应你自己的域名）  
可以看到能正常访问  
实际在访问 http 时也会强制跳转到 https，这里就不做演示了

## 文章出处
[Ubuntu 部署 Gin+Vue 前后端分离项目](https://www.lonesome.cn/posts/ubuntu-deploy-gin-and-vue-project/)