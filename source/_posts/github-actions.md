---
title: GitHub Actions实现自动部署
date: 2024-10-01 16:52:28
keywords:
  - "golang"
  - "github"
  - "运维"
updated: 2024-10-01 16:52:28
description: "由于每次写完项目都要手动构建二进制文件，再使用smtp上传到服务器，最后再重启服务，这一系列操作过于麻烦，于是尝试使用GitHub Actions 来创建自动化的 CI/CD（持续集成/持续部署）流程。"
categories: 运维
tags:
  - golang
  - github
---
每次部署 Go 项目，我都要先构建二进制文件，再上传到服务器，最后重启服务。这篇记录怎样用 GitHub Actions 串起这几步，让推送代码后能自动完成部署。

## 介绍

GitHub Actions 根据仓库事件运行工作流，可以用来构建、测试或部署。下面这个例子需要先分清五个概念：

| 概念 | 在这个部署流程里的作用 |
| --- | --- |
| Event | `push` 到指定分支时触发，也可以按 PR、定时或发布等事件触发 |
| Workflow | `.github/workflows/` 下的 YAML 文件，组织整个自动化流程 |
| Job | 一组在指定 runner 环境中执行的步骤；多个 job 可以按依赖串行或并行 |
| Step | job 中的一步，执行命令或调用 action |
| Action | 可复用的操作，例如检出代码或准备 Go 环境 |

具体定义见 [官方文档](https://docs.github.com/zh/actions)。这里用一个 job 完成构建、SCP 上传和远程重启服务，服务器上的目录、SSH 权限与 systemd 服务需要事先准备好。

## 配置 GitHub Actions

### 创建 GitHub Actions Workflow 文件
在项目的根目录下创建 `.github/workflows/deploy.yml` 文件。这个文件定义了你的自动化工作流流程。
```yml
name: easy-forum

on:
  push:
    branches:
      - main  # 当推送到 main 分支时触发工作流

jobs:
  build:
    runs-on: ubuntu-22.04

    steps:
      # 检出代码
      - name: Checkout code
        uses: actions/checkout@v3

      # 设置 Go 语言环境
      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: '1.21.0'  # 使用你项目的 Go 版本

      # 编译 Go 项目为二进制文件
      - name: Build project
        run: go build main.go  # 将项目编译为可执行文件

      # 上传二进制文件到服务器
      - name: Upload binary to server via scp
        uses: appleboy/scp-action@v0.1.4
        with:
          host: ${{ secrets.SERVER_HOST }}  # 服务器 IP 或域名
          username: ${{ secrets.SERVER_USER }}  # SSH 用户名
          key: ${{ secrets.SSH_PRIVATE_KEY }}  # GitHub Secrets 中存储的 SSH 私钥
          source: "main"  # 二进制文件
          target: "/opt/go/easy-forum"  # 上传到服务器的路径

      # 配置并重启 systemd 服务
      - name: restart systemd service
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
             # 设置权限
             sudo chmod 740 /opt/go/easy-forum/main
            
             # 启动或重启服务
             sudo systemctl restart easy-forum.service


```
该配置文件的主要过程是：
- 编译生成二进制文件。
- 将二进制文件上传到服务器。
- 通过 SSH 重启已经配置好的 `systemd` 服务。
## 配置 GitHub Secrets
为了确保 SSH 连接的安全性，你可以将敏感信息（如服务器 IP、SSH 密钥等）存储在 GitHub Secrets 中。

1. 进入 GitHub 仓库的页面。
2. 点击 `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`。
3. 添加以下 Secrets：
    - `SERVER_HOST`: 服务器的 IP 地址或域名。
    - `SERVER_USER`: SSH 连接使用的用户名。
    - `SSH_PRIVATE_KEY`: 服务器的 SSH 私钥（需要在服务器上配置公钥）。

#### 如何生成 SSH 密钥
你可以通过以下命令生成 SSH 密钥对：
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```
生成的私钥可以用于 `SSH_PRIVATE_KEY`，而公钥需要放置在你服务器的 `~/.ssh/authorized_keys` 文件中。

## 验证部署
以上步骤完成，你可以推送main分支，然后看见github会自动开始构建，
成功后会有以下页面
![GitHub Actions实现自动部署配图](https://qiuniu.phlin.cn/bucket/202410011647581.png)

到服务器也可以通过输入以下命令查看服务是否运行
```sh
sudo systemctl status easy-forum.service
```

## 补充
如果还要自动创建或更新 `systemd` 服务文件，可以继续把相应命令放进工作流。上面的示例只处理已有服务的重启。

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E8%BF%90%E7%BB%B4/)
