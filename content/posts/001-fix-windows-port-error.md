---
title: "[001] 解决 Windows 端口被系统保留及 winget 路径丢失的深度复盘"
date: 2026-02-05T14:00:00+08:00
draft: false
tags: ["Windows", "Python", "Git"]
categories: ["开发环境"]
---
### 问题 1：Flask等程序报错“以一种访问权限不允许的方式做了一个访问套接字的尝试”

**现象：** 尝试在 5001 等端口运行应用时失败，报错代码 10013。资源监视器显示端口未被占用。

**原因：** Windows 的 Hyper-V 或 WinNAT 动态生成了“排除范围”（Excluded Port Range）。虽然没有进程监听，但内核已禁止普通应用申请这些端口。

**终极解法：**
以管理员身份运行以下指令，将系统随机分配的起始端口调高，避开开发常用的低位区：

```bash
netsh int ipv4 set dynamicport tcp start=10000 num=55535
```

---

### 问题 2：winget 突然失效，“不是内部或外部命令”

**深度发现：** 经过全盘搜索，发现 `winget.exe` 存在于 `%LOCALAPPDATA%\Microsoft\WindowsApps`，但该路径之前在系统的 `%PATH%` 环境变量过长的问题中被我异常删掉了。

**解决方案：** 将上述路径手动添加到系统的环境变量 Path 中，即可恢复 `winget` 命令的使用。
