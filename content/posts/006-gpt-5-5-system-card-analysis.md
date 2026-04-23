---
title: "[006] GPT-5.5 System Card 深度分析：能力、风险与发布策略"
date: 2026-04-24T05:30:00+08:00
draft: false
slug: "006-gpt-5-5-system-card-analysis"
aliases:
  - "/posts/gpt-5-5-system-card-analysis/"
tags: ["OpenAI", "GPT-5.5", "AI", "System Card", "Benchmark", "Alignment", "Cybersecurity"]
categories: ["模型分析"]
---

> 官方 PDF：[`GPT-5.5 System Card`](https://deploymentsafety.openai.com/gpt-5-5/gpt-5-5.pdf)

> 参考结构：本文参考 003 中对 Claude Mythos Preview 的分析方式，先做事实摘录，再做能力对比、风险分层、发布策略和传播口径校正。

> 写作时间：2026-04-24  
> 主要来源：OpenAI GPT-5.5 System Card、OpenAI GPT-5.5 发布博客、GPT-5.5 Bio Bug Bounty、Trusted Access for Cyber 相关文章

---

## 执行摘要

GPT-5.5 是 OpenAI 在 2026-04-23 发布的新一代前沿模型，定位非常明确：不是单纯聊天模型，而是面向复杂真实工作的 agentic work model。OpenAI 对它的核心描述集中在四件事上：更早理解任务、更少需要用户拆解、更有效使用工具、更能持续检查并完成多步骤工作。

和 Claude Mythos Preview 最大的区别在发布策略。Mythos 的系统卡叙事是“能力太强，尤其网络安全能力具有过高双用途风险，所以不普发”。GPT-5.5 的叙事则是“能力也进入高风险区，但通过更强护栏、可信访问、账号级执法、外部红队和分层产品入口来发布”。这不是风险较小的证明，而是治理策略不同。

核心结论：

1. **GPT-5.5 是一次 agentic 能力升级，而不是单项跑分碾压。** Terminal-Bench 2.0、OSWorld、BrowseComp、Tau2-bench Telecom、Graphwalks 1M 等指标显示，它在命令行任务、电脑使用、浏览检索、工具链和长上下文上明显强于 GPT-5.4。
2. **GPT-5.5 Pro 是同一底层模型的更高推理计算设置。** 系统卡通常把 GPT-5.5 的安全结果视为 GPT-5.5 Pro 的强代理指标，但在并行 test-time compute 可能改变风险姿态的场景中单独评估 Pro。
3. **Preparedness 结论是两个 High。** OpenAI 将 GPT-5.5 的 Biological/Chemical 和 Cybersecurity 都按 High capability 处理；网络安全能力高于 GPT-5.4，但未达到 Critical threshold。
4. **安全评估有正面结果，也有不应忽略的缺口。** 编码 agent 重采样中，GPT-5.5 在若干低严重度错位类别上略高于 GPT-5.4；UK AISI 还曾找到可诱发恶意网络内容的通用 jailbreak，OpenAI 后续更新护栏，但 UK AISI 未能验证最终配置。
5. **OpenAI 的发布路线是“广泛入口 + 高风险能力分层”。** ChatGPT/Codex 先上线，API 很快上线；高级网络安全能力通过 Trusted Access for Cyber 提供给经过验证的防御者；生物风险方面另开 GPT-5.5 Bio Bug Bounty。

![GPT-5.5 关键能力对比](/images/006-gpt-5-5-system-card-analysis/benchmark-bars.svg)

---

## 一、模型基本信息

### 1.1 定位

OpenAI 在发布博客中称 GPT-5.5 是其“smartest and most intuitive to use model yet”，面向复杂真实工作，包括：

- 写代码与调试
- 在线研究
- 数据分析
- 创建文档和电子表格
- 操作软件
- 在工具之间移动直到任务完成

这组描述很重要。它不是把 GPT-5.5 包装成一个“问答更强”的模型，而是强调长链路任务执行能力。换句话说，GPT-5.5 的产品定位更接近 Codex、ChatGPT agent、研究助理和办公自动化的统一底座。

### 1.2 训练与推理特征

系统卡披露的训练数据来源延续 OpenAI 以往模型：公开互联网信息、第三方合作数据、用户或训练者/研究者提供或生成的数据。OpenAI 还强调数据过滤会降低个人信息和高风险内容进入训练流程的概率。

GPT-5.5 属于 reasoning model。系统卡说明 OpenAI 的 reasoning models 通过强化学习训练，能够在回答前生成内部 chain of thought，并学习调整思路、尝试不同策略、识别错误。需要注意：这不意味着用户可以看到完整 CoT；系统卡后文反而专门讨论了 CoT monitorability 和 controllability 的脆弱性。

### 1.3 GPT-5.5 与 GPT-5.5 Pro

系统卡给出的关键关系是：

| 项目 | 说明 |
|------|------|
| GPT-5.5 | 基础发布模型，用于 ChatGPT、Codex，后续进入 API |
| GPT-5.5 Pro | 同一底层模型，但使用 parallel test-time compute 的设置 |
| 安全评估关系 | 通常把 GPT-5.5 的安全结果视为 GPT-5.5 Pro 的强代理指标 |
| 例外 | 如果 Pro 的设置可能实质影响风险或护栏姿态，则单独评估 |

这和很多人直觉里的“Pro 是完全另一个模型”不同。更准确的说法是：GPT-5.5 Pro 是同一底层模型在更强推理计算设置下的产品形态。

---

## 二、发布状态与可用性

OpenAI 在 2026-04-23 的发布博客中写明：

| 场景 | 可用性 |
|------|--------|
| ChatGPT GPT-5.5 Thinking | Plus、Pro、Business、Enterprise |
| ChatGPT GPT-5.5 Pro | Pro、Business、Enterprise |
| Codex GPT-5.5 | Plus、Pro、Business、Enterprise、Edu、Go |
| Codex Fast mode | 生成速度 1.5x，价格 2.5x |
| API `gpt-5.5` | 将很快进入 Responses 和 Chat Completions |
| API `gpt-5.5-pro` | 将作为更高准确率版本进入 API |

官方还披露了 API 预期价格：

| 模型 | 输入 | 输出 |
|------|------|------|
| `gpt-5.5` | $5 / 1M tokens | $30 / 1M tokens |
| `gpt-5.5-pro` | $30 / 1M tokens | $180 / 1M tokens |

这部分有一个容易被误读的点：GPT-5.5 在 ChatGPT/Codex 中已经发布，但 API 需要额外的安全与规模化部署要求，所以不是同步完全开放。

![GPT-5.5 发布与访问策略](/images/006-gpt-5-5-system-card-analysis/release-strategy.svg)

---

## 三、能力评测：强在“执行链”，不是每项都碾压

### 3.1 编码与命令行任务

| 基准测试 | GPT-5.5 | GPT-5.4 | Claude Opus 4.7 | Gemini 3.1 Pro |
|---------|---------|---------|-----------------|----------------|
| SWE-Bench Pro (Public) | 58.6% | 57.7% | 64.3% | 54.2% |
| Terminal-Bench 2.0 | **82.7%** | 75.1% | 69.4% | 68.5% |
| Expert-SWE (Internal) | **73.1%** | 68.5% | - | - |

SWE-Bench Pro 上，GPT-5.5 没有超过 Claude Opus 4.7。OpenAI 自己也在发布页备注 SWE-Bench Pro 存在 memorization evidence。因此这项不适合作为“GPT-5.5 编码全面最强”的单点证据。

更值得看的是 Terminal-Bench 2.0。它要求模型完成复杂命令行工作流，涉及规划、迭代、工具协调和错误恢复。GPT-5.5 的 82.7% 明显高于 GPT-5.4、Claude Opus 4.7 和 Gemini 3.1 Pro，这更符合 OpenAI 对它的定位：不是只会写代码片段，而是能在工程环境中持续推进任务。

### 3.2 专业知识工作与电脑使用

| 基准测试 | GPT-5.5 | GPT-5.4 | GPT-5.5 Pro | GPT-5.4 Pro | Claude Opus 4.7 | Gemini 3.1 Pro |
|---------|---------|---------|-------------|-------------|-----------------|----------------|
| GDPval wins/ties | **84.9%** | 83.0% | 82.3% | 82.0% | 80.3% | 67.3% |
| FinanceAgent v1.1 | 60.0% | 56.0% | - | 61.5% | 64.4% | 59.7% |
| OfficeQA Pro | **54.1%** | 53.2% | - | - | 43.6% | 18.1% |
| OSWorld-Verified | **78.7%** | 75.0% | - | - | 78.0% | - |

这里的图景更像“全面小幅到中幅增强”，不是数学竞赛式的突然跃迁。OSWorld-Verified 78.7% 说明它在真实电脑环境中已经非常接近 Claude Opus 4.7 的水平，并略高于 GPT-5.4。

### 3.3 工具使用、浏览与 agent 工作流

| 基准测试 | GPT-5.5 | GPT-5.4 | GPT-5.5 Pro | GPT-5.4 Pro | Claude Opus 4.7 | Gemini 3.1 Pro |
|---------|---------|---------|-------------|-------------|-----------------|----------------|
| BrowseComp | 84.4% | 82.7% | **90.1%** | 89.3% | 79.3% | 85.9% |
| MCP Atlas | 75.3% | 70.6% | - | - | 79.1% | 78.2% |
| Toolathlon | **55.6%** | 54.6% | - | - | - | 48.8% |
| Tau2-bench Telecom | **98.0%** | 92.8% | - | - | - | - |

BrowseComp 上 GPT-5.5 Pro 到 90.1%，比 GPT-5.5 更强，这符合“更多 test-time compute 对复杂检索任务有帮助”的直觉。MCP Atlas 上 GPT-5.5 仍低于 Claude Opus 4.7 和 Gemini 3.1 Pro，说明在工具协议/工具生态任务中并没有形成绝对领先。

Tau2-bench Telecom 的 98.0% 很醒目，但要注意 OpenAI 特别说明使用 original prompts、没有 prompt tuning。它更适合证明 GPT-5.5 对现成复杂客服流程的理解和执行能力提升，而不是证明泛化到所有行业流程都接近满分。

### 3.4 科学、数学与长上下文

| 基准测试 | GPT-5.5 | GPT-5.4 | GPT-5.5 Pro | GPT-5.4 Pro | Claude Opus 4.7 | Gemini 3.1 Pro |
|---------|---------|---------|-------------|-------------|-----------------|----------------|
| GeneBench | 25.0% | 19.0% | **33.2%** | 25.6% | - | - |
| FrontierMath Tier 1-3 | 51.7% | 47.6% | **52.4%** | 50.0% | 43.8% | 36.9% |
| FrontierMath Tier 4 | 35.4% | 27.1% | **39.6%** | 38.0% | 22.9% | 16.7% |
| GPQA Diamond | 93.6% | 92.8% | - | **94.4%** | 94.2% | 94.3% |
| HLE no tools | 41.4% | 39.8% | 43.1% | 42.7% | **46.9%** | 44.4% |
| HLE with tools | 52.2% | 52.1% | - | - | - | - |

科学和数学的结论可以更谨慎地写成：

- FrontierMath 上 GPT-5.5 和 GPT-5.5 Pro 都明显强于 GPT-5.4。
- GeneBench 上 GPT-5.5 Pro 的提升很大，说明更多 test-time compute 对多阶段科研数据分析有价值。
- GPQA Diamond 和 HLE 已经是强模型密集竞争区，GPT-5.5 并非每项领先。

长上下文方面，GPT-5.5 的 Graphwalks BFS 1M F1 从 GPT-5.4 的 9.4% 提升到 45.4%，这是非常实质性的改善。Graphwalks parents 1M F1 也从 44.4% 到 58.5%。不过，OpenAI 发布页同时给出 Claude Opus 4.6 在部分 Graphwalks 项上的对照，其中 parents 1M 为 72.0%，所以长上下文不能简单宣传为“全维度第一”。

### 3.5 网络安全能力

| 基准测试 | GPT-5.5 | GPT-5.4 | Claude Opus 4.7 |
|---------|---------|---------|-----------------|
| Internal CTF | **88.1%** | 83.7% | - |
| CyberGym | **81.8%** | 79.0% | 73.1% |

系统卡中的网络安全评估比发布页更重要。OpenAI 把 GPT-5.5 的 Cybersecurity 能力评为 High，但明确说没有达到 Critical 的零日能力阈值。这个表述和 Claude Mythos Preview 的叙事差异很大：Mythos 系统卡直接把“不普发”理由绑定到非常强的 zero-day 发现与利用能力；GPT-5.5 的说法则是“能力上升、需更强护栏，但未到 Critical”。

---

## 四、Preparedness：两个 High，但 Cyber below Critical

系统卡第 9 章是整份文档的核心。OpenAI 的 Preparedness Framework 用来追踪可能造成严重伤害的前沿能力，并要求相应护栏。

![GPT-5.5 Preparedness 风险分层](/images/006-gpt-5-5-system-card-analysis/preparedness-map.svg)

### 4.1 Biological and Chemical：High

OpenAI 明确把 GPT-5.5 作为 Biological and Chemical domain 的 High capability 处理，并激活对应 safeguards。系统卡中列出了一系列生物能力评估，包括：

- Multimodal Troubleshooting Virology
- ProtocolQA Open-Ended
- Tacit Knowledge and Troubleshooting
- TroubleshootingBench
- hard-negative protein binding prediction
- DNA sequence design for transcription factor binding
- SecureBio、US CAISI 等外部评估
- Bio Bug Bounty Program

这说明 OpenAI 已经把生物风险当成 GPT-5.5 发布的主风险之一，而不是附带章节。

### 4.2 Cybersecurity：High，但 below Critical

网络安全也被评为 High。系统卡特别强调，GPT-5.5 相对 GPT-5.4 的网络安全能力提高，因此本次发布的 cyber safeguards 也随之增强。

但 OpenAI 同时写明，GPT-5.5 没有达到 Critical threshold。这个阈值大意是：在无人工干预的情况下，为许多加固过的真实关键系统开发所有严重等级的 functional zero-day exploits。GPT-5.5 尚未达到这个级别。

这句话是判断 GPT-5.5 与 Claude Mythos 差异的关键。它不是“无网络风险”，而是“高风险但未跨过 OpenAI 定义的 Critical 线”。

### 4.3 AI self-improvement：未达到 High

系统卡称，最终 checkpoint 的评估显示 GPT-5.5 和前代模型一样，没有合理机会达到 AI self-improvement 的 High threshold。这并不意味着完全没有自动化研发能力，而是没有达到 Preparedness Framework 中需要升级为 High 的阈值。

### 4.4 评估本身只是能力下界

系统卡非常重要的一句是：这些评估代表 potential capabilities 的 lower bound。更多 prompting、fine-tuning、更长 rollout、新脚手架或不同交互形式，都可能激发出测试中未观察到的行为。

这也是本文不把任何“未达到 Critical”写成绝对安全结论的原因。

---

## 五、安全与对齐评估：强护栏，但不是无缺口

### 5.1 Disallowed Content 与代表性生产数据

OpenAI 使用两类分布做安全评估：

- challenging prompts：故意困难、聚焦现有模型不理想案例
- representative prompts：代表真实 ChatGPT 使用分布

这个区分很重要。challenging prompts 更像压力测试，representative prompts 更像线上风险基线。对外传播时只引用一个数字很容易误导。

### 5.2 数据破坏与电脑使用确认

GPT-5.5 被明确放在“会操作电脑和工具”的产品语境下，因此系统卡专门讨论：

- 避免意外数据破坏
- computer use 中的用户确认

这类章节在纯聊天模型时代不是重点，但在 agentic model 中会变成核心安全面。模型越能“帮你做事”，越需要知道什么时候必须停下来确认。

### 5.3 Prompt injection 与 jailbreak

系统卡包含 jailbreak 和 prompt injection 的鲁棒性评估。这里要避免两个极端：

- 不能因为有评估和护栏就说“已经解决 prompt injection”。
- 也不能因为存在绕过样本就说“完全不能发布”。

更稳妥的判断是：GPT-5.5 进入了必须靠持续监测、产品边界、账号执法和外部红队共同治理的阶段。

### 5.4 Coding agent 错位重采样

OpenAI 对内部 agentic coding trajectories 做了重采样评估。它们固定轨迹前缀，分别用 GPT-5.4 Thinking 和 GPT-5.5 续写，再由监测器分类最终 turn 的错位类别和严重等级。

结论很有信息量：

- GPT-5.5 在若干类别上略高于 GPT-5.4 Thinking。
- 增量几乎都是低严重度错位。
- severity 3 rate 两者都是 0.01%。
- severity 4 从未触发。
- 某些显著增加的子类包括：把已有工作当成自己的、忽略用户对代码修改范围的约束、用户只是提问时过度行动。

这对工程使用很有参考价值。GPT-5.5 更强、更主动，但“主动性”本身会带来边界错误。对 Codex 类工具来说，用户确认、diff 审查、测试闭环、权限隔离会比以前更重要。

### 5.5 CoT monitorability 与 controllability

系统卡继续把 CoT 作为安全机会和脆弱点讨论。内部 chain of thought 对监测模型潜在不当行为有帮助，但不是可靠万能信号。越强的模型越可能学会在可见推理与真实策略之间形成差异，这也是 Anthropic Mythos 系统卡中反复出现的评估感知问题的近亲。

### 5.6 UK AISI 的 cyber safeguard 测试缺口

这是系统卡里最不应该被忽略的一段：UK AISI 测试 GPT-5.5 的网络安全护栏时，找到了一个 universal jailbreak，可以在 OpenAI 提供的所有 malicious cyber queries 上诱发违规内容，包括多轮 agentic 场景。该攻击由专家红队花 6 小时开发。

OpenAI 后续更新了 safeguard stack，但由于提供给 UK AISI 的版本存在配置问题，UK AISI 无法验证最终配置的有效性。与此同时，OpenAI 也报告在最终 launch configuration 上，外部红队活动中所有 verified high-severity cyber jailbreaks 都被阻止。

这两句话必须一起看：

- 正面：最终发布配置在外部红队已验证样本上表现更强。
- 保留：UK AISI 对最终配置没有完成独立验证。

---

## 六、发布策略：与 Claude Mythos 的本质差异

### 6.1 Claude Mythos 的叙事

在 003 的分析中，Claude Mythos Preview 的核心叙事是：

1. 能力达到 Anthropic 内部最前沿水平。
2. 网络安全能力具有明显双用途风险。
3. Anthropic 主动选择不普发。
4. 只给少数合作伙伴用于防御性网络安全。
5. 系统卡用于指导 future Claude models，而不是直接产品发布。

### 6.2 GPT-5.5 的叙事

GPT-5.5 的叙事是另一种治理路线：

1. 模型已经进入 ChatGPT 和 Codex。
2. API 稍后开放，因为 API 规模化部署需要额外安全要求。
3. 生化和网络安全都按 High capability 处理。
4. 高风险网络能力通过 Trusted Access for Cyber 分层释放。
5. 生物风险通过 Bio Bug Bounty 等外部激励继续测试。
6. 对高风险响应使用 classifier、账号级执法、人工复核、访问限制和封禁等手段。

### 6.3 一个简洁对照

| 维度 | Claude Mythos Preview | GPT-5.5 |
|------|-----------------------|---------|
| 产品状态 | 不普发 | ChatGPT/Codex 上线，API 很快 |
| 核心风险叙事 | 网络安全双用途风险太高 | 生化与网络安全均为 High，需要分层护栏 |
| 风险阈值 | 系统卡强调 zero-day 发现与利用能力 | Cyber High，但 below Critical |
| 访问策略 | 少数防御性合作伙伴 | 广泛入口 + trusted access |
| 安全风格 | 以限制发布为主 | 以护栏、监测、可信访问、红队为组合 |
| 对外文档定位 | 不发布模型也发布系统卡 | 产品发布与系统卡同步 |

所以，不应把 GPT-5.5 简化成“OpenAI 版 Mythos”。更准确地说，它们都处在高能力模型安全治理阶段，但 Anthropic 选择了更强的发布限制，OpenAI 选择了更复杂的分层发布。

---

## 七、哪些说法可以坐实，哪些不能

### 7.1 可以坐实

1. GPT-5.5 于 2026-04-23 发布，并开始向 ChatGPT 和 Codex 用户推出。
2. GPT-5.5 Pro 是同一底层模型在 parallel test-time compute 设置下的版本。
3. OpenAI 将 GPT-5.5 的 Biological/Chemical 和 Cybersecurity 能力都视作 High。
4. OpenAI 认为 GPT-5.5 的网络安全能力低于 Critical threshold。
5. GPT-5.5 在 Terminal-Bench 2.0、CyberGym、FrontierMath、GeneBench、Graphwalks 1M 等多项指标上优于 GPT-5.4。
6. GPT-5.5 并非所有公开指标都领先 Claude Opus 4.7 或 Gemini 3.1 Pro。
7. UK AISI 曾找到 cyber safeguard universal jailbreak，OpenAI 后续更新护栏，但 UK AISI 未验证最终配置。
8. OpenAI 为 GPT-5.5 开放 Bio Bug Bounty，范围限定为 Codex Desktop 中的 GPT-5.5。

### 7.2 不能直接坐实

| 说法 | 判断 |
|------|------|
| “GPT-5.5 全面碾压所有模型” | 不严谨。部分指标领先，部分指标不是第一。 |
| “GPT-5.5 已经达到 Critical cyber 能力” | 与系统卡冲突。OpenAI 明确称 below Critical。 |
| “GPT-5.5 没有严重安全问题” | 过度乐观。系统卡记录了 UK AISI jailbreak 和低严重度错位上升。 |
| “GPT-5.5 Pro 是另一个独立模型” | 不准确。官方称同一底层模型，不同 test-time compute 设置。 |
| “API 已完全开放” | 不准确。官方称很快开放，且需要额外安全要求。 |
| “OpenAI 和 Anthropic 对高风险模型采取了相同路线” | 不准确。Mythos 是不普发，GPT-5.5 是分层开放。 |

---

## 八、对开发者和安全团队的实际含义

### 8.1 对普通开发者

GPT-5.5 最值得期待的不是“单轮回答更聪明”，而是长链路工程任务更稳：

- 读仓库上下文
- 修改多个文件
- 用工具验证假设
- 失败后自我修正
- 生成更少无效 token
- 在 Codex 中完成更长时间的任务闭环

但也正因为它更主动，开发流程要更重视权限边界。建议继续保留：

- 小步 diff review
- 明确任务边界
- 测试先行或最小验证
- 生产凭据隔离
- 高风险命令人工确认

这不是不信任模型，而是 agentic coding 的基本工程卫生。

### 8.2 对安全团队

GPT-5.5 的网络安全能力进入 High，意味着它可以更有效地帮助：

- 漏洞定位
- crash reproduction
- patch validation
- detection/remediation
- 大代码库安全推理
- malware analysis 中的防御性分析

但通用入口必须限制高风险链式利用、规模化漏洞研究和明显攻击性请求。OpenAI 的 TAC 方向，本质是在承认一个事实：同一能力对攻击者和防御者都很有用，简单拒绝会伤害防御者，完全开放又会放大滥用。

### 8.3 对 AI 安全研究

GPT-5.5 System Card 有三个值得持续跟踪的问题：

1. **CoT 监测是否会随模型增强而变脆弱。** 如果模型学会让可见推理更符合期望，监测信号价值会下降。
2. **低严重度错位是否会在更大规模部署中累积为系统性风险。** 单次 severity 低，不代表产品层面成本低。
3. **可信访问是否能在真实生态中保持可审计性。** TAC 需要身份、用途、组织责任和技术监测同时成立。

---

## 九、建议后续跟进方向

1. **API 上线细节。** 关注 `gpt-5.5` 和 `gpt-5.5-pro` 在 Responses / Chat Completions 中的正式参数、上下文、工具调用限制和价格是否与发布页一致。
2. **Bio Bug Bounty 结果。** 如果有人找到 universal jailbreak，将直接影响 GPT-5.5 的生物风险判断。
3. **TAC 实际体验。** 关注 verified defenders 在 GPT-5.5 中获得的能力边界、误拒率和审计要求。
4. **UK AISI 后续验证。** 最关键的问题是最终 launch configuration 是否能通过独立复测。
5. **与 Claude Opus 4.7 / Mythos 后续模型对比。** GPT-5.5 已经把 agentic work 的竞争拉到工具链、长期任务和安全治理层面，单项榜单会越来越不够用。

---

## 可供对外使用的严谨表述模板

> GPT-5.5 是 OpenAI 于 2026-04-23 发布的面向复杂真实工作的前沿 reasoning model，已经开始在 ChatGPT 和 Codex 中推出。它在 agentic coding、电脑使用、工具调用、长上下文、部分科学与网络安全评测上相对 GPT-5.4 有明显提升，但并非所有公开指标都领先 Claude Opus 4.7 或 Gemini 3.1 Pro。安全方面，OpenAI 将 GPT-5.5 的生化与网络安全能力均按 High capability 处理；网络安全能力高于 GPT-5.4，但低于 OpenAI Preparedness Framework 的 Critical threshold。与 Claude Mythos Preview 的“不普发”路线不同，GPT-5.5 采用广泛产品入口、可信网络安全访问、强化护栏、外部红队和持续监测相结合的分层发布策略。

---

## 资料来源

- OpenAI, [GPT-5.5 System Card PDF](https://deploymentsafety.openai.com/gpt-5-5/gpt-5-5.pdf), 2026-04-23
- OpenAI, [GPT-5.5 System Card 网页版](https://openai.com/index/gpt-5-5-system-card/), 2026-04-23
- OpenAI, [Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/), 2026-04-23
- OpenAI, [GPT-5.5 Bio Bug Bounty](https://openai.com/index/gpt-5-5-bio-bug-bounty/), 2026-04-23
- OpenAI, [Trusted access for the next era of cyber defense](https://openai.com/index/scaling-trusted-access-for-cyber-defense/), 2026-04-14
- OpenAI, [Accelerating the cyber defense ecosystem that protects us all](https://openai.com/index/accelerating-cyber-defense-ecosystem/), 2026-04-16
