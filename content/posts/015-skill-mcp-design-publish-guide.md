---
title: "[015] 如何构建自己的 Skill 或 MCP：从渐进式披露到可发布的 Agent 能力"
date: 2026-04-29T22:40:00+08:00
draft: false
slug: "015-skill-mcp-design-publish-guide"
aliases:
  - "/posts/skill-mcp-design-publish-guide/"
tags: ["AI Agent", "Skill", "MCP", "Anthropic", "渐进式披露", "Context Engineering", "Harness Engineering"]
categories: ["AI 工具"]
---

> 写作时间：2026-04-29  
> 关键词：Agent Skills、MCP、渐进式披露、Context Engineering、Harness Engineering、发布工程

---

## 执行摘要

如果你想给 agent 增加能力，现在大概会遇到两个词：

```text
Skill：把某类任务的知识、流程、脚本和资源打包给 agent。
MCP：把外部系统、数据和动作标准化暴露给 agent。
```

它们不是互相替代的关系。

更准确地说：

```text
Skill 解决“agent 应该如何理解、选择和推进任务”。
MCP 解决“agent 能稳定调用哪些外部能力”。
```

一个好的 agent 工程体系，通常不是只写 prompt，也不是只接一堆 tools，而是把四层东西配齐：

```text
Prompt Engineering：当前任务怎么说清楚。
Context Engineering：长期知识如何按需进入上下文。
Harness Engineering：复杂任务如何被约束、验证、恢复。
Capability Engineering：能力如何被封装、分发、审计、升级。
```

Skill 和 MCP 都属于 Capability Engineering，但位置不同。

我的判断是：

- 如果你要沉淀“怎么做”，优先做 Skill。
- 如果你要连接“能做什么”，优先做 MCP。
- 如果你要做一个真正可复用的 agent 工作流，最好是 Skill + MCP 联合设计。

---

## 一、先判断：你要做 Skill，还是 MCP？

不要一上来就写框架。先问一个很朴素的问题：

```text
这个能力的核心，是知识流程，还是外部接口？
```

适合做 Skill 的情况：

- 你有一套稳定的工作方法，比如写博客、做 code review、整理会议纪要、发布 Hugo 站点。
- 你需要告诉 agent 什么时候使用某些流程，什么时候不要使用。
- 你有一批参考文档、模板、规范、错误案例，需要按需加载。
- 你有一些确定性脚本，但脚本本身只是流程的一部分。
- 你更关心 agent 的判断质量，而不是单个 API 调用。

适合做 MCP 的情况：

- 你要连接外部系统，比如数据库、GitHub、Notion、Figma、内部 SaaS、搜索服务。
- 你需要把动作暴露成结构化工具，并让多个 MCP client 都能用。
- 你需要权限、审计、输入 schema、输出 schema、错误边界。
- 你希望能力不绑定某一个 agent，而是成为标准化服务。
- 你要让模型访问实时数据，而不是静态知识。

适合二者结合的情况：

```text
Skill：告诉 agent 何时用、按什么顺序用、如何验证结果。
MCP：提供可调用、可审计、可复用的工具和资源。
```

例如“发布博客”这个任务：

```text
Skill 负责：
- 检查 front matter 的 date 是否未来时间
- 约定文章编号、slug、aliases、tags
- 规定发布前必须运行 hugo
- 规定推送后检查 GitHub Pages 状态

MCP 负责：
- 读取仓库状态
- 查询 GitHub Actions / Pages
- 获取线上页面响应
- 生成发布报告
```

这就是 011 里讨论的渐进式披露在工程层的延伸：不是把所有知识塞进一次 prompt，而是让 agent 在需要时打开正确的能力层。

---

## 二、Anthropic 的设计哲学：有用，但不要神化

Anthropic 在 Agent Skills 的工程文章里给了一个很清楚的设计方向：Skill 是一个目录，核心入口是 `SKILL.md`，再按需要包含脚本、参考资料和资源。

这里真正值得借鉴的不是文件名，而是三个思想。

第一，渐进式披露。

agent 启动时不应该加载所有技能内容，只需要看到每个 skill 的 `name` 和 `description`。当用户任务命中某个 skill 时，再读取完整 `SKILL.md`。如果任务还需要更深的细节，再读取 `references/` 里的文件，或者执行 `scripts/` 里的脚本。

这让 Skill 的规模几乎不再由单次上下文窗口决定，而由“能否被正确索引、触发、拆分和验证”决定。

第二，程序性知识比静态提示更重要。

很多人写 skill，会把它写成一篇超长 prompt。这样通常会失败。好的 skill 更像一个给新同事看的 onboarding 包：

```text
什么时候该用它？
先做什么？
哪些判断不能省？
哪些步骤可以交给脚本？
失败时怎么恢复？
哪些资料只在特定场景才需要读？
```

第三，把确定性工作交给代码。

排序、解析、格式检查、构建、测试、schema 校验，不应该让模型靠语言生成硬猜。Skill 可以带脚本，MCP 可以暴露工具。能确定的部分越稳定，模型就越能把注意力放在判断、规划和整合上。

但也要克制：不要把所有设计都强行解释成 Anthropic 哲学。Anthropic 明确讲的是 Skills 的渐进式披露、上下文管理、脚本执行和安全审计。至于 MCP 的工具治理、服务化发布、跨 client 生态，是 MCP 自己的协议设计重点。

---

## 三、一个好的 Skill 应该怎么设计

Skill 的核心不是“写一段提示词”，而是设计一个可触发、可执行、可验证的能力包。

一个基本结构可以是：

```text
my-skill/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── references/
│   ├── workflow.md
│   └── troubleshooting.md
├── scripts/
│   └── validate.ps1
└── assets/
    └── template.md
```

其中 `SKILL.md` 是唯一必须入口。它应该短，清楚，有边界。

一个可参考的 `SKILL.md`：

```markdown
---
name: hugo-publish
description: Use when publishing a Hugo blog post, checking front matter dates, running Hugo builds, debugging missing posts, or verifying GitHub Pages deployment. Do not use for general writing advice.
---

# Hugo Publish

## Workflow

1. Inspect the target post front matter before editing.
2. Ensure `date` is not in the future for the site's configured timezone.
3. Run `hugo` before claiming the post is publishable.
4. If the page is missing online, read `references/troubleshooting.md`.
5. Run `scripts/validate.ps1` when the task includes publishing.

## Safety

Ask for explicit confirmation before `git commit` or `git push`.
Never rewrite unrelated posts.
```

这里有几个关键点。

`description` 是路由协议，不是广告语。

agent 在加载完整 skill 之前，主要依赖 `name` 和 `description` 判断是否触发。所以 description 要写清楚：

- 什么时候使用。
- 什么时候不要使用。
- 任务边界是什么。
- 触发词可能是什么。

不好的写法：

```yaml
description: A useful skill for blogs.
```

好的写法：

```yaml
description: Use when creating, editing, validating, or publishing Hugo blog posts, especially when checking front matter dates, slugs, aliases, local builds, or GitHub Pages deployment status. Do not use for generic essay brainstorming.
```

`SKILL.md` 不是资料仓库。

如果内容开始超过几百行，通常应该拆：

```text
稳定主流程       -> SKILL.md
详细操作手册     -> references/workflow.md
故障排查         -> references/troubleshooting.md
确定性检查       -> scripts/validate.ps1
输出模板         -> assets/template.md
```

这种拆分的本质是上下文节流。agent 不需要在每次写文章时都读完整的 GitHub Pages 故障排查手册；只有“构建成功但线上看不到”时才需要。

脚本要处理确定性问题。

例如 Hugo 发布 skill 可以把这些事情放进脚本：

```powershell
param(
  [Parameter(Mandatory = $true)]
  [string]$PostPath
)

$content = Get-Content -Path $PostPath -Raw
if ($content -notmatch "draft:\s*false") {
  throw "Post is not publishable: draft is not false."
}

hugo
if ($LASTEXITCODE -ne 0) {
  throw "Hugo build failed."
}
```

不要让模型凭感觉判断 “应该没问题”。让脚本判断。

---

## 四、一个好的 MCP 应该怎么设计

MCP 的官方定位是让 AI 应用连接外部系统。它把能力拆成几个核心面：

- Tools：模型可以调用的动作，例如查数据库、调用 API、执行计算。
- Resources：模型可以读取的上下文或数据，例如文件、记录、文档片段。
- Prompts：可复用的交互模板或任务入口。

所以 MCP server 的设计重点不是“把 API 全包一遍”，而是把 agent 真正需要的任务接口抽象出来。

一个坏的 MCP server 往往这样设计：

```text
github_get_api(path, method, body)
notion_api(method, endpoint, payload)
database_query(sql)
```

这看起来通用，实际把所有风险都甩给了模型。

一个更好的设计是：

```text
list_open_pull_requests(repo)
get_failed_workflow_runs(repo, branch)
summarize_pages_deployment(repo)
create_blog_publish_report(repo, commit)
```

好工具应该表达任务意图，而不是暴露底层管道。

最小 MCP server 的形态大致如下：

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "blog-tools",
  version: "0.1.0",
});

server.registerTool(
  "check_hugo_post",
  {
    title: "Check Hugo Post",
    description: "Validate front matter and run Hugo build for a single blog post.",
    inputSchema: {
      postPath: z.string().describe("Absolute path to the Markdown post"),
    },
  },
  async ({ postPath }) => {
    // 真实实现里应做路径白名单、front matter 解析、hugo build、错误归一化。
    return {
      content: [
        {
          type: "text",
          text: `Checked ${postPath}`,
        },
      ],
    };
  }
);

await server.connect(new StdioServerTransport());
```

这个例子只说明设计形态。真正发布时，至少还要补齐：

- 输入校验：路径、参数、枚举、长度、权限。
- 输出 schema：让 client 和模型知道结构化结果是什么。
- 错误分类：协议错误、业务错误、上游错误要分开。
- 超时与重试：不要让工具调用无限挂起。
- 审计日志：记录谁在什么时候调用了什么工具。
- 人类确认：写入、删除、推送、支付、发邮件等动作必须能被用户拒绝。

MCP Tools 的危险之处在于它们通常真的能做事。越靠近真实系统，越要把权限、最小动作面和确认机制设计在协议边界上，而不是指望模型永远自觉。

---

## 五、Skill + MCP 的联合设计

最好的模式通常是：

```text
Skill 负责任务策略。
MCP 负责能力执行。
```

以“发布一篇技术博客”为例，skill 可以这样写：

```markdown
# Blog Publish Skill

## Workflow

1. Read the draft and infer target post number.
2. Create or update one post only.
3. Call `check_hugo_post` before publishing.
4. If build passes, summarize local changes.
5. Ask for explicit confirmation before commit and push.
6. After push, call `get_pages_deployment_status`.
7. If the page is missing, read `references/pages-troubleshooting.md`.
```

MCP server 则提供这些工具：

```text
check_hugo_post(postPath) -> buildResult
get_git_status(repoPath) -> changedFiles
get_pages_deployment_status(repo) -> deploymentState
fetch_live_post(url) -> httpStatus + title
```

这样设计的好处是：

- Skill 不需要知道 GitHub API 的所有细节。
- MCP 不需要承担复杂写作和发布策略。
- agent 看到的是一个可执行的流程，而不是一堆散乱工具。
- 验证点可以被固化下来，减少“说发布了但其实没上线”的问题。

这也是 014 里分析 Vibe-Skills 时我认为最有价值的部分：高级 skill 不只是能力集合，而是任务推进 harness。

---

## 六、如何发布一个 Skill

发布 skill 前，先做最小可用版本，不要一开始追求“大而全”。

第一步，定义任务边界。

写下三类样例：

```text
应该触发：
- 帮我发布一篇 Hugo 博客
- 为什么我的新文章线上看不到
- 检查这篇文章 front matter 是否正确

不应该触发：
- 帮我想 10 个博客标题
- 总结这篇文章观点
- 改一下中文表达

边界情况：
- 用户要求 push，但仓库有未关联改动
- Hugo 构建成功但 GitHub Pages 没更新
- 文章 date 是未来时间
```

第二步，写 `SKILL.md`。

只放主流程、触发边界、必要安全约束。不要把全部知识都塞进去。

第三步，拆出 `references/`、`scripts/`、`assets/`。

常见拆法：

```text
references/
  workflow.md          # 详细流程
  troubleshooting.md   # 罕见错误
  api-patterns.md      # 外部系统模式
scripts/
  validate.ps1
  inspect.py
assets/
  template.md
```

第四步，本地验证。

至少做三类测试：

- 正常任务：agent 能否正确触发 skill。
- 负样例：agent 会不会过度触发 skill。
- 失败路径：脚本失败、缺权限、缺依赖时能否给出可恢复建议。

第五步，发布到 GitHub。

建议仓库结构简单一点：

```text
my-agent-skills/
├── README.md
├── LICENSE
└── skills/
    └── hugo-publish/
        ├── SKILL.md
        ├── references/
        ├── scripts/
        └── assets/
```

仓库 README 负责说明安装方式、兼容 agent、示例任务、版本变更。skill 目录内部保持干净，不要塞一堆和运行无关的文档。

第六步，版本化。

Skill 也需要版本意识。每次改动至少说明：

- 触发条件是否变化。
- 工作流是否变化。
- 脚本依赖是否变化。
- 是否新增高风险操作。
- 是否需要用户重新授权。

---

## 七、如何发布一个 MCP server

MCP server 的发布更接近传统软件工程。

你需要先决定部署形态：

- 本地 stdio：适合原型、本机文件、桌面应用、localhost 服务。
- MCPB 或类似打包方式：适合把本地 server 连同运行时一起分发。
- 远程 Streamable HTTP：适合云 API、团队服务、多用户共享、OAuth。

然后设计工具面。

一个实用原则：

```text
优先暴露任务级工具，而不是底层 API 代理。
```

例如不要急着做：

```text
call_github_api(method, path, body)
```

优先做：

```text
get_pull_request_review_state(owner, repo, number)
list_failed_actions(owner, repo, branch)
create_release_note(owner, repo, tag)
```

发布前至少准备：

- README：server 能做什么，不能做什么。
- 安装方式：npm、PyPI、Docker、二进制、MCPB。
- client 配置示例：本地 stdio 和远程 HTTP 分开写。
- 环境变量说明：token、base URL、权限范围。
- 工具清单：name、description、input schema、output schema。
- 安全说明：哪些工具会写入、删除、发送、支付、推送。
- 测试方式：MCP Inspector、单元测试、集成测试。
- 版本策略：语义化版本，破坏性变更单独标注。

官方 TypeScript SDK 和 Python SDK 都可以作为起点。MCP 的 examples/server 仓库也值得看，但不要照搬所有例子。先做窄，再做稳。

---

## 八、常见反模式

反模式一：把 Skill 写成长文档。

长文档看起来完整，实际会让 agent 在每次触发时吞下大量无关上下文。Skill 的入口应该像目录和操作规程，不应该像百科全书。

反模式二：`description` 太泛。

如果 description 写成 “helpful for development”，它就会到处误触发。误触发比不触发更危险，因为它会悄悄改变 agent 的行为。

反模式三：MCP server 只是 API 透传。

模型不需要一个“万能 HTTP 调用器”。它需要边界清晰、schema 明确、错误可解释、权限可控制的任务工具。

反模式四：没有失败路径。

真实工作流里，失败不是异常，而是常态。好的 Skill/MCP 要告诉 agent：

- 构建失败怎么办。
- 上游 API 限流怎么办。
- token 缺权限怎么办。
- 本地路径不存在怎么办。
- 用户拒绝高风险动作怎么办。

反模式五：没有发布后的验证。

尤其是写入型工具和发布型 skill，不能以“命令执行成功”作为最终成功。真正的成功应该来自目标状态验证：

```text
文章是否能访问？
PR 是否真的创建？
workflow 是否通过？
数据库记录是否可读？
用户是否看到了结果？
```

---

## 九、下一代方向：从 Prompt 到 Capability

过去的 agent 工程，经常停在 prompt：

```text
告诉模型怎么做。
```

现在正在进入 context：

```text
让模型在正确时刻看到正确资料。
```

再往前，是 harness：

```text
让模型按可验证的节奏推进复杂任务。
```

而 Skill 和 MCP 指向的是下一层：

```text
把能力做成可组合、可发布、可审计、可升级的工程资产。
```

这也是为什么我认为“做自己的 Skill 或 MCP”不是玩具工程。

如果你的团队反复让 agent 做同一类任务，却每次都靠复制 prompt，那就应该做 Skill。

如果你的团队反复让 agent 访问同一批系统，却每次都靠临时脚本和一次性 token，那就应该做 MCP。

如果你的任务既需要流程判断，又需要真实系统动作，那就把两者结合起来：

```text
Skill 管策略。
MCP 管能力。
脚本管确定性。
人管授权边界。
验证管最终可信度。
```

这套结构，才是 agent 时代更接近生产级的工程形态。

---

## 参考资料

- Anthropic Engineering：[Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- Model Context Protocol：[What is MCP?](https://modelcontextprotocol.io/docs/getting-started/intro)
- Model Context Protocol：[Build with Agent Skills](https://modelcontextprotocol.io/docs/develop/build-with-agent-skills)
- MCP Specification：[Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
- MCP Specification：[Resources](https://modelcontextprotocol.io/specification/2025-06-18/server/resources)
- MCP Specification：[Prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts)
- GitHub：[modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
- GitHub：[modelcontextprotocol/python-sdk](https://github.com/modelcontextprotocol/python-sdk)
- GitHub：[modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
