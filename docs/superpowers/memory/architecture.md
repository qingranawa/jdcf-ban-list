---
last_updated: 2026-07-10
updated_by: superpowers-memory:ingest
covers_branch: master@95e3818
triggered_by_plan: 2026-07-02-player-profile-plan.md
---

# 项目架构

## 模式概述

Hono SSR 单体应用，Cloudflare Pages Functions 运行。服务端 html 模板渲染，htmx 局部更新。单入口挂载 4 组路由 + 公告路由 + 玩家档案路由。

## 系统上下文

- **玩家（访客）** — 查封禁、看统计、看公告、看玩家档案，无需登录
- **管理员（T1~OWNER）** — 登录后台管理
- **Cloudflare D1** — SQLite 边缘数据库，11 张表
- **Cron Worker** — 定时发布公告（归档改为手动）

## 分层

- **入口**: functions/[[path]].ts — 挂载点 + 全局 CORS + 错误处理 + dev 模式配置
- **路由**: src/routes/ — public / auth / admin / account
- **视图**: src/views/ — 17 个服务端模板（新增 player.ts），两套布局（Layout + AdminLayout），共享 CSS Token
- **中间件**: src/middleware/ — auth.ts（JWT 双通道认证 + 权限守卫 + checkOwnership），rate-limit.ts（登录限流），dev.ts（开发模式绕过认证）
- **工具**: src/helpers/ — escape.ts + format.ts

调用方向：路由层 → 视图层 / 中间件 / DB。视图层不直接访问 DB。

## 数据库表

当前 11 张表（按创建顺序）：
| 表名 | 用途 |
|------|------|
| bans | 封禁记录（核心表，含 co_handlers） |
| admins | 管理员账号 |
| watchlist | 重点观察名单 |
| archives | 归档批次 |
| archive_items | 归档条目 |
| login_attempts | 登录限流记录 |
| audit_log | 操作审计日志 |
| announcements | 公告内容 |
| announcement_reads | 公告已读标记 |
| sessions | JWT 会话（旧表） |
| blacklist | 旧的观察名单（已弃用） |

## 视图文件结构

src/views/styles.ts icons.ts layout.ts admin-layout.ts home.ts stats.ts team.ts announcements.ts login.ts account.ts admin-bans.ts admin-process.ts admin-watchlist.ts admin-announcements.ts admin-team.ts player.ts

## 关键设计决策

- [Hono + htmx] 轻量 SSR
- [权限分级 T1~T6+OWNER] GROUP_RANK 数值越小权限越高
- [封禁状态实时计算] computeStatus() 读时计算
- [JWT 双通道] header + cookie，无 Secure 支持 HTTP 开发
- [公告系统] announcements 表 + announcement_reads 表，Markdown 渲染，支持编辑（PUT /api/admin/announcements/:id）
- [Cyberpunk 玻璃态 UI] backdrop-filter 毛玻璃 + 霓虹色调
- [登录限流] 5 次失败 / 15 分钟 / IP，login_attempts 表
- [审计日志] writeAuditLog fire-and-forget，不阻塞业务操作
- [玩家档案 URL] 使用封禁 ID（/player/:id）而非 steam_id，steam_id 无效时回退到昵称查询
- [Dev Mode] DEV_MODE 环境变量 + dev.ts 中间件，开发环境绕过 JWT 认证
