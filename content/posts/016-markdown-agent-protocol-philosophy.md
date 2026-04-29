---
title: "[016] 为什么 Agent 时代到处都是 Markdown：从 CLAUDE.md、AGENTS.md 到 BOOTSTRAP.md"
date: 2026-04-29T22:47:00+08:00
draft: false
slug: "016-markdown-agent-protocol-philosophy"
aliases:
  - "/posts/markdown-agent-protocol-philosophy/"
tags: ["AI Agent", "Markdown", "CLAUDE.md", "AGENTS.md", "OpenClaw", "Context Engineering", "Human-AI Interface"]
categories: ["AI 工具"]
---

> 写作时间：2026-04-29  
> 关键词：Markdown、CLAUDE.md、AGENTS.md、BOOTSTRAP.md、Context Engineering、Agent Protocol

---

## 执行摘要

Agent 时代有一个很有意思的共识正在形成：

```text
Claude Code 选择 CLAUDE.md。
Codex / AGENTS.md 生态选择 AGENTS.md。
OpenClaw 里有 AGENTS.md、CLAUDE.md，也有 BOOTSTRAP.md 模板。
Google Labs 甚至有 DESIGN.md，把视觉系统也变成面向 agent 的 Markdown 协议。
```

为什么大家都选了 `.md`？

我的判断是：这不是偶然，也不只是因为 Markdown 简单。

Markdown 在 agent 时代承担的是一种新的角色：

```text
它是人和 agent 共享的控制面。
```

它不像 JSON 那样强结构，也不像自然语言那样完全松散；它处在一个很微妙的位置：

```text
人能直接读。
模型能稳定解析。
Git 能清楚 diff。
工具能轻量处理。
代码块能承载可执行知识。
链接和标题能支持渐进式披露。
```

这让 Markdown 变成了一种“弱协议”：不负责保证所有语义正确，但足够稳定地传递意图、层级、约束、示例和操作步骤。

---

## 一、从文档到控制面

传统软件项目里，Markdown 主要是文档格式：

```text
README.md：告诉人类项目是什么。
CONTRIBUTING.md：告诉人类如何贡献。
CHANGELOG.md：告诉人类版本变化。
```

Agent 进入项目以后，Markdown 的角色变了。

```text
CLAUDE.md：告诉 Claude Code 如何在这个项目里工作。
AGENTS.md：告诉各种 coding agent 项目规则、命令、测试、边界。
BOOTSTRAP.md：告诉 agent 如何初始化、理解、接管一个 workspace。
DESIGN.md：告诉 agent 视觉系统、品牌语气、组件规则。
```

这些文件不再只是给人看的说明，而是 agent 的运行上下文。

这意味着 `.md` 从“项目文档”变成了“项目环境的一部分”。

更准确地说，它开始承担三种职责：

- 记忆：保存团队偏好、项目结构、常用命令、容易踩坑的地方。
- 路由：告诉 agent 什么任务该用什么流程、什么文件、什么工具。
- 约束：告诉 agent 哪些事不能做，哪些动作必须确认，哪些测试必须跑。

这和 011 里讨论的渐进式披露是一条线上的东西：agent 不需要每次都靠用户重新说一遍项目规则，而是可以在仓库里找到长期稳定的指导层。

---

## 二、为什么不是 JSON、YAML 或数据库？

如果只从机器角度看，JSON、YAML、SQLite、protobuf 都比 Markdown 更“严肃”。但 agent 场景不是纯机器通信，它是人机协作。

JSON 的问题是太硬。

它适合配置，不适合解释。你可以写：

```json
{
  "testCommand": "npm test",
  "dangerousOperationsNeedConfirmation": true
}
```

但你很难自然地写：

```text
这个项目的测试很慢。修改 parser 时必须跑全量测试；只改文案时跑 smoke test 就够了。
如果用户正在改同一个文件，不要为了格式化覆盖他的改动。
```

YAML 稍微柔软一点，但仍然偏配置。它适合表达字段，不擅长表达例外、经验、语气和判断条件。

数据库的问题是太远。

agent 可以查数据库，但人类不会为了改一句项目规则打开数据库。人类协作需要一种“在仓库里、能 code review、能追历史、能直接改”的格式。

Markdown 的优势正好在中间：

```text
比自然语言更有结构。
比 JSON/YAML 更有叙述能力。
比数据库更贴近 Git 工作流。
比专用 DSL 更容易被所有 agent 和所有人理解。
```

所以 Markdown 不是最强的机器格式，而是最好的协作格式之一。

---

## 三、Markdown 的信息传递能力

Markdown 对 agent 有用，是因为它同时具备几种信息能力。

第一，层级能力。

标题天然表达信息架构：

```markdown
# Project Rules

## Build

## Test

## Deployment

## Safety
```

模型很擅长利用这种层级。标题让 agent 知道“下面这段属于什么上下文”，也方便它只读取相关部分。

第二，顺序能力。

有序列表表达流程：

```markdown
1. Read the existing file.
2. Make the smallest change.
3. Run the targeted test.
4. Summarize the result.
```

这比一段散文更适合任务执行。它给 agent 一个默认节奏。

第三，约束能力。

项目规则通常不是纯事实，而是约束：

```markdown
- Never rewrite unrelated files.
- Ask before pushing to remote.
- Prefer `rg` for search.
- Use the existing component style.
```

Markdown 的 bullet list 非常适合承载这种“软约束”。它不像类型系统那样强制，但足以影响模型行为。

第四，示例能力。

代码块是 Markdown 在 agent 时代最关键的结构之一：

````markdown
Run:

```powershell
hugo
git status --short
```
````

代码块同时满足三件事：

- 对人类可读。
- 对模型边界清晰。
- 对工具可提取、可复制、可执行。

第五，引用和链接能力。

Markdown 可以把主文件做得很短，然后把细节放到链接里：

```markdown
Read `docs/deploy.md` only when the task touches deployment.
Read `docs/design.md` only when editing UI.
```

这就是渐进式披露。主上下文只保存索引，细节按需打开。

---

## 四、Markdown 的哲学意义：弱结构胜过强协议

Markdown 最初的目标就是让纯文本也容易读、容易写。这个目标在 agent 时代突然变得非常重要。

因为 agent 协作不是传统 API 调用。

传统 API 追求：

```text
字段精确。
schema 严格。
输入输出可验证。
```

agent 协作还需要：

```text
意图可解释。
经验可沉淀。
例外可说明。
过程可追踪。
人类可随手修改。
```

这两组需求不完全一样。

Markdown 的哲学优势在于：它承认很多知识暂时无法完全结构化，但仍然给这些知识一个足够稳定的载体。

比如这句话：

```text
这个项目很在意小而可审查的改动，除非用户明确要求，不要顺手重构。
```

这不是一个简单字段。它包含团队风格、风险偏好、协作文化和上下文判断。把它写成 JSON 会损失很多语义；写成 Markdown 则刚刚好。

所以 Markdown 的价值不是“更精确”，而是“足够结构化的含混”。

这种含混对 agent 很重要。因为模型本来就擅长处理语义、语气、例外和上下文；Markdown 刚好提供了一个不会过度压扁语义的形状。

---

## 五、能力完备性：Markdown 完备吗？

如果从计算理论看，Markdown 本身当然不完备。它不是编程语言，没有类型系统，没有权限模型，也不能保证执行安全。

但如果从 agent 信息传递看，Markdown 具备一种“协作完备性”。

也就是说，它足以承载 agent 工作所需的关键上下文类型：

```text
目标：这次工作要达成什么。
边界：哪些事不要做。
流程：先做什么，后做什么。
命令：用什么工具验证。
示例：什么输出算对。
引用：更详细资料在哪里。
记忆：上次踩过什么坑。
权限：什么动作必须问人。
```

这已经覆盖了 agent 执行任务的大部分高层控制信息。

Markdown 不擅长的部分，也很明确：

- 不适合表达严格 schema。
- 不适合做权限系统。
- 不适合保存高频变化的状态。
- 不适合承载大规模结构化数据。
- 不适合替代测试、类型检查和审计日志。

所以更好的判断不是：

```text
Markdown 能不能替代所有格式？
```

而是：

```text
Markdown 是否足以成为 agent 的人机共享协议入口？
```

答案是：非常足够。

---

## 六、为什么 LLM 特别吃 Markdown

这里还有一个现实因素：大模型训练语料里有大量 Markdown。

GitHub README、技术博客、文档站、issue、pull request、教程、API 文档，都大量使用 Markdown。模型早就学会了：

- 标题代表主题切换。
- bullet list 代表规则集合。
- numbered list 代表步骤。
- fenced code block 代表代码或命令。
- inline code 代表符号、路径、命令、字段。
- link 代表外部引用。
- front matter 代表元数据。

所以 Markdown 对模型来说不是陌生格式，而是一种高频自然格式。

这也是为什么 agent vendors 会倾向选择 `.md`。他们不需要训练用户学习复杂 DSL，也不需要让模型适配全新格式。

Markdown 是一种已经被人类和模型共同熟悉的中间语言。

---

## 七、CLAUDE.md、AGENTS.md、BOOTSTRAP.md 的差异

这些文件表面上都是 Markdown，但职责略有不同。

`CLAUDE.md` 更像产品内置 memory 文件。

Anthropic 官方文档把它用于存放项目常用命令、风格指南、测试说明、仓库礼仪等信息。Claude Code 可以在会话开始时读取它，也可以通过命令把记忆写入合适的层级。

`AGENTS.md` 更像开放约定。

OpenAI Codex 文档和 AGENTS.md 官网都把它描述成给 coding agents 的项目说明。它的重点不是绑定某个模型，而是把“这个仓库里的 agent 工作规则”放到一个可发现的位置。

`BOOTSTRAP.md` 更像初始化协议。

OpenClaw 的模板把它放在 workspace bootstrap 场景下，作用不是长期项目规则，而是帮助 agent 接管一个环境：从哪里开始、如何恢复上下文、如何建立初始工作状态。

`DESIGN.md` 则说明这个趋势正在扩展。

Google Labs 的 DESIGN.md 把视觉系统也变成 Markdown 规范：品牌、组件、色彩、布局、交互约束都可以进入 agent 上下文。也就是说，`.md` 正在从“代码协作说明”扩展成“多领域 agent 协作协议”。

这些文件共同说明一件事：

```text
未来项目里不只会有 README.md。
还会有一组面向 agent 的 operational markdown。
```

---

## 八、Markdown 和渐进式披露

Markdown 天然适合做渐进式披露，有三个原因。

第一，标题可以做索引。

agent 可以先读目录、标题、摘要，再决定是否深入某一节。

第二，链接可以做延迟加载。

主文件不必塞所有细节，只需要写：

```markdown
For deployment failures, read `docs/deployment-troubleshooting.md`.
```

第三，文件系统可以做能力边界。

不同文件承担不同层级：

```text
AGENTS.md          -> 项目总规则
SKILL.md           -> 任务能力入口
DESIGN.md          -> 视觉系统
BOOTSTRAP.md       -> 初始化流程
docs/deploy.md     -> 部署细节
scripts/check.ps1  -> 确定性验证
```

这和上一篇 015 的 Skill/MCP 关系也能接上：

```text
Markdown 负责描述 agent 应该如何思考和协作。
Skill 负责把一类任务封装成可触发能力。
MCP 负责把外部系统暴露成可调用接口。
脚本负责确定性检查。
```

Markdown 是这几层之间最轻的胶水。

---

## 九、它的问题也很明显

Markdown 被选中，不代表它没有问题。

第一，语义不够严格。

同样一句 “must run tests”，到底是强制，还是建议？不同 agent 可能理解不一致。

第二，冲突很难自动合并。

根目录 `AGENTS.md`、子目录 `AGENTS.md`、用户全局规则、系统规则、会话指令之间可能互相冲突。Markdown 本身没有优先级模型，优先级要由 agent runtime 解释。

第三，安全边界弱。

Markdown 可以写“不要推送”，但不能阻止工具真的推送。真正的安全必须由 runtime、权限系统、确认机制和审计日志承担。

第四，容易膨胀。

一旦团队把所有规则都塞进一个文件，agent 反而会被噪音淹没。Markdown 的低门槛既是优势，也是风险。

第五，缺少机器可验证结构。

例如“必须覆盖这些测试场景”，Markdown 可以表达，但不能自动证明已经覆盖。最终仍然需要脚本、CI、类型系统、测试和 MCP 工具来验证。

所以好的 `.md` 不是越长越好，而是越可路由越好。

---

## 十、未来会如何演化

我认为 Markdown 不会消失，但会分层。

第一层，继续是人类可读的 Markdown。

这层负责解释目标、原则、例外、风格、经验和流程。

第二层，会越来越多使用 front matter。

例如：

```yaml
---
scope: repo
priority: 50
applies_to:
  - "src/**"
requires_confirmation:
  - git.push
  - file.delete
---
```

正文继续用 Markdown，元数据用 YAML。这种组合已经在博客、文档站、skills 里非常常见。

第三层，会出现 typed blocks。

也就是在 Markdown 里嵌入更强结构：

````markdown
```agent-policy
operation: git.push
confirmation: required
reason: remote history and deployment can change
```
````

这类块可以被人读，也可以被工具解析。

第四层，会和 MCP、Skill、CI 连接。

未来的 agent runtime 可能会这样工作：

```text
读取 AGENTS.md 的高层规则。
根据任务触发某个 SKILL.md。
用 MCP server 获取实时状态。
执行 scripts/ 中的验证。
把结果写回任务日志或记忆文件。
```

也就是说，Markdown 会从“说明文件”演化成“agent workspace 的 manifest + playbook”。

第五层，会出现更强的冲突解决和优先级协议。

比如：

```text
system > developer > user > repo root AGENTS.md > subdirectory AGENTS.md > skill instruction > generated plan
```

现在这些规则多数由具体产品约定。未来可能会形成更通用的 agent context resolution 规范。

---

## 十一、怎么写好的 Agent Markdown

如果你要给自己的项目写 `AGENTS.md`、`CLAUDE.md` 或 `BOOTSTRAP.md`，我建议遵循几个原则。

第一，短入口。

入口文件只放最稳定、最常用、最高优先级的信息。细节放链接。

第二，强动词。

少写抽象价值观，多写可执行规则：

```text
Run `hugo` before saying a post is publishable.
Ask before `git push`.
Do not edit unrelated posts.
Prefer `rg` for search.
```

第三，写触发条件。

不要只写“部署说明”，要写“什么时候读部署说明”：

```markdown
When changing deployment config, read `docs/deploy.md`.
When a published page is missing, check front matter date first.
```

第四，写失败路径。

agent 最需要的不是顺利流程，而是失败时如何恢复：

```markdown
If Hugo builds but the post is missing, check:
1. `draft`
2. `date`
3. `slug`
4. generated `public/posts/.../index.html`
5. GitHub Pages deployment status
```

第五，把确定性检查交给脚本。

Markdown 负责说明，脚本负责证明。

第六，避免把情绪化偏好写成硬规则。

比如“代码要优雅”没什么用。更好的写法是：

```markdown
Keep changes scoped to the requested module.
Do not introduce new abstractions unless they remove real duplication.
```

第七，定期修剪。

过期的 agent markdown 比没有更危险，因为它会稳定地把 agent 带偏。

---

## 结论

Markdown 在 agent 时代被大量选择，不是因为它完美，而是因为它刚好站在正确的位置。

它足够人类化，可以承载经验、例外和协作文化。

它足够结构化，可以让模型理解层级、流程、规则和代码边界。

它足够工程化，可以进入 Git、code review、diff、CI 和脚本生态。

它又足够轻，不需要任何团队为它建立复杂基础设施。

所以 `.md` 正在从“文档格式”变成“agent 时代的协作协议层”。

未来真正成熟的 agent workspace，大概率不是只有一个巨大的 prompt，而是一组相互配合的文件：

```text
AGENTS.md      -> 项目规则
CLAUDE.md      -> 产品特定记忆
BOOTSTRAP.md   -> 初始化流程
SKILL.md       -> 任务能力入口
DESIGN.md      -> 视觉系统
MCP config     -> 外部能力连接
scripts/       -> 确定性验证
```

其中 Markdown 负责让这些能力可读、可改、可审查、可传递。

这就是它的哲学意义：它不是机器格式对人类的胜利，也不是自然语言对结构化协议的胜利，而是一种中间层的胜利。

---

## 参考资料

- Anthropic Docs：[Manage Claude's memory](https://docs.anthropic.com/en/docs/claude-code/memory)
- OpenAI Developers：[AGENTS.md](https://developers.openai.com/codex/guides/agents-md)
- AGENTS.md：[A simple, open format for guiding coding agents](https://agents.md/)
- GitHub：[openai/codex AGENTS.md](https://github.com/openai/codex/blob/main/AGENTS.md)
- GitHub：[openclaw/openclaw AGENTS.md](https://github.com/openclaw/openclaw/blob/main/AGENTS.md)
- GitHub：[openclaw/openclaw BOOTSTRAP.md template](https://github.com/openclaw/openclaw/blob/main/docs/reference/templates/BOOTSTRAP.md)
- GitHub：[google-labs-code/design.md](https://github.com/google-labs-code/design.md)
- Daring Fireball：[Markdown](https://daringfireball.net/projects/markdown/)
- CommonMark：[A strongly defined, highly compatible specification of Markdown](https://commonmark.org/)
