---
last_updated: 2026-07-02
updated_by: superpowers-memory:update
covers_branch: master@5d8e1ee
triggered_by_plan: 2026-07-02-announcements-plan.md
---

# 项目架构

## 模式概述

Hono SSR 单体应用，Cloudflare Pages Functions 运行。服务端 html 模板渲染，htmx 局部更新。单入口挂载 4 组路由 + 公告路由。

## 系统上下文

- **玩家（访客）** — 查封禁、看统计、看公告，无需登录
- **管理员（T1~OWNER）** — 登录后台管理
- **Cloudflare D1** — SQLite 边缘数据库
- **Cron Worker** — 定时发布公告（归档改为手动）

## 分层

- **入口**: functions/[[path]].ts — 挂载点 + 全局 CORS + 错误处理
- **路由**: src/routes/ — public / auth / admin / account
- **视图**: src/views/ — 16 个服务端模板，两套布局（Layout + AdminLayout），共享 CSS Token
- **中间件**: src/middleware/auth.ts — JWT 双通道认证 + 权限守卫
- **工具**: src/helpers/ — escape.ts + format.ts

调用方向：路由层 → 视图层 / 中间件 / DB。视图层不直接访问 DB。

## 视图文件结构

src/views/styles.ts icons.ts layout.ts admin-layout.ts home.ts stats.ts team.ts announcements.ts login.ts account.ts admin-bans.ts admin-process.ts admin-watchlist.ts admin-announcements.ts admin-team.ts player.ts

## 关键设计决策

- [Hono + htmx] 轻量 SSR
- [权限分级 T1~T6+OWNER] GROUP_RANK 数值越小权限越高
- [封禁状态实时计算] computeStatus() 读时计算
- [JWT 双通道] header + cookie，无 Secure 支持 HTTP 开发
- [公告系统] announcements 表 + announcement_reads 表，Markdown 渲染
- [Cyberpunk 玻璃态 UI] backdrop-filter 毛玻璃 + 霓虹色调
