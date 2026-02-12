---
title: mongodb安装
date: 2024-04-26 17:24:13
categories: 运维
tags: 
 - ubuntu
 - mongoDB
---

问卷系统要求用MongoDB存放答卷数据，因此我在我云服务器上安装了MongoDB

这是官方的[安装教程](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/#std-label-install-mdb-community-ubuntu)

下面简单介绍我的安装过程

我的云服务器系统：ubuntu22.04 LTS

先运行下面这行代码检查服务器系统是否是ubuntu22.04 LTS或ubuntu20.04 LTS
```
cat /etc/lsb-release
```
## 本地安装
### 导入包管理系统使用的公钥
从终端安装，gnupg如果curl它们尚不可用：
```
sudo apt-get install gnupg curl
```
要导入 MongoDB 公共 GPG 密钥，请运行以下命令：
```
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor
```

### 为 MongoDB 创建列表文件
/etc/apt/sources.list.d/mongodb-org-7.0.list为您的 Ubuntu 版本创建列表文件 。

22.04
```
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```
20.04
```
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```


### 重新加载本地包数据库
发出以下命令重新加载本地包数据库：
```
sudo apt-get update
```

### 安装 MongoDB 包
```
sudo apt-get install -y mongodb-org
```

这样我们就安装好了数据库

接下来我们检查一下是否安装成功，并启动一下
```
sudo systemctl start mongod
```
如果您在启动时收到类似以下内容的错误 mongod：
Failed to start mongod.service: Unit mongod.service not found.

首先运行以下命令：
```
sudo systemctl daemon-reload
```

验证 MongoDB 是否已成功启动
```
sudo systemctl status mongod
```

其他操作
```
sudo systemctl enable mongod
sudo systemctl stop mongod
sudo systemctl restart mongod
```


### 新增用户
MongoDB好像是可以直接免用户登录的，我们先设置一个用户供我们外部数据库连接

先启动打开数据库
```
mongosh
use admin
```

然后输入,user和pwd可根据自己更改
```
//这个可以用例如datagrip去连接
db.createUser(
  {
    user: "admin",
    pwd: "abc123",
    roles: [
      { role: "userAdminAnyDatabase", db: "admin" },
    ]
  }
)

```
如果返回结果是 { ok: 1 }，那么表示用户创建成功。这意味着 new_root 用户已经被成功创建，并且被赋予了该用户具有对数据库的读取和修改权限。

我们可以去查看一下是否创建成功 
```
db.getUsers()
```

然后在QA也是
```
//这个用程序去连接
use qa
db.createUser(
  {
    user: "new_root",
    pwd: "abc123",
    roles: [
      { role: "readWrite", db: "QA" }
    ]
  }
)
```
我们可以看到上面出现了new_root这个用户了

### 远程连接
MongoDB默认是只能本地连接
所以我们要去配置文件更改一下，MongoDB的配置文件存在（ /etc/mongod.conf）
```
sudo vim /etc/mongod.conf
```
找到 bindIp 配置项，并将其值改为 0.0.0.0，表示允许来自任何 IP 地址的连接：
```
bindIp: 0.0.0.0
```
找到security:
去除#，并加上
```
authorization: enabled
```
保存并关闭文件，然后重新启动 MongoDB 服务：
```
sudo systemctl restart mongodb
```

最后要记得到云服务器的安全组开放27017端口（~~建议换个开发端口，27017端口真是太不安全了~~）

之后进入就要
```
mongosh -u new_root -p
```
然后输入密码


以上就可以安装好了

注意设置账号密码后，登录需要密码，同时也要设置对应数据库，默认是admin的数据库，操作如下：
```
mongosh --username yourUsername --password yourPassword --authenticationDatabase yourDatabaseName
```

## docker安装
先拉取docker镜像
```
docker pull mongo:latest
```
启动运行镜像，并新建管理员账号
```
docker run --name mongodb -d -p 28017:27017 -v /home/data/mongo:/data/db -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=abc123 mongo
```
进入容器
```
docker exec -it mongodb /bin/bash
```
进入mongo,并输入密码
```
mongosh -u root -p
```
进入默认test，我们可以取admin看我们刚创建的管理账号
```
use admin
db.getUsers()
```
QA表新建用户给程序使用
```
use qa
db.createUser(
  {
    user: "new_root",
    pwd: "abc123",
    roles: [
      { role: "readWrite", db: "QA" }
    ]
  }
)
db.getUsers()
```

## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E8%BF%90%E7%BB%B4/)
