---
last_updated: 2026-06-29
updated_by: opencode
covers_branch: master
---

# 功能特性

## Implemented

### Product Capabilities

#### 封禁查询（公开首页）

**Enables** — 玩家搜索/筛选所有封禁记录，按昵称/SteamID/IP 搜索，按违规等级/封禁状态过滤，分页浏览，查看统计卡片，支持"警告/禁言/封禁"快速过滤标签。

**Actors / Entry Points** — 所有访客 → `/`（htmx 局部更新通过 HX-Request header 返回片段）

**Capability Boundary** — 状态实时计算（computeStatus），不存库。分页支持每页 10/25/50/100 条。已归档+deleted 的记录不显示。

**References** — architecture.md §封禁状态机，src/routes/public.ts，src/views/home.ts

#### 统计信息页

**Enables** — 查看封禁数据的可视化统计：违规等级占比（饼图/环形图）、操作员处理排行（水平柱状图 top 5）、30 天封禁趋势（折线图）、封禁时长分类统计（柱状图）。

**Actors / Entry Points** — 所有访客 → `/stats`

**Capability Boundary** — Chart.js v4 CDN 渲染，含自定义 `afterDraw` 百分比标签插件。数据来源于 `/stats` 路由的三个独立 SQL 查询。

**References** — src/routes/public.ts，src/views/stats.ts

#### 管理组公示

**Enables** — 公开查看管理团队信息（游戏名、QQ、任职、主管），卡片网格 2 列 4:3 比例展示。

**Actors / Entry Points** — 所有访客 → `/team`

**Capability Boundary** — 仅显示 is_active=1 的管理员。

**References** — src/routes/public.ts，src/views/team.ts

#### 管理后台 — 封禁 CRUD

**Enables** — 管理员增删改封禁记录，含自定义违规等级、自定义时长、备注、联合封禁管理员。仅 T1+ 可访问，仅 OWNER/T6/T5 可改他人记录。导航栏支持快捷添加弹窗。

**Actors / Entry Points** — T1~OWNER → `/admin/bans`，POST/PUT/DELETE `/api/admin/bans`

**Capability Boundary** — 修改他人记录需 `GROUP_RANK ≤ 2`（即 T5+）。删除直接物理删，不走归档。ban_duration 格式经过 regex 校验。

**References** — src/routes/admin.ts，src/views/admin-bans.ts，src/views/layout.ts（全局弹窗）

#### 管理后台 — 批量处理过期违规

**Enables** — T1+ 管理员查看已过期的 2/3 级违规，可批量删除（3 级）或降级为 3 级（2 级），操作结果写入归档表。

**Actors / Entry Points** — T1+ → `/admin/process`，POST `/api/admin/process/delete|downgrade`

**Capability Boundary** — 仅处理 `is_archived=0` 且 `ban_time + ban_duration < now` 的记录。处理后标记 `is_archived=1`。

**References** — architecture.md §归档处理状态机，src/routes/admin.ts

#### 管理后台 — 重点观察名单

**Enables** — T3+ 管理员手动维护重点观察玩家列表（SteamID、昵称、原因、备注），增删改查。

**Actors / Entry Points** — T3+ → `/admin/watchlist`，REST API `/api/admin/watchlist`

**Capability Boundary** — Steam ID 唯一约束。手动维护，非自动聚合。

**References** — src/routes/admin.ts，src/views/admin-watchlist.ts

#### 管理后台 — 管理组管理

**Enables** — T5+ 管理员创建/编辑/删除管理员账户，设置权限组、游戏名、QQ 等。

**Actors / Entry Points** — T5+ → `/admin/team`，CRUD `/api/admin/profiles`

**Capability Boundary** — 不能删除自己。OWNER 权限最高。新增管理员必须提供密码（不再有默认密码）。

**References** — src/routes/admin.ts，src/views/admin-team.ts

#### 管理后台 — 归档日志

**Enables** — T4+ 查看历史归档摘要（日期、处理总数、各级别处理数）。

**Actors / Entry Points** — T4+ → `/admin/archive`

**Capability Boundary** — 只读。归档明细存储在 archive_items 表。

**References** — src/routes/admin.ts，schema.sql

### User / Operator Workflows

#### 账户自助管理

**Enables** — 登录用户查看自己信息、修改游戏名/QQ名/密码。

**Actors / Entry Points** — 已登录用户 → `/account`（客户端 JS 验证 JWT），API `/api/account`

**Capability Boundary** — 不能修改权限组（需 T5+ 通过管理组管理操作）。JWT 存在 localStorage。

**References** — src/routes/account.ts，src/views/account.ts

### Platform Capabilities

#### JWT 认证系统

**Enables** — Steam ID + 用户名 + 密码登录，颁发 7 天 JWT token，支持双通道传输（Authorization header + httpOnly cookie，无 Secure 标志）。

**Actors / Entry Points** — 管理员 → `/login`，POST `/api/login`

**Capability Boundary** — bcryptjs 哈希。Cookie 自动携带，避免页面导航 401。Set-Cookie 无 `Secure` 标志以支持本地 HTTP 开发。

**References** — architecture.md §登录流程，src/middleware/auth.ts，src/routes/auth.ts

#### 权限分级中间件

**Enables** — GROUP_RANK 数值比较（0=OWNER → 6=T1），requirePermission(minGroup) 控制路由访问。

**Actors / Entry Points** — 路由中间件链 → `authMiddleware` + `requirePermission('Tx')`

**Capability Boundary** — 数值越小权限越高。API 返回 403 JSON，HTML 页面重定向 /login。

**References** — src/middleware/auth.ts

## Planned

### 月度自动归档（Cron Worker）

**Intent** — Cron Trigger 每月 1 日自动处理过期封禁。
**Source** — design spec，当前以手动处理页面代替
