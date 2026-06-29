---
last_updated: 2026-06-29
updated_by: opencode
covers_branch: master
---

# 项目知识库索引

## 文件摘要

- [architecture.md](architecture.md) — Hono SSR 单体架构，4 组路由，JWT 双通道，htmx 局部更新，封禁状态实时计算，cyberpunk 玻璃态 UI 视图结构，统计信息页
- [features.md](features.md) — 封禁查询/统计图表/公示/后台 CRUD/批量处理/观察名单/管理组/账户/归档日志 均已实现
- [tech-stack.md](tech-stack.md) — Hono 4.6 + htmx 2.0.4 + Chart.js v4 + D1 + bcryptjs + hono/jwt，已放弃 Turnstile 和 Cron Worker
- [conventions.md](conventions.md) — RESTful API，权限数值比较，cyberpunk 玻璃态主题，`cyber-` 前缀 CSS 类名，CSS Token 系统
- [glossary.md](glossary.md) — 封禁记录、违规等级、状态、duration 格式、权限组、观察名单、归档、JWT 双通道、统计图表、背景图预加载

## 状态说明

项目已完整实现并部署于 Cloudflare Pages（https://jdcf-ban-list.pages.dev），D1 数据库约 156 条记录。UI 为 cyberpunk 玻璃态暗色主题，14 个视图文件统一使用 CSS Token 系统。
