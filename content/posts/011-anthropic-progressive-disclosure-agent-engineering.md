---
title: "[011] Anthropic 渐进式披露设计：从 Agent Skills 到工程化 Agent"
date: 2026-04-29T00:00:00+08:00
draft: false
slug: "011-anthropic-progressive-disclosure-agent-engineering"
aliases:
  - "/posts/anthropic-progressive-disclosure-agent-engineering/"
tags: ["Anthropic", "Agent Skills", "AI Agent", "Prompt Engineering", "Context Engineering", "Harness Engineering"]
categories: ["AI 工具"]
---

> 分析对象：Anthropic Agent Skills 与 Claude Code 相关工程实践  
> 整理时间：2026-04-29  
> 关键词：渐进式披露、Agent Skills、Prompt Engineering、Context Engineering、Harness Engineering  
> **更新（2025-12-18）**：Anthropic 已将 Agent Skills 作为[开放标准（open standard）](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)发布，支持跨平台可移植性，不再仅限于 Claude 生态。

---

## 执行摘要

Anthropic 在 Agent Skills 中把“渐进式披露”（progressive disclosure）做成了一种很朴素但有效的 Agent 系统设计：启动时只暴露能力索引，命中任务后再加载核心说明，执行到具体分支时再读取更深层的参考文件、脚本或模板。

它不是单纯的 UI 交互策略，而是面向 Agent 的上下文调度策略。

这套设计真正解决的问题不是“如何写一个 Markdown 文件”，而是：

```text
如何在有限上下文窗口里，保留一个可以持续扩展的能力空间？
```

我的判断是：渐进式披露会成为 Agent 工程化里的基础模式。它把 prompt engineering、context engineering、harness engineering 连接起来，并进一步指向下一代 agent engineering：能力不再只是写在 prompt 里，而是被组织、加载、执行、评测和治理。

---

## 一、Anthropic 的核心设计：让上下文按需显形

Anthropic 在 Agent Skills 中给出的基本结构很简单：

```text
skill-name/
  SKILL.md
  references/
  scripts/
  templates/
```

其中 `SKILL.md` 带有 YAML 元数据，至少包含 `name` 和 `description`。系统启动时，agent 会把每个已安装 skill 的 `name` 和 `description` **预加载进系统提示词（system prompt）**，而非把所有 skill 全文塞进上下文。

当模型判断某个 skill 与当前任务相关时，会通过文件读取工具（如 Bash）**主动调用**来读取完整的 `SKILL.md`——这是一次真实的工具调用，不是被动注入。如果 `SKILL.md` 继续引用了 `references/`、`scripts/` 或 `templates/` 中的文件，模型再以同样方式按需读取更深层内容。

以 Anthropic 官方给出的 PDF skill 为例，上下文窗口的变化路径是：

```text
系统提示词 + 已安装 skill 元数据 + 用户消息
  → Claude 调用 Bash 读取 pdf/SKILL.md
  → Claude 发现需要填写表单，调用 Bash 读取 forms.md
  → Claude 使用加载到的指令完成任务
```

这个过程完全透明可观测，每一层加载都是显式的工具调用记录。

这个结构可以抽象为三层：

| 层级 | 内容 | 作用 |
|---|---|---|
| 发现层 | `name`、`description` | 让模型知道能力存在 |
| 指导层 | `SKILL.md` 正文 | 让模型知道如何执行 |
| 执行层 | 参考资料、脚本、模板 | 让模型在具体场景里做对 |

这就是渐进式披露的关键：**先暴露”可用能力”，再按需加载”执行细节”**。

Anthropic 特别指出一个关键工程优势：由于模型是按需读取文件而非一次性全量加载，**可以捆绑进 skill 的上下文量在技术上是无界的（effectively unbounded）**。限制的不是 skill 的体量，而是单次执行中实际被读入上下文的量。

很多 Agent 项目的失败不是因为缺少知识，而是因为一开始就把所有知识塞进上下文，导致模型注意力稀释、工具选择变差、成本上升、调试困难。

Anthropic 在《[Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)》里也强调过类似工程取向：有效 Agent 系统往往不来自复杂框架，而来自简单、可组合、可观测的模式。Workflow 走预定义路径，Agent 由模型动态决定过程与工具使用。渐进式披露可以服务于这两种模式：它不强行替模型规划所有路径，但给模型提供了可发现、可验证、可执行的路标。

---

## 二、为什么渐进式披露适合 Agent 项目

传统软件的模块边界主要服务于人类开发者：降低认知负担、隔离变化、提升复用。

Agent 项目的模块边界还要服务于模型：

- 降低上下文噪声。
- 减少错误工具触发。
- 控制能力和权限边界。
- 让模型能在运行时找到正确信息。

因此，一个 Agent 项目不应该只是“给模型一个很长的 system prompt”。更合理的方式，是像设计操作系统的动态链接机制一样，把能力拆成可发现、可加载、可执行、可观测的单元。

一个可落地的项目结构可以是：

```text
agent/
  skills/
    code-review/
      SKILL.md
      references/
        severity.md
        security.md
      scripts/
        collect-diff.ts
    release-note/
      SKILL.md
      templates/
        changelog.md
  prompts/
    base.md
    planner.md
  harness/
    tool-registry.ts
    context-loader.ts
    policy-gate.ts
    eval-runner.ts
```

这里的重点不是目录名字，而是职责边界：

- `prompts/` 定义稳定角色、任务格式和输出协议。
- `skills/` 封装可复用的领域能力。
- `harness/` 负责加载、裁剪、权限、执行、观测和评测。

换句话说：

```text
Prompt 负责让模型理解任务。
Context 负责让模型拿到刚好够用的信息。
Harness 负责让模型行动时仍然在工程约束内。
```

---

## 三、Prompt Engineering：把意图说清，不要把世界塞进去

在渐进式披露体系里，prompt engineering 应该变得更短、更清晰、更协议化。

它的目标不是包含所有知识，而是规定模型如何识别任务、如何选择能力、如何输出可验证结果。

一个基础 system prompt 可以只保留稳定规则：

```md
你是一个工程型 Agent。

工作原则：
- 先理解目标和约束，再选择工具。
- 优先使用已注册 skill；只有 skill 不覆盖时才直接推理。
- 每次加载上下文都说明目的。
- 产生代码变更后必须运行最小必要验证。

输出协议：
- 说明结论。
- 列出修改文件。
- 列出验证结果。
- 标注未完成风险。
```

这比把代码规范、部署流程、API 文档、错误排查手册全部塞进 system prompt 更稳。

长 prompt 看似充分，实际会让模型在每一步都背着大量无关信息工作。上下文窗口越大，这个问题越隐蔽：不是放不下，而是放进去以后模型不一定会用对。

在 prompt engineering 层，渐进式披露带来的启发是：

> Prompt 应该描述选择策略，而不是承载全部知识。

---

## 四、Context Engineering：上下文不是越多越好，而是越准越好

Context engineering 是渐进式披露的主战场。

它要解决三个问题：

1. 当前任务需要哪些上下文？
2. 哪些上下文只需要摘要？
3. 哪些上下文必须原文加载？

一个简单的 context loader 可以这样设计：

```ts
type SkillMeta = {
  name: string;
  description: string;
  path: string;
};

type LoadedContext = {
  source: string;
  content: string;
  reason: string;
};

export async function selectSkill(
  task: string,
  skills: SkillMeta[],
  classify: (input: string) => Promise<string[]>
): Promise<SkillMeta[]> {
  const selectedNames = await classify(
    [
      "Select relevant skills for the task.",
      `Task: ${task}`,
      "Available skills:",
      ...skills.map((skill) => `- ${skill.name}: ${skill.description}`),
    ].join("\n")
  );

  return skills.filter((skill) => selectedNames.includes(skill.name));
}
```

这段代码刻意保持简单：先用 metadata 做路由，而不是直接加载所有 skill。生产系统当然可以加入 embedding 检索、规则命中、历史反馈，但第一版应该先验证最小闭环。

加载 skill 时也要分层：

```ts
export async function loadSkillBody(
  skill: SkillMeta,
  readFile: (path: string) => Promise<string>
): Promise<LoadedContext> {
  const content = await readFile(`${skill.path}/SKILL.md`);

  return {
    source: `${skill.name}/SKILL.md`,
    content,
    reason: `Task matched skill metadata: ${skill.description}`,
  };
}
```

更深层的 `references/` 或 `scripts/` 不应该在这一步自动加载。它们应该由 `SKILL.md` 明确说明触发条件。

例如：

```md
---
name: code-review
description: Use when reviewing code changes for correctness, regressions, security, or missing tests.
---

# Code Review

Review changed code with this order:
1. Read the diff.
2. Identify behavioral regressions first.
3. Check tests only after correctness risks.

Read `references/security.md` only when the change touches authentication,
authorization, secrets, payments, sandboxing, or external input handling.

Run `scripts/collect-diff.ts` when the local git diff is too large to inspect manually.
```

这就是 context engineering 的细节：不仅决定“加载什么”，还要决定“什么时候加载”“为什么加载”“加载后如何退出”。

---

## 五、Harness Engineering：把模型放进可控执行环境

Prompt 和 context 解决的是“模型知道什么”；harness 解决的是“模型能做什么，以及做了以后如何被观察”。

一个成熟 Agent 项目的 harness 至少需要四类能力：

| 能力 | 职责 |
|---|---|
| 工具注册 | 声明工具名称、用途、输入输出 schema、权限级别 |
| 策略门禁 | 对删除、提交、推送、外部请求、敏感数据传输做确认或拒绝 |
| 执行记录 | 保存每次工具调用、输入摘要、输出摘要和失败原因 |
| 评测闭环 | 把成功路径、失败路径沉淀为 skill 或测试集 |

例如工具注册可以这样写：

```ts
type RiskLevel = "read" | "write" | "destructive" | "external";

type ToolDefinition<Input, Output> = {
  name: string;
  description: string;
  risk: RiskLevel;
  inputSchema: unknown;
  run: (input: Input) => Promise<Output>;
};

export function createToolRegistry() {
  const tools = new Map<string, ToolDefinition<unknown, unknown>>();

  return {
    register(tool: ToolDefinition<unknown, unknown>) {
      if (tools.has(tool.name)) {
        throw new Error(`Tool already registered: ${tool.name}`);
      }

      tools.set(tool.name, tool);
    },
    get(name: string) {
      return tools.get(name);
    },
  };
}
```

策略门禁则可以集中处理：

```ts
export function requiresConfirmation(risk: RiskLevel): boolean {
  return risk === "destructive" || risk === "external";
}
```

不要把这些判断散落在每个工具实现里。Agent 的安全性来自清晰的边界，而不是在每个 prompt 里反复提醒“请小心”。

Anthropic 在 Skills 相关说明中也特别强调安全问题：skill 会给 Agent 新能力，因此来自不可信来源的 skill 需要审计，尤其关注脚本、依赖、资源和外部网络访问。

这个提醒对任何 Agent 项目都成立：

> 渐进式披露不是权限豁免机制，它只是上下文加载机制。真正的执行安全必须由 harness 兜底。

---

## 六、四种 Engineering 的联合分工

可以把 Agent 工程拆成四层：

| 层次 | 关注点 | 典型产物 | 失败症状 |
|---|---|---|---|
| Prompt Engineering | 指令、角色、输出协议 | system prompt、任务模板、few-shot 示例 | 输出格式飘、步骤混乱 |
| Context Engineering | 信息选择、压缩、加载时机 | memory、RAG、skill metadata、context loader | 上下文过载、遗漏关键事实 |
| Harness Engineering | 工具、权限、执行、观测 | tool registry、policy gate、eval runner | 工具误用、不可复现、不可审计 |
| Agent Engineering | 目标分解、状态机、反馈闭环 | planner、worker、evaluator、skill evolution | 长任务失控、无法持续改进 |

渐进式披露把这四层串起来：

- Prompt 告诉模型“应该按需选择能力”。
- Context 提供“可发现但不立即展开的能力索引”。
- Harness 控制“加载、执行、审计和确认”。
- Agent Engineering 让系统从执行结果中学习，把稳定路径沉淀成新的 skill。

这也是 Anthropic 这套设计最值得借鉴的地方：它把 Agent 从“一个会聊天的模型”推进到“一个可以被工程化治理的能力系统”。

---

## 七、对 Agent 项目的具体设计建议

如果要在一个真实 Agent 项目中采用渐进式披露，我会优先做四件事。

### 7.1 Skill 元数据要像 API 契约一样写

`description` 是模型触发 skill 的主要依据，不应该写成营销文案，而应该写成触发条件。

较弱的写法：

```yaml
description: Helps with code review.
```

更好的写法：

```yaml
description: Use when reviewing a git diff, pull request, or patch for correctness, regressions, security risks, and missing tests. Do not use for general code explanation.
```

这里的关键是同时写清“何时使用”和“何时不使用”。这能减少误触发，也能降低后续 prompt 修补成本。

### 7.2 大上下文必须拆成互斥路径

如果一个 skill 同时支持 React、Rust、Postgres、Stripe，不要把所有说明写在一个文件里。

应该拆成：

```text
payment-skill/
  SKILL.md
  references/
    stripe-checkout.md
    stripe-connect.md
    webhook-security.md
```

`SKILL.md` 只写路由规则：

```md
Read `references/stripe-connect.md` only when the task involves connected accounts,
marketplaces, platforms, or transfers.
```

这比“一份万能手册”更符合 KISS 和 YAGNI：只把当前路径需要的信息交给模型。

### 7.3 脚本优先执行，不优先读入上下文

很多确定性任务不应该让模型用 token 完成，例如排序、diff 统计、schema 校验、PDF 字段提取、测试报告解析。

脚本可以作为 skill 的一部分存在，但默认应该执行脚本，而不是读取脚本源码。

这会带来两个收益：

- 节省上下文。
- 提升可重复性。

在 Agent 项目里，脚本是 harness 和 skill 的连接点：skill 告诉模型什么时候用脚本，harness 决定脚本是否允许执行、如何记录输出。

### 7.4 评测先于抽象

不要一上来设计庞大的 Agent 框架。先挑 10 到 30 个代表性任务，记录失败模式，再把高频失败转化为 skill、规则或脚本。

一个简单 eval 数据可以是：

```json
{
  "task": "Review a patch that changes password reset token validation.",
  "expectedBehaviors": [
    "loads code-review skill",
    "loads security reference",
    "checks token expiry and one-time-use semantics",
    "does not suggest unrelated formatting changes"
  ]
}
```

这比空泛地说”提升 Agent 质量”更可执行。

### 7.5 与 Claude 协作迭代 Skill

[Anthropic 原文](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)中有一个常被忽视的工程建议：**在完成任务的过程中，让 Claude 参与 skill 的写作和迭代本身**。

具体做法：在 Claude 完成一项任务后，要求它把成功路径和常见错误归纳为可复用的 skill 内容；如果它在使用某个 skill 时出了问题，让它自我反思哪里出错，`SKILL.md` 应该如何修改。

这比”事先设计完整 skill”更务实。因为很多时候你无法提前知道 Claude 需要什么信息，通过实际执行来发现，比凭空预测要准确得多。

> 不要试图在一开始就预判 Claude 需要什么上下文，而是通过实际执行来发现，再把稳定路径沉淀为 skill。

---

## 八、下一代 Engineering：从写 prompt 到治理能力生态

Prompt engineering 解决的是单次交互质量；context engineering 解决的是信息供给；harness engineering 解决的是可控执行。

下一代 Agent engineering 可能会进一步走向“能力生态治理”。

我认为会出现几个方向：

| 方向 | 含义 |
|---|---|
| SkillOps | 像管理服务一样管理 skill，包含版本、兼容性、评测、发布、回滚 |
| Context Budgeting | 把 token 预算显式纳入规划，让 Agent 在检索、摘要、原文加载之间做成本决策 |
| Policy-Aware Tooling | 工具不只是函数，而是带权限、审计、风险等级和确认机制的能力单元 |
| Self-Evolving Skills | Agent 从成功执行路径中提炼新 skill，但必须经过 eval 和人工审批 |
| Trajectory Engineering | 不只优化最终答案，而是优化 Agent 的行动轨迹，包括何时读文件、何时调用工具、何时停止 |
| Environment Contracts | 为 Agent 暴露稳定、文档化、可测试的环境接口，而不是让它直接面对混乱的系统细节 |

这些方向的共同点是：工程重心正在从“如何让模型答得更好”转向“如何让模型在复杂环境里持续、可控、可审计地完成任务”。

---

## 九、结论

Anthropic 的渐进式披露设计看起来只是 Agent Skills 的加载策略，但它背后是一种更通用的 Agent 系统架构思想：

```text
能力应该可发现。
知识应该按需加载。
执行应该由 harness 约束。
经验应该被评测后沉淀。
```

对 Agent 项目来说，最重要的启发不是照搬 `SKILL.md` 文件格式，而是建立分层意识：

- 用 prompt 定义稳定行为协议。
- 用 context 组织可加载知识。
- 用 harness 控制工具和环境。
- 用 eval 驱动能力迭代。

当这些层次清楚之后，Agent 系统会更简单，也更强。简单不是少做，而是每一层只做自己该做的事。

---

## 参考资料

- Anthropic Engineering, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Anthropic Engineering, [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- Anthropic Docs, [Prompt engineering overview](https://docs.anthropic.com/en/docs/prompt-engineering)
- Anthropic Docs, [Manage Claude's memory](https://docs.anthropic.com/en/docs/claude-code/memory)
- Anthropic Engineering, [Best practices for Claude Code](https://www.anthropic.com/engineering/claude-code-best-practices)
