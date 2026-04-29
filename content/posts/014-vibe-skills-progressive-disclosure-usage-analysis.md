---
title: "[014] Vibe-Skills 使用指南与架构分析：340+ Skills 如何通过渐进式披露变成 Agent 工作流"
date: 2026-04-29T22:15:00+08:00
draft: false
slug: "014-vibe-skills-progressive-disclosure-usage-analysis"
aliases:
  - "/posts/vibe-skills-progressive-disclosure-usage-analysis/"
tags: ["Vibe-Skills", "AI Agent", "Skills", "渐进式披露", "AgentOS", "Context Engineering", "Harness Engineering"]
categories: ["AI 工具"]
---

> 分析对象：Vibe-Skills 3.1.0  
> 整理时间：2026-04-29  
> 关键词：Super Skill、VCO Runtime、340+ Skills、渐进式披露、Workspace Memory、Verified Delivery

---

## 执行摘要

Vibe-Skills 是一个很有意思的项目。

它表面上是“340+ Skills 的集合”，但真正有价值的地方不是数量，而是它把 skills 从“工具列表”提升成了“工作流 harness”。

官方 README 里有一句话基本说明了它的定位：

```text
Install VibeSkills, type vibe, and let the harness handle the busy work.
```

也就是说，用户不再需要自己从几百个 skills 里挑一个，不再需要每一步都提醒 agent “先规划”“再测试”“记得保存上下文”。Vibe-Skills 试图用一个入口 `vibe` 接管任务节奏：

```text
intent.freeze()        -> requirement_doc
plan.stage()           -> xl_plan
skills.orchestrate()   -> expert Skills by phase
evidence.verify()      -> tests, checks, artifacts
memory.preserve()      -> next-session context
```

这就是它和普通技能包的差异：

```text
普通 Skill：我能做一件事。
Vibe-Skills：我来安排这件事怎么推进。
```

结合 [[011] Anthropic 渐进式披露设计](/posts/011-anthropic-progressive-disclosure-agent-engineering/) 的视角，我的判断是：Vibe-Skills 有明显的渐进式披露设计，而且是多层渐进式披露：

- 外部只暴露 `vibe` / `vibe-upgrade` 两个主要入口。
- 内部再根据任务阶段路由到专家 skills。
- `SKILL.md` 保持小入口，runtime 细节放在 `protocols/runtime.md`、`protocols/do.md` 等后置文档里。
- 复杂任务在需求、计划、阶段清理处设置 bounded stop，让用户确认后再继续。
- workspace memory 只在需要恢复上下文时发挥作用，而不是每次把全部历史塞进上下文。

如果 Anthropic Agent Skills 解决的是：

```text
能力如何按需加载？
```

那么 Vibe-Skills 想解决的是：

```text
复杂任务如何被 agent 稳定推进？
```

---

## 一、它到底是什么

Vibe-Skills 的 GitHub 描述是：

```text
Vibe-Skills is an all-in-one AI skills package.
```

但这个描述还不够。更准确地说，它是一个 **Super Skill Harness**。

它包含三层东西：

| 层级 | 作用 |
|---|---|
| `vibe` 入口 | 让用户用一个入口进入受治理流程 |
| VCO Runtime | 负责需求冻结、计划、路由、验证、清理和记忆 |
| 340+ Skills | 在不同阶段被调用的专家能力 |

官方 README 里把核心概念解释得很清楚：

| 概念 | 含义 |
|---|---|
| Harness | 围绕 AI agent 的工作流层，决定下一步、调用 skills、检查工作并保存上下文 |
| Skill | 聚焦的专家能力，例如 TDD、代码审查、数据分析、写作、研究 |
| Vibe / VCO | canonical runtime，公共入口是 `vibe` 和 `vibe-upgrade` |
| Automatic orchestration | 在需求、规划、实现、review、验证、清理等阶段调用不同 skills |
| Workspace memory | 保存项目事实、决策和证据，让后续会话能继续 |

所以 Vibe-Skills 不是“给模型更多 prompt”。它是在给 agent 一个工作节奏。

---

## 二、现在项目状态

截至 2026-04-29，我用 GitHub CLI 查看了仓库状态：

| 项目 | 状态 |
|---|---|
| 仓库 | `foryourhealth111-pixel/Vibe-Skills` |
| License | Apache-2.0 |
| Stars | 1860 |
| Forks | 142 |
| 最新 release | `v3.1.0` |
| release 名称 | `Vibe Skills 3.1.0` |
| 发布时间 | 2026-04-25 |
| 更新时间 | 2026-04-29 |

从状态看，它已经不是纯概念项目，有活跃发布和社区关注。但 README 也坦诚提到当前 codebase 有技术债，一些能力还需要 refinement。

所以我的建议是：

```text
可以研究，可以试用，可以借鉴架构。
但不要未经审计就把它装进高敏感生产环境。
```

---

## 三、它的渐进式披露设计

Vibe-Skills 的渐进式披露不是单点设计，而是贯穿入口、文档、路由、执行和记忆的系统设计。

### 1. 入口层：从 340+ skills 收敛到一个 `vibe`

普通技能包的问题是：skills 越多，模型越容易被噪声干扰。

如果 agent 一开始看到几百个 skills，它要先解决一个元问题：

```text
我现在到底该用哪个？
```

Vibe-Skills 的做法是把外部入口收敛为：

```text
vibe
vibe-upgrade
```

用户正常只需要调用 `vibe`。

这就是第一层 disclosure：

```text
外部只看到一个工作流入口；
内部再根据任务展开 skills。
```

### 2. 文档层：小 SKILL.md，大细节后置

Vibe-Skills 的 `SKILL.md` 明确说，它只是 host-facing SOP，要保持小：

```text
runtime details belong in protocols/runtime.md
execution discipline belongs in protocols/do.md
```

这和 Anthropic Skills 的设计非常像：

```text
metadata -> SKILL.md -> references / scripts / protocols
```

它避免把所有 runtime 细节一次性塞给模型。

### 3. 路由层：先提取核心意图，再选择路径

`SKILL.md` 里要求 canonical launch 前只做最小启动工作：

- Resolve `skill_root`
- Resolve `workspace_root`
- Resolve `host_id`
- Extract core intent as keyword text

特别重要的是这句：

```text
Do not pass the raw prompt, full chat history, or mixed-language filler to the router.
```

这其实是 context engineering 的关键原则：路由器不应该吃完整聊天历史，而应该吃被压缩后的任务意图。

也就是说：

```text
用户原始请求
-> 提取核心 intent
-> router 判断路线
-> 再加载对应 runtime 和 skills
```

### 4. 流程层：bounded stop 防止一路狂奔

Vibe-Skills 有 progressive governed stops：

```text
requirement_doc
xl_plan
phase_cleanup
```

当 runtime 要求显式用户 re-entry 时，当前 assistant turn 应该停止，等用户批准或修订。

这很重要。很多 agent 工具的问题是：一旦开始执行，就一路自动跑到底，最后用户才发现方向错了。

Vibe-Skills 把关键边界切出来：

```text
需求边界：先确认做什么。
计划边界：再确认怎么做。
阶段边界：每个阶段做完后清理和验收。
```

这是 workflow 级别的渐进式披露。

### 5. 记忆层：上下文不常驻，而是按需恢复

Vibe-Skills 的 workspace memory 会保存：

- requirements
- plans
- decisions
- evidence
- runtime sessions

这些东西存到 `.vibeskills/` 下面，供后续会话恢复。

这和我之前写的 AgentOS 很接近：

```text
上下文窗口是内存。
workspace memory 是项目级持久存储。
vibe runtime 是调度器。
```

真正有价值的是“什么时候恢复哪段上下文”，而不是“永远把所有历史注入”。

---

## 四、怎么安装

Vibe-Skills 官方给了两条安装路线。

### 1. Prompt-Based Install

这是官方推荐路线。

你需要选择三件事：

```text
host: codex / claude-code / cursor / windsurf / openclaw / opencode
action: install / update
version: full / minimal
```

然后打开官方的 prompt-based install 文档，把匹配 prompt 复制到对应 AI app，让 assistant 帮你执行安装和检查。

这个方式适合：

- 不想手动判断 host root。
- 希望 agent 帮你跑安装检查。
- 第一次试用。

但我的建议是：即使使用 prompt-based install，也应该先读一下安装脚本和要写入的位置。因为它会让 AI 在你的本机执行安装动作，属于需要谨慎的本地环境修改。

### 2. Command Install

如果你更熟悉命令行，可以直接看 command reference。

官方给出的通用形态是：

```bash
bash ./install.sh --host <host> --profile full
bash ./check.sh --host <host> --profile full
```

Windows / PowerShell 会有对应变体。

Command install 更适合：

- 你知道目标 host root。
- 你想自己控制 install / check 顺序。
- 你在测试机、CI 或隔离环境里验证。

### 3. full 还是 minimal

官方建议：

```text
full：正常 VibeSkills 体验，推荐默认。
minimal：更小的 governance framework，适合刻意想先装框架的人。
```

我自己的选择会是：

```text
个人试用：full
生产或团队验证：先在隔离环境 full，再决定是否迁移
只想研究架构：minimal 或直接读源码
```

---

## 五、怎么调用

Vibe-Skills 不是一个普通 CLI 程序，而是 Skills-format runtime。它要通过宿主的 Skills 入口调用。

官方 README 里列了几个入口：

| Host | Invocation | 示例 |
|---|---|---|
| Claude Code | `/vibe` | `Plan this task /vibe` |
| Codex | `$vibe` | `Plan this task $vibe` |
| OpenCode | `/vibe` | `Plan this task with vibe.` |
| OpenClaw | Skills entry | 看宿主文档 |
| Cursor / Windsurf | Skills entry | 看平台 Skills 文档 |

对 Codex 用户来说，典型写法就是：

```text
把这个功能拆成可执行计划 $vibe
```

或者：

```text
实现这个需求，先冻结需求、再计划、再分阶段执行，最后验证 $vibe
```

如果你想后续对话继续留在 governed workflow 中，就要在后续消息里继续带上 `$vibe` 或对应 host 的入口。

官方也特别提醒：

```text
$vibe 或 /vibe 只是进入 governed runtime。
它不是 MCP completion，也不证明宿主 native MCP 已安装。
```

这点很容易误解。

---

## 六、什么任务适合用 Vibe-Skills

我会把任务分成三类。

### 1. 不适合用

这些任务不必上 Vibe-Skills：

```text
问一个概念
查一个命令
改一行小 bug
让 agent 总结一段文本
一次性 shell 检查
```

因为 Vibe-Skills 的价值是治理复杂任务。简单任务上 harness 反而重。

### 2. 适合用

这些任务很适合：

```text
多文件代码改造
从需求到实现的小功能
需要设计、实现、测试、验收的任务
研究报告 + 可复现实验
数据分析 + 图表 + 文档
多媒体生成和审查
需要跨会话保存上下文的长期任务
```

比如：

```text
为这个 Hugo 博客新增一个发布检查 workflow，并写文档 $vibe
```

Vibe-Skills 理想情况下会推动 agent：

```text
确认需求
读取项目结构
制定阶段计划
调用相关 skills
执行改动
运行 Hugo build
检查 GitHub Pages
保存本次经验
```

### 3. 最适合用

我认为它最适合下面这种任务：

```text
目标明确，但路径复杂；
需要多个技能协作；
需要可交付结果；
需要保存上下文；
不希望 agent 只给一段“看起来不错”的回答。
```

一句话：

```text
当你关心“过程可控”和“结果可验证”时，用 Vibe-Skills。
```

---

## 七、一次实际使用应该怎么写 prompt

下面给几个我会使用的 prompt 模板。

### 1. 需求澄清型

```text
我想做一个面向个人博客的文章发布检查流程。
请先冻结需求，列出边界和不做的事，然后给我一个分阶段计划 $vibe
```

这个适合任务还不清楚时。

### 2. 代码实现型

```text
在这个项目中实现一个发布前检查脚本：
1. 检查 Hugo front matter
2. 运行 hugo build
3. 搜索生成产物是否包含新文章 slug
4. 输出检查报告
请按需求、计划、实现、验证推进 $vibe
```

这个适合开发任务。

### 3. 研究写作型

```text
研究 Vibe-Skills 与 Anthropic Agent Skills 的关系，
输出一篇中文技术博客，要求包含架构分析、使用方法、风险边界和 Agent 时代意义。
请先列提纲，再写正文并自检引用 $vibe
```

这个适合研究和写作。

### 4. 长任务续跑型

```text
继续上次的 Vibe-Skills 研究任务。
请读取 workspace memory 中的需求、计划和证据，
先告诉我当前阶段和剩余工作，再继续执行 $vibe
```

这个适合跨会话。

---

## 八、它和 Anthropic Agent Skills 的关系

Anthropic Agent Skills 的核心思想是渐进式披露：

```text
系统启动时只加载 skill metadata。
命中任务后读取 SKILL.md。
需要更深资料时再读取 references、scripts、templates。
```

Vibe-Skills 吸收了这个方向，但扩展到了 workflow 层。

可以这样区分：

| 维度 | Anthropic Agent Skills | Vibe-Skills |
|---|---|---|
| 核心问题 | 能力如何按需加载 | 任务如何按阶段推进 |
| 外部形态 | 多个独立 skills | 一个 super skill harness |
| 主要机制 | metadata -> SKILL.md -> references | vibe -> requirement -> plan -> route -> verify -> memory |
| 优势 | 简洁、标准、可移植 | 更像完整任务操作系统 |
| 风险 | 需要模型自己判断何时加载 | harness 较重，可能和其他流程冲突 |

所以我会说：

```text
Anthropic 是 capability progressive disclosure。
Vibe-Skills 是 workflow progressive disclosure。
```

前者解决“能力可发现和按需加载”。

后者解决“能力如何被编排成可靠交付”。

如果套用 011 里的三层模型，Vibe-Skills 可以这样理解：

```text
发现层：vibe / vibe-upgrade
指导层：SKILL.md + runtime protocol
执行层：340+ bundled skills + scripts + evidence + memory
```

但 Vibe-Skills 又多了一层，这层是它区别于普通 Agent Skills 的关键：

```text
治理层：requirement_doc / xl_plan / phase_cleanup
```

Anthropic Agent Skills 主要让 agent 知道“该读什么”。Vibe-Skills 进一步规定“什么时候停下来让用户确认，什么时候进入下一阶段，什么时候必须拿出验证证据”。

所以它不是简单复刻 Anthropic Skills，而是在 011 的能力渐进式披露基础上，把披露边界从“文档和脚本”扩展到了“任务生命周期”：

```text
先披露入口，不披露全部 skills。
先冻结需求，不直接执行。
先给阶段计划，不一次跑到底。
先验证证据，不只宣称完成。
先保存上下文，不把旧历史常驻注入。
```

这也是 Vibe-Skills 最值得研究的地方：它把 skills 从“可调用能力”组织成了“可治理流程”。

---

## 九、和 AgentOS / 经验系统的关系

我之前写过 AgentOS 和经验压缩：

```text
做事 -> 复盘 -> 压缩 -> 检索 -> 复用 -> 再做事
```

Vibe-Skills 正好可以放进这条链。

它负责的是：

```text
做事时把过程结构化。
阶段结束时留下证据。
任务结束时保存 workspace memory。
下次任务时恢复相关上下文。
```

这让它具备 AgentOS 雏形：

| AgentOS 层 | Vibe-Skills 对应物 |
|---|---|
| Context Manager | router / runtime input packet |
| Memory Manager | `.vibeskills/` workspace memory |
| Experience Compiler | requirement / plan / proof artifacts |
| Workflow Scheduler | VCO runtime |
| Verification Layer | evidence.verify / tests / artifacts |
| Governance Layer | bounded stops / phase cleanup |

如果未来它能把“经验卡片”和“skill 迭代”做得更明确，就会更接近一个完整的 agent 工作系统。

---

## 十、风险和注意事项

Vibe-Skills 的方向很好，但使用时要注意几个风险。

### 1. 安装风险

Prompt-based install 会让 AI 帮你执行安装。它很方便，但本质上仍然是本地环境修改。

建议：

```text
先读安装文档。
尽量在测试环境试装。
确认写入路径。
不要在未知脚本里输入 secrets。
不要让它直接接触高敏感项目。
```

### 2. Harness 冲突

如果你已经在用另一个强流程框架，比如 spec workflow、Trellis、SuperClaude 或自定义 AGENTS 工作流，Vibe-Skills 可能会和它争夺流程控制权。

因为它是 Super Skill，不是普通 Skill。

建议：

```text
一个任务只让一个总控 harness 负责。
其他 skills 作为专家能力被调用。
```

### 3. Skills 数量治理

340+ skills 听起来强，但真正难的是治理：

```text
哪些过期？
哪些重复？
哪些适用边界不清？
哪些会误触发？
哪些需要 eval？
```

如果没有持续评测，skills 越多，长期维护成本越高。

### 4. 记忆污染

Workspace memory 是优势，也是风险。

如果旧需求、旧计划、旧假设没有过期机制，下次任务可能被错误上下文带偏。

建议 memory 里必须区分：

```text
事实
假设
已验证结论
用户偏好
废弃决策
当前任务状态
```

### 5. “完成”必须绑定证据

Vibe-Skills 强调 verified delivery，这是对的。

但用户仍然应该看最终证据，而不是只相信 agent 说“完成了”。

一个合格收尾应该至少包含：

```text
改了什么
为什么这样改
运行了什么验证
验证结果是什么
哪些风险还没覆盖
下次如何继续
```

---

## 十一、我会怎么把它用于自己的工作流

如果我在自己的博客和 agent 实验里试用 Vibe-Skills，我会从三类任务开始。

### 1. 文章研究与发布

例如：

```text
分析 Entire、Vibe-Skills 或 AgentOS 相关工具，
形成一篇文章并发布到 Hugo 博客 $vibe
```

理想流程：

```text
冻结主题
收集资料
形成提纲
写正文
本地 hugo build
检查生成产物
commit / push
检查 GitHub Pages
保存发布经验
```

### 2. 项目发布检查

例如：

```text
为 my-blog 建立一份发布检查清单和可复用脚本 $vibe
```

这里可以验证它是否真的会：

```text
读取项目事实
生成计划
实现最小脚本
运行构建
保存 proof
```

### 3. 长期 AgentOS 实验

例如：

```text
基于 007、008、011、012 的文章，设计一个 .agents/experience 系统原型 $vibe
```

这个任务很适合测试 Vibe-Skills 的记忆和阶段治理能力。

---

## 十二、结论

Vibe-Skills 的核心价值不是“我有 340+ skills”。

真正重要的是它提出了一个方向：

```text
skills 不应该只是列表。
skills 应该被编排成工作流。
工作流不应该一次跑到底。
工作流应该在需求、计划、执行、验证、记忆之间渐进展开。
```

这就是它的渐进式披露设计：

```text
一个入口
按需路由
阶段确认
证据验证
记忆保存
下次恢复
```

如果说 Anthropic Agent Skills 是“能力的渐进式披露”，那么 Vibe-Skills 就是在尝试“任务执行的渐进式披露”。

我认为它代表了 agent 工具正在发生的一个变化：

```text
从 prompt 包
到 skill 包
再到 workflow harness
最后走向 AgentOS。
```

现阶段它还需要解决安装安全、harness 冲突、skills 治理、记忆污染和长期 eval 的问题。但作为一个开源实验，它已经很值得研究。

对个人用户来说，最好的使用方式不是马上把所有任务都交给它，而是从一个中等复杂度、可验证、有明确交付物的任务开始。

比如：

```text
帮我把这个想法做成一篇文章并发布，要求先冻结需求、再计划、最后验证上线 $vibe
```

如果它真的能让 agent 稳定走完这条链，那它就不是“技能合集”，而是一个真正开始具备操作系统气质的 agent 工作台。

---

## 参考资料

- Linux.do, [Vibe-Skills 3.1.0 主题](https://linux.do/t/topic/2061161?u=laiwuying)
- GitHub, [foryourhealth111-pixel/Vibe-Skills](https://github.com/foryourhealth111-pixel/Vibe-Skills)
- GitHub, [Vibe-Skills v3.1.0 release](https://github.com/foryourhealth111-pixel/Vibe-Skills/releases/tag/v3.1.0)
- Vibe-Skills, [`SKILL.md`](https://github.com/foryourhealth111-pixel/Vibe-Skills/blob/main/SKILL.md)
- Vibe-Skills, [Prompt-based install](https://github.com/foryourhealth111-pixel/Vibe-Skills/blob/main/docs/install/one-click-install-release-copy.en.md)
- Vibe-Skills, [Command install reference](https://github.com/foryourhealth111-pixel/Vibe-Skills/blob/main/docs/install/recommended-full-path.en.md)

