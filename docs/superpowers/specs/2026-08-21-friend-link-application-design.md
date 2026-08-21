# 友链申请自动 PR 设计

## 目标

访客从博客友链页进入申请入口，在 GitHub Issue Form 中提交站点名称、简介、链接和头像。仓库自动校验申请，把合法数据写入独立分支并创建 PR；维护者审核并合并 PR 后，现有博客构建流程发布新友链。

## 非目标

- 不自动合并友链 PR。
- 不在浏览器端保存 GitHub Token。
- 不部署额外后端或 GitHub App。
- 不请求访客站点或头像地址，避免 SSRF、超时和不稳定的网络校验。
- 不检查对方是否已添加本站友链。
- 第一版不自动修改或删除已经合并的友链。

## 用户流程

1. 访客在 `/links/` 页面点击“申请友链”。
2. 浏览器打开本仓库的 `friend-link.yml` Issue Form。
3. 访客填写站点名称、站点简介、站点地址和头像地址，并确认申请须知。
4. Issue 创建、重新打开或编辑后，GitHub Actions 从默认分支运行受信任的脚本。
5. 脚本解析并校验 Issue，更新 `automation/friend-link-<issue-number>` 分支。
6. 脚本创建或更新一个面向 `main` 的 PR，并在 Issue 中回复 PR 链接。
7. PR 描述包含 `Closes #<issue-number>`。合并 PR 后，申请 Issue 自动关闭。

## 友链数据源

把当前 `themes/fluid/_config.yml` 中的 `links.items` 移到 `source/_data/fluid_config.json`。

Fluid 已经原生读取 `source/_data/fluid_config.*` 并覆盖主题配置。使用独立 JSON 文件有三个好处：

- 自动 PR 只修改一个小文件，diff 清晰。
- 不需要让自动化重写整份主题 YAML。
- 更新 Fluid 主题时不会覆盖友链数据。

每条友链保持现有字段：

```json
{
  "title": "站点名称",
  "intro": "一句话简介",
  "link": "https://example.com/",
  "avatar": "https://example.com/avatar.png"
}
```

`fluid_config.json` 同时启用 `links.custom`，在友链卡片下展示简短说明和指向 Issue Form 的申请按钮。

## 组件

### Issue Form

文件：`.github/ISSUE_TEMPLATE/friend-link.yml`

字段标签固定为：

- `站点名称`
- `站点简介`
- `站点地址`
- `头像地址`
- `申请确认`

标题固定以 `[友链申请]` 开头。工作流只处理使用这些稳定标题和字段标签的 Issue。

### 工作流

文件：`.github/workflows/friend-link-pr.yml`

工作流监听 `issues` 的 `opened`、`edited` 和 `reopened` 事件。Job 只在 Issue 标题以 `[友链申请]` 开头时执行，并声明最小权限：

- `contents: write`
- `issues: write`
- `pull-requests: write`

工作流使用 `actions/github-script` 调用仓库内脚本，不执行申请者提供的代码，也不使用 `pull_request_target`。

### 自动化脚本

文件：`.github/scripts/create-friend-link-pr.cjs`

脚本分成纯逻辑和 GitHub API 编排两层。纯逻辑负责：

- 按固定三级标题解析 Issue Form 生成的 Markdown。
- 拒绝缺失字段和重复字段。
- 限制名称为 1～80 个字符、简介为 1～160 个字符。
- 拒绝名称和简介中的换行及控制字符。
- 限制 URL 长度为 2048 个字符。
- URL 只允许 `http:` 和 `https:`，并拒绝用户名或密码。
- 对站点 URL 去除 fragment、末尾斜杠并归一化后查重。
- 向 `links.items` 追加数据，其他配置保持不变。

GitHub API 编排层负责：

- 从默认分支读取配置和 SHA。
- 使用 `automation/friend-link-<issue-number>` 分支保证幂等。
- Issue 被编辑后更新同一分支和 PR，不重复创建。
- 已存在相同站点时不创建 PR，并回复原因。
- 用带隐藏标记的单条 Bot 评论报告状态，重复运行时更新原评论。

### 输出安全

Fluid 当前用未转义 EJS 输出友链名称和简介。实现时改为转义输出，确保 Issue 中的文本即使包含 HTML，也只会显示为文本，不会成为页面脚本。

## 错误处理

输入不合法时，工作流不改文件、不创建分支或 PR，在 Issue 中回复具体错误，并让 Job 失败以留下清晰的 Actions 记录。

GitHub API 的权限或网络错误直接让工作流失败。分支已存在、PR 已存在、重复事件投递都按幂等路径处理。

## 测试

使用现有 Node `node:test` 测试体系，先写失败测试再实现：

- 正确解析 Issue Form Markdown。
- 拒绝缺失或重复字段。
- 拒绝非 HTTP(S)、带认证信息和超长 URL。
- URL 归一化查重。
- 只向 `links.items` 追加一条记录且保持其他配置。
- 同一申请重复执行时不重复追加。
- Issue Form、工作流触发器、权限和申请按钮保持约定。
- Fluid 模板转义友链名称和简介。

最后运行 `pnpm test` 和 `pnpm build`，验证完整仓库与 Hexo 输出。

## 仓库设置

代码合并后，需要在 GitHub 的 `Settings → Actions → General → Workflow permissions` 中允许 GitHub Actions 创建 Pull Request。仓库当前默认工作流权限为只读，代码会在 Job 级别申请所需写权限，但仓库级“允许创建 PR”仍需开启。
