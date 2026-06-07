---
last_updated: 2026-06-07
updated_by: superpowers-memory:update
triggered_by_plan: 2026-06-05-jdcf-phase2-3-4-implementation.md
---

# 项目架构

## 模式概述

Hono SSR 单体应用，运行于 Cloudflare Pages Functions。服务端 JSX 渲染 HTML，htmx 实现无整页刷新的局部更新（搜索、翻页）。单一入口 `functions/[[path]].ts` 挂载 5 组路由。

## 系统上下文

- **玩家（访客）** — 查询封禁列表、查看管理组公示，无需登录
- **管理员（T1~T6 / OWNER）** — 登录后台管理封禁、观察名单、批量处理、账户
- **Cloudflare D1** — SQLite 边缘数据库（jdcf-db，WNAM 区域）
- **Cron Worker** — 独立部署的定时 Worker（当前改为手动处理模式）

## 分层

- **入口**: `functions/[[path]].ts` — 单一路由挂载点，CORS 中间件
- **路由**: `src/routes/` — 5 组路由（public, auth, admin, adminTeam, account），Hono Router + RESTful JSON API
- **视图**: `src/views/` — TSX 服务端模板，两套布局（公开 `Layout` + 后台 `AdminLayout` 侧边栏）
- **中间件**: `src/middleware/auth.ts` — JWT 认证（双传输：header + cookie）+ 权限等级校验
- **工具**: `src/helpers/escape.ts` — HTML/属性转义，跨路由和视图共用
- **类型**: `src/db.ts` — D1 绑定类型、行类型定义

调用方向：路由层 → 视图层（渲染响应）/ 中间件（拦截校验）/ DB（数据存取）。视图层不直接访问 DB。

## 场景序列

### 登录流程

```mermaid
sequenceDiagram
    participant Browser
    participant Server as functions/[[path]].ts
    participant Auth as authRoutes
    participant DB as D1
    Browser->>Server: GET /login
    Server->>Auth: 渲染登录表单
    Auth-->>Browser: HTML 登录页
    Browser->>Server: POST /api/login (steam_id, username, password)
    Server->>DB: 查询 admins 表
    DB-->>Server: 用户记录
    Server->>Server: bcrypt 校验密码
    Server->>Browser: JWT token (body + httpOnly cookie)
    Browser->>Browser: localStorage 存 JWT，跳转 /admin/bans
```

### htmx 搜索翻页

```mermaid
sequenceDiagram
    participant Browser
    participant Server as publicRoutes
    participant DB as D1
    Browser->>Server: GET /?q=xxx&page=2 (HX-Request header)
    Server->>DB: SELECT bans ... WHERE nickname LIKE ...
    DB-->>Server: 结果集
    Server->>Server: computeStatus() 计算封禁状态
    Server-->>Browser: HTML 片段（仅 BanTable）
    Browser->>Browser: htmx 替换 #banTable 区域
```

### 批量处理过期违规

```mermaid
sequenceDiagram
    participant Admin as 管理员(T1+)
    participant Server as adminRoutes
    participant DB as D1
    Admin->>Server: GET /admin/process
    Server->>DB: SELECT level2/level3 bans WHERE is_archived=0
    DB-->>Server: 未归档记录
    Server->>Server: isBanExpired() 过滤实际过期记录
    Server-->>Admin: 处理页（过期条目列表）
    Admin->>Server: POST /api/admin/process/downgrade (ids)
    Server->>DB: UPDATE level2→level3, is_archived=1
    Server->>DB: INSERT archives + archive_items
    Server-->>Admin: { success: true, processed: N }
```

## 关键对象状态机

### 封禁状态（computeStatus 实时计算）

```mermaid
stateDiagram-v2
    direction LR
    [*] --> warning: ban_duration='warning'
    [*] --> permanent: ban_duration='permanent'
    [*] --> cfba: ban_duration='cfba'
    [*] --> banned: 50y / 未到期(d/h/m)
    [*] --> muted: mute-前缀且未到期
    banned --> unbanned: ban_time + ban_duration < now
    muted --> unbanned: ban_time + ban_duration < now
    unbanned --> banned: archive_action='downgraded'
```

状态不存库，每次读取时由 `computeStatus()` 根据 `ban_duration`、`ban_time`、`archive_action` 实时算出。

### 归档处理动作

```mermaid
stateDiagram-v2
    direction LR
    [*] --> level3_expired: 3级过期
    [*] --> level2_expired: 2级过期
    level3_expired --> deleted: 批量删除 → archives + archive_items
    level2_expired --> downgraded: 批量降级为3级 + 归档
```

## 关键设计决策

- **[Hono + htmx 选型]** — 见 `docs/superpowers/specs/2026-06-05-jdcf-ban-list-design.md`
- **[权限分级 T1~T6 + OWNER]** — GROUP_RANK 数值越小权限越高（OWNER=0, T1=6）
- **[封禁状态实时计算]** — computeStatus() 读时计算，不持久化
- **[JWT 双通道传输]** — Authorization header（API 调用）+ httpOnly cookie（页面导航）
- **[Turnstile 移除]** — CDN 在国内被屏蔽，改为纯 fetch 表单提交
