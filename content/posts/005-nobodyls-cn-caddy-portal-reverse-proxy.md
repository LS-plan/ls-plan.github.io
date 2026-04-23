---
title: "[005] 把 nobodyls.cn 改造成统一门户：一次看懂 DNS、Caddy、反向代理和路径路由"
date: 2026-04-24T05:00:00+08:00
draft: false
slug: "005-nobodyls-cn-caddy-portal-reverse-proxy"
aliases:
  - "/posts/nobodyls-cn-caddy-portal-reverse-proxy/"
tags: ["Caddy", "DNS", "Reverse Proxy", "GitHub Pages", "Server", "DevOps", "经验压缩", "知识管理"]
categories: ["运维部署"]
---

这篇是一次真实改造的复盘。

目标很简单：我有一个主域名 `nobodyls.cn`，还有几个散落的服务：

- `www.nobodyls.cn`：GitHub Pages 上的博客
- `imageweb.nobodyls.cn`：阿里云服务器上的图片工具
- `elec.nobodyls.cn`：阿里云服务器上的电费监控
- 服务器里还残留了一段 `nobodyls.cn -> cpolar` 的旧 Caddy 配置，但上游已经 `404`

我想把它们收拢成：

```text
nobodyls.cn/       门户
nobodyls.cn/blog/  博客
nobodyls.cn/image/ 图片工具
nobodyls.cn/elec/  电费监控
```

这篇文章不只记录怎么做，也借这个过程把几个容易混在一起的概念拆清楚：**DNS、服务器、反向代理、路径路由、GitHub Pages 自定义域名**。

---

## 先给结论

这次改造的核心不是“把所有服务合并成一个项目”，而是做了一层新的入口：

> `nobodyls.cn` 作为统一入口，Caddy 根据请求路径把流量转发到不同服务。

![改造前后的整体架构](/images/005-nobodyls-portal/architecture-before-after.svg)

改造后：

- `/` 由阿里云服务器上的 Caddy 直接托管一个静态门户页
- `/blog/` 反代到原来的 `https://www.nobodyls.cn`
- `/image/` 反代到服务器本机的 `localhost:8092`
- `/elec/` 复用服务器上的 `/var/www/elecmon` 静态站点和 `127.0.0.1:8089` API
- 原来的 `imageweb.nobodyls.cn` 和 `elec.nobodyls.cn` 继续保留

这样做有一个重要好处：**每个服务还是独立的，只是入口统一了**。

---

## 改造前到底发生了什么

检查时发现，公网和服务器内部是两套状态。

公网 DNS 里：

```text
nobodyls.cn      -> GitHub Pages 的 185.199.*.153
www.nobodyls.cn  -> ls-plan.github.io
imageweb         -> 8.155.163.203
elec             -> 8.155.163.203
```

服务器 Caddy 里有一段形如下面这样的旧配置：

```caddy
nobodyls.cn {
    reverse_proxy https://<old-cpolar-domain> {
        header_up Host <old-cpolar-domain>
    }
}
```

这段配置已经没有实际价值，原因有两个：

1. `nobodyls.cn` 的公网 DNS 没有指向这台阿里云服务器，所以用户访问根域名根本到不了这段 Caddy 配置。
2. 即使强行让请求到服务器，这段配置的上游 `cpolar` 也已经返回 `404`。

这就是一个典型的“服务器里有配置，但公网流量没有走这里”的问题。

---

## DNS、服务器、Caddy 分别负责什么

这三个概念很容易混：

| 层级 | 它回答的问题 | 在这次改造中的作用 |
|------|--------------|--------------------|
| DNS | 这个域名应该去哪个 IP | 把 `nobodyls.cn` 指到阿里云服务器 |
| 服务器 | 这个 IP 上有哪些进程在监听 | 运行 Caddy、Docker、Python API |
| Caddy | 这个 HTTP 请求应该交给谁处理 | 根据 `/blog/`、`/image/`、`/elec/` 分发 |

可以这样理解：

1. DNS 只负责“找到楼”
2. 服务器是“这栋楼”
3. Caddy 是“一楼前台”
4. 具体服务是“楼里的不同房间”

所以，如果 DNS 还指向 GitHub Pages，那么你在阿里云服务器上怎么改 Caddy 都不会影响 `nobodyls.cn` 的公网访问。

---

## 一次请求是怎么走的

以访问 `https://nobodyls.cn/image/` 为例：

![一次请求的流转过程](/images/005-nobodyls-portal/request-routing.svg)

完整链路是：

1. 浏览器问 DNS：`nobodyls.cn` 是哪个 IP？
2. DNS 返回：`8.155.163.203`
3. 浏览器和 `8.155.163.203:443` 建立 HTTPS 连接
4. Caddy 收到请求，看到：
   - `Host: nobodyls.cn`
   - `Path: /image/`
5. Caddy 命中 `/image/*` 路由
6. Caddy 把请求转发给本机 `localhost:8092`
7. `image-web` 返回页面
8. Caddy 把响应交还给浏览器

这里最关键的一点是：**浏览器不知道后面真实服务在哪里，它只认识 `nobodyls.cn`**。

这就是反向代理的意义。

---

## 正向代理和反向代理的区别

如果你只记一句话：

> 正向代理代理客户端，反向代理代理服务器。

正向代理常见于：

- 客户端想访问外网
- 客户端显式配置代理
- 目标网站看到的是代理服务器

反向代理常见于：

- 用户访问统一域名
- 入口服务器把请求转给内部服务
- 用户不知道内部服务真实地址

这次用的是反向代理。

用户访问：

```text
https://nobodyls.cn/image/
```

真实服务可能是：

```text
http://localhost:8092/
```

用户不需要知道，也不应该直接依赖内部地址。

---

## 最终 Caddy 配置

最终配置长这样：

```caddy
nobodyls.cn {
    root * /var/www/nobodyls-portal

    @blogRoot path /blog
    redir @blogRoot /blog/ 308

    handle_path /blog/* {
        reverse_proxy https://www.nobodyls.cn {
            header_up Host www.nobodyls.cn
        }
    }

    @blogAssets path /assets/* /posts/* /search/* /tags/* /categories/* /archives/* /index.xml /favicon.ico /favicon-16x16.png /favicon-32x32.png /apple-touch-icon.png /safari-pinned-tab.svg
    handle @blogAssets {
        reverse_proxy https://www.nobodyls.cn {
            header_up Host www.nobodyls.cn
        }
    }

    @imageRoot path /image
    redir @imageRoot /image/ 308

    handle_path /image/* {
        reverse_proxy localhost:8092
    }

    @elecRoot path /elec
    redir @elecRoot /elec/ 308

    handle_path /elec/api/* {
        reverse_proxy localhost:8089
    }

    handle_path /elec/* {
        root * /var/www/elecmon
        @elecNoCache path /data/history.json /data/analysis.json
        header @elecNoCache Cache-Control "no-cache, no-store, must-revalidate"
        file_server
    }

    @elecLegacyApi path /api/collect /api/save-analysis
    reverse_proxy @elecLegacyApi localhost:8089

    file_server
}
```

后面还保留了两个子域名：

```caddy
imageweb.nobodyls.cn {
    reverse_proxy localhost:8092
}

elec.nobodyls.cn {
    root * /var/www/elecmon

    @api path /api/*
    handle @api {
        reverse_proxy localhost:8089
    }

    @noCache path /data/history.json /data/analysis.json
    header @noCache Cache-Control "no-cache, no-store, must-revalidate"

    file_server
}
```

---

## 这份配置怎么读

![路径路由表](/images/005-nobodyls-portal/path-routing-table.svg)

### `root * /var/www/nobodyls-portal`

这是门户页目录。

当请求没有被前面的 `/blog/`、`/image/`、`/elec/` 命中时，最后的：

```caddy
file_server
```

会从 `/var/www/nobodyls-portal` 里找文件。

也就是说：

```text
nobodyls.cn/
```

会返回：

```text
/var/www/nobodyls-portal/index.html
```

### `handle_path /image/*`

`handle_path` 的特点是：**匹配路径后，会把这段前缀剥掉再交给上游**。

例如浏览器请求：

```text
/image/api/models
```

Caddy 转给 `localhost:8092` 时，上游看到的是：

```text
/api/models
```

这对 `image-web` 很重要，因为它本来就是按根路径部署的。如果不用 `handle_path`，上游可能会收到 `/image/api/models`，然后找不到对应接口。

### `/blog/` 为什么比较麻烦

博客是 Hugo + GitHub Pages。

它当前构建时的 `baseURL` 是：

```toml
baseURL = 'https://www.nobodyls.cn/'
```

所以 HTML 里会出现类似：

```html
<link href="/assets/css/stylesheet.xxx.css" rel="stylesheet">
```

这个 `/assets/...` 是根路径，不是 `/blog/assets/...`。

因此只代理 `/blog/*` 还不够，还需要把博客常用的资源路径一起透传：

```caddy
@blogAssets path /assets/* /posts/* /search/* /tags/* /categories/* /archives/* /index.xml /favicon.ico
```

这是一种兼容做法。

更彻底的做法是：以后把博客构建的 `baseURL` 改成 `https://nobodyls.cn/blog/`，并确保 Hugo 主题、RSS、canonical、搜索索引都按子路径生成。那样 `/blog/` 会更干净，但迁移成本也更高。

### `/elec/` 为什么额外保留了 `/api/collect`

`elec` 的前端里有一部分请求是相对路径：

```js
fetch("./data/history.json")
```

这种很适合放到 `/elec/` 下。

但也有请求写成了根路径：

```js
fetch("/api/collect")
fetch("/api/save-analysis")
```

如果页面在 `nobodyls.cn/elec/` 打开，这两个请求仍然会打到：

```text
nobodyls.cn/api/collect
nobodyls.cn/api/save-analysis
```

所以 Caddy 里额外做了一层兼容：

```caddy
@elecLegacyApi path /api/collect /api/save-analysis
reverse_proxy @elecLegacyApi localhost:8089
```

这不是最优雅的长期设计，但符合 KISS：先不改应用代码，用入口层兼容现状。

---

## 实际操作顺序

这次改造遵循一个原则：**线上入口配置必须先验证，再替换**。

### 1. 备份原配置

```bash
cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak-20260424-050534
```

### 2. 写入门户页

门户页放在：

```text
/var/www/nobodyls-portal/index.html
```

### 3. 先验证 Caddyfile

```bash
caddy validate --config /tmp/nobodyls.Caddyfile
```

只有返回：

```text
Valid configuration
```

才继续。

### 4. 替换配置并重载

```bash
install -m 0644 /tmp/nobodyls.Caddyfile /etc/caddy/Caddyfile
caddy reload --config /etc/caddy/Caddyfile
```

这里用 `reload`，不是粗暴重启。它会通过 Caddy 的管理接口加载新配置，成功后再切换。

### 5. 不等 DNS，先模拟访问

因为根域名 DNS 还没切到阿里云，所以可以用 `curl --resolve` 模拟：

```bash
curl --resolve nobodyls.cn:443:8.155.163.203 -I https://nobodyls.cn/
```

这个命令的意思是：

> 这次请求不要问公共 DNS，直接把 `nobodyls.cn` 当成 `8.155.163.203` 访问。

验证项：

```text
https://nobodyls.cn/                     200
https://nobodyls.cn/blog/                200
https://nobodyls.cn/image/               200
https://nobodyls.cn/elec/                200
https://nobodyls.cn/elec/data/history.json 200
```

---

## 为什么现在公网访问根域名还没变

因为 DNS 还没切。

服务器已经准备好了，但公网默认访问：

```text
https://nobodyls.cn/
```

仍然走 GitHub Pages。

要让门户正式生效，需要把根域名 `nobodyls.cn` 的 A 记录改到：

```text
8.155.163.203
```

同时可以保留：

```text
www.nobodyls.cn CNAME ls-plan.github.io
```

这样：

- `nobodyls.cn` 成为统一门户
- `www.nobodyls.cn` 继续作为原博客入口
- `/blog/` 作为门户下的博客镜像入口

---

## 这次学到的判断方法

以后遇到“我有很多子域名和服务，想统一起来”时，可以按这个顺序判断。

### 先问 DNS

这个域名现在指向哪里？

```bash
dig nobodyls.cn
dig imageweb.nobodyls.cn
dig elec.nobodyls.cn
```

如果域名没指向你的服务器，服务器配置就不会生效。

### 再问入口层

服务器上谁在监听 `80/443`？

```bash
ss -lntp
```

如果是 Caddy，就看：

```bash
/etc/caddy/Caddyfile
```

如果是 Nginx，就看：

```bash
/etc/nginx/sites-enabled/
```

### 再问服务层

服务到底跑在哪里？

```bash
docker ps
systemctl list-units --type=service
ss -lntp
```

这次就是：

```text
Caddy         :80/:443
image-web     localhost:8092
ElecMon API   127.0.0.1:8089
ElecMon 静态页 /var/www/elecmon
GitHub Pages  https://www.nobodyls.cn
```

### 最后问路径兼容

服务能不能挂在子路径，主要看三类路径：

| 类型 | 例子 | 子路径兼容性 |
|------|------|--------------|
| 相对路径 | `./api/`、`./data/history.json` | 通常好 |
| 绝对路径 | `/api/collect`、`/assets/app.css` | 需要额外路由或改代码 |
| 写死完整域名 | `https://www.nobodyls.cn/posts/` | 能用，但不够统一 |

这也是为什么 `/image/` 很顺利，而 `/blog/` 和 `/elec/` 都需要一点兼容路由。

---

## 顺手发现的安全问题

这次排查还发现两个和门户无关、但值得处理的问题。

### 1. FileCodeBox 直接暴露在公网端口

服务器上有一个 `filecodebox` 容器：

```text
0.0.0.0:12345 -> 12345
```

也就是说公网可以直接打到这个服务端口：

```text
http://<server-ip>:12345
```

更好的做法是：

- 要么关掉公网端口，只走 Caddy
- 要么挂到 `files.nobodyls.cn`
- 要么至少加认证、访问控制或防火墙规则

### 2. 前端里不应该放默认 API Key

`elec` 页面里曾经看到默认 API Key 写在前端脚本里。

前端代码是公开给浏览器的，任何人都能看到。长期应该改成：

- 前端只请求自己的后端
- 后端持有 API Key
- 后端再去请求模型服务

这是一个很典型的边界：**能进浏览器的东西，都不能当秘密**。

---

## “把过程写成博客”到底是什么思维

这件事本身也很有意思。

把一次操作过程整理成博客，不只是记录流水账，它更像是在做一次“经验压缩”。

一次真实问题通常是混乱的：

- 先看到现象
- 中间查了很多命令
- 有些判断错了
- 有些配置看起来相关，其实没生效
- 最后才找到真正的边界

如果只是把命令贴出来，下次很难复用。真正有价值的是把它压缩成结构：

```text
现象 -> 分层 -> 判断依据 -> 操作 -> 验证 -> 可复用规则
```

这背后是一种工程师非常重要的思维：**把一次性经验变成可迁移模型**。

比如这次不是只学会了“怎么写 Caddyfile”，而是学会了：

- 先分清 DNS 和服务器配置是不是同一层
- 先确认流量有没有走到这台机器
- 再确认入口层是谁
- 再确认服务跑在哪
- 最后确认路径兼容性

这就从“我修好了一个网站”变成了“我理解了一类部署问题”。

我觉得这种写博客的方式，本质上是在给未来的自己写调试手册。它不是炫技，而是把今天的上下文、误区、判断路径和最终模型保存下来。过几个月再遇到类似问题时，你不需要重新把脑子烧一遍。

> 延伸阅读：这篇之后，我又专门写了一篇关于“经验压缩”和 AI 长期记忆的分析：[[007] 从单次感知到经验压缩：AI 工具如何把一次会话变成可复用记忆](/posts/007-one-shot-perception-experience-compression-ai-memory/)。

---

## 参考

- [Caddy reverse_proxy 官方文档](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
- [Caddy handle_path 官方文档](https://caddyserver.com/docs/caddyfile/directives/handle_path)
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [GitHub Pages 自定义域名说明](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
