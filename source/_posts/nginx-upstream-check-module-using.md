---
title: 使用nginx_upstream_check_module做流量切换
date: 2024-09-05 03:11:25
categories: 运维
tags:
  - nginx
---

# 前情提要
要考虑内外网正方和统一的流量切换，笔者首先想到的是nginx好像也有健康检查功能，但原生的nginx,只有被动的健康检查能力，即仅在有请求时才会检测后端节点的健康状态。后面在黑白的建议下，发现有nginx_upstream_check_module这个不错的第三方模块，可以实现主动的健康检查。
## 主动健康检查的概念

主动健康检查指的是 Nginx 定期主动地向后端服务发送探测请求，检查其健康状态。当发现某个服务出现异常时，Nginx 会将其从健康列表中移除；当服务恢复正常时，Nginx 会将其重新加入健康列表。与 Nginx 自带的被动健康检查不同，`nginx_upstream_check_module` 提供了更加平滑的业务切换功能。

## 使用 `nginx_upstream_check_module` 的优势

- **主动健康检查**：`nginx_upstream_check_module` 提供主动式的健康检查，定期向后端服务发送探测请求。与 Nginx 自带的被动检查不同，它能够主动检测后端服务的状态。
- **健康检查包类型**：若使用 HTTP 健康检查包，Nginx 会按照设定的间隔向后端服务器发送 HTTP 请求，并根据期望的 HTTP 状态码判断服务是否健康。
- **避免故障节点**：当后端节点不可用时，请求不会被转发到故障节点，从而提高请求的成功率和系统的整体稳定性。
- **自动恢复**：当故障节点恢复正常后，请求会自动转发到恢复的节点，确保业务的持续可用性。
- **可配置性**: 提供多种配置选项，如检查频率、超时时间、重试次数等，可以根据实际需求进行调整。
- **统计信息**: 可以提供有关健康检查结果的统计信息，这些信息有助于监控和调优负载均衡配置。



# 本地编译安装
要为已经安装好的 NGINX 添加 `nginx_upstream_check_module` 模块，通常需要重新编译 NGINX，因为大多数第三方模块都需要在编译时进行集成。下面是大致的步骤：

### 1. 准备环境

首先，确保你有以下软件已安装：
- GCC 编译器
- make
- NGINX 依赖库（如 `libpcre3-dev`, `zlib1g-dev`, `libssl-dev`）

```bash
sudo apt-get update
sudo apt-get install build-essential libpcre3 libpcre3-dev zlib1g zlib1g-dev libssl-dev
```

### 2. 获取 NGINX 源代码

下载与你当前安装版本一致的 NGINX 源代码(笔者是1.26.2)：

```bash
cd /usr/src
wget http://nginx.org/download/nginx-<你的版本号>.tar.gz
tar -zxvf nginx-<你的版本号>.tar.gz
cd nginx-<你的版本号>
```

### 3. 获取 `nginx_upstream_check_module` 源码

从 GitHub 克隆 `nginx_upstream_check_module` 的源码：

```bash
git clone https://github.com/yaoweibin/nginx_upstream_check_module.git
```

### 4. 配置和编译 NGINX

在编译时添加 `nginx_upstream_check_module` 模块：

```bash
patch -p1 < nginx_upstream_check_module/check_1.20.1+.patch
./configure --with-http_ssl_module --add-module=nginx_upstream_check_module
make
```

### 5. 安装编译好的 NGINX

```bash
sudo make install
```

### 6. 添加环境变量
你可能执行第七步时显示找不到nginx，可能是你已经将 Nginx 安装到了 `/usr/local/nginx` 目录下，而不是默认的 `/usr/sbin` 目录。
```
export PATH=$PATH:/usr/local/nginx/sbin
```
### 7. 验证安装

重启 NGINX 并检查是否正确加载了模块：

```bash
nginx -V
```

在输出的配置选项中，应该能看到 `--add-module=.../nginx_upstream_check_module`。

其他命令
```bash
//启动
nginx 
// 停止
nginx -s quit
// 查看nginx进程
 ps aux | grep nginx
```

这样，你就能成功地为已安装的 NGINX 添加 `nginx_upstream_check_module` 模块了。
如果要设置为system，则在/etc/systemd/system/nginx.service添加
```vim
[Unit]
Description=A high-performance web server and reverse proxy server
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/usr/local/nginx/sbin/nginx -s quit
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
启动服务
```bash
sudo systemctl daemon-reload
sudo systemctl start nginx.service
sudo systemctl status nginx.service
```

以下是对应的nginx的配置文件
```vim
worker_processes auto;  # 根据CPU核心数量动态调整工作进程数，优化资源使用

events {
    worker_connections 10240;
    use epoll;  # 对于Linux系统，在高并发场景下效率更高
    multi_accept on;  # 在接收到通知后尽可能多地接受连接
}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    tcp_nopush on;  # 减少网络I/O延迟
    tcp_nodelay on;  # 立即发送小数据包，避免延迟
    keepalive_timeout 65;
    keepalive_requests 1000;  # 每个连接的最大请求数，减少开销
    client_max_body_size 10M;  # 限制请求体大小以增强安全性
    server_tokens off;  # 隐藏NGINX版本信息以提高安全性

    upstream backend {
        server backend1 max_fails=2 fail_timeout=10s weight=1; 
        server backend2 max_fails=2 fail_timeout=10s weight=1; 
		# backend1,backend2根据实际需要更改

        # 健康检查配置
        check interval=3000 rise=2 fall=5 timeout=3000 type=http;
        # 设置主动健康检查的时间间隔为 3000 毫秒（即 3 秒）
        # 后端节点恢复正常需要连续 2 次成功的健康检查
        # 后端节点被标记为故障所需的连续失败健康检查次数为 5 次
        # 每次健康检查的超时时间为 3000 毫秒（即 3 秒）
        # 使用 HTTP 协议进行健康检查
        check_http_expect_alive http_2xx http_3xx;
        # 配置期望的 HTTP 响应状态码，以判断后端服务是否健康
        check_http_send "GET / HTTP/1.0\r\n\r\n";
        # 配置发送给后端服务的 HTTP 请求内容 
        # "GET / HTTP/1.0\r\n\r\n" 表示发送一个 HTTP/1.0 协议的 GET 请求 
        # 请求路径为根目录（/），请求头为空
    }

    server {
        listen 80;
        server_name localhost;

        # 安全头信息
        add_header X-Frame-Options SAMEORIGIN;  # 防止点击劫持
        add_header X-Content-Type-Options nosniff;  # 防止MIME类型嗅探
        add_header X-XSS-Protection "1; mode=block";  # 启用XSS保护

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 增加代理大请求的缓冲区大小
            proxy_buffer_size 128k;
            proxy_buffers 4 256k;
            proxy_busy_buffers_size 256k;
            proxy_max_temp_file_size 0;

            # 代理超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查状态的访问位置
        location /status {
            check_status;
            access_log off;
            # allow 127.0.0.1;  # 限制访问为本地请求，增强安全性
            # deny all;
        }

        # 错误处理
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/local/nginx/html;  # 根据实际路径调整
        }
    }
}

```
# 构建成docker运行
首先在` /usr/src/nginx-<你的版本号>`的目录下新建一个Dockerfile，并写上这些内容
```vim
# 使用基础镜像
FROM ubuntu:22.04

# 安装构建依赖、工具以及 ping 和 curl
RUN apt-get update && \
    apt-get install -y \
    build-essential \
    libpcre3-dev \
    libssl-dev \
    zlib1g-dev \
    wget \
    iputils-ping \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /opt

# 复制 nginx 源代码到容器中
COPY nginx-1.26.2 /opt/nginx-1.26.2

# 切换到 nginx 源代码目录
WORKDIR /opt/nginx-1.26.2

# 执行配置、编译和安装
RUN  make install

# 设置 PATH 环境变量
ENV PATH="/usr/local/nginx/sbin:${PATH}"

# 清理不必要的文件，减少镜像体积
RUN apt-get purge -y build-essential && \
    apt-get autoremove -y && \
    rm -rf /opt/nginx-1.26.2 && \
    rm -rf /var/lib/apt/lists/*

# 可以后面补充 nginx 配置文件
COPY nginx.conf /usr/local/nginx/conf/nginx.conf

# 设置 Nginx 默认命令（更新为实际路径）
CMD ["nginx", "-g", "daemon off;"]
```
执行构建并运行
```bash
#构建
docker build -t check .
#运行
docker run -d -p 80:80 --name check check
#进入
docker exec -it check /bin/bash
```
# 用docker-compose模拟实现后端节点健康检查
编写`nginx.conf`
```vim
worker_processes auto;  # 根据CPU核心数量动态调整工作进程数，优化资源使用

events {
    worker_connections 10240;
    use epoll;  # 对于Linux系统，在高并发场景下效率更高
    multi_accept on;  # 在接收到通知后尽可能多地接受连接
}

http {
    include mime.types;
    default_type application/octet-stream;
    sendfile on;
    tcp_nopush on;  # 减少网络I/O延迟
    tcp_nodelay on;  # 立即发送小数据包，避免延迟
    keepalive_timeout 65;
    keepalive_requests 1000;  # 每个连接的最大请求数，减少开销
    client_max_body_size 10M;  # 限制请求体大小以增强安全性
    server_tokens off;  # 隐藏NGINX版本信息以提高安全性

    upstream backend {
        server web1:80 max_fails=2 fail_timeout=10s weight=1;
        server web2:80 max_fails=2 fail_timeout=10s weight=1;

        # 健康检查配置
        check interval=3000 rise=2 fall=5 timeout=3000 type=http;
        # 设置主动健康检查的时间间隔为 3000 毫秒（即 3 秒）
        # 后端节点恢复正常需要连续 2 次成功的健康检查
        # 后端节点被标记为故障所需的连续失败健康检查次数为 5 次
        # 每次健康检查的超时时间为 3000 毫秒（即 3 秒）
        # 使用 HTTP 协议进行健康检查
        check_http_expect_alive http_2xx http_3xx;
        # 配置期望的 HTTP 响应状态码，以判断后端服务是否健康
        check_http_send "GET / HTTP/1.0\r\n\r\n";
        # 配置发送给后端服务的 HTTP 请求内容 
        # "GET / HTTP/1.0\r\n\r\n" 表示发送一个 HTTP/1.0 协议的 GET 请求 
        # 请求路径为根目录（/），请求头为空
    }

    server {
        listen 80;
        server_name localhost;

        # 安全头信息
        add_header X-Frame-Options SAMEORIGIN;  # 防止点击劫持
        add_header X-Content-Type-Options nosniff;  # 防止MIME类型嗅探
        add_header X-XSS-Protection "1; mode=block";  # 启用XSS保护

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 增加代理大请求的缓冲区大小
            proxy_buffer_size 128k;
            proxy_buffers 4 256k;
            proxy_busy_buffers_size 256k;
            proxy_max_temp_file_size 0;

            # 代理超时设置
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # 健康检查状态的访问位置
        location /status {
            check_status;
            access_log off;
            # allow 127.0.0.1;  # 限制访问为本地请求，增强安全性
            # deny all;
        }

        # 错误处理
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/local/nginx/html;  # 根据实际路径调整
        }
    }
}

```
编写docker-compose.yml
```vim
version: '3.8'

services:
  nginx:
    build: .
    ports:
      - "80:80"
      - "18080:8080"
    networks:
      - mynetwork

  web1:
    image: nginx:alpine
    networks:
      - mynetwork

  web2:
    image: nginx:alpine
    networks:
      - mynetwork

networks:
  mynetwork:
    driver: bridge
```
一键启动
```vim
#启动
docker compose up --build -d
#进入
docker exec -it check-nginx-1 /bin/bash
#注销
docker compose down
```
## 运行效果
访问`localhost/status`就可以查看上流服务的结果
![](https://qiuniu.phlin.top/bucket/202409050238100.png)


### 字段解释

| 项目            | 解释                                                                                     |
|-----------------|------------------------------------------------------------------------------------------|
| **Index**       | 上游服务器在 `upstream` 组中的索引号，从 0 开始递增。                                      |
| **Upstream**    | 服务器所属的 `upstream` 组的名称。在这个例子中，组名为 `backend`。                         |
| **Name**        | 服务器的 IP 地址和端口号。例子中包括两个服务器：`192.168.32.4:80` 和 `192.168.32.2:80`。   |
| **Status**      | 服务器的健康状态：<br>- `up`: 服务器正常运行，能够响应请求。<br>- `down`: 服务器不健康或不可用。|
| **Rise Counts** | 自上次状态改变后，连续健康检查成功的次数。达到配置值后，服务器状态将从 `down` 变为 `up`。  |
| **Fall Counts** | 自上次状态改变后，连续健康检查失败的次数。达到配置值后，服务器状态将从 `up` 变为 `down`。  |
| **Check Type**  | 健康检查的类型，例如 `http`，表示通过 HTTP 请求检查服务器的健康状态。                      |
| **Check Port**  | 健康检查使用的端口：<br>- `0`: 使用上游服务器配置的默认端口（通常为 `80`）。               |
