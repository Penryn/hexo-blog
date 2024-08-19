---
title: neo4j安装
date: 2024-04-26 17:55:55
summary: Ubuntu安装neo4j
categories: 运维
tags: 
 - ubuntu
 - neo4j

img: ../picture/createblog/bg.jpg
coverImg: ../picture/createblog/bg.jpg
---

首先更新apt
```
sudo apt update
sudo apt upgrade
```

neo4j需要依赖jdk环境，而且还有版本要求的
要求jdk要17版本以上
```
sudo apt install openjdk-17-jdk
```
查看是否成功安装
```
java -version
```
开始安装neo4j
```
wget https://neo4j.com/artifact.php?name=neo4j-community-5.17.0-unix.tar.gz -O neo4j-community-5.17.0-unix.tar.gz
```
解压运行
```
tar -xf neo4j-community-5.17.0-unix.tar.gz
```

到这里就成功安装了,然后就进入工作目录运行,这是后台一直运行的，不需要存为service
```
cd neo4j-community-5.17.0
sudo ./bin/neo4j start
```
当然，也可以停止
```
sudo ./bin/neo4j stop
```

远程连接设置，打开配置文件
```
sudo vim conf/neo4j.conf
```
修改以下代码为true和监听地址修改
```
# Bolt connector
server.bolt.enabled=true
server.bolt.tls_level=DISABLED
server.bolt.listen_address=:7687
server.bolt.advertised_address=:7687

# HTTP Connector. There can be zero or one HTTP connectors.
server.http.enabled=true
server.http.listen_address=:7474
server.http.advertised_address=:7474

server.default_listen_address=0.0.0.0
```
接着保存退出，重新启动服务
cd neo4j-community-5.17.0
sudo ./bin/neo4j stop
sudo ./bin/neo4j start

最后再云服务器的安全组开放7474和7687两个端口就可以在外面连接该服务器运行的neo4j的知识图谱网页版了。
http://（你的ip）:7474/browser/