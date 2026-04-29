---
title: "[013] Entire 与“Git 已死”：Agent 时代的软件协作系统为什么需要重写"
date: 2026-04-29T21:55:00+08:00
draft: false
slug: "013-entire-git-agent-native-dev-platform"
aliases:
  - "/posts/entire-git-agent-native-dev-platform/"
tags: ["Entire", "Git", "AI Agent", "AgentOS", "软件工程", "Context Engineering", "Developer Tools"]
categories: ["AI 工具"]
---

> 分析对象：Entire、Thomas Dohmke、Agent-native Developer Platform  
> 整理时间：2026-04-29  
> 关键词：Git、Checkpoints、Agent Context、Semantic Reasoning Layer、AgentOS

---

## 执行摘要

Entire 很值得关注。

它不是又一个“AI 写代码工具”，而是在尝试重写 AI agent 时代的软件协作底座。它的第一步也很克制：不是马上替代 GitHub，而是先用一个开源 CLI，把 agent 会话、prompt、工具调用、token 使用、触碰文件、决策过程和 commit 绑定起来，形成所谓 Checkpoints。

一句话概括：

```text
Git 记录了代码怎么变。
Entire 试图记录代码为什么这样变，以及是哪段 agent 轨迹导致了这个变化。
```

用户提到“GitHub 创始人之一辞职创建了这个公司，他认为 Git 已死”。这里需要先澄清一个事实：Entire 创始人 Thomas Dohmke 是 GitHub 前 CEO，不是 GitHub 创始人。GitHub 创始人通常指 Tom Preston-Werner、Chris Wanstrath、PJ Hyett、Scott Chacon 等人。

但这个误差不影响核心判断：Thomas Dohmke 对 Entire 的定位，确实是在挑战 GitHub 时代的软件开发生命周期。他真正说的不是“Git 这个数据结构已经没有价值”，而是：

```text
以 Git repo、issue、pull request、人类 code review 为中心的协作系统，
不是为 agent 作为主要代码生产者的时代设计的。
```

所以，“Git 已死”如果要成立，应该理解为：

```text
Git-only workflow 已经不够了。
Code diff-only review 已经不够了。
Human-to-human SDLC 已经不够了。
```

Git 作为内容寻址、分支、合并、分布式版本控制的底层模型并没有死。恰恰相反，Entire 当前第一版还在复用 Git：它把 checkpoint metadata 存在仓库里的 `entire/checkpoints/v1` 分支，并通过 commit trailer 把 commit 和 checkpoint 关联起来。

这说明 Entire 现在不是反 Git，而是在 Git 上方补一层 agent-native 的语义记录。

---

## 一、Entire 现在是什么状态

截至 2026-04-29，我看到的 Entire 状态可以分成三层。

### 1. 公司状态：高调启动，融资规模很大

Entire 官方新闻稿显示，Thomas Dohmke 在 2026-02-10 宣布启动 Entire，并获得 6000 万美元种子轮融资，估值 3 亿美元。融资由 Felicis 领投，Madrona、M12、Basis Set、20VC、Cherry Ventures、Picus Capital、Global Founders Capital 等参与。

这对 developer tools 领域来说是非常激进的早期融资规模。它反映的不是一个 CLI 工具本身的价值，而是投资人押注：

```text
AI agent 会重写软件生产方式，
因此 GitHub 之后可能出现新的开发者平台。
```

### 2. 产品状态：第一版是 Checkpoints

Entire 当前首页把自己定义为：

```text
Developer platform for humans and agents
```

第一版产品不是 IDE，也不是代码托管平台，而是 Entire CLI。它接入现有 Git 工作流，在每次 push / commit 周围捕获 agent session，并把这些 session 与 commit 一起索引。

官方首页强调几个点：

- CLI 接入 Git workflow。
- 捕获 AI agent sessions。
- session 和 commit 一起索引。
- 形成代码是如何写出来的可搜索记录。
- 开源，MIT license。
- 支持 Claude Code、Gemini CLI、OpenCode、Cursor、GitHub Copilot CLI、FactoryAI 等 agent / 工具生态。

官方 announcement 对 Checkpoints 的定义更具体：

```text
每个 agent-generated commit 都绑定一个 structured checkpoint，
包含 transcript、prompts、files touched、token usage、tool calls 等信息。
```

这很关键。它不是“AI 总结一下 commit message”，而是把 agent 运行轨迹变成版本化数据。

### 3. 开源状态：CLI 已经有真实关注度

我用 GitHub CLI 查看了 `entireio/cli` 仓库当前状态：

| 项目 | 状态 |
|---|---|
| 仓库 | `entireio/cli` |
| License | MIT |
| 创建时间 | 2026-01-02 |
| Stars | 4086 |
| Forks | 313 |
| 最新 release | `v0.5.6` |
| release 时间 | 2026-04-24 |
| Open issues | 61 |
| Open PRs | 63 |

这个状态说明它不是纯概念页，已经有开源实现和社区活动。但也要冷静看：它还处于早期阶段，远没有到“替代 GitHub”或“重写行业标准”的成熟度。

更准确的描述是：

```text
Entire 正在从一个 agent session provenance 工具，向 agent-native developer platform 演进。
```

---

## 二、“Git 已死”到底是什么意思

如果按字面理解，“Git 已死”是不准确的。

原因很简单：Entire 目前仍然建立在 Git 之上。

Entire FAQ 里解释了为什么它使用 commit trailer，而不是 Git notes。它会在 commit message 中加入类似这样的 trailer：

```text
Entire-Checkpoint: a3b2c4d5e6f7
```

这个 checkpoint ID 指向存储在 `entire/checkpoints/v1` 分支里的 checkpoint metadata。

Entire 选择 commit trailer 的原因也很工程化：Git notes 不会随普通 push 自动推送，rebase、amend、cherry-pick 会改变 commit SHA，托管平台对 notes 的支持也不一致。把稳定 checkpoint ID 放进 commit message，更容易穿过常见 Git 工作流。

这说明 Entire 对 Git 的态度不是“推翻”，而是“补语义层”。

那么什么死了？

我认为死的是这三个默认假设。

### 1. “diff 足够解释代码变化”死了

在人类写代码时代，一个 diff 通常还能让 reviewer 推断大致意图。

在 agent 时代，这个假设会失效。

因为 agent 一次可能生成大量代码，跨很多文件，甚至并行尝试多个方案。最终 diff 只展示结果，不展示：

- prompt 里给了什么目标。
- agent 读取了哪些文件。
- 它尝试过哪些错误路径。
- 用户中途纠正了什么。
- 哪些约束被模型遵守或忽略。
- 为什么选择方案 A 而不是方案 B。

只看 diff，就像只看机器最终产物，不看生产过程。

### 2. “PR 是软件协作的中心”开始失灵

Pull request 是为人类协作设计的。它假设变更量相对可读，reviewer 可以逐行理解，讨论可以围绕 diff 进行。

Agent 时代会打破这个尺度：

```text
一个人可以同时开多个终端，让多个 agent 改不同分支。
一个任务可以生成几十个候选实现。
一个 monorepo 里可能每天产生海量机器生成代码。
```

如果仍然把 PR 当唯一协作中心，reviewer 会成为瓶颈。

未来 review 的中心可能不再是“逐行看 diff”，而是：

```text
审查意图
审查约束
审查测试证据
审查 agent 轨迹
审查风险边界
审查最终可回滚性
```

这就是 Entire 想切进去的位置。

### 3. “代码仓库只存代码”死了

Git 仓库过去主要存源码、配置、文档和构建脚本。

Agent 时代，真正有价值的还有：

- 任务意图。
- prompt。
- 约束。
- agent 会话。
- 工具调用。
- 失败尝试。
- 用户纠正。
- 验证证据。
- 生成代码的责任链。

如果这些都不被版本化，代码库就会越来越像“只剩尸体，没有案发过程”。

Entire 的核心判断是：agent 时代的版本控制系统必须记录 code + context，而不是只记录 code。

---

## 三、Entire 和我前面几篇文章的关系

前面我写过三篇有关经验系统的文章：

- [[007] 从单次感知到经验压缩](/posts/007-one-shot-perception-experience-compression-ai-memory/)
- [[008] 从内存与存储看 AgentOS](/posts/008-agentos-memory-storage-rag-experience/)
- [[012] 从经验压缩到渐进式披露](/posts/012-experience-os-progressive-disclosure-agent-loop/)

Entire 正好落在这条链的一个关键位置。

007 讨论的是：

```text
一次会话如何被压缩成未来可复用经验？
```

008 讨论的是：

```text
这些经验如何被保存、索引、调度和治理？
```

012 讨论的是：

```text
经验如何通过渐进式披露和 skill 机制变成可执行能力？
```

Entire 当前做的事情是更底层的：

```text
先把 agent 轨迹可靠地保存下来，并和 commit 建立稳定关联。
```

也就是说，Entire 不是直接给出“经验压缩”的最终答案，但它在补一块非常关键的基础设施：

```text
没有完整轨迹，就没有高质量经验压缩。
没有 commit 关联，就没有代码级可追溯性。
没有版本化上下文，就没有团队级 agent 记忆。
```

它像是 AgentOS 的事件日志和 provenance layer。

---

## 四、Entire 的真正价值：从 Commit History 到 Intent History

传统 Git history 是 commit history。

它能回答：

```text
谁在什么时候改了哪些文件？
```

但 agent 时代更需要 intent history。

它要回答：

```text
为什么要改？
根据什么上下文改？
agent 读了哪些文件？
用户如何约束它？
它尝试过什么？
它如何验证？
它有哪些未解决风险？
```

Entire 的 Checkpoints 本质上是在构建 intent history。

这件事对团队协作会有几个直接影响。

### 1. Code review 从结果审查变成过程审查

以前 review 主要看 diff。

未来 review 可能要看：

```text
任务规格是否清楚？
agent 是否读取了正确上下文？
是否遗漏关键测试？
是否被错误假设带偏？
是否有用户批准高风险操作？
```

Entire 记录 session transcript、tool calls、files touched 等信息，可以让 reviewer 不只看代码，还能看生成过程。

### 2. Handoff 从“你去读代码”变成“你接着这条轨迹走”

现在开发交接经常是：

```text
你看一下这个分支，我大概改了这些。
```

Agent 时代更好的交接应该是：

```text
这是 checkpoint。
这里有完整任务意图、上下文、尝试路径、验证结果和剩余问题。
```

这样下一个人或下一个 agent 不需要从零推断。

### 3. Agent 记忆从“聊天软件记忆”变成“仓库级记忆”

如果 agent 的记忆只存在某个产品账号里，它很难成为团队资产。

Entire 的思路是把 session context 放回 Git 相关历史里。这样它有几个优势：

- 跟随仓库迁移。
- 可以和 commit、branch、review 关联。
- 可以被团队权限体系管理。
- 可以成为未来 agent 的检索材料。

这非常接近我在 AgentOS 里说的项目级文件系统思路。

---

## 五、Entire 当前设计里的几个工程判断

Entire 的第一版有几个很有意思的取舍。

### 1. 不做 line-level 永久归因

Entire FAQ 明确说，它优先保存 session 和 commit 级 provenance，而不是做永久 line-level AI attribution。

这是合理的。

因为 Git 历史里，行会移动、拆分、合并、重写。rebase、amend、cherry-pick、squash、merge conflict 都会破坏行级归因。要让每一行永久知道“是哪次 agent 生成的”，实现成本和误差都很高。

所以 Entire 选择更稳的对象：

```text
session -> checkpoint -> commit
```

这符合 KISS。先把稳定单位做好，再谈更细粒度。

### 2. 用 Git branch 保存 metadata，而不是另起数据库

官方说 Checkpoints metadata 存在 `entire/checkpoints/v1` 分支。这意味着它仍然利用 Git 的分布式、可同步、可审计特性。

这有点像：

```text
Git 原本只存代码树。
Entire 用另一个分支存 agent 轨迹树。
commit trailer 做两者之间的指针。
```

好处是开放、便携、容易接入现有工作流。

风险也很明显：metadata 的体积、隐私、同步策略、冲突处理、托管平台兼容性，都需要长期验证。

### 3. 先做 CLI，不急着做完整平台

这是一个务实选择。

如果一上来做完整替代 GitHub 的平台，阻力会非常大。先做 CLI，可以接入已有仓库和已有 agent，把关键数据采集起来。

它的战略顺序很清楚：

```text
先成为 agent session 的记录层。
再成为 agent context 的检索层。
再成为团队协作的语义层。
最后才可能成为新的 developer platform。
```

---

## 六、对 Agent 时代的意义

Entire 最值得关注的地方，不是它现在的功能，而是它指向的范式变化。

### 1. Agent 需要的是“轨迹”，不是只需要代码

一个 agent 生成的代码，如果没有轨迹记录，就很难回答：

```text
它为什么这样做？
它有没有误解需求？
它是不是跳过了测试？
它是不是碰了不该碰的文件？
```

Agent 时代的工程治理，必须把 trajectory 当作一等对象。

这和我在 012 里写的 Trajectory Engineering 是同一方向：未来不只优化最终答案，而是优化 agent 的行动轨迹。

### 2. 代码审查会变成“意图审查 + 证据审查”

人类 reviewer 不可能逐行消化无限机器生成代码。

所以 review 会上移：

```text
意图是否正确？
约束是否完整？
执行轨迹是否可信？
验证证据是否充分？
变更是否可回滚？
风险是否被记录？
```

Entire 的 Checkpoints 如果做得好，会成为这种 review 的证据层。

### 3. 经验系统需要原始轨迹作为燃料

前面我一直强调经验压缩。

但经验压缩有一个前提：原始轨迹必须存在。

如果只有最后 diff，就很难知道 agent 是怎么推理的，也很难提取高质量经验卡片。

Entire 捕获 transcript、prompt、tool calls、files touched，意味着它可以为后续的 Experience Compiler 提供原料。

未来可以出现这样的流水线：

```text
Entire checkpoint
-> 提取任务意图、关键约束、失败尝试、验证证据
-> 生成经验卡片
-> 升级为 skill
-> 下次 agent 按需加载
```

这就是 agent 时代的“做事 -> 复盘 -> 压缩 -> 复用”自动化版本。

### 4. 多 agent 协作需要共享上下文图

单 agent 可以靠当前上下文勉强工作。

多 agent 并行时，必须有共享语义层。

Entire vision 里提到 semantic reasoning layer 和 context graph。这个方向很重要，因为多 agent 协作最怕：

- 重复做同一件事。
- 覆盖彼此改动。
- 基于过期假设继续执行。
- 不知道另一个 agent 已经验证或否定了什么。

Git merge 只能合并文件内容，不能合并意图、假设、验证和失败路径。

这就是语义层的价值。

---

## 七、我对 Entire 的保留判断

Entire 的方向很对，但它也有几个难点。

### 1. 隐私和敏感信息会是第一大挑战

Agent session 里可能包含：

- API key。
- 私有代码片段。
- 客户信息。
- 生产日志。
- 内部需求。
- 用户临时输入的敏感数据。

Entire 文档提到会尝试匿名化 transcript 中的敏感数据，也提到 session 数据存储在仓库分支并可在 Entire.io 中加密保存。但这类系统的安全边界非常敏感。

团队真正采用前，必须能回答：

```text
哪些 session 会被捕获？
哪些字段会被脱敏？
谁可以查看？
是否能本地-only？
是否能删除？
删除后 Git 分支历史如何处理？
是否符合企业合规？
```

### 2. 数据量会快速膨胀

Agent session 很长。工具调用很多。token 使用、文件读取、终端输出都会产生大量记录。

如果每个 commit 都附带完整 session，仓库 metadata 体积会不会失控？如何做压缩、索引、归档、冷热分层？

这是从“能记录”走向“长期可用”的关键。

### 3. 记录轨迹不等于理解轨迹

Checkpoints 保存了数据，但真正的价值来自解释。

如果最后只是多了一个“很长的 transcript 列表”，reviewer 仍然不会看。

下一步必须是：

```text
从 transcript 提取意图、约束、风险、验证、未解决问题。
```

也就是说，Entire 最终要做的不只是 provenance database，而是 reasoning summarization + semantic indexing + policy-aware review。

### 4. 标准化会决定天花板

Entire 想支持各种 agent。问题是不同 agent 的日志格式、工具调用格式、权限模型、上下文记录方式都不同。

如果没有跨 agent 的开放 schema，Checkpoints 可能会变成适配器集合。

真正的平台机会在于定义一种通用格式：

```text
Agent session schema
Tool call schema
Intent schema
Verification schema
Risk schema
Handoff schema
```

谁定义了这个 schema，谁就可能成为 agent-native SDLC 的底座。

---

## 八、这对 GitHub 意味着什么

Entire 最直接挑战的其实不是 Git，而是 GitHub。

GitHub 的核心资产是：

- 代码托管。
- Issue。
- Pull Request。
- Actions。
- Review。
- 生态集成。
- 社交网络。

但这些都是围绕人类协作生长出来的。

Agent 时代的问题是：

```text
代码生产者从人类为主，变成 agent 参与甚至 agent 为主。
```

GitHub 当然也会演进，Copilot、Coding Agent、Actions、code review automation 都在往这个方向走。但 GitHub 的路径天然是：

```text
在现有 GitHub 工作流里加入 agent。
```

Entire 的路径则是：

```text
从 agent-native production system 重新定义工作流。
```

这就是两者差异。

长期看，Entire 不一定要取代 GitHub 才有价值。它也可能成为：

- GitHub 上的 agent provenance layer。
- 企业内部 agent session archive。
- 多 agent 协作的 shared context layer。
- AI-native code review 的证据层。
- 新一代开发平台的数据底座。

---

## 九、对我自己的启发

Entire 让我更确定一件事：

```text
未来软件工程的核心对象，不再只是代码，而是代码生成过程。
```

我之前写“经验压缩”“AgentOS”“渐进式披露”，更多是从个人知识复用和 agent 记忆角度出发。

Entire 则把这件事推进到工程协作层：

```text
个人经验压缩 -> 团队经验系统
会话记忆 -> 仓库级可追溯上下文
代码 diff -> 意图和证据
单 agent 执行 -> 多 agent 共享语义层
```

这对我现在这个博客项目也有直接启发。

例如每次我让 agent 写文章、构建、提交、推送、检查线上页面，这不只是一次操作。它可以被记录成：

```text
任务意图：新增分析文章并发布
上下文：读取哪些历史文章
执行：新增哪个 Markdown 文件
验证：Hugo build、生成产物搜索、GitHub Actions、线上 URL
风险：日期是否未来、缓存是否未刷新、是否混入无关提交
```

这就是一个 mini checkpoint。

如果把这些 checkpoint 长期保存，下一次 agent 不需要重新猜我的博客发布流程。它可以直接复用历史轨迹。

---

## 十、结论

Entire 的重要性不在于它现在是否已经成熟，也不在于它是否真的能“杀死 Git”。

它真正指出的问题是：

```text
Agent 时代，代码本身不够了。
我们还需要记录意图、约束、轨迹、验证和责任链。
```

Git 不会马上死。Git 作为底层版本控制模型仍然强大。

但 Git-only、diff-only、PR-only、human-only 的软件协作方式，确实正在老化。

Entire 当前第一版 Checkpoints 是一个很聪明的切入点：它不试图一口气重写整个开发平台，而是先把最容易丢失、但未来最重要的东西保存下来：

```text
agent 生成代码时的上下文和轨迹。
```

如果 Entire 能继续解决隐私、数据体积、语义摘要、跨 agent schema、团队治理这些问题，它可能会成为 agent-native SDLC 的关键基础设施。

换句话说：

```text
Git 记录历史。
Entire 想记录历史背后的意图。
Agent 时代真正需要的，是能让人和机器共同理解、审查、继承和复用的开发历史。
```

这也是为什么我认为 Entire 值得持续关注。

---

## 参考资料

- Entire, [Developer platform for humans and agents](https://entire.io/home)
- Entire, [Vision](https://entire.io/vision)
- Entire, [Hello Entire World](https://entire.io/blog/hello-entire-world)
- Entire, [Former GitHub CEO Thomas Dohmke raises $60 million seed round](https://entire.io/news/former-github-ceo-thomas-dohmke-raises-60-million-seed-round)
- Entire Docs, [Frequently Asked Questions](https://docs.entire.io/cli/faq)
- Entire Docs, [Web Overview](https://docs.entire.io/web/overview)
- GitHub, [entireio/cli](https://github.com/entireio/cli)
