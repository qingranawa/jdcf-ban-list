---
last_updated: 2026-07-02
updated_by: superpowers-memory:update
covers_branch: master@5d8e1ee
triggered_by_plan: 2026-07-02-announcements-plan.md
---

# 功能特性

## Implemented

### Product Capabilities

#### 封禁查询（公开首页）

**Enables** — 搜索/筛选封禁记录，按昵称/SteamID/IP/原因/备注搜索，按违规等级/封禁状态过滤，htmx 分页。

**Actors / Entry Points** — 所有访客 → /（HX-Request 返回片段）

**Capability Boundary** — computeStatus 实时计算，不存库。已归档不显示。

**References** — src/routes/public.ts, src/views/home.ts

#### 统计信息页

**Enables** — 违规等级占比（饼图）、操作员排行（柱状图 top5）、30 天趋势（折线图）、时长分类（柱状图）。

**Actors / Entry Points** — 所有访客 → /stats

**Capability Boundary** — Chart.js v4 CDN + 自定义 afterDraw 百分比插件。

**References** — src/routes/public.ts, src/views/stats.ts

#### 管理组公示

**Enables** — 公开查看管理团队信息。

**Actors / Entry Points** — 所有访客 → /team

**Capability Boundary** — 仅显示 is_active=1。

**References** — src/routes/public.ts, src/views/team.ts

#### 公告系统

**Enables** — T4+ 发布公告（标题/副标题/正文Markdown/引用/类型），支持置顶、定时发布、已读标记。公开列表类型筛选+分页。6 种类型：服务器/处罚/活动/紧急/更新日志/内部。

**Actors / Entry Points** — 访客 → /announcements；T4+ → /admin/announcements

**Capability Boundary** — 内部通知对非管理员隐藏。Markdown 用 marked.js CDN 渲染。

**References** — src/routes/public.ts, src/routes/admin.ts, src/views/announcements.ts, src/views/admin-announcements.ts

#### 管理后台 — 封禁 CRUD

**Enables** — 增删改封禁，自定义等级/时长/备注/联合封禁。T5+ 可改他人记录。

**Actors / Entry Points** — T1+ → /admin/bans

**Capability Boundary** — 软删除（is_archived=1）。导航栏快捷添加弹窗。

**References** — src/routes/admin.ts, src/views/admin-bans.ts

#### 管理后台 — 批量处理过期违规

**Enables** — T1+ 批量删除 3 级或降级 2 级过期违规。

**Actors / Entry Points** — T1+ → /admin/process

**Capability Boundary** — 操作进归档表。

**References** — src/routes/admin.ts

#### 管理后台 — 重点观察名单

**Enables** — T3+ 增删改查观察玩家。

**Capability Boundary** — Steam ID 唯一约束。

**References** — src/routes/admin.ts, src/views/admin-watchlist.ts

#### 管理后台 — 管理组管理

**Enables** — T5+ 增删改管理员账号，设置权限组。

**Capability Boundary** — 不能删除自己。

**References** — src/routes/admin.ts, src/views/admin-team.ts

#### 管理后台 — 归档日志

**Enables** — T4+ 查看归档操作记录。

**Capability Boundary** — 只读。

**References** — src/routes/admin.ts

### Platform Capabilities

#### JWT 认证系统

**Enables** — SteamID + 用户名 + 密码登录，7 天 token，双通道（header + cookie，无 Secure）。

**Actors / Entry Points** — /login, POST /api/login

**Capability Boundary** — bcryptjs。退出同时清除 localStorage + cookie。登录页 JWT 自检跳转。

**References** — src/middleware/auth.ts, src/routes/auth.ts

#### 权限分级中间件

**Enables** — GROUP_RANK 数值比较（0=OWNER→6=T1），requirePermission 控制路由。

**Capability Boundary** — 越小越高。HTML 重定向 /login，API 返回 403。

**References** — src/middleware/auth.ts

## Planned

### 月度自动归档（Cron Worker）

**Intent** — Cron 每月 1 日自动处理过期封禁。
**Source** — design spec
