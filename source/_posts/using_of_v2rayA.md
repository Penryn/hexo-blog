---
title: v2rayA的使用
date: 2024-07-13 23:45:14
img: ../picture/createblog/bg.jpg
summary: v2rayA的安装和使用
categories: 运维
tags:
  - Ubuntu
coverImg: ../picture/createblog/bg.jpg
---

由于这两天在捣鼓某些环境的安装，等待下载可以等半年，因此决定在云服务器上搞一下加速。

```
### 下载v2raya
wget https://github.com/v2rayA/v2rayA/releases/download/v2.2.5/v2raya_linux_x64_2.2.5

### 设置可执行权限 
chmod +x v2raya_linux_x64_2.2.5

### 运行
./v2raya_linux_x64_2.2.5
```

这样我们就启动好了这个v2rayA，但是我们要把这个作为在后台运行的服务（systemd）,因此创建并填写一个服务单元文件。

```
sudo touch /etc/systemd/system/v2raya.service

sudo vim /etc/systemd/system/v2raya.service

```
编辑内容如下
```
[Unit]
Description=v2rayA Service
After=network.target

[Service]
ExecStart=/home/v2raya_linux_x64_2.2.5  # 根据你的实际路径调整,注释要删掉。
Restart=always
RestartSec=3
User=<你的用户名>
Group=<你的用户名>
LimitNOFILE=4096

[Install]
WantedBy=multi-user.target

```
然后重新加载 Systemd 配置，并重新启动v2rayA 服务和查看服务状态。
```
sudo systemctl daemon-reload
sudo systemctl start v2raya
sudo systemctl status v2raya

```
我们还要在防火墙把2017端口（一般情况下）打开，这样我们就可以在浏览器上通过访问ip：2017查看v2rayA的web可视化界面。

把我们的订阅地址导入进去，点击我们想要地区的代理（是点右边的选择而不是左边的可选框，不然会显示failed to start v2ray-core: failed: no server is selected. please select at least one server的报错）。

但，当我们点击选择的时候会有failed to start v2ray-core: geoip.dat or geosite.dat file does not exist的报错，原因是要缺少下载v2ray-core，这时候我们只要再补一个就可以了。
```
# 安装 curl 和 jq
sudo apt-get update
sudo apt-get install curl jq

# 下载并运行 fhs-install-v2ray 脚本
curl -O https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release.sh
sudo bash install-release.sh
```

这个时候在回到可视化网址就会点击选择和启动就正常运行了。