---
last_updated: 2026-06-05
updated_by: superpowers-memory:rebuild
triggered_by_plan: null
---

# 项目架构

> 项目尚未实现。以下为设计阶段的架构规划。

## 模式概述

SCP:SL "CN 鸡蛋肠粉服务器"封禁管理系统 — 面向玩家的封禁查询网站，兼顾管理员公示信息展示。

## 系统上下文

- **玩家（访客）** — 查询封禁列表、查看管理组公示
- **管理员（T1~T6 / OWNER）** — 登录后台管理封禁记录
- **Cron Worker** — 每月1日触发归档处理
- **外部系统** — Cloudflare D1（数据库）、Cloudflare Turnstile（人机验证）

## 分层

- **表现层** — Hono SSR（服务端渲染 HTML）+ htmx 增强交互，`functions/api/`
- **API 层** — Hono Router RESTful API，JWT 中间件认证，`functions/api/`
- **数据层** — Cloudflare D1 (SQLite)，含 `bans`、`admins`、`blacklist`、`archives` 等表

## 关键设计决策

- **[Hono + htmx 选型]** — 见设计文档 `docs/superpowers/specs/2026-06-05-jdcf-ban-list-design.md`
- **[权限分级 T1~T6 + OWNER]** — 同上
- **[封禁状态实时计算]** — `status` 在读取时由代码计算，不持久化
