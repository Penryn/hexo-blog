---
title: GitHub Actions实现自动部署
date: 2024-10-01 16:52:28
updated: 2024-10-01 16:52:28
description: "由于每次写完项目都要手动构建二进制文件，再使用smtp上传到服务器，最后再重启服务，这一系列操作过于麻烦，于是尝试使用GitHub Actions 来创建自动化的 CI/CD（持续集成/持续部署）流程。"
keywords:
  - "golang"
  - "github"
  - "运维"
index_img: https://qiuniu.phlin.cn/bucket/202410011647581.png
categories: 运维
tags:
  - golang
  - github
---
由于每次写完项目都要手动构建二进制文件，再使用smtp上传到服务器，最后再重启服务，这一系列操作过于麻烦，于是尝试使用GitHub Actions 来创建自动化的 CI/CD（持续集成/持续部署）流程。

## 介绍
GitHub Actions 是 GitHub 提供的一项**持续集成和持续部署（CI/CD）**服务，它允许你自动化、定制并执行各种任务。这些任务可以是**编译代码、运行测试、部署应用、发布软件包**等，几乎涵盖了软件开发的整个生命周期。

### 主要功能和概念

#### 1. **工作流（Workflow）**

工作流是 GitHub Actions 的核心部分。它是定义在 `.yml` 文件中的一系列步骤和任务。这些步骤可以自动化你的项目的某些操作，比如在每次推送代码时进行代码测试或在发布新版本时自动部署到服务器。

- 工作流文件存放在仓库的 `.github/workflows/` 目录下。
- 你可以根据需要创建多个工作流文件。
- 每个工作流可以根据不同的触发条件运行，比如推送代码、创建 Pull Request、发布标签等。

#### 2. **事件（Event）**

事件是触发工作流执行的条件。例如：

- **push**：每当代码被推送到仓库时触发工作流。
- **pull_request**：每当创建或更新 Pull Request 时触发。
- **schedule**：在设定的时间表（如每天凌晨）执行。
- **release**：当创建一个新版本时执行。

#### 3. **作业（Job）**

每个工作流由一个或多个作业组成。一个作业是一个独立的任务，通常包含多个步骤。作业可以并行或串行执行。每个作业可以在指定的虚拟环境中运行，比如 Linux、Windows 或 macOS。

#### 4. **步骤（Step）**

步骤是作业中的具体操作。每个步骤通常是执行一条命令或调用一个动作（Actions）。步骤是工作流的最小单元，按顺序执行。

#### 5. **动作（Action）**

动作是步骤中的一个独立任务，它是复用的代码片段，可以是你自己编写的，也可以是社区共享的。在工作流中可以直接使用这些动作来完成特定任务，例如拉取代码、运行测试、部署应用等。

GitHub 提供了许多**官方的 Actions**，同时你也可以在 GitHub Marketplace 中找到由其他开发者创建的 Actions。

[官方文档](https://docs.github.com/zh/actions)有许多详细介绍，下面就以部署go项目为例

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
- 配置 `systemd` 守护进程，自动管理项目的启动、重启和服务运行。
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
当然，其实可以在在配置文件中，让GitHub Actions自动配置 `systemd` 服务文件的，这里就不再多写了，可以自行尝试。

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E8%BF%90%E7%BB%B4/)
