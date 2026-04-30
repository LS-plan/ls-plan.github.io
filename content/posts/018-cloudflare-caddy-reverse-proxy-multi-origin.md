---
title: "[018] Cloudflare 橙云、Caddy 反向代理与多源站门户：从 nobodyls.cn 的改造说起"
date: 2026-04-30T15:20:00+08:00
draft: false
locked: true
passwordHash: "9df2308c15f6ca21cf2fd082fba26949508c83d5c0285bea8c90fdf7b3e1dd16"
lockAdminHash: "cb91cd7115499c7a7d4669f82f918dd0975d309d304d0e9607e86f69d9018139"
hideSummary: true
searchHidden: true
robotsNoIndex: true
slug: "018-cloudflare-caddy-reverse-proxy-multi-origin"
aliases:
  - "/posts/cloudflare-caddy-reverse-proxy-multi-origin/"
tags: ["Cloudflare", "Caddy", "Reverse Proxy", "DNS", "Security", "Self Hosting", "DevOps"]
categories: ["基础设施"]
---

> 写作时间：2026-04-30  
> 关键词：Cloudflare 橙云、Caddy、反向代理、多源站、门户页、安全组、fail2ban

---

## 执行摘要

这次改造的目标很明确：

```text
nobodyls.cn              -> 阿里云主站门户页
www.nobodyls.cn          -> 同样进入门户页
blog.nobodyls.cn         -> GitHub Pages / Hugo 博客
nobodyls.cn/blog         -> 301 跳转到 blog.nobodyls.cn
nobodyls.cn/filebox      -> 阿里云内网本机服务 127.0.0.1:12345
imageweb.nobodyls.cn     -> 阿里云图片服务
elec.nobodyls.cn         -> 阿里云电量监控服务
los.nobodyls.cn          -> 测试节点入口
```

这里面其实包含了现代个人基础设施的一套典型模式：

```text
Cloudflare 负责入口、DNS、TLS 边缘和隐藏源站。
Caddy 负责站点内部的路由、静态文件、反向代理和 HTTPS。
安全组 / UFW 负责真正的网络边界。
fail2ban 负责 SSH 这类入口的暴力破解防护。
```

反向代理不是“把端口藏起来”这么简单。它真正的意义是把一堆分散的服务重新组织成一个可治理的入口。

---

## 一、先分清三层：注册商、DNS、代理

很多域名配置的混乱，都来自把三件事混在一起：

```text
注册商：谁卖给你这个域名，例如阿里云。
权威 DNS：谁负责回答这个域名的解析，例如 Cloudflare。
代理/CDN：谁站在用户和源站中间转发流量，例如 Cloudflare 橙云。
```

你把 nameserver 从阿里云的：

```text
dns15.hichina.com
dns16.hichina.com
```

改成 Cloudflare 分配的：

```text
kira.ns.cloudflare.com
lou.ns.cloudflare.com
```

之后，域名还是在阿里云买的，但“解析控制权”已经交给 Cloudflare。  
所以以后新增 `A`、`CNAME`、`TXT` 记录，主要应该在 Cloudflare DNS 页面改，而不是继续在阿里云云解析里改。

这也是为什么同一个 `A` 记录旁边会有橙色云朵和灰色云朵：

```text
橙云 Proxied：用户访问 Cloudflare，Cloudflare 再访问你的源站。
灰云 DNS only：Cloudflare 只回答 DNS，用户直接访问你的源站 IP。
```

如果目标是“套壳”和隐藏源站，HTTP/HTTPS 服务通常应该用橙云。  
但 SSH、数据库、RDP 这类非 Web 服务不应该指望橙云保护，它们要靠安全组、UFW、密钥登录和专门的隧道方案。

---

## 二、为什么根域名适合做门户

根域名 `nobodyls.cn` 是用户最自然会输入的入口。  
所以它最好不要直接绑死到某一个具体服务，而是作为门户页：

```text
nobodyls.cn
  -> Blog
  -> Image Web
  -> Elec Monitor
  -> Filebox
  -> Test Node
```

这种设计有几个好处：

- 入口稳定：以后服务迁移，用户仍然记住根域名。
- 语义清楚：根域名代表“我这个人的基础设施首页”，子域名代表具体能力。
- 可扩展：新增服务时，只需要加 DNS + Caddy 路由 + 门户卡片。
- 安全边界清楚：公网只暴露 80/443，业务服务尽量只监听 `127.0.0.1`。

最终入口不是一堆端口：

```text
https://nobodyls.cn:12345
https://nobodyls.cn:8092
https://nobodyls.cn:8089
```

而是一组可读 URL：

```text
https://nobodyls.cn/filebox/
https://imageweb.nobodyls.cn/
https://elec.nobodyls.cn/
https://los.nobodyls.cn/
```

这就是反向代理的第一层价值：把机器端口翻译成人类语义。

---

## 三、反向代理和重定向不是一回事

`/blog` 这个例子很典型。

如果想让 `https://nobodyls.cn/blog/` 显示博客，有两种方式：

```text
方式一：反向代理
nobodyls.cn/blog/* -> GitHub Pages 后端

方式二：重定向
nobodyls.cn/blog/* -> 301 到 blog.nobodyls.cn/*
```

这次更适合选择第二种。

原因是 Hugo 静态站点通常会有自己的 `baseURL`、canonical URL、静态资源路径、分页路径和 RSS 路径。  
如果强行把 `blog.nobodyls.cn` 挂到 `nobodyls.cn/blog/` 子路径下，容易出现资源路径、跳转、SEO 和页面生成不一致的问题。

所以 Caddy 里可以这样处理：

```caddyfile
@blogRoot path /blog /blog/
redir @blogRoot https://blog.nobodyls.cn/ 301

handle_path /blog/* {
    redir https://blog.nobodyls.cn{uri} 301
}
```

这里的思路是：

```text
博客有自己的完整域名，就让它待在自己的域名里。
根域名只负责把用户带过去。
```

这比“所有东西都塞进一个路径前缀”更稳。

---

## 四、Filebox 为什么适合放在 /filebox/

Filebox 这类工具更像一个附属能力：临时上传、口令分享、文件中转。  
它不一定需要单独占一个子域名，放在门户页下面很自然：

```text
https://nobodyls.cn/filebox/
```

后端服务可以只监听本机：

```text
127.0.0.1:12345
```

Caddy 再把外部路径转给它：

```caddyfile
@fileboxRoot path /filebox
redir @fileboxRoot /filebox/ 308

handle_path /filebox/* {
    reverse_proxy 127.0.0.1:12345
}
```

这里有两个关键点。

第一，`12345` 不应该继续暴露在公网安全组里。  
用户访问的是 `443`，Caddy 在服务器内部访问 `127.0.0.1:12345`。

第二，`handle_path` 会剥掉匹配到的路径前缀。  
也就是说外部请求：

```text
/filebox/assets/index.js
```

转到后端时会变成：

```text
/assets/index.js
```

这对很多前端单页应用很重要。  
如果某个应用强依赖根路径、写死了绝对路径，子路径部署仍然可能出问题，这时更稳的方案是单独给它一个子域名：

```text
filebox.nobodyls.cn
```

所以经验规则是：

```text
轻量附属工具：优先路径，例如 /filebox/
完整独立产品：优先子域名，例如 blog.nobodyls.cn
路径不兼容的前端应用：改用子域名
```

---

## 五、Cloudflare 橙云不是防火墙的替代品

橙云的价值是让用户先访问 Cloudflare：

```text
用户 -> Cloudflare Edge -> 源站
```

这样用户看到的是 Cloudflare IP，而不是你的真实源站 IP。  
但这不代表源站端口可以随便开。

真正应该做的是分层收敛：

```text
Cloudflare DNS：Web 域名开启橙云。
安全组：只开放必要端口。
UFW：在系统内再做一层入站控制。
Caddy：只在 80/443 接收 Web 请求。
业务服务：尽量只监听 127.0.0.1。
fail2ban：保护 SSH 登录入口。
```

例如阿里云这台机器，公网入口应该尽量收敛到：

```text
22/tcp    SSH，最好限制来源 IP 或改密钥登录
80/tcp    HTTP，给 Caddy 自动跳转和证书验证
443/tcp   HTTPS，Web 入口
```

`3306`、`3389`、`12345` 这类端口都不适合对全网开放。

如果只希望网站流量经过 Cloudflare，还可以进一步限制 80/443 只允许 Cloudflare IP 段访问。  
这一步要谨慎，因为 Cloudflare IP 段会更新，最好用脚本同步官方列表，而不是手抄一次就忘。

一个简化版思路是：

```bash
# 先删除对全网开放的 80/443，再按 Cloudflare IP 段逐条放行
ufw deny 80/tcp
ufw deny 443/tcp

# 示例：实际应从 Cloudflare 官方 IP 列表同步
ufw allow from 173.245.48.0/20 to any port 80 proto tcp
ufw allow from 173.245.48.0/20 to any port 443 proto tcp
```

这里不要只看“能不能访问”，还要看访问路径：

```bash
curl -I https://nobodyls.cn
```

如果响应里有：

```text
server: cloudflare
cf-ray: ...
```

说明用户侧经过了 Cloudflare。  
如果直接访问源站 IP 的 80/443 被拒绝，说明源站入口也收住了。

---

## 六、fail2ban 的作用

fail2ban 不是用来保护 HTTP 业务逻辑的，它最常见的用途是保护 SSH。

它会持续观察认证日志，例如：

```text
/var/log/auth.log
```

当某个 IP 在短时间内多次登录失败，就自动调用防火墙规则封禁它一段时间。

它适合解决的是这种问题：

```text
有人不断扫你的 SSH。
有人用密码字典撞 root。
有人反复尝试常见用户名。
```

但它不能替代这些基本操作：

```text
禁用 root 直接登录。
关闭密码登录。
使用 SSH key。
限制 SSH 来源 IP。
把不需要的端口从安全组删掉。
```

fail2ban 是补充层，不是第一道门。

---

## 七、推荐的最终结构

我更喜欢把这套结构理解成“入口层”和“服务层”的分离：

```text
入口层：
  Cloudflare DNS / Proxy
  Caddy 80/443
  门户页

服务层：
  GitHub Pages
  阿里云本机容器
  阿里云静态目录
  测试节点
```

对应关系可以写成：

```text
nobodyls.cn
  A -> 8.155.163.203
  Cloudflare Proxied
  Caddy -> /var/www/nobodyls-portal

www.nobodyls.cn
  CNAME -> nobodyls.cn
  Cloudflare Proxied

blog.nobodyls.cn
  CNAME -> ls-plan.github.io
  Cloudflare Proxied

los.nobodyls.cn
  A -> 154.217.234.91
  Cloudflare Proxied

imageweb.nobodyls.cn
  A -> 8.155.163.203
  Cloudflare Proxied
  Caddy -> localhost:8092

elec.nobodyls.cn
  A -> 8.155.163.203
  Cloudflare Proxied
  Caddy -> /var/www/elecmon + localhost:8089/api

nobodyls.cn/filebox/
  Caddy path -> 127.0.0.1:12345
```

这个结构有一个很重要的工程优点：

```text
DNS 负责“到哪台机器”。
Caddy 负责“进机器后到哪个服务”。
应用只负责自己的业务。
```

职责边界清楚之后，排障也会简单很多。

---

## 八、排障顺序

如果访问失败，不要一上来就改一堆配置。  
可以按链路一层一层看：

```bash
# 1. 看 DNS 是否指向 Cloudflare
nslookup nobodyls.cn
nslookup los.nobodyls.cn

# 2. 看是否经过 Cloudflare
curl -I https://nobodyls.cn

# 3. 看源站 Caddy 是否正常
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl status caddy

# 4. 看本机服务是否活着
curl -I http://127.0.0.1:12345
curl -I http://127.0.0.1:8092

# 5. 看公网端口是否真的关闭
Test-NetConnection 8.155.163.203 -Port 12345
```

这个顺序很重要：

```text
先确认入口，再确认代理，再确认后端，再确认安全边界。
```

不要反过来。反过来最容易陷入“感觉哪里都对，但就是打不开”的状态。

---

## 九、对个人基础设施的启发

这次改造之后，我对个人服务器的理解更接近下面这个模型：

```text
域名不是解析表。
域名是个人基础设施的产品界面。
```

每一个子域名、每一个路径，其实都在表达一个产品决策：

```text
根域名：我是谁，我有哪些入口。
blog：长期内容和公开表达。
filebox：短期文件交换。
imageweb：具体工具能力。
elec：家庭/设备数据面板。
los：测试节点。
```

而 Cloudflare + Caddy 的组合，刚好让这件事变得非常轻：

```text
Cloudflare 管外部入口。
Caddy 管内部组织。
Linux 安全层管暴露面。
```

这套模式不只适合个人网站，也适合小团队、实验室、家庭服务器和 agent 时代的工具集。

因为 agent 时代会出现越来越多“小而专”的服务：文件箱、知识库、爬虫、模型网关、任务队列、监控面板、自动化工作台。  
如果每个服务都要求用户记一个端口，这套系统很快会失控。

更好的方式是：

```text
让端口消失。
让路径和子域名成为产品界面。
让反向代理成为服务编排层。
```

这就是这次改造最核心的收获。

---

## 参考资料

- Cloudflare Docs: Proxied DNS records  
  https://developers.cloudflare.com/dns/manage-dns-records/reference/proxied-dns-records/
- Cloudflare Docs: Cloudflare IP addresses  
  https://developers.cloudflare.com/fundamentals/concepts/cloudflare-ip-addresses/
- Caddy Docs: reverse_proxy directive  
  https://caddyserver.com/docs/caddyfile/directives/reverse_proxy
