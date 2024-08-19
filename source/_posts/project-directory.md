---
title: go的标准项目布局
date: 2024-05-12 22:31:30
img: ../picture/createblog/bg.jpg
summary: go的目录结构介绍
categories: 后端
tags:
  - go
coverImg: ../picture/createblog/bg.jpg
---

因为笔者一开始是在精弘暑期课入门的go，因此主要学习的还是部门项目微精弘的代码目录结构，所以对go的标准目录结构不是很了解，特此出一篇文章来捋一下go现在比较规范的目录结构，以此来学习。

### 目录规范
虽然每个项目的目录结构并不是有规定模板的，也有很多优秀的项目并不是常规的项目布局，还是要依据项目类型、大小及灵活程度做调整，但一定要保证结构清晰！
一般要求：

* 命名清晰：目录命名要清晰、简介，不宜过长或过短。目录名要求能清晰表达出该目录所要实现的功能，在清晰表达的基础上最好用单数，避免单复混用的情况。
* 功能明确：一个目录所要实现的功能应该是明确的、并且在整个项目目录中具有高辨识度。
* 全面性：目录结构应该尽可能全面地包含研发过程中需要的功能，例如文档、脚本、源码管理、API 实现、工具包、第三方包、测试、编译产物等。
* 可预测性：项目规模一般是从小到大的，所以一个好的目录结构应该能够在项目变大时，仍然保持之前的目录结构。
* 可扩展性：每个目录下存放了同类的功能，在项目变大时，这些目录应该可以存放更多同类功能

### 目录类型 
根据项目的功能，目录结构可以分为两种：
* 平铺式目录结构
* 结构化目录结构


### 平铺式目录结构
当一个项目是体量较小或是一个工具库时，适合使用平铺式目录结构。项目的代码都存放在项目的根目录下，可以减少项目引用路径的长度。例如 github.com/golang/glog：

### 结构化目录结构
当前 Go 社区比较推荐的结构化目录结构是 [project-layout](https://github.com/golang-standards/project-layout/blob/master/README_zh.md) 。虽然它并不是官方和社区的规范，但因为组织方式比较合理，被很多 Go 开发人员接受并推荐，因此我现在先以这个作为规范。

#### 微精弘目录架构
在讲这个新的目录结构前，我先来聊聊wjh的目录结构
```
├── app 
│   ├── apiException           //定义统一的错误码
│   ├── config                 //从数据库获取配置信息
│   ├── controllers            // 控制器，主要包括了处理函数
│   ├── midwares               // 中间件
│   ├── models                 // 模型
│   ├── services               // 业务逻辑，与数据库进行交互
│   └── utils                  // 一些封装好的工具
├── config                     // 
│   ├── api                    //一些api常量的定义
│   ├── config                 //对viper的初始化
│   ├── database               //对数据库（如mysql或mongodb）的初始化和自动建
│   ├── router                 //路由的定义
│   ├── redis                  //redis的配置和初始化
│   ├── session                //session的配置和初始化
│   └── wechat                 //微信配置和初始化
├── dockerfile                 //docker制作文件
├── docker-compose.yml         //Docker Compose 工具使用的配置文件
├── go.mod                     //用于管理项目的依赖关系
├── go.sum                     //为了确保在构建项目时，使用的确切依赖项版本与最初确定的版本相匹配
├── main.go                    //主入口文件
├── Makefile                   //如何构建和编译项目的文本工具
```
yysy，这个目录结构还是比较简单且清晰的，易于新手理解

#### project-layout目录架构
```
project-layout/
├── api                       # 存放 API 定义文件，如 OpenAPI/Swagger 规范或 gRPC 服务定义
├── cmd                       # 包含应用程序的入口点，每个应用程序的可执行文件的 main 包
├── chart                     # Helm Chart 文件夹，用于 Kubernetes 部署（如果使用 Helm）
├── conf                      # 存放配置文件，如 YAML、JSON 格式的配置
├── docs                      # 项目文档，可能包括 API 文档、开发者指南等
│   ├── dev                   # 开发者文档
│   │   ├── en-US             # 英文文档
│   │   └── zh-CN             # 中文文档
│   ├── guide                 # 用户指南或教程
│   │   ├── en-US             # 英文指南
│   │   └── zh-CN             # 中文指南
│   └── README.md             # 项目 README 文档
├── examples                  # 项目使用示例，可能包括代码片段或完整的示例应用程序
├── go.mod                    # Go Modules 模块依赖文件
├── go.sum                    # Go Modules 模块依赖的校验和
├── hack                      # 构建脚本、CI 配置和辅助工具
│   ├── include              # Makefile 片段，被根 Makefile 包含
│   ├── scripts              # 存放用于构建、测试、部署等的 Shell 脚本
│   └── docker                # Docker 相关配置，如 Dockerfile 和 Docker Compose 文件
├── internal                  # 项目内部包，包含服务器、模型、配置等
│   ├── app                   # 应用程序的主体逻辑
│   │   └── server.go        # 服务器初始化和启动
│   ├── global                # 全局可用的配置和初始化代码
│   │   └── config            # 配置加载和解析
│   ├── http                  # HTTP 相关代码
│   │   ├── router            # 路由注册
│   │   ├── middleware        # 中间件逻辑
│   │   ├── dao               # 数据访问对象层
│   │   ├── controllers       # 控制器，处理 HTTP 请求
│   │   └── services          # 业务逻辑服务层
│   ├── models                # 数据模型定义
│   │   ├── user.go           # 用户模型定义
│   │   └── ...
│   └── pkg                  # 内部工具包
│       ├── code.go          # 错误码定义
│       ├── utils             # 内部使用的工具函数
│       ├── log               # 日志配置和管理
│       ├── database          # 数据库连接和初始化
│       ├── session           # 会话管理
│       └── redis             # Redis 配置和管理
├── logs                     # 日志文件输出目录
├── LICENSE                   # 项目许可证文件
├── Makefile                  # 根 Makefile 文件，包含构建和编译项目的指令
├── pkg                       # 可被外部引用的全局工具包
│   └── util                  # 通用工具代码
├── README.md                  # 项目 README 文档，通常提供项目概览和快速开始指南
├── vendor                    # 存放项目依赖包（在使用 Go Modules 之前的做法，现在通常由 go.mod 和 go.sum 管理）
├── deployments               # 部署相关的配置和模板文件，如 Docker、Kubernetes 配置
├── test                      # 测试代码，包括单元测试、集成测试和端到端测试
│   ├── testdata              # 测试数据文件
│   └── e2e                   # 端到端测试代码
├── web                       # 前端资源文件，如 React、Vue 项目生成的静态资源
├── public                    # 公共静态资源，如未构建的前端资源或可直接访问的静态文件
└── .gitignore                # Git 忽略文件配置
```

经过多方参考，最终形成这样的一个目录，好的目录结构，总能让人眼前一亮，舒舒服服的看下去。项目的目录结构并没有一个强制性规范，我们应该不断看优秀的项目的结构目录，不断优化自己的架构意识，使得自己项目的扩展性加大的同时还能保证清晰。加油(ง •_•)ง