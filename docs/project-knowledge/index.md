---
last_updated: 2026-06-07
updated_by: superpowers-memory:update
covers_branch: master@eec24dd
triggered_by_plan: 2026-06-05-jdcf-phase2-3-4-implementation.md
---

# 项目知识库索引

## 文件摘要

- [architecture.md](architecture.md) — Hono SSR 单体架构，5 组路由，JWT 双通道，htmx 局部更新，状态机
- [features.md](features.md) — 封禁查询/公示/后台 CRUD/批量处理/观察名单/管理组/账户/归档日志 均已实现
- [tech-stack.md](tech-stack.md) — Hono 4.6 + htmx 2.0.4 + D1 + bcryptjs + hono/jwt，已放弃 Turnstile
- [conventions.md](conventions.md) — RESTful API，权限数值比较，双布局，dark 主题，cross-cutting concerns
- [glossary.md](glossary.md) — 8 个术语：封禁记录、违规等级、状态、duration 格式、权限组、观察名单、归档、JWT 双通道

## 状态说明

项目已完整实现并部署于 Cloudflare Pages（https://jdcf-ban-list.pages.dev），D1 数据库约 156 条记录。Cron Worker 自动归档改为手动处理页。
