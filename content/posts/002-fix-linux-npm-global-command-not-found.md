---
title: "[002] Linux 中 npm 全局命令（如 claude）无法识别的修复方法"
date: 2026-02-10T09:00:00+08:00
draft: false
tags: ["Linux", "Node.js", "npm", "PATH", "Claude"]
categories: ["开发环境"]
---

### 问题现象

在 Linux 中通过 `npm -g` 全局安装某些工具后（例如 `claude`），在任意目录执行命令时提示“command not found”或“无法识别命令”。

### 根本原因

系统当前会话的 `PATH` 环境变量中，缺少 npm 全局安装命令对应的 `bin` 目录。  
可执行文件虽然已经安装成功，但 shell 无法在搜索路径中找到它。

### 解决命令

执行以下命令，将 npm 全局前缀目录下的 `bin` 路径追加到 `~/.bashrc`，并立即生效：

```bash
echo -e "export PATH=$(npm prefix -g)/bin:$PATH" >> ~/.bashrc && source ~/.bashrc
```

### 命令说明

- `npm prefix -g`：获取 npm 全局安装前缀目录（常见如 `/usr`、`/usr/local` 或用户目录下前缀）。
- `export PATH=...`：把全局命令的 `bin` 路径加入 `PATH`。
- `>> ~/.bashrc`：将配置追加到 Bash 启动文件。
- `source ~/.bashrc`：当前终端立即加载新配置，无需重开终端。

### 验证方式

执行以下命令确认路径和工具可用：

```bash
echo $PATH
which claude
claude --version
```

如果 `which claude` 能输出可执行文件路径，说明修复成功。
