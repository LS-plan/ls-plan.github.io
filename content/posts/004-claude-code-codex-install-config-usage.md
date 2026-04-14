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

这篇文章按我自己实际更推荐的一条路径来整理：

先检查 `Git`、`Node.js`、`npm/npx` 和环境变量是否干净，再安装 `CC Switch（很多人也简称 ccs）` 统一管理配置，然后分别安装 `Claude Code`、`Codex CLI`，最后再用 `ZCF` 补齐初始化工作流、常用 MCP 和提示词模板。

这样做的好处是：**先把环境和配置入口统一，再装工具本体，最后做增强**。  
比起一上来就在 `~/.claude/settings.json`、`~/.codex/config.toml`、系统环境变量之间来回改，稳定得多，也更不容易把自己绕进去。

---

## 零散信息先看这 5 条

如果你只想快速抓重点，先记住下面这 5 条：

1. `Git`、`Node.js 18+`、`npm/npx` 和全局 `PATH` 必须先检查
2. 同时用 `Claude Code` 和 `Codex` 时，优先装 `CC Switch`
3. `Claude Code` 的 `Base URL` **不带** `/v1`
4. `Codex` 的 `Base URL` **必须带** `/v1`
5. `ZCF` 更适合做初始化增强，`CC Switch` 更适合做长期配置管理

---

## 一、开始前先检查 Git、Node、npm、PATH 和环境变量

如果这一层没检查干净，后面很容易出现以下问题：

- `claude` 或 `codex` 安装成功但命令不可用
- `CC Switch` 切换配置后不生效
- 明明改了配置文件，CLI 仍然在读旧环境变量
- `Claude Code` 和 `Codex` 混用了错误的 `Base URL`

### Windows PowerShell 检查命令

```powershell
git --version
node -v
npm -v
npx -v

where.exe git
where.exe node
where.exe npm
where.exe npx
where.exe claude
where.exe codex

npm config get prefix
$env:Path -split ";"
Get-ChildItem Env: | Where-Object { $_.Name -match "ANTHROPIC|OPENAI|CLAUDE|CODEX" } | Sort-Object Name
```

### macOS / Linux 检查命令

```bash
git --version
node -v
npm -v
npx -v

which -a git node npm npx claude codex
npm config get prefix
printf '%s\n' "$PATH" | tr ':' '\n'
env | grep -E 'ANTHROPIC|OPENAI|CLAUDE|CODEX'
```

### 你至少要确认这几件事

1. `git` 正常可用
2. `node`、`npm`、`npx` 正常可用
3. `Node.js` 至少满足 `18+`
4. npm 全局安装目录已经在 `PATH` 中
5. 没有残留的旧环境变量覆盖新配置

### npm 全局命令目录要看哪里

通常是下面这两类：

- Windows：`%AppData%\npm`
- macOS / Linux：`$(npm config get prefix)/bin`

如果你已经执行过 `npm install -g ...`，但 `claude` / `codex` 仍然提示找不到命令，优先怀疑的不是包没装上，而是 **全局命令目录没进 PATH**。

### 哪些环境变量最容易互相打架

重点看这些：

- `ANTHROPIC_BASE_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`
- `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

其中最关键的一点是：

> `Claude Code` 文档明确说明，**系统环境变量的优先级高于 `settings.json` 和 CC Switch 写入的配置**。

所以如果你已经准备用 `CC Switch` 统一管理配置，就不要再长期保留一堆同名系统变量。否则你会看到 UI 里已经切换成功，但 CLI 端一直在走旧值。

---

## 二、先装 CC Switch（ccs）

如果你准备同时用 `Claude Code` 和 `Codex`，我非常建议先装 `CC Switch`。

原因很简单：它是这套环境里最重要的“配置入口”。  
文档站默认也推荐先用它统一管理 `Claude Code`、`Codex`、`OpenClaw` 等工具的 API 配置，而不是分别手改不同文件。

### 安装方式

#### Windows

前往 Releases 页面下载安装版或便携版：

- [CC Switch Releases](https://github.com/farion1231/cc-switch/releases)

#### macOS

```bash
brew tap farion1231/ccswitch
brew install --cask cc-switch
```

#### Linux

根据 `CC Switch` 仓库 README，Linux 也提供发行包，可从 Releases 下载：

- `.deb`
- `.rpm`
- `.AppImage`

### 为什么推荐它作为统一入口

`CC Switch` 的核心价值不是“帮你填一遍 API Key”，而是把原本分散在多个位置的配置统一起来：

- `Claude Code` → `~/.claude/settings.json`
- `Codex` → `~/.codex/config.toml` + `~/.codex/auth.json`
- 其他 CLI / 网关 → 各自配置文件

而且文档里已经把默认流程写得很明确：

1. 打开 `CC Switch`
2. 点击“添加配置”
3. 选择对应框架，比如 `Claude Code` 或 `Codex`
4. 在预设供应商列表中点击 `Micu`
5. 填写 `API Key`
6. 根据渠道决定 `model` 是否需要手动指定
7. 点击添加或应用，然后重启终端

### 渠道与模型最容易填错的地方

这部分一定要记住：

| 场景 | 分组 | `model` 建议 |
|------|------|-------------|
| Claude Code 常规 Claude 渠道 | `vip_1_api` / `vip_1_api_mix` / `vip_1_max*` / `free_2*` | 通常留空 |
| Codex CLI | `vip_2` | 通常留空，或显式填 `gpt-5.4` |
| Claude Code 调用 OAI 模型 | `vip_2_cc` | **必须改成 `gpt-5.4` 或其他 GPT 模型** |

也就是说：

- 正常 Claude 渠道下，不要硬填 `claude-sonnet`
- `vip_2_cc` 不是 Claude 模型池，而是 **让 Claude Code 去跑 OAI 系列模型**
- 这个场景下继续填 `claude-opus` / `claude-sonnet`，大概率就会报模型不可用或请求失败

### 外接调用再补一条

如果你不是直接用官方 CLI，而是外接到网关、自定义客户端、`OpenClaw` 或其他第三方平台，除了 `Base URL` 和 `API Key`，还要同时确认：

1. 分组选对
2. `User-Agent` 选对

否则常见报错就是：

- `403 block`
- `403 Forbidden`
- `Connection blocked`

---

## 三、安装 Claude Code

### 标准安装

```bash
npm install -g @anthropic-ai/claude-code
```

验证：

```bash
claude --version
```

### 其他安装方式

文档里还给了几种替代方案：

#### macOS / Linux / WSL

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

#### Windows PowerShell

```powershell
irm https://claude.ai/install.ps1 | iex
```

#### WinGet

```powershell
winget install Anthropic.ClaudeCode
```

#### Homebrew

```bash
brew install --cask claude-code
```

不过如果你的目标是和 `Codex` 一起维护，最省事的仍然是 `npm install -g` 这条。

### Claude Code 配置的推荐顺序

推荐顺序只有一句话：

> **优先用 CC Switch 配，手动配置只在排障或高级自定义时再用。**

如果你已经有官方 Claude 账号，文档也明确说了：直接运行 `claude` 登录即可，不一定非要走 API 中转。

### Claude Code 适合什么人

如果你的工作方式更偏下面这些，通常会更喜欢 `Claude Code`：

- 长时间在同一个仓库里持续协作
- 需要边读代码边改代码边跑命令
- 希望保留较长的上下文和历史对话
- 更关注“持续结对编程感”，而不是只做一次性生成

### 手动配置时要记住的关键差异

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

配置文件位置通常是：

- Windows：`C:/Users/<用户名>/.claude/settings.json`
- macOS / Linux：`~/.claude/settings.json`

### 国内网络环境建议补充项

文档里专门强调了国内网络下的必做配置，推荐补成这样：

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

如果你用的是 AWS 分组，并遇到带实验性 Beta 参数的 `400` 报错，还可以继续追加：

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}
```

### Claude Code 这里最重要的几个坑

1. `Base URL` 不要写成带 `/v1` 的 OpenAI 风格地址
2. 如果 `CC Switch` 切换后不生效，先查系统环境变量是否覆盖了它
3. `skipWebFetchPreflight` 在国内网络下很关键，不配可能直接导致联网功能异常
4. 不要额外加 `"skipAutoPermissionPrompt": true`，文档明确提到这会影响 `Plan` 模式

---

## 四、安装 Codex CLI

### 标准安装

```bash
npm install -g @openai/codex
```

验证：

```bash
codex --version
```

### Codex 配置的默认做法

和 `Claude Code` 一样，默认还是先走 `CC Switch`：

1. 打开 `CC Switch`
2. 框架选择 `Codex`
3. 点击“添加配置”
4. 预设供应商选择 `Micu`
5. 填写 `API Key`
6. `model` 推荐填 `gpt-5.4`
7. 应用后重启终端

文档说明 `CC Switch` 会自动写入：

- `~/.codex/config.toml`
- `~/.codex/auth.json`

### Codex 和 Claude Code 的最大配置差异

`Codex` 的 `Base URL` **需要带 `/v1`**。

这和 `Claude Code` 正好相反。

### 手动配置示例

`config.toml`：

```toml
model_provider = "micu"
model = "gpt-5.4"
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.micu]
name = "micu"
base_url = "https://www.openclaudecode.cn/v1"
wire_api = "responses"
requires_openai_auth = true
model_context_window = 1000000
model_auto_compact_token_limit = 9000000
```

`auth.json`：

```json
{
  "OPENAI_API_KEY": "sk-xxx"
}
```

常见位置：

- Windows：`C:/Users/<用户名>/.codex/config.toml`、`C:/Users/<用户名>/.codex/auth.json`
- macOS / Linux：`~/.codex/config.toml`、`~/.codex/auth.json`

### 推理深度怎么选

`Codex` 的一个核心配置是 `model_reasoning_effort`：

| 值 | 速度 | 适用场景 |
|------|------|---------|
| `low` | 快 | 小修改、快速问答、轻量生成 |
| `medium` | 中 | 日常开发默认值 |
| `high` | 慢 | 复杂重构、架构设计、长链路问题 |

如果你第一次用 `Codex`，建议直接从 `medium` 起步。  
只有在明确感觉推理深度不够时，再切到 `high`。

### Codex 常见坑

1. `Base URL` 少了 `/v1`
2. `OPENAI_API_KEY` 没写进 `auth.json`
3. 外接场景没配对 `vip_2` 分组
4. 第三方接入时缺少 `Codex` 对应的 `User-Agent`

文档给出的 `User-Agent` 例子是：

```json
{
  "Authorization": "Bearer sk-xxx",
  "User-Agent": "codex_cli_rs/0.77.0 (Windows 10.0.26100; x86_64) WindowsTerminal"
}
```

如果是直接用 `Codex CLI` 本体，通常不需要你手动去写这一层；  
但如果你接的是第三方平台、网关或者自定义客户端，就必须检查。

---

## 五、安装和使用 ZCF

`ZCF` 在文档站里被定位成“零配置初始化工具”，适合快速完成 `Claude Code` 初始化，包括：

- 常用 MCP 服务器配置
- 提示词模板设置
- 首次环境整理

而它在 GitHub README 中还进一步写明，目标是做 **Claude Code & Codex 的零配置一键初始化**。

### 最简单的启动方式

```bash
npx zcf
```

这会直接进入交互菜单。

### 常用命令

```bash
npx zcf i
npx zcf u
npx zcf --lang zh-CN
```

它们分别对应：

- `npx zcf i`：完整初始化，包含安装、工作流、API/CCR、MCP
- `npx zcf u`：只更新工作流
- `npx zcf --lang zh-CN`：切换界面语言

README 里还给了一个非交互示例：

```bash
npx zcf i -s -p 302ai -k "sk-xxx"
```

### 我更建议的使用姿势

如果你已经用 `CC Switch` 管理 API 和模型，不要让 `ZCF` 再去承担“长期 API 配置中心”的角色。  
更合理的分工是：

- `CC Switch`：负责 API、模型、配置切换
- `ZCF`：负责初始化工作流、MCP、模板、首次环境整理

也就是说，`ZCF` 更像“首装加速器”，`CC Switch` 更像“日常控制台”。

---

## 六、Claude Code 和 Codex 到底怎么分工

很多人第一次装完这两个工具后，最容易卡住的问题不是“怎么配置”，而是“以后到底该先用哪个”。

可以先按这张表理解：

| 维度 | Claude Code | Codex |
|------|-------------|-------|
| 更像什么 | 长会话编程搭子 | 可控推理深度的代码代理 |
| 默认关注点 | 持续协作、上下文延续 | 推理强度、任务求解 |
| 更适合 | 仓库内长期工作 | 复杂分析、重构、方案比较 |
| 关键配置点 | `settings.json` / 环境变量 | `config.toml` / `auth.json` |
| Base URL | 不带 `/v1` | 必须带 `/v1` |

如果你不想想太多，也可以先用这个简单规则：

- 需要长期在项目里边看边改边追踪上下文，先用 `Claude Code`
- 需要更明确地控制推理深度，或者想让模型更认真地“想一轮再答”，先用 `Codex`

---

## 七、Claude Code 的使用

### 启动

```bash
claude
```

### 常用命令

| 命令 | 作用 |
|------|------|
| `/model` | 切换模型 |
| `/model sonnet[1m]` | 切换 1M 上下文版本 |
| `/cost` | 查看当前令牌消耗 |
| `/compact` | 压缩上下文 |
| `/resume` | 恢复历史对话 |
| `/clear` | 清空当前会话 |

### 模型怎么选

| 模型 | 适用场景 |
|------|---------|
| `claude-opus` | 复杂任务、难问题、质量优先 |
| `claude-sonnet` | 日常开发主力，推荐默认使用 |
| `claude-haiku` | 轻量场景，部分工具链会自动切换 |

如果你当前使用的是 `vip_2_cc` 渠道，那就别再按 Claude 模型名思考了。  
这个时候 `Claude Code` 实际走的是 OAI 模型，应当在 `CC Switch` 里改成 `gpt-5.4` 这类 GPT 模型。

### 我自己的建议

日常开发里，`Claude Code` 更适合：

- 长会话持续协作
- 读仓库、改代码、跑命令一体化
- 需要频繁压缩上下文和恢复历史对话的任务

如果你想把项目背景长期喂给它，可以再配合 `CLAUDE.md`、MCP 和状态栏工具一起用。

---

## 八、Codex 的使用

### 启动

```bash
codex
```

### 最先调的不是 prompt，而是推理深度

和 `Claude Code` 相比，`Codex` 文档里最值得关注的不是一堆子命令，而是 `model_reasoning_effort`。

建议这样理解：

- `low`：像“快速副驾”，适合小任务和快速验证
- `medium`：最均衡，适合作为默认档位
- `high`：像“深度审稿人”，适合复杂问题和重构

### 一套实用默认值

如果你不知道怎么选，可以直接用这一套：

```toml
model = "gpt-5.4"
model_reasoning_effort = "medium"
disable_response_storage = true
```

然后按任务难度再调。

### Codex 更适合什么场景

在这套组合里，我更倾向于这样分工：

- `Claude Code`：长链路协作、仓库内持续工作
- `Codex`：复杂推理、重构、方案比较、需要显式控制推理深度的任务

它们不是互斥关系，而是能互补。

---

## 九、常见排障顺序

如果你已经按教程装完，但命令还是不工作，建议按下面顺序排查，不要一上来就重装：

1. 先执行 `where.exe claude` / `where.exe codex` 或 `which -a claude codex`
2. 再检查 `npm config get prefix` 对应目录是否已进入 `PATH`
3. 再检查系统里是否残留 `ANTHROPIC_*` / `OPENAI_*` 环境变量覆盖 `CC Switch`
4. 再核对 `Claude Code` 是否误写成带 `/v1` 的地址
5. 再核对 `Codex` 是否漏写了 `/v1`
6. 如果是第三方外接，最后再查分组和 `User-Agent`

这个顺序的好处是遵循 `KISS`：

- 先排查最常见、最便宜的问题
- 再排查配置覆盖
- 最后才考虑复杂的外接调用场景

---

## 十、一条最省心的落地顺序

如果你今天就是想从 0 到 1 配起来，最省心的顺序就是：

1. 安装 `Git`
2. 安装 `Node.js 18+`
3. 检查 `npm` 全局路径和 `PATH`
4. 清理旧的 `ANTHROPIC_*` / `OPENAI_*` 环境变量
5. 安装 `CC Switch`
6. 用 `CC Switch` 先把 `Claude Code` 和 `Codex` 的配置都配好
7. 执行 `npm install -g @anthropic-ai/claude-code`
8. 执行 `npm install -g @openai/codex`
9. 执行 `npx zcf` 做初始化增强
10. 分别启动 `claude` 和 `codex` 验证

对应的最小命令集如下：

```bash
npm install -g @anthropic-ai/claude-code
npm install -g @openai/codex
claude --version
codex --version
npx zcf
```

---

## 十一、参考来源

- [Claude Code 快速上手](https://docs.openclaudecode.cn/#/claude-code)
- [Claude Code 配置参考](https://docs.openclaudecode.cn/#/claude-code/config)
- [Codex CLI 快速上手](https://docs.openclaudecode.cn/#/codex)
- [Codex CLI 配置参考](https://docs.openclaudecode.cn/#/codex/config)
- [CC Switch 统一配置](https://docs.openclaudecode.cn/#/cc-switch)
- [推荐工具](https://docs.openclaudecode.cn/#/tools)
- [CC Switch GitHub 仓库](https://github.com/farion1231/cc-switch)
- [ZCF GitHub 仓库](https://github.com/UfoMiao/zcf)
