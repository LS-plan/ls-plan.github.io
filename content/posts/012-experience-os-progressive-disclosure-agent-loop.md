---
title: "[012] 从经验压缩到渐进式披露：构建可复用、可调度、可执行的 Agent 经验系统"
date: 2026-04-29T14:30:00+08:00
draft: false
slug: "012-experience-os-progressive-disclosure-agent-loop"
aliases:
  - "/posts/experience-os-progressive-disclosure-agent-loop/"
tags: ["AI Agent", "AgentOS", "经验压缩", "渐进式披露", "RAG", "Context Engineering", "Agent Skills"]
categories: ["AI 工具"]
---

> 综合对象：  
> [[007] 从单次感知到经验压缩：AI 工具如何把一次会话变成可复用记忆](/posts/007-one-shot-perception-experience-compression-ai-memory/)  
> [[008] 从内存与存储看 AgentOS：AI 经验如何被保存、调度和复用](/posts/008-agentos-memory-storage-rag-experience/)  
> [[011] Anthropic 渐进式披露设计：从 Agent Skills 到工程化 Agent](/posts/011-anthropic-progressive-disclosure-agent-engineering/)  
> 整理时间：2026-04-29

---

## 执行摘要

007、008、011 三篇文章其实在讨论同一个问题的三个阶段：

```text
一次经验如何从“发生过”，变成未来 agent 可以稳定复用的能力？
```

007 讨论的是经验压缩：一次会话、一次故障、一次部署经历，不能只被保存成流水账，而应该被压缩成可触发、可诊断、可执行、可验证的经验对象。

008 讨论的是 AgentOS：经验对象不能散落在聊天记录里，它需要像操作系统管理内存、文件、缓存和权限一样，被分层保存、索引、调度、更新和审计。

011 讨论的是 Anthropic 的渐进式披露：经验和能力不应该一次性全部塞进上下文，而应该先暴露元数据，再按任务需要逐层加载说明、参考资料、脚本和模板。

把这三篇合起来，可以得到一个更完整的模型：

```text
经验压缩 -> 经验存储 -> 经验检索 -> 渐进式披露 -> 工具执行 -> 验证反馈 -> 经验更新
```

这不是普通 RAG，也不是单纯 prompt engineering。它更像一个面向 Agent 的经验操作系统：让知识从“被收藏”变成“被调度”，让记忆从“能找回”变成“能执行”，让一次成功路径逐步沉淀成稳定能力。

---

## 一、三篇文章的共同问题：经验如何变成能力

007 的起点是一个认知类比：人看一张退化图像，第一次看不出来；一旦看过原图，再看同一张退化图像，就会稳定地看见对象。

这个现象很像工程复盘。一次复杂问题如果被压缩得足够好，下次遇到相似现象，就不会再从零开始乱试，而是直接进入更高质量的判断框架。

例如从：

```text
Caddy、GitHub Pages、子路径、404、分享链接、baseURL 混在一起。
```

压缩成：

```text
先分层：DNS -> 入口层 -> 反代层 -> 应用路径 -> 返回链接。
```

这就是“经验压缩”：把一次具体经历变成可迁移判断。

008 接着问：压缩后的经验放在哪里？如何被未来任务调度？

答案不是“全部塞进上下文”，而是建立类似操作系统的分层：

| 层级 | Agent 中的对应物 | 作用 |
|---|---|---|
| 上下文窗口 | 运行时内存 | 承载当前任务的临时工作集 |
| 长期记忆 | 持久存储 | 保存偏好、项目事实、经验卡片 |
| RAG/索引 | 文件系统索引 | 按任务找到相关经验 |
| Context Manager | 内存管理器 | 决定什么进入当前上下文 |
| Experience Compiler | 编译器 | 把原始会话变成可复用经验 |

011 则进一步问：经验被找到了以后，怎么安全、低噪声地交给模型？

Anthropic 的 Agent Skills 给出了一个很清楚的答案：渐进式披露。

不要一次加载所有技能全文，而是：

```text
先加载 skill 元数据
-> 命中后读取 SKILL.md
-> 需要时再读取 references/scripts/templates
-> 执行后通过验证反馈更新经验
```

所以三篇文章其实构成了一条链：

```text
007：经验如何被压缩
008：经验如何被保存和调度
011：经验如何被按需披露并转化为行动
```

---

## 二、经验系统的核心闭环

如果把三篇文章合成一个系统，可以得到下面这个闭环：

```text
真实任务
  -> 原始轨迹
  -> 经验压缩
  -> 类型化记忆
  -> 检索调度
  -> 渐进式披露
  -> 工具执行
  -> 验证反馈
  -> 经验更新
```

每一环都有明确职责。

| 环节 | 问题 | 产物 |
|---|---|---|
| 原始轨迹 | 发生了什么 | 日志、diff、命令、对话 |
| 经验压缩 | 这次真正学到了什么 | 经验卡片 |
| 类型化记忆 | 它属于哪类记忆 | fact、episode、procedure、skill |
| 检索调度 | 什么时候该想起它 | metadata、tags、适用条件 |
| 渐进式披露 | 当前只需要哪些细节 | skill 元数据、SKILL.md、引用文件 |
| 工具执行 | 如何把知识变成行动 | tool call、脚本、补丁 |
| 验证反馈 | 行动是否有效 | 测试、构建、线上检查 |
| 经验更新 | 是否修正旧经验 | 新版本、废弃标记、补充边界 |

这里最重要的变化是：经验不再只是“文档”，而是进入执行链路。

普通文档回答的是：

```text
我在哪里写过这件事？
```

经验系统回答的是：

```text
当前任务是否应该调用这段经验？
调用到什么深度？
调用后应该执行什么？
执行后如何验证？
验证后是否更新经验？
```

这就是从知识管理走向 AgentOS 的分水岭。

---

## 三、经验卡片、AgentOS、Skill 的分工

007、008、011 里有三个关键对象：经验卡片、AgentOS、Skill。它们容易混在一起，但职责不同。

### 1. 经验卡片：压缩后的知识单元

经验卡片负责把一次经历变成可迁移结构。

它应该回答：

```text
什么情况下适用？
有哪些症状？
根因是什么？
怎么修？
怎么验证？
什么时候不适用？
```

例如：

```yaml
title: "子路径部署导致绝对路径泄漏"
applies_when:
  - "应用原本部署在根路径"
  - "现在挂到 /xxx/ 子路径"
  - "分享链接、静态资源或回调跳回根路径"
symptoms:
  - "页面主体可访问"
  - "某些链接跳到根路径后 404"
diagnosis:
  - "检查服务端返回路径是否以 / 开头"
  - "检查前端是否用 new URL(path, location.href)"
fix_patterns:
  - "返回相对路径"
  - "显式支持 base path"
  - "在入口层增加兼容路由"
verification:
  - "验证子路径下新链接"
  - "验证兼容路径"
invalid_when:
  - "应用已经完整支持 baseURL"
```

经验卡片更像“知识的压缩包”。它还不是执行能力，但它已经比原始聊天记录有用得多。

### 2. AgentOS：负责保存、索引、调度和治理

AgentOS 不直接解决具体任务。它负责管理经验资源。

它要回答：

```text
这条经验应该存在哪里？
当前任务该不该召回它？
召回它会不会污染上下文？
它是不是过期了？
它被哪些任务用过？
谁有权限修改它？
```

如果没有 AgentOS，经验卡片会变成一堆散文档。你知道它们存在，但 agent 不一定知道什么时候用。

### 3. Skill：把经验变成可执行能力

Skill 是更靠近执行侧的对象。它不只是讲故事，而是告诉 agent 如何完成一类任务。

一个 skill 至少应该包含：

```text
何时使用
不要何时使用
执行步骤
需要读取哪些参考
需要调用哪些脚本
如何验证结果
失败时如何降级
```

如果说经验卡片是压缩后的“过去”，那么 skill 是面向未来的“操作手册”。

三者关系可以这样理解：

```text
经验卡片：一次经历压缩成知识
AgentOS：把知识保存并按需调度
Skill：把知识转化为可执行流程
```

---

## 四、为什么“只做 RAG”不够

很多系统会把这个问题简化为：

```text
把历史会话切块，丢进向量库，下次检索出来。
```

这有用，但不够。

因为经验复用不是文本相似度问题，而是任务适配问题。

### 1. Chunk 不是经验单位

经验的自然单位不是固定 token 长度，而是：

```text
触发条件 -> 症状 -> 诊断 -> 操作 -> 验证 -> 风险 -> 迁移边界
```

如果按固定长度切块，可能把“症状”和“验证”切开，也可能把已经废弃的假设和最终结论混在一起。

### 2. 检索到不等于会使用

就算 RAG 找到了相关文档，模型还要知道：

```text
这条经验是不是适用？
哪些部分是事实？
哪些部分只是历史猜测？
当前项目和当时项目有什么差异？
需要读取全文，还是只要摘要？
```

这就需要 context engineering，而不是只靠 embedding。

### 3. 知识要能执行

很多 RAG 结果只是“材料”，不是“行动”。

比如召回一篇文章说“发布博客要构建和检查 GitHub Actions”，它还不等于 agent 会自动执行：

```text
hugo build
git status
git commit
git push
gh run list
线上 URL 检查
```

Skill 的意义就在这里：把经验从“可阅读”推进到“可执行”。

---

## 五、一个可落地的系统设计

如果要在自己的 agent 项目里落地，我会从一个很小的目录结构开始。

```text
.agents/
  profile.md
  facts/
    my-blog.md
  experiences/
    hugo-post-publish.md
    subpath-deploy-path-leak.md
  skills/
    publish-hugo-post/
      SKILL.md
      references/
        github-pages.md
      scripts/
        check-live-page.ts
  runs/
    2026-04-29-publish-012.md
```

职责分别是：

| 路径 | 职责 |
|---|---|
| `profile.md` | 常驻偏好和长期原则 |
| `facts/` | 项目稳定事实 |
| `experiences/` | 压缩后的经验卡片 |
| `skills/` | 可执行能力 |
| `runs/` | 完整任务轨迹和证据 |

这样做的好处是 KISS：不用一开始就上数据库、图谱、embedding 和复杂调度器。先用文件系统建立清晰边界，再逐步把高频能力产品化。

---

## 六、从文章发布流程看经验系统如何工作

以这个博客项目为例，一次“新增文章并推送远程”的经验可以被压缩成三层。

### 1. 项目事实

```yaml
project: my-blog
type: Hugo + PaperMod
content_dir: content/posts
post_naming: "NNN-slug.md"
deploy:
  provider: GitHub Pages
  workflow: ".github/workflows/hugo.yml"
  branch: main
proxy:
  local: "http://127.0.0.1:7890"
```

这是事实层。它应该被快速召回，但不应该混入太多历史故事。

### 2. 经验卡片

```yaml
title: "Hugo 博客文章发布后线上看不到"
applies_when:
  - "文章已提交并推送"
  - "本地能看到 Markdown 文件"
  - "线上首页或文章页暂时不可见"
diagnosis_order:
  - "检查 draft 是否 false"
  - "检查 date 是否未来时间"
  - "运行 hugo 本地构建并搜索生成产物"
  - "检查 GitHub Actions 是否成功"
  - "检查直链状态码"
  - "检查首页、posts 列表和 index.json"
  - "考虑 CDN 或浏览器缓存"
verification:
  - "hugo 构建成功"
  - "生成产物包含文章 slug"
  - "gh run list 显示部署成功"
  - "线上直链返回 200"
```

这是经验层。它来自真实问题，但已经被压缩成下次可复用的诊断顺序。

### 3. Skill

```md
---
name: publish-hugo-post
description: Use when adding, validating, committing, and publishing a Hugo blog post to GitHub Pages. Use this when the task mentions publishing a post, pushing remote, checking visibility, or debugging missing posts.
---

# Publish Hugo Post

1. Read existing post front matter and numbering.
2. Add the new post under `content/posts`.
3. Run `hugo --source <repo> --destination <repo>/.hugo-build-check`.
4. Search generated output for the post slug.
5. Commit only the intended file.
6. Push to `origin/main`.
7. Check GitHub Actions.
8. Check the direct URL, `/posts/`, home page, and `/index.json`.

Read `references/github-pages.md` if the deployment succeeds but the live page is missing.
```

这是能力层。它直接指导 agent 做事，而且可以渐进式披露：默认只看步骤，出问题时再读 GitHub Pages 参考。

---

## 七、代码层如何设计

一个最小可用的经验系统，不需要一开始做成大平台。可以先写三个模块：

```text
experience-compiler.ts
memory-store.ts
context-loader.ts
```

### 1. 经验类型

```ts
type ExperienceCard = {
  title: string;
  appliesWhen: string[];
  symptoms: string[];
  diagnosis: string[];
  fixPatterns: string[];
  verification: string[];
  invalidWhen: string[];
  evidence: string[];
  updatedAt: string;
};

type SkillMeta = {
  name: string;
  description: string;
  path: string;
};

type ContextItem = {
  source: string;
  content: string;
  reason: string;
  priority: number;
};
```

这里要刻意保持类型简单。先让经验能被写入、检索、注入、验证，不要一开始设计复杂本体论。

### 2. 检索调度

```ts
export async function planContext(
  task: string,
  facts: ContextItem[],
  experiences: ExperienceCard[],
  skills: SkillMeta[],
  match: (query: string, candidates: string[]) => Promise<number[]>
): Promise<ContextItem[]> {
  const experienceCandidates = experiences.map((item) =>
    [
      item.title,
      ...item.appliesWhen,
      ...item.symptoms,
      ...item.diagnosis,
    ].join("\n")
  );

  const matchedExperienceIndexes = await match(task, experienceCandidates);
  const matchedSkillIndexes = await match(
    task,
    skills.map((skill) => `${skill.name}: ${skill.description}`)
  );

  return [
    ...facts.map((fact) => ({
      ...fact,
      reason: "Project fact loaded as task background",
      priority: 10,
    })),
    ...matchedExperienceIndexes.map((index) => ({
      source: experiences[index].title,
      content: JSON.stringify(experiences[index], null, 2),
      reason: "Experience card matched current task",
      priority: 20,
    })),
    ...matchedSkillIndexes.map((index) => ({
      source: `${skills[index].name}/metadata`,
      content: skills[index].description,
      reason: "Skill metadata matched current task",
      priority: 30,
    })),
  ].sort((a, b) => b.priority - a.priority);
}
```

这段代码表达的是一个原则：上下文不是“搜到什么放什么”，而是按任务阶段和信息类型排序。

### 3. 渐进式加载 Skill

```ts
export async function loadSkillIfNeeded(
  selectedSkill: SkillMeta,
  readFile: (path: string) => Promise<string>
): Promise<ContextItem> {
  const content = await readFile(`${selectedSkill.path}/SKILL.md`);

  return {
    source: `${selectedSkill.name}/SKILL.md`,
    content,
    reason: "Loaded after skill metadata matched task",
    priority: 100,
  };
}
```

这就是 011 里 Anthropic 渐进式披露思想的最小版本：先让模型知道 skill 存在，只有真正相关时才读取正文。

### 4. 执行后回写经验

```ts
type RunResult = {
  task: string;
  actions: string[];
  verification: string[];
  failures: string[];
  changedFiles: string[];
};

export function shouldCompileExperience(result: RunResult): boolean {
  return (
    result.failures.length > 0 ||
    result.verification.length > 0 ||
    result.changedFiles.length > 1
  );
}
```

这个规则很粗糙，但方向是对的：不是每次对话都值得沉淀。只有解决了真实问题、产生了验证、遇到过失败或形成了可复用流程时，才进入经验压缩。

---

## 八、Prompt、Context、Harness 在这个系统里的位置

012 这篇综合之后，我会把四种 engineering 的关系再压缩一次。

### Prompt Engineering

负责定义模型的工作协议：

```text
先识别任务类型。
再选择 skill。
再请求必要上下文。
执行后必须验证。
最后判断是否沉淀经验。
```

Prompt 不负责保存所有知识。它负责规定“怎么找知识、怎么用知识”。

### Context Engineering

负责决定哪些信息进入当前上下文：

```text
项目事实是否常驻？
经验卡片是否相关？
Skill 是否只加载 metadata？
什么时候读取 SKILL.md？
什么时候读取 references？
```

Context engineering 的目标是“准”，不是“多”。

### Harness Engineering

负责工具、权限、执行和审计：

```text
哪些工具可用？
哪些操作需要确认？
工具调用如何记录？
验证结果如何进入 run log？
经验回写是否需要人工审批？
```

Harness 是 agent 系统的安全边界。渐进式披露只解决上下文加载，不解决权限控制。

### Agent Engineering

负责把任务组织成可持续闭环：

```text
规划 -> 执行 -> 观察 -> 验证 -> 反思 -> 记忆更新 -> skill 迭代
```

这才是下一阶段的重点：不是让模型单次答得更好，而是让 agent 系统越用越稳。

---

## 九、从“知识利用流动”到“经验利用流动”

007 的结尾说：

```text
做事 -> 复盘 -> 压缩 -> 检索 -> 复用 -> 再做事
```

008 把它扩展成 AgentOS：

```text
记忆分层
按需装载
结构化写入
可解释召回
可审计更新
可控遗忘
```

011 再把它落到执行机制：

```text
skill 元数据
SKILL.md
references/scripts/templates
工具调用
验证反馈
```

合在一起，我会把它称为“经验利用流动”：

```text
经验不是被收藏，而是被调度；
经验不是被全文塞入，而是被按需披露；
经验不是被朗读，而是被执行和验证；
经验不是一次写死，而是在反馈中更新。
```

这比“知识库”更进一步。

知识库可以是静态的。经验系统必须是循环的。

---

## 十、一个现实的演进路线

如果从今天开始做，不应该一上来做复杂平台。我会按四步走。

### 第一阶段：手写经验卡片

每次真实任务结束后，只沉淀高价值经验。

目录可以很简单：

```text
.agents/experiences/
```

重点是把字段写清楚：

```text
适用条件、症状、诊断、修复、验证、失效边界。
```

### 第二阶段：把高频经验升级成 Skill

当一类经验复用三次以上，就可以升级为 skill。

经验卡片偏“这次学到了什么”，skill 偏“下次怎么做”。

### 第三阶段：加检索和调度

先不用复杂向量库，可以从文件名、tags、front matter、关键词开始。

只有当经验数量增长到人工检索困难时，再引入 embedding、图谱和 reranker。

### 第四阶段：加评测和治理

每个 skill 都应该有小型 eval：

```text
给定任务描述，是否会触发正确 skill？
是否会读取正确 reference？
是否会避免不相关经验污染？
是否会执行必要验证？
```

没有 eval 的自我进化，很容易变成自我污染。

---

## 结论

007、008、011 三篇合起来，其实是在搭一套 Agent 时代的经验系统。

007 解决“经验如何从一次事件压缩成结构”。

008 解决“经验如何被保存、索引、调度和治理”。

011 解决“经验如何被按需披露，并转化为可执行能力”。

最终得到的不是一个更大的 prompt，也不是一个更大的向量库，而是一条闭环：

```text
真实任务
-> 经验压缩
-> AgentOS 调度
-> 渐进式披露
-> Harness 执行
-> 验证反馈
-> Skill 迭代
```

这条闭环的意义在于：agent 不再只是“当前上下文里的聪明模型”，而是逐渐拥有一个可复用、可调度、可执行、可审计的经验系统。

对个人来说，它能让每一次真实问题都不白白消失。

对 Agent 项目来说，它可能就是从“会话工具”走向“长期协作系统”的关键一步。

