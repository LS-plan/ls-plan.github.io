---
title: "解决 Windows 端口被系统保留及 winget 路径丢失的深度复盘"
date: 2026-02-06T14:00:00+08:00
draft: false
tags: ["Windows", "Python", "Git"]
categories: ["开发环境"]
---

### 问题 1：Flask/LocalSend 报错“以一种访问权限不允许的方式做了一个访问套接字的尝试”

**现象：** 尝试在 5001 或 53317 端口运行应用时失败，报错代码 10013。资源监视器显示端口未被占用。

**原因：** Windows 的 Hyper-V 或 WinNAT 动态生成了“排除范围”（Excluded Port Range）。虽然没有进程监听，但内核已禁止普通应用申请这些端口。

**终极解法：**
以管理员身份运行以下指令，将系统随机分配的起始端口调高，避开开发常用的低位区：
```bash
netsh int ipv4 set dynamicport tcp start=10000 num=55535
```
---

## 2. 让网站更精致：PaperMod 进阶配置

打开你博客根目录下的 `hugo.toml`，建议用以下内容覆盖，这会开启搜索、评论区占位和美观的侧边栏：

```toml
baseURL = 'https://nobodyls.github.io/'
languageCode = 'zh-cn'
title = 'Nobodyls 的技术日志'
theme = 'PaperMod'

[params]
    env = "production"
    # 开启搜索功能
    ShowReadingTime = true
    ShowShareButtons = true
    ShowCodeCopyButtons = true
    # 首页信息卡片
    [params.homeInfoParams]
        Title = "👋 欢迎来到我的技术空间"
        Content = "专注于 RL Infra、AI 协作与 Windows 开发避坑。这里记录了我从 'Nobody' 到 'Somebody' 的进化过程。"

    # 社交图标配置
    [[params.socialIcons]]
        name = "github"
        url = "https://github.com/LS-plan"

[menu]
    [[menu.main]]
        identifier = "posts"
        name = "📚 文章"
        url = "/posts/"
        weight = 10
    [[menu.main]]
        identifier = "search"
        name = "🔍 搜索"
        url = "/search/"
        weight = 20
```