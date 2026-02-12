---
title: eino学习小记(二)
date: 2025-03-22 17:14:28
updated: 2025-03-22 17:14:28
description: "书接上回，笔者谈到原来的项目只是人为先去使用工具然后再给ai，而且也没有发挥eino框架的https://www.cloudwego.io/zh/docs/eino/core_modules/chain_and_graph_orche..."
keywords:
  - "golang"
  - "eino"
  - "cloudwego"
  - "开发"
index_img: https://qiuniu.phlin.cn/bucket/20250322170230283.png
categories: 开发
tags:
  - golang
  - eino
  - cloudwego
---
书接上回，笔者谈到原来的项目只是人为先去使用工具然后再给ai，而且也没有发挥eino框架的[编排功能](https://www.cloudwego.io/zh/docs/eino/core_modules/chain_and_graph_orchestration/)(~~这玩意是真不大会写~~)


## 什么是编排：
一个大模型应用，除了需要这些原子能力之外，还需要根据场景化的业务逻辑，**对这些原子能力进行组合、串联**，这就是 **『编排』**。

大模型应用的开发有其自身典型的特征： 自定义的业务逻辑本身不会很复杂，几乎主要都是对『原子能力』的组合串联。


## 进一步完善
在之前的项目原有基础上让 AI 绑定工具并进行功能调用。最初的想法是只是让 AI 绑定调用工具并执行操作，但问题在于，实际效果AI 仅仅完成了调用，并没有进一步与工具获取的内容进行交互。这让我意识到，应该在后续的环节加入一个模型来处理与工具获取的内容的对话和交流。

尝试修改代码的过程中，我发现自己对编排和在链路中调用工具的实现并不清楚，尽管不断调整代码，还是无法有效地写出清晰的编排代码。

于是，我决定转向使用 Eino 官方提供的 [EinoDev 插件](https://www.cloudwego.io/zh/docs/eino/core_modules/devops/)，它在 Goland 和 VSCode 中都有支持。特别是在 Goland 中，Eino 提供的可视化编排插件使得我们能够通过拖拽组件来实现图形化的编排，生成代码，并且支持 JSON 导入导出。

简而言之，这个插件让我们能够将更多精力集中在具体的业务逻辑上，而不必过于担心链路的代码实现。

如下图所示，我们可以在可视化界面上设计链路，确保上游节点的输入输出类型匹配。之后，就可以生成相应的项目代码，再补充配置信息和业务逻辑，即可实现我们想要的效果。

![eino学习小记(二)配图](https://qiuniu.phlin.cn/bucket/20250322170230283.png)

之后，生成的代码架构大致如下：
![eino学习小记(二)配图](https://qiuniu.phlin.cn/bucket/20250322173309897.png)
之后我们再进入把配置信息和业务逻辑补齐就可以实现自己想要的效果了

具体代码详见[我的仓库]((https://github.com/Penryn/eino-llm)，欢迎自取！OvO

ps：
1. 目前可视化界面生成的节点名称可能会与实际生成的节点名称不同，导致一些节点之间的混乱。
2. 目前插件生成的代码仅支持 Graph，虽然 Chain 可以看作是 Graph 的简化封装。


## 参考资料
[Eino用户手册](https://www.cloudwego.io/zh/docs/eino/)

<!-- auto-internal-links -->
## 延伸阅读
- [文章归档](/archives/)
- [分类导航](/categories/)
- [标签导航](/tags/)
- [同分类更多内容](/categories/%E5%BC%80%E5%8F%91/)
