---
last_updated: 2026-07-10
updated_by: superpowers-memory:ingest
covers_branch: master@95e3818
triggered_by_plan: 2026-07-02-player-profile-plan.md
---

# 项目知识库索引

## 文件摘要

- [architecture.md](architecture.md) — Hono SSR 单体，4 组路由 + 公告 + 玩家档案，JWT 双通道，11 张 D1 表，htmx，cyberpunk UI
- [features.md](features.md) — 封禁查询/玩家档案/统计/公告系统/后台 CRUD/批量处理/观察名单/管理组/登录限流/审计日志/JWT 认证/权限分级
- [tech-stack.md](tech-stack.md) — Hono 4.6 + htmx + Chart.js + marked.js + D1 + bcryptjs + hono/jwt
- [conventions.md](conventions.md) — RESTful API，权限数值比较，writeAuditLog fire-and-forget，公告编辑流程，cyber- CSS 前缀，CSS Token 系统，模态框 z-index 10000
- [glossary.md](glossary.md) — 封禁记录/违规等级/封禁状态/权限组/公告系统/内部通知/JWT 双通道/登录限流/审计日志/联合封禁/Dev Mode

## 状态说明

已部署于 Cloudflare Pages（jdcf-ban-list.pages.dev），D1 ~156 条记录。17 个视图文件，cyberpunk 玻璃态暗色主题。公告系统支持编辑、Markdown、置顶、定时、已读、6 种类型。登录限流、审计日志、玩家档案页已上线。
