---
title: "[008] 从内存与存储看 AgentOS：AI 经验如何被保存、调度和复用"
date: 2026-04-24T06:18:00+08:00
draft: false
slug: "008-agentos-memory-storage-rag-experience"
aliases:
  - "/posts/agentos-memory-storage-rag-experience/"
tags: ["AI", "AgentOS", "RAG", "记忆系统", "经验压缩", "知识管理", "LLM", "Agent"]
categories: ["AI 工具"]
---

上一篇我写到：

> 上下文像工作台。长期记忆像工具柜。

你提醒我：这不正像操作系统里的 **内存和存储** 吗？

我觉得这个类比非常准确，而且比“工作台/工具柜”更工程化。

如果把大模型看成一个强大的计算核心，那么一次会话里的上下文窗口，很像运行时内存：快、贵、容量有限、随进程结束而消失。外部知识库、项目文档、经验卡片、向量库、图数据库、`CLAUDE.md`、Memory API，则更像存储系统：慢一些，但能跨会话、跨任务、跨工具保留下来。

这就自然引出一个问题：

> AgentOS 能不能像传统操作系统管理内存、文件、进程和权限一样，管理 AI agent 的上下文、长期记忆、工具调用和经验复用？

我的答案是：可以，而且现在很多产品已经在朝这个方向走。只是它们还比较分散，有的像内存管理器，有的像文件系统，有的像检索引擎，有的像用户偏好本。

真正的 AgentOS，应该把这些能力收束成一套“经验操作系统”。

---

## 一、把上下文看成内存，把知识库看成存储

传统计算机里，内存和存储的分工很清楚：

| 层级 | 特点 | 典型职责 |
|---|---|---|
| CPU 寄存器 | 极快、极小 | 当前指令和即时变量 |
| 内存 RAM | 快、易失、容量有限 | 正在运行的程序状态 |
| 磁盘/SSD | 慢一些、持久、容量大 | 文件、日志、数据库 |
| 文件系统 | 命名、权限、目录结构 | 让存储可组织、可查找 |
| 操作系统 | 调度、隔离、资源管理 | 决定什么进入内存，什么留在磁盘 |

AI agent 也有类似层级：

| Agent 层级 | 类比 | 典型内容 |
|---|---|---|
| 当前 prompt | 寄存器/栈帧 | 当前问题、系统指令、马上要执行的步骤 |
| 上下文窗口 | RAM | 对话历史、临时文件摘要、最近工具结果 |
| 会话状态 | 进程状态 | 当前任务计划、未完成步骤、临时判断 |
| 长期记忆 | 持久存储 | 用户偏好、项目事实、经验卡片、历史决策 |
| 检索系统 | 文件系统索引 | 向量索引、关键词索引、知识图谱、时间索引 |
| AgentOS | 操作系统 | 决定何时写入、遗忘、召回、压缩、授权 |

所以“上下文窗口不够用”并不只是 token 问题。它本质上是：

> Agent 还没有成熟的虚拟内存、文件系统、缓存、分页和垃圾回收机制。

现在很多应用的做法是：把越来越多聊天记录塞进上下文。

这像什么？

像把所有文件都复制到内存里，然后希望程序自己别乱。

当然会慢、贵、混乱，而且容易被旧信息干扰。

---

## 二、现有产品已经在拼 AgentOS 的不同部件

我调研了一圈，发现业界已经有很多“局部操作系统化”的设计。

### 1. OpenAI：记忆开始分成 saved memories 和 chat history

OpenAI 的 ChatGPT Memory 官方说明里，把记忆分成两类：一类是用户明确要求保存的 saved memories，另一类是可引用的 chat history。这个分层很重要，因为它区分了“明确写入的长期偏好”和“从历史会话中提取的上下文线索”。

OpenAI Agents SDK 也提供 session memory 相关能力，用于跨轮次保存上下文；其 agent memory 文档还提到，会在 run 开始时注入一份 `memory_summary.md`，把常用提示、用户偏好、可用记忆放进 developer prompt。

这已经很像操作系统启动进程时加载环境变量、配置文件和最近状态。

但它还不是完整 AgentOS。它更像：

```text
会话状态管理 + 用户记忆 + 启动时上下文注入
```

### 2. Claude Code：把记忆做成可版本化的项目文件

Claude Code 的官方 memory 文档把 `CLAUDE.md` 作为记忆入口，并区分组织级、项目级、用户级等不同作用域。

这件事对 coding agent 很关键。

因为代码项目里的长期记忆不应该只存在某个产品账号里，而应该和项目一起走：

```text
项目规则
构建命令
部署约定
踩坑记录
架构边界
```

这些内容如果放在仓库文件里，就能被 review、diff、commit、回滚。

这像文件系统，而不是聊天软件的“脑内记忆”。

### 3. LangGraph / LangChain：短期状态和长期 store 开始分离

LangGraph 的 memory 文档明确区分 short-term memory 和 long-term memory：短期记忆是 thread-scoped，保存在 agent state/checkpointer 里；长期记忆跨 thread 保存，通常放在 store 里，并且可以按 namespace/key 组织成 JSON 文档。

这个设计非常像：

```text
进程内存：当前 thread 的 state
持久存储：跨 session 的 store
```

更重要的是，它把记忆分成 semantic、episodic、procedural：

- semantic memory：事实、偏好、实体关系
- episodic memory：过去发生的事件和案例
- procedural memory：怎么完成一类任务

这已经接近“记忆类型系统”。

### 4. Letta / MemGPT：最像操作系统的路线

MemGPT 的论文标题就是 *Towards LLMs as Operating Systems*。Letta 作为后续产品，也延续了核心思想：把 agent 的有限上下文看成主存，把外部 archival memory 看成更大的可检索存储，然后通过函数调用在两者之间搬运信息。

这个方向和你的直觉几乎完全一致。

它不是说“大模型自己会永远记住”，而是说：

```text
LLM + memory manager + external memory = 可长期运行的 agent
```

这里最关键的是 memory manager。

没有 manager，长期记忆就是资料堆。

有了 manager，长期记忆才变成可调度资源。

### 5. Mem0、Zep、LlamaIndex、MemOS：记忆层正在产品化

Mem0 把自己定位成 AI agent 的 managed memory layer，强调从会话中抽取重要信息，结合向量存储、图服务和 reranker，让 agent 跨会话保持连续性。

Zep/Graphiti 走的是 temporal knowledge graph 路线。它不是只问“什么事实存在”，而是追踪“这个事实什么时候成立”。这对真实系统很关键，因为项目知识会变：

```text
以前 image-web 分享链接是 /share/:id
后来为了适配 /image/，服务端返回 ./share/:id
```

如果记忆系统没有时间维度，就会把旧知识和新知识混在一起。

LlamaIndex 的 memory 文档则把 memory 作为 agentic systems 的核心组件，支持短期消息队列和长期 memory blocks。

MemOS 更进一步，直接提出 Memory Operating System，把 memory units 当作一等资源来 store、retrieve、manage。

也就是说，AgentOS 不是凭空想象。现在的生态已经出现了这些部件：

| 产品/框架 | 更像 OS 的哪一层 |
|---|---|
| ChatGPT Memory | 用户级长期偏好和历史索引 |
| OpenAI Agents SDK | 会话状态、运行时 memory 注入 |
| Claude Code `CLAUDE.md` | 项目级配置文件和启动脚本 |
| LangGraph | 进程状态、checkpoint、long-term store |
| Letta / MemGPT | 虚拟内存和 memory manager |
| Mem0 | 托管记忆层和个性化 memory API |
| Zep / Graphiti | 时间感知知识图谱 |
| LlamaIndex | agent memory 抽象和 memory blocks |
| MemOS | 把记忆正式操作系统化 |

---

## 三、我理解的 AgentOS 应该长什么样

一个真正有用的 AgentOS，不应该只是“把向量库接上模型”。

它至少要有这些模块：

### 1. Context Manager：上下文管理器

决定当前任务要把哪些东西放进上下文。

它要做的不是“召回最多”，而是“装载最合适”。

类似 OS 的页面置换：

```text
当前目标是什么？
哪些记忆必须常驻？
哪些只是候选？
哪些已经过期？
哪些有风险，不能自动注入？
```

### 2. Memory Manager：记忆管理器

负责写入、更新、合并、遗忘。

它要解决的问题是：

```text
这句话值得记吗？
它是事实、经验、偏好，还是临时状态？
它应该覆盖旧记忆，还是保留历史版本？
它有没有证据？
它什么时候过期？
```

### 3. Experience Compiler：经验编译器

这是我最关心的一层。

原始会话不能直接变成长期记忆。它必须被编译。

```text
原始会话 -> 事件日志 -> 经验卡片 -> 程序化检查清单 -> 可复用技能
```

这就像源代码不能直接丢给 CPU，需要编译成结构化的可执行形式。

### 4. Retrieval Scheduler：检索调度器

RAG 的问题不只是检索精度，而是调度策略。

什么时候该查项目事实？

什么时候该查历史案例？

什么时候该查用户偏好？

什么时候不该查，因为当前任务需要干净上下文？

成熟的 AgentOS 应该能按任务类型选择检索策略：

| 任务 | 优先检索 |
|---|---|
| 写博客 | 文章风格、过往标题、标签体系 |
| 修 bug | 项目架构、历史故障、验证命令 |
| 改服务器 | Caddy 配置、端口、备份记录、回滚步骤 |
| 设计产品 | 用户长期偏好、价值主线、已有功能边界 |

### 5. Permission & Audit：权限和审计

长期记忆会影响未来行为，所以它必须可见、可编辑、可删除、可追责。

AgentOS 应该能回答：

```text
这条记忆从哪里来？
谁写入的？
什么时候写入的？
被哪些任务使用过？
它是否仍然有效？
```

否则 memory 会变成“幽灵上下文”：你不知道 agent 为什么突然这样判断。

---

## 四、“外部记忆系统 + 检索 + 上下文注入 + 模型推理”和人的经验复用像不像？

上一篇我写：

```text
AI 的经验复用更像：

外部记忆系统 + 检索 + 上下文注入 + 模型推理
```

这和人复用经验有没有关系？

有关系，但不能简单等同。

人的经验复用不是把全部过去重新播放一遍。

更常见的过程是：

```text
当前情境触发线索
-> 唤起相关经验
-> 抽取其中的模式
-> 结合当前差异修正
-> 采取行动
-> 根据反馈更新经验
```

这其实和好的 Agent 记忆循环很像：

```text
当前任务
-> 检索相关记忆
-> 注入上下文
-> 模型推理
-> 工具执行
-> 验证反馈
-> 更新记忆
```

但人的经验复用还有三个 AI 系统常缺的能力。

### 1. 人会自动压缩

人不会把一次修服务器的每句话都记住。

人会保留类似这样的东西：

```text
下次域名访问异常，先分层：
DNS 是否指到机器？
Caddy 是否接到请求？
反代目标是否健康？
路径前缀是否被应用支持？
```

这就是经验压缩。

AI 如果只保存聊天记录，就没有完成这一步。

### 2. 人会按情境召回

人不会每次写文章都想起 Caddy 配置，也不会每次改 Caddy 都想起文章标题。

好的经验不是“永远注入”，而是“在恰当情境出现”。

这对应 AgentOS 的检索调度器。

### 3. 人会更新自己的判断模型

人经历一次失败后，会改变下次的行动顺序。

比如这次发现 `/image/` 子路径下分享链接失效，下次再看到 404，就会先检查绝对路径泄漏，而不是先怀疑服务器挂了。

AI 如果只是召回一段记录，但没有把它变成“优先级改变”，就仍然只是查资料。

所以，人类经验复用更像：

```text
记忆 + 模型更新 + 行动策略更新
```

而当代 AI 工具多数还是：

```text
记忆检索 + 临时上下文利用
```

差别就在“经验是否改变了未来默认策略”。

---

## 五、为什么普通 RAG 还不够

RAG 最初解决的是知识密集型 NLP 的问题：模型不知道某些外部事实，就从文档里检索相关片段，再基于片段生成答案。

这个思路非常重要，但用于 agent 长期经验时，普通 RAG 会遇到几个结构性问题。

### 1. Chunk 不是经验单位

很多 RAG 系统按固定长度切块。

但经验的自然单位不是 500 字，也不是 1000 token。

经验的自然单位是：

```text
触发条件 -> 症状 -> 根因 -> 操作 -> 验证 -> 风险 -> 迁移边界
```

如果切块把“症状”和“验证”切开，召回结果就会变成残片。

### 2. 向量相似不等于任务相关

“Caddy 404”和“GitHub Pages 404”文本很相似，但处理路径可能完全不同。

真正相关的是：

```text
当前请求路径
当前入口域名
当前部署拓扑
当前错误发生在哪一层
```

这需要结构化过滤、图关系、时间版本和任务意图，而不只是 embedding 距离。

### 3. 知识会过期

服务器配置会变，项目目录会变，工具版本会变。

RAG 如果不知道时间，就可能召回旧事实。

比如：

```text
旧经验：nobodyls.cn 根域名没有指回这台机器
新状态：nobodyls.cn 已经作为统一门户在这台机器上
```

旧经验曾经是真的，但现在不能直接用。

所以未来的 RAG 必须有 temporal awareness。

### 4. 记忆需要治理

RAG 很容易把“曾经说过的话”当成事实。

但会话里有很多东西只是猜测：

```text
我怀疑是 DNS
可能是 Caddy
也许 GitHub Pages 没构建
```

如果这些探索性判断被当作长期记忆，下次 agent 会被误导。

真正的记忆系统必须区分：

```text
观察
假设
已验证结论
废弃结论
偏好
长期原则
```

---

## 六、RAG 的未来形态：从“资料召回”走向“经验操作系统”

我觉得未来更有效、更通用的 RAG 不会只是 vector DB + top-k。

它会变成多层记忆系统。

### 1. 从文档 RAG 到 Memory RAG

文档 RAG 问的是：

```text
哪段文档和问题最像？
```

Memory RAG 问的是：

```text
当前任务需要哪类记忆？
这些记忆的可信度、时效性、作用域和风险是什么？
```

### 2. 从 flat chunks 到 typed memory

未来记忆至少要分类型：

| 类型 | 保存什么 | 示例 |
|---|---|---|
| semantic | 稳定事实 | 博客项目是 Hugo + PaperMod |
| episodic | 发生过的事件 | 2026-04-24 修过 `/search/` 404 |
| procedural | 操作流程 | 发布博客先 Hugo build，再 commit/push，再查 Actions |
| preference | 用户偏好 | 喜欢把问题整理成可迁移模型 |
| principle | 长期原则 | 先验证链路，再修改配置 |
| artifact | 可引用产物 | Caddyfile、文章路径、部署脚本 |

### 3. 从一次召回到计划式召回

Agent 不应该只在回答前查一次知识库。

它应该在不同阶段查不同东西：

```text
理解任务时：查用户偏好和项目背景
制定计划时：查历史经验和风险
执行时：查具体命令和文件路径
验证时：查验收标准
收尾时：写入新经验
```

这叫 retrieval as scheduling，而不是 retrieval as search。

### 4. 从只读知识库到可更新经验库

好的 RAG 不只是读。

它还要写。

每次任务结束后，系统应该问：

```text
这次是否产生了新事实？
是否修正了旧事实？
是否产生了可复用流程？
是否发现了新的风险？
是否需要废弃某条旧记忆？
```

这就是经验库的写入路径。

没有写入路径的 RAG，只是图书馆。

有写入路径的 RAG，才像操作系统里的文件系统和日志系统。

---

## 七、什么是真正好的经验

上一篇我举了两个例子：

```text
今天我和 AI 聊了 20000 字，最后修好了。
```

这不算好经验。

它是记录，但不是经验。

更好的形式是：

```text
子路径部署检查清单：
绝对路径、baseURL、API 根路径、分享链接、静态资源、回调 URL。
```

为什么后者更好？

因为它能改变下一次行动。

我会把“好经验”定义成：

> 能在相似但不完全相同的未来情境中，帮助人或 AI 更快识别问题、选择行动、验证结果，并避免重复犯错的压缩结构。

### 对人来说，好的经验是什么？

对人来说，好的经验要满足五点：

| 标准 | 含义 |
|---|---|
| 可想起 | 遇到类似场景时能被触发 |
| 可理解 | 能解释为什么这样做 |
| 可迁移 | 不只绑定某条命令 |
| 可校正 | 知道什么时候不适用 |
| 可讲述 | 能教给别人，也能写成复盘 |

人的好经验常常带有故事性。

比如：

```text
那次不是服务挂了，而是根域名根本没指到服务器。
```

这句话对人很有用，因为它有情境、有反转、有因果。

它会形成一个提醒：

```text
别急着改服务，先看请求有没有到机器。
```

### 对 AI 来说，好的经验是什么？

AI 的好经验要更结构化。

因为 AI 不会像人一样自然地把故事压成触发器。

对 AI 来说，一条好经验最好包含：

```yaml
title: "子路径部署导致绝对路径泄漏"
applies_when:
  - "应用原本部署在根路径"
  - "现在被挂到 /xxx/ 子路径"
  - "页面可访问但分享链接、静态资源或回调跳回根路径"
symptoms:
  - "GET /xxx/ 正常"
  - "GET /share/id 返回 404"
diagnosis:
  - "检查服务端返回路径是否以 / 开头"
  - "检查前端是否使用 new URL(path, location.href)"
fix_patterns:
  - "返回相对路径 ./share/:id"
  - "或让应用显式支持 base path"
  - "或在入口层增加兼容路由"
verification:
  - "新建分享链接"
  - "验证 /xxx/share/id"
  - "验证兼容路径是否仍可访问"
invalid_when:
  - "应用本身已经完整支持 baseURL"
  - "入口层没有做子路径挂载"
evidence:
  - "关联提交、日志、URL、配置文件路径"
```

对 AI 来说，好的经验不是“文字优美”，而是：

```text
可检索
可判定适用性
可执行
可验证
可更新
可审计
```

### 人的好经验和 AI 的好经验有什么不同？

| 维度 | 人的好经验 | AI 的好经验 |
|---|---|---|
| 触发方式 | 类比、故事、感觉 | 明确条件、关键词、结构化字段 |
| 保存形式 | 记忆、笔记、复盘 | JSON/YAML/Markdown/图谱 |
| 复用方式 | 直觉 + 推理 | 检索 + 注入 + 推理 |
| 风险 | 过度类比、记忆偏差 | 召回错误、旧事实污染 |
| 优化方向 | 讲得清、想得起 | 查得到、判得准、做得对 |

所以同一份经验，最好有两种表达：

```text
给人的版本：故事化、因果清楚、能形成直觉。
给 AI 的版本：结构化、可触发、可验证、可更新。
```

博客更偏前者。

经验卡片更偏后者。

AgentOS 需要把两者连接起来。

---

## 八、如果为自己设计一个 Nobodyls AgentOS

如果我把这套东西落到自己的工作流里，我会这样设计。

### 1. 常驻内存层

每次 agent 启动都应该加载很小的一份 profile：

```text
Nobodyls 的主线：
知识理应流动，痕迹理应留存。

写作偏好：
把真实操作压缩成可迁移模型，少写流水账。

工程偏好：
先读后写，先验证链路，再修改配置。
```

这份东西不能太长。

它像 shell 启动时加载的 `.profile`。

### 2. 项目事实层

每个项目维护自己的 facts：

```text
my-blog:
Hugo + PaperMod
文章在 content/posts
搜索页依赖 content/search.md 和 index.json
GitHub Actions 部署到 Pages
```

这些适合放在项目仓库里。

### 3. 经验卡片层

把真实踩坑沉淀成经验：

```text
caddy-root-domain-portal.md
hugo-papermod-search-404.md
subpath-reverse-proxy-share-link.md
github-pages-action-publish-check.md
```

### 4. 任务日志层

保留完整证据，但不默认注入。

它像系统日志：

```text
可以查，但不应该每次启动都读。
```

### 5. 发布后的回写层

每次完成一次真实任务，都问三个问题：

```text
这次新增了什么项目事实？
这次产生了什么可迁移经验？
有没有旧经验需要标记为过期？
```

这才会让 AI 工具越用越像“熟悉你的工作系统”，而不是每次都像新同事入职。

---

## 九、AgentOS 的核心不是“记住一切”，而是“知道什么该被带到当前”

这点很重要。

很多人谈 AI memory 时，本能目标是：

```text
让 AI 什么都记住。
```

但操作系统的智慧从来不是“把所有文件放进内存”。

操作系统真正做的是：

```text
把当前最需要的页调入内存；
把暂时不用的页换出；
保护不同进程的地址空间；
让文件有路径、权限和版本；
让崩溃后还能恢复。
```

AgentOS 也应该这样。

它的目标不是无限记忆，而是：

```text
记忆分层
按需装载
结构化写入
可解释召回
可审计更新
可控遗忘
```

这比“更大的上下文窗口”更重要。

大上下文像更大的 RAM。

但没有文件系统、索引、权限、缓存和垃圾回收，再大的 RAM 也会被垃圾填满。

---

## 结论

你的“内存和存储”类比，是理解 AgentOS 的一个非常好的入口。

上下文窗口是运行时内存。

知识库是持久存储。

RAG 是索引和读取机制。

经验卡片是被编译过的可复用程序片段。

AgentOS 则应该负责调度这一切：什么时候读、什么时候写、写成什么格式、什么时候过期、如何验证、如何审计。

未来真正有效的 RAG，不会只是“把文档切块后向量检索”。

它会变成一个分层、类型化、时间感知、可写入、可治理的经验操作系统。

而对我们个人来说，最实际的起点也许很简单：

```text
不要只保存聊天记录。
把真正解决过的问题，压缩成能被未来的人和 AI 都复用的经验。
```

这就是知识从“被收藏”走向“被调度”的过程。

也是“知识理应流动，痕迹理应留存”真正落到系统里的样子。

---

## 参考

- [What is Memory? - OpenAI Help Center](https://help.openai.com/en/articles/8983136-what-is-memory)
- [How does “Reference saved memories” work? - OpenAI Help Center](https://help.openai.com/en/articles/11146739-how-does-reference-saved-memories-work)
- [Agent memory - OpenAI Agents SDK](https://openai.github.io/openai-agents-python/sandbox/memory/)
- [Sessions - OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/guides/sessions/)
- [Manage Claude's memory - Anthropic](https://docs.anthropic.com/en/docs/claude-code/memory)
- [Memory overview - LangGraph](https://docs.langchain.com/oss/python/langgraph/memory)
- [Long-term memory - LangChain](https://docs.langchain.com/oss/javascript/langchain/long-term-memory)
- [Memory - LlamaIndex](https://docs.llamaindex.ai/en/stable/module_guides/deploying/agents/memory/)
- [MemGPT: Towards LLMs as Operating Systems](https://arxiv.org/abs/2310.08560)
- [Letta / MemGPT memory documentation](https://docs.letta.com/)
- [Mem0 Platform Overview](https://docs.mem0.ai/overview)
- [Graphiti Open Source - Zep](https://www.getzep.com/product/open-source)
- [Zep: A Temporal Knowledge Graph Architecture for Agent Memory](https://arxiv.org/abs/2501.13956)
- [MemOS: A Memory OS for AI System](https://arxiv.org/abs/2507.03724)
