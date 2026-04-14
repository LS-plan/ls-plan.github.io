---
title: "[004] Claude Code 与 Codex 的安装、配置与使用：从 Git/Node 检查到 CC Switch、ZCF 全流程"
date: 2026-04-14T17:50:00+08:00
draft: false
slug: "004-claude-code-codex-install-config-usage"
aliases:
  - "/posts/claude-code-codex-install-config-usage/"
tags: ["Claude Code", "Codex", "CC Switch", "ZCF", "Node.js", "Git"]
categories: ["开发环境"]
---

这篇文章按 **Windows 用户优先** 的方式重写。

默认正文只写 **Windows CMD** 的做法；`PowerShell`、`macOS`、`Linux` 都放进折叠块里，需要时再展开看。

我的推荐顺序仍然不变：

1. 先把 `Git`、`Node.js`、`npm/npx`、环境变量理干净
2. 先装 `CC Switch` 作为统一配置入口
3. 再装 `Claude Code` 和 `Codex`
4. 最后用 `ZCF` 做初始化增强

---

## 零散信息先看这 6 条

1. 这篇教程默认以 **Windows CMD** 为推荐命令环境
2. `Node.js` 建议不要直接把 npm 全局目录丢到默认位置，而是显式配置 `node_global` 和 `node_cache`
3. `Claude Code` 的 `Base URL` **不带** `/v1`
4. `Codex` 的 `Base URL` **必须带** `/v1`
5. 同时用 `Claude Code` 和 `Codex` 时，优先装 `CC Switch`
6. `ZCF` 更适合做初始化增强，不适合长期承担配置中心

---

## 一、先准备 Windows 目录结构

这一步不要跳。

如果你想让后面的 npm 全局安装、命令可执行路径、缓存目录都稳定，最省心的做法是：

- `Node.js` 安装目录固定在一个你自己可控的位置
- 在这个目录下面手动建 `node_global`
- 在这个目录下面手动建 `node_cache`
- 然后把 npm 的 `prefix` 和 `cache` 都显式指过去

我建议你用类似这样的目录：

```text
D:\Dev\nodejs
```

最终结构建议是：

```text
D:\Dev\nodejs
D:\Dev\nodejs\node_global
D:\Dev\nodejs\node_cache
```

> 截图预留：`Node.js` 安装目录与 `node_global` / `node_cache` 目录结构

### 为什么这样配

这样做有几个直接好处：

- 不依赖系统默认的 `%AppData%\npm`
- 全局命令目录清晰，排障时一眼能找到
- 缓存目录独立，不容易和别的 Node 环境搅在一起
- 迁移机器、备份环境、写教程都更直观

---

## 二、先检查 Git、Node、npm、npx 和环境变量

如果这一层没检查干净，后面最常见的问题就是：

- `claude` 或 `codex` 明明装了，但命令不可用
- `CC Switch` 切换成功了，CLI 却还在读旧配置
- npm 全局安装成功，但命令目录没进 `PATH`
- `Claude Code` 和 `Codex` 的地址格式配反了

### Windows CMD 检查命令

```cmd
git --version
```

```cmd
node -v
```

```cmd
npm -v
```

```cmd
npx -v
```

```cmd
where git
```

```cmd
where node
```

```cmd
where npm
```

```cmd
where npx
```

```cmd
where claude
```

```cmd
where codex
```

```cmd
npm config get prefix
```

```cmd
npm config get cache
```

```cmd
echo %PATH%
```

```cmd
set ANTHROPIC
```

```cmd
set OPENAI
```

### 你至少要确认这几件事

1. `git` 正常可用
2. `node`、`npm`、`npx` 正常可用
3. `Node.js` 至少是 `18+`
4. `npm prefix` 和 `npm cache` 已经指向你自己的目录
5. `PATH` 里已经包含 `node_global`
6. 系统里没有残留一堆旧的 `ANTHROPIC_*` / `OPENAI_*` 环境变量长期覆盖新配置

{{< collapse summary="展开查看 Windows PowerShell 检查命令" >}}

```powershell
git --version
```

```powershell
node -v
```

```powershell
npm -v
```

```powershell
npx -v
```

```powershell
where.exe git
```

```powershell
where.exe node
```

```powershell
where.exe npm
```

```powershell
where.exe npx
```

```powershell
where.exe claude
```

```powershell
where.exe codex
```

```powershell
npm config get prefix
```

```powershell
npm config get cache
```

```powershell
$env:Path -split ";"
```

```powershell
Get-ChildItem Env: | Where-Object { $_.Name -match "ANTHROPIC|OPENAI|CLAUDE|CODEX" } | Sort-Object Name
```

{{< /collapse >}}

{{< collapse summary="展开查看 macOS 检查命令" >}}

```bash
git --version
```

```bash
node -v
```

```bash
npm -v
```

```bash
npx -v
```

```bash
which -a git
```

```bash
which -a node
```

```bash
which -a npm
```

```bash
which -a npx
```

```bash
which -a claude
```

```bash
which -a codex
```

```bash
npm config get prefix
```

```bash
npm config get cache
```

```bash
printf '%s\n' "$PATH"
```

```bash
env | grep -E 'ANTHROPIC|OPENAI|CLAUDE|CODEX'
```

{{< /collapse >}}

{{< collapse summary="展开查看 Linux 检查命令" >}}

```bash
git --version
```

```bash
node -v
```

```bash
npm -v
```

```bash
npx -v
```

```bash
which -a git
```

```bash
which -a node
```

```bash
which -a npm
```

```bash
which -a npx
```

```bash
which -a claude
```

```bash
which -a codex
```

```bash
npm config get prefix
```

```bash
npm config get cache
```

```bash
printf '%s\n' "$PATH"
```

```bash
env | grep -E 'ANTHROPIC|OPENAI|CLAUDE|CODEX'
```

{{< /collapse >}}

---

## 三、配置 npm 全局目录和缓存目录

这是这篇里最重要的 Windows 习惯之一。

### 1. 先建目录

如果目录还没建，先手动建好，或者用 CMD 执行：

```cmd
mkdir D:\Dev\nodejs\node_global
```

```cmd
mkdir D:\Dev\nodejs\node_cache
```

### 2. 把 npm 的 prefix 和 cache 指过去

```cmd
npm config set prefix "D:\Dev\nodejs\node_global"
```

```cmd
npm config set cache "D:\Dev\nodejs\node_cache"
```

### 3. 重新检查是否生效

```cmd
npm config get prefix
```

```cmd
npm config get cache
```

### 4. 配环境变量

至少要保证下面这几个路径关系是清楚的：

- `NODEJS_HOME=D:\Dev\nodejs`
- `Path` 中包含 `%NODEJS_HOME%`
- `Path` 中包含 `%NODEJS_HOME%\node_global`

如果你习惯手动配系统环境变量，我建议最少保留这两条：

```text
NODEJS_HOME=D:\Dev\nodejs
Path=%NODEJS_HOME%;%NODEJS_HOME%\node_global
```

> 截图预留：Windows 环境变量中 `NODEJS_HOME` 与 `Path` 的配置界面

### 5. 为什么不建议继续依赖 `%AppData%\npm`

不是说 `%AppData%\npm` 一定不能用，而是这类路径在下面几种场景里更容易出问题：

- 多版本 Node 混用
- 你自己后面想迁移安装目录
- 公司电脑权限限制
- 写教程、排障、远程协助时路径不直观

这也是为什么我更推荐一开始就把目录显式定下来。

{{< collapse summary="展开查看 PowerShell 版本的 npm 目录配置命令" >}}

```powershell
New-Item -ItemType Directory -Force -Path "D:\Dev\nodejs\node_global"
```

```powershell
New-Item -ItemType Directory -Force -Path "D:\Dev\nodejs\node_cache"
```

```powershell
npm config set prefix "D:\Dev\nodejs\node_global"
```

```powershell
npm config set cache "D:\Dev\nodejs\node_cache"
```

{{< /collapse >}}

---

## 四、先装 CC Switch（ccs）

如果你准备同时用 `Claude Code` 和 `Codex`，我仍然建议 **先装 `CC Switch`**。

原因很简单：它更适合做统一配置入口，而不是你手改多个文件来回切。

### Windows 下载

直接去 Releases 页面下载：

- [CC Switch Releases](https://github.com/farion1231/cc-switch/releases)

> 截图预留：`CC Switch` 下载页与安装后的主界面

### 为什么推荐先装它

`CC Switch` 的核心价值不是“帮你填个 API Key”，而是把这些配置入口统一起来：

- `Claude Code` → `~/.claude/settings.json`
- `Codex` → `~/.codex/config.toml` + `~/.codex/auth.json`
- 其他相关工具 → 各自配置文件

### 在 CC Switch 里最容易填错的地方

| 场景 | 分组 | `model` 建议 |
|------|------|-------------|
| Claude Code 常规 Claude 渠道 | `vip_1_api` / `vip_1_api_mix` / `vip_1_max*` / `free_2*` | 通常留空 |
| Codex CLI | `vip_2` | 通常留空，或显式填 `gpt-5.4` |
| Claude Code 调用 OAI 模型 | `vip_2_cc` | 必须填 `gpt-5.4` 或其他 GPT 模型 |

### 外接时再额外确认两件事

1. 分组选对
2. `User-Agent` 选对

否则你会遇到的常见报错就是：

- `403 block`
- `403 Forbidden`
- `Connection blocked`

{{< collapse summary="展开查看 macOS 安装 CC Switch" >}}

```bash
brew tap farion1231/ccswitch
```

```bash
brew install --cask cc-switch
```

{{< /collapse >}}

{{< collapse summary="展开查看 Linux 获取 CC Switch 的方式" >}}

Linux 直接去 Releases 下载对应包即可，通常会看到这些格式：

- `.deb`
- `.rpm`
- `.AppImage`

{{< /collapse >}}

---

## 五、安装 Claude Code

### Windows CMD 安装

```cmd
npm install -g @anthropic-ai/claude-code
```

### 验证

```cmd
claude --version
```

### 为什么这里仍然优先推荐 npm 安装

因为你前面已经把：

- `Node.js`
- `node_global`
- `node_cache`
- `PATH`

都理顺了，所以这时候用 `npm install -g` 反而最稳定。

### Claude Code 手动配置时要记住的一点

`Claude Code` 的 `Base URL` **不要带 `/v1`**。

最小配置示例：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.openclaudecode.cn",
    "ANTHROPIC_API_KEY": "sk-xxx"
  }
}
```

常见位置：

- Windows：`C:/Users/<用户名>/.claude/settings.json`

### 国内网络环境建议补充项

```json
{
  "ENABLE_TOOL_SEARCH": true,
  "skipWebFetchPreflight": true,
  "env": {
    "ANTHROPIC_BASE_URL": "https://www.openclaudecode.cn",
    "ANTHROPIC_API_KEY": "sk-xxx",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  }
}
```

如果你走 AWS 分组并遇到带 Beta 参数的 `400`，再加：

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}
```

### Claude Code 这里最常见的坑

1. `Base URL` 写成了带 `/v1` 的地址
2. `CC Switch` 已切换，但系统环境变量还在覆盖它
3. 国内网络没配 `skipWebFetchPreflight`
4. 额外加了 `"skipAutoPermissionPrompt": true`，影响 `Plan` 模式

> 截图预留：`Claude Code` 在 `CC Switch` 中的配置页

{{< collapse summary="展开查看 Windows PowerShell 安装 Claude Code" >}}

```powershell
irm https://claude.ai/install.ps1 | iex
```

{{< /collapse >}}

{{< collapse summary="展开查看 WinGet 安装 Claude Code" >}}

```powershell
winget install Anthropic.ClaudeCode
```

{{< /collapse >}}

{{< collapse summary="展开查看 macOS / Linux / WSL 安装 Claude Code" >}}

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

{{< /collapse >}}

{{< collapse summary="展开查看 Homebrew 安装 Claude Code" >}}

```bash
brew install --cask claude-code
```

{{< /collapse >}}

---

## 六、安装 Codex

### Windows CMD 安装

```cmd
npm install -g @openai/codex
```

### 验证

```cmd
codex --version
```

### Codex 配置的默认做法

和 `Claude Code` 一样，默认还是优先走 `CC Switch`：

1. 打开 `CC Switch`
2. 框架选择 `Codex`
3. 添加配置
4. 选择供应商
5. 填写 `API Key`
6. `model` 推荐填 `gpt-5.4`
7. 应用后重启终端

### Codex 和 Claude Code 最大的配置差异

`Codex` 的 `Base URL` **需要带 `/v1`**。

### 手动配置示例

`config.toml`：

```toml
model_provider = "micu"
```

```toml
model = "gpt-5.4"
```

```toml
model_reasoning_effort = "high"
```

```toml
disable_response_storage = true
```

```toml
[model_providers.micu]
```

```toml
name = "micu"
```

```toml
base_url = "https://www.openclaudecode.cn/v1"
```

```toml
wire_api = "responses"
```

```toml
requires_openai_auth = true
```

```toml
model_context_window = 1000000
```

```toml
model_auto_compact_token_limit = 9000000
```

`auth.json`：

```json
{
  "OPENAI_API_KEY": "sk-xxx"
}
```

常见位置：

- Windows：`C:/Users/<用户名>/.codex/config.toml`
- Windows：`C:/Users/<用户名>/.codex/auth.json`

### 推理深度怎么选

| 值 | 速度 | 适用场景 |
|------|------|---------|
| `low` | 快 | 小修改、快速问答 |
| `medium` | 中 | 日常开发默认值 |
| `high` | 慢 | 复杂重构、深度分析 |

### Codex 常见坑

1. `Base URL` 漏了 `/v1`
2. `OPENAI_API_KEY` 没写进 `auth.json`
3. 外接时分组选错
4. 第三方接入时 `User-Agent` 没配对

如果你走第三方外接，文档里常见的 `User-Agent` 例子是：

```json
{
  "Authorization": "Bearer sk-xxx",
  "User-Agent": "codex_cli_rs/0.77.0 (Windows 10.0.26100; x86_64) WindowsTerminal"
}
```

> 截图预留：`Codex` 在 `CC Switch` 中的配置页

---

## 七、安装和使用 ZCF

`ZCF` 更适合做：

- 首次初始化
- MCP 配置补齐
- 工作流模板补齐
- 中文环境下的快速整理

但我不建议让它长期承担“唯一配置中心”的角色。

### 最简单的启动方式

```cmd
npx zcf
```

### 常用命令

```cmd
npx zcf i
```

```cmd
npx zcf u
```

```cmd
npx zcf --lang zh-CN
```

它们分别对应：

- `npx zcf i`：完整初始化
- `npx zcf u`：更新工作流
- `npx zcf --lang zh-CN`：切换界面语言

README 里还给了一个非交互示例：

```cmd
npx zcf i -s -p 302ai -k "sk-xxx"
```

### 更合理的分工

- `CC Switch`：负责 API、模型、配置切换
- `ZCF`：负责初始化工作流、MCP、模板、首次整理

---

## 八、Claude Code 和 Codex 怎么分工

先用这张表记忆最省事：

| 维度 | Claude Code | Codex |
|------|-------------|-------|
| 更像什么 | 长会话编程搭子 | 可控推理深度的代码代理 |
| 默认关注点 | 持续协作、上下文延续 | 推理强度、任务求解 |
| 更适合 | 仓库内长期工作 | 复杂分析、重构、方案比较 |
| 关键配置点 | `settings.json` / 环境变量 | `config.toml` / `auth.json` |
| Base URL | 不带 `/v1` | 必须带 `/v1` |

如果你不想想太多，可以先用这个简单规则：

- 需要长期在项目里边看边改边追踪上下文，先用 `Claude Code`
- 需要显式控制推理深度、做复杂分析或重构，先用 `Codex`

---

## 九、Windows 场景下的推荐落地顺序

如果你今天就是从 0 到 1 配起来，我建议你按这个顺序走：

1. 安装 `Git`
2. 安装 `Node.js 18+`
3. 在 Node 安装目录下新建 `node_global` 和 `node_cache`
4. 用 `npm config set prefix` 和 `npm config set cache` 指过去
5. 配置 `NODEJS_HOME` 和 `Path`
6. 清理旧的 `ANTHROPIC_*` / `OPENAI_*` 环境变量
7. 安装 `CC Switch`
8. 用 `CC Switch` 先把 `Claude Code` 和 `Codex` 配好
9. 安装 `Claude Code`
10. 安装 `Codex`
11. 执行 `npx zcf` 做初始化增强
12. 分别验证 `claude` 和 `codex`

### 对应最小命令集

```cmd
npm config set prefix "D:\Dev\nodejs\node_global"
```

```cmd
npm config set cache "D:\Dev\nodejs\node_cache"
```

```cmd
npm install -g @anthropic-ai/claude-code
```

```cmd
npm install -g @openai/codex
```

```cmd
claude --version
```

```cmd
codex --version
```

```cmd
npx zcf
```

---

## 十、参考来源

- [Claude Code 快速上手](https://docs.openclaudecode.cn/#/claude-code)
- [Claude Code 配置参考](https://docs.openclaudecode.cn/#/claude-code/config)
- [Codex CLI 快速上手](https://docs.openclaudecode.cn/#/codex)
- [Codex CLI 配置参考](https://docs.openclaudecode.cn/#/codex/config)
- [CC Switch 统一配置](https://docs.openclaudecode.cn/#/cc-switch)
- [推荐工具](https://docs.openclaudecode.cn/#/tools)
- [CC Switch GitHub 仓库](https://github.com/farion1231/cc-switch)
- [ZCF GitHub 仓库](https://github.com/UfoMiao/zcf)
