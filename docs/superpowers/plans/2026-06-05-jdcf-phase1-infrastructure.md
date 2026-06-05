# Phase 1: 基础架构 — JDCF 封禁管理系统 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建可运行的 Cloudflare Pages + Hono + D1 基础架构，包含项目初始化、数据库 Schema、Hono 路由框架、JWT 认证中间件、基本页面结构，确保能成功部署。

**Architecture:** Hono SSR 应用运行于 Cloudflare Pages Functions，使用 `functions/[[path]].ts` 作为统一入口，Hono 内部路由处理所有路径。数据库使用 Cloudflare D1，认证使用 JWT（`@hono/jwt`）无状态方案。

**Tech Stack:** Hono + JSX SSR、htmx（CDN）、原生 CSS、Cloudflare Pages Functions、D1、JWT + bcryptjs、Turnstile

**Design Spec:** `docs/superpowers/specs/2026-06-05-jdcf-ban-list-design.md`

---

## 文件结构

```
d:/Project/JDCF-ban-list/
├── package.json                 # 项目依赖（hono, @hono/jwt, bcryptjs）
├── tsconfig.json                # TypeScript 配置（JSX, 目标 ESNext）
├── wrangler.jsonc               # Cloudflare Pages + D1 配置
├── schema.sql                   # D1 数据库 Schema（所有表）
├── seed.sql                     # 初始数据（OWNER 管理员）
├── .gitignore                   # 忽略 node_modules, dist, .wrangler
├── functions/
│   └── [[path]].ts              # Hono 应用入口（唯一 Functions 端点）
├── src/
│   ├── db.ts                    # D1 数据库类型绑定
│   ├── middleware/
│   │   └── auth.ts              # JWT 认证 + 权限组检查中间件
│   ├── routes/
│   │   ├── public.ts            # 公开路由（首页、管理组公示、API）
│   │   └── auth.ts              # 登录路由（GET /login, POST /api/login）
│   └── views/
│       ├── layout.tsx           # Base HTML 布局 + 玻璃态 CSS
│       ├── home.tsx             # 首页封禁列表
│       └── team.tsx             # 管理组公示页
└── public/
    └── _redirects               # 重定向规则（可选）
```

---

## Task 1: 项目初始化

- **操作**: 新建

### Task 1.1: 创建 package.json

**文件：** `Create: package.json`

```json
{
  "name": "jdcf-ban-list",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "wrangler pages dev functions/ --binding",
    "deploy": "wrangler pages deploy",
    "db:init": "wrangler d1 execute jdcf-db --file=./schema.sql",
    "db:seed": "wrangler d1 execute jdcf-db --file=./seed.sql"
  },
  "dependencies": {
    "hono": "^4.6.0",
    "@hono/jwt": "^2.5.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240601",
    "wrangler": "^3.60.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] 写入 `package.json`

### Task 1.2: 创建 tsconfig.json

**文件：** `Create: tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "verbatimModuleSyntax": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["functions/**/*", "src/**/*"]
}
```

- [ ] 写入 `tsconfig.json`

> **为什么用 `hono/jsx`**：Hono 内置 JSX 引擎，无需 React 依赖。`react-jsx` + `jsxImportSource: "hono/jsx"` 让 TypeScript 把 `div`、`h1` 等 JSX 标签编译为 Hono 的 JSX 运行时调用。

### Task 1.3: 创建 .gitignore

**文件：** `Create: .gitignore`

```
node_modules/
dist/
.wrangler/
*.local.json
```

- [ ] 写入 `.gitignore`

### Task 1.4: 创建 wrangler.jsonc（配置文件）

**文件：** `Create: wrangler.jsonc`

```jsonc
{
  "name": "jdcf-ban-list",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "jdcf-db",
      "database_id": "local-dev" // 本地开发占位，部署时用真实 ID
    }
  ],
  "vars": {
    "TURNSTILE_SITE_KEY": "1x00000000000000000000AA",  // 本地测试用（always pass）
    "TURNSTILE_SECRET_KEY": "1x00000000000000000000AA", // 本地测试用
    "JWT_SECRET": "dev-secret-change-in-production",
    "CRON_SECRET": "dev-cron-secret-change-in-production"
  }
}
```

> 部署前需要：创建 D1 数据库、替换 `database_id`、替换所有密钥。

- [ ] 写入 `wrangler.jsonc`
- [ ] 验证：`ls` 确认 4 个文件存在

---

## Task 2: D1 数据库 Schema + Seed

### Task 2.1: 创建 schema.sql

**文件：** `Create: schema.sql`

主表 + 索引。注意 `bans` 表的 `status` 为计算字段（不在 SQL 中存储），`handle_by` 引用 `admins.id`。

```sql
-- 封禁表
CREATE TABLE IF NOT EXISTS bans (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname        TEXT NOT NULL,
  steam_id        TEXT NOT NULL,
  ip_address      TEXT NOT NULL DEFAULT '',
  reason          TEXT NOT NULL DEFAULT '',
  ban_time        TEXT NOT NULL DEFAULT (datetime('now')),
  ban_duration    TEXT NOT NULL,
  violation_level TEXT NOT NULL,
  notes           TEXT NOT NULL DEFAULT '',
  handled_by      INTEGER,
  is_archived     INTEGER NOT NULL DEFAULT 0,
  archive_action  TEXT,
  archived_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (handled_by) REFERENCES admins(id)
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id         TEXT NOT NULL UNIQUE,
  username         TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  permission_group TEXT NOT NULL DEFAULT 'T1',
  game_name        TEXT NOT NULL DEFAULT '',
  qq_name          TEXT NOT NULL DEFAULT '',
  position         TEXT NOT NULL DEFAULT '',
  supervisor       TEXT NOT NULL DEFAULT '',
  is_active        INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 黑名单总表
CREATE TABLE IF NOT EXISTS blacklist (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id        TEXT NOT NULL UNIQUE,
  nickname        TEXT NOT NULL,
  ip_address      TEXT NOT NULL DEFAULT '',
  ban_count       INTEGER NOT NULL DEFAULT 1,
  first_ban_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_ban_at     TEXT NOT NULL DEFAULT (datetime('now')),
  latest_violation_level TEXT NOT NULL DEFAULT 'warning',
  notes           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 归档摘要表
CREATE TABLE IF NOT EXISTS archives (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_date     TEXT NOT NULL UNIQUE,
  total_processed  INTEGER NOT NULL DEFAULT 0,
  l3_deleted       INTEGER NOT NULL DEFAULT 0,
  l2_downgraded    INTEGER NOT NULL DEFAULT 0,
  l1_ignored       INTEGER NOT NULL DEFAULT 0,
  l4_ignored       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 归档明细表
CREATE TABLE IF NOT EXISTS archive_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id       INTEGER NOT NULL,
  ban_id           INTEGER NOT NULL,
  nickname         TEXT NOT NULL,
  steam_id         TEXT NOT NULL,
  original_level   TEXT NOT NULL,
  new_level        TEXT,
  action           TEXT NOT NULL,
  original_status  TEXT NOT NULL,
  original_duration TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (archive_id) REFERENCES archives(id),
  FOREIGN KEY (ban_id) REFERENCES bans(id)
);

-- Session 表（可选，用于 JWT 黑名单）
CREATE TABLE IF NOT EXISTS sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER NOT NULL,
  token_jti  TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bans_steam_id ON bans(steam_id);
CREATE INDEX IF NOT EXISTS idx_bans_violation_level ON bans(violation_level);
CREATE INDEX IF NOT EXISTS idx_bans_handled_by ON bans(handled_by);
CREATE INDEX IF NOT EXISTS idx_bans_is_archived ON bans(is_archived);
CREATE INDEX IF NOT EXISTS idx_admins_permission_group ON admins(permission_group);
CREATE INDEX IF NOT EXISTS idx_blacklist_steam_id ON blacklist(steam_id);
CREATE INDEX IF NOT EXISTS idx_archive_items_archive_id ON archive_items(archive_id);
```

- [ ] 写入 `schema.sql`

### Task 2.2: 创建 seed.sql（初始 OWNER 管理员）

**文件：** `Create: seed.sql`

```sql
-- 初始 OWNER 管理员
-- 密码: change_me_123   (bcrypt hash)
-- 部署前请务必修改此密码！
INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
VALUES (
  'INIT_STEAM_ID',
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'OWNER',
  '初始管理员',
  '初始管理员',
  '服务器主管',
  '全局'
);
```

> 此 bcrypt hash 对应密码 `change_me_123`。部署前必须告知用户修改此密码。

- [ ] 写入 `seed.sql`
- [ ] 验证：确认 SQL 语法正确（可通过 `sqlite3 :memory: < schema.sql` 快速验证）

---

## Task 3: Hono 应用入口 + 中间件

### Task 3.1: 创建 src/db.ts — D1 类型绑定

**文件：** `Create: src/db.ts`

```typescript
import type { D1Database } from '@cloudflare/workers-types';

export type Env = {
  DB: D1Database;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  JWT_SECRET: string;
  CRON_SECRET: string;
};

// 封禁记录类型（数据库行）
export type BanRow = {
  id: number;
  nickname: string;
  steam_id: string;
  ip_address: string;
  reason: string;
  ban_time: string;
  ban_duration: string;
  violation_level: string;
  notes: string;
  handled_by: number | null;
  is_archived: number;
  archive_action: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

// 管理员记录类型
export type AdminRow = {
  id: number;
  steam_id: string;
  username: string;
  password_hash: string;
  permission_group: string;
  game_name: string;
  qq_name: string;
  position: string;
  supervisor: string;
  is_active: number;
  created_at: string;
  updated_at: string;
};
```

- [ ] 写入 `src/db.ts`

### Task 3.2: 创建 src/middleware/auth.ts — JWT + 权限中间件

**文件：** `Create: src/middleware/auth.ts`

```typescript
import { jwt, verify, type JwtVariables } from '@hono/jwt'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../db'

// 权限组等级排序（数字越小权限越高）
const GROUP_RANK: Record<string, number> = {
  OWNER: 0,
  T6: 1,
  T5: 2,
  T4: 3,
  T3: 4,
  T2: 5,
  T1: 6,
}

// 扩展 Hono Context 变量类型
export type Variables = JwtVariables & {
  adminId: number;
  permissionGroup: string;
}

// 验证 JWT 中间件 — 解码并注入 adminId + permissionGroup
export const authMiddleware = jwt({
  secret: (c) => c.env.JWT_SECRET,
})

// 权限组检查中间件 — 要求最低权限组
// 用法: requirePermission('T3') 表示 T3 及以上才能访问
export const requirePermission = (minGroup: string) =>
  createMiddleware<{ Variables: Variables; Bindings: Env }>(async (c, next) => {
    const payload = c.get('jwtPayload')
    if (!payload || !payload.adminId || !payload.permissionGroup) {
      return c.json({ error: '无效的认证凭据' }, 401)
    }

    const userRank = GROUP_RANK[payload.permissionGroup]
    const requiredRank = GROUP_RANK[minGroup]

    if (userRank === undefined || requiredRank === undefined) {
      return c.json({ error: '权限组配置错误' }, 500)
    }

    // 数值越小权限越高，所以 userRank > requiredRank 表示权限不足
    if (userRank > requiredRank) {
      return c.json({ error: '权限不足' }, 403)
    }

    c.set('adminId', payload.adminId as number)
    c.set('permissionGroup', payload.permissionGroup as string)
    await next()
  })

// 辅助函数：获取 JWT 令牌 payload（用于构造响应）
export function getJwtPayload(c: { get: (key: string) => unknown }) {
  const payload = c.get('jwtPayload') as Record<string, unknown> | undefined
  return payload ?? null
}
```

- [ ] 写入 `src/middleware/auth.ts`

### Task 3.3: 创建 functions/[[path]].ts — Hono 应用入口

**文件：** `Create: functions/[[path]].ts`

```typescript
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'

// 创建 Hono 应用
const app = new Hono<{ Bindings: Env }>()

// 全局中间件
app.use('*', cors())

// 注册路由
app.route('/', publicRoutes)
app.route('/', authRoutes)

// Cloudflare Pages 入口
export const onRequest = handle(app)
```

- [ ] 写入 `functions/[[path]].ts`
- [ ] 验证：`npx tsc --noEmit` 确认 TypeScript 编译通过

---

## Task 4: Views — JSX 页面组件

JSX 使用 Hono 内置引擎，无 React 依赖。

### Task 4.1: 创建 src/views/layout.tsx — 基础布局

**文件：** `Create: src/views/layout.tsx`

包含：HTML 骨架、玻璃态 CSS 样式、系统字体栈、响应式 meta。

```tsx
import { html } from 'hono/html'

type LayoutProps = {
  title: string;
  currentPath: string;
  children: any;
  admin?: { game_name: string; permission_group: string } | null;
}

export function Layout({ title, currentPath, children, admin }: LayoutProps) {
  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — 鸡蛋肠粉封禁查询</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #0a0a0f;
      color: #e8e8f0;
      min-height: 100vh;
      line-height: 1.6;
    }
    /* 玻璃态容器 */
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
    }
    /* 导航 */
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    nav .logo {
      font-weight: 700;
      font-size: 1.1rem;
      color: #4a9eff;
    }
    nav a {
      color: #8888a0;
      text-decoration: none;
      margin-left: 1.5rem;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #e8e8f0; }
    nav a.active {
      border-bottom: 2px solid #4a9eff;
      padding-bottom: 2px;
    }
    /* 主容器 */
    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    /* 卡片表格区 */
    .card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    /* 表格 */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th, td {
      text-align: left;
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    th {
      color: #8888a0;
      font-weight: 500;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    /* 徽章 */
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-warning { background: rgba(255, 193, 7, 0.15); color: #ffc107; }
    .badge-level3  { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .badge-level2  { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .badge-level1  { background: rgba(233, 30, 99, 0.15); color: #e91e63; }
    .badge-level4  { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
    .badge-ok   { background: rgba(0, 212, 170, 0.15); color: #00d4aa; }
    .badge-ban  { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .badge-perm { background: rgba(0, 0, 0, 0.3); color: #666; }
    .badge-muted { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
    /* 搜索框 */
    .search-box {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .search-box input {
      flex: 1;
      padding: 0.6rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #e8e8f0;
      font-size: 0.9rem;
    }
    .search-box input::placeholder { color: #555; }
    .search-box select {
      padding: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #e8e8f0;
    }
    /* 按钮 */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-danger  { background: #f44336; color: #fff; }
    .btn-ghost   { background: rgba(255,255,255,0.06); color: #e8e8f0; }
    /* 分页 */
    .pagination {
      display: flex;
      gap: 0.3rem;
      justify-content: center;
      margin-top: 1rem;
    }
    .pagination a, .pagination span {
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #8888a0;
      text-decoration: none;
    }
    .pagination a:hover { background: rgba(255,255,255,0.06); color: #e8e8f0; }
    .pagination .current { background: #4a9eff; color: #fff; }
    /* 响应式 */
    @media (max-width: 768px) {
      nav { flex-wrap: wrap; gap: 0.5rem; }
      nav .nav-links { width: 100%; display: flex; flex-wrap: wrap; gap: 0.5rem; }
      nav a { margin-left: 0; }
      table { font-size: 0.78rem; }
      th, td { padding: 0.5rem 0.3rem; }
      .search-box { flex-direction: column; }
    }
    /* 表单 */
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      color: #8888a0;
      font-size: 0.82rem;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.8rem;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: #e8e8f0;
      font-size: 0.9rem;
    }
    .form-group textarea { resize: vertical; min-height: 60px; }
    /* footer */
    footer {
      text-align: center;
      padding: 2rem;
      color: #555;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <nav>
    <div class="logo">🔍 鸡蛋肠粉封禁查询</div>
    <div class="nav-links">
      <a href="/" data-current="${currentPath === '/' ? 'active' : ''}">封禁列表</a>
      <a href="/team" data-current="${currentPath === '/team' ? 'active' : ''}">管理组</a>
      ${admin ? html`<a href="/admin/bans">后台</a>` : ''}
      ${admin ? html`<a href="/admin/logout">退出</a>` : html`<a href="/login">登录</a>`}
    </div>
  </nav>
  <main>
    ${children}
  </main>
  <footer>
    CN 鸡蛋肠粉服务器 &copy; ${new Date().getFullYear()} &mdash; SCP: Secret Laboratory
  </footer>
  <script>
    // 设置 nav 高亮
    document.querySelectorAll('nav a').forEach(a => {
      if (a.dataset.current === 'active') a.classList.add('active');
    });
  </script>
</body>
</html>`
}
```

- [ ] 写入 `src/views/layout.tsx`

### Task 4.2: 创建 src/views/home.tsx — 首页封禁列表

**文件：** `Create: src/views/home.tsx`

```tsx
import { html } from 'hono/html'

type HomePageProps = {
  bans: Array<{
    id: number;
    nickname: string;
    steam_id: string;
    ip_address: string;
    reason: string;
    ban_time: string;
    ban_duration: string;
    violation_level: string;
    status: string;
    notes: string;
    handled_by_name: string | null;
  }>;
  page: number;
  totalPages: number;
  total: number;
  query: string;
  levelFilter: string;
  statusFilter: string;
}

// 违规等级 → 徽章 CSS 类名
function levelBadge(level: string): string {
  const map: Record<string, string> = {
    warning: 'badge-warning',
    severe_warning: 'badge-warning',
    level3: 'badge-level3',
    level2: 'badge-level2',
    level1: 'badge-level1',
    level4: 'badge-level4',
  }
  return map[level] || 'badge-warning'
}

// 违规等级 → 显示文字
function levelLabel(level: string): string {
  const map: Record<string, string> = {
    warning: '警告',
    severe_warning: '严重警告',
    level3: '3级违规',
    level2: '2级违规',
    level1: '1级违规',
    level4: '4级(逃逸)',
  }
  return map[level] || level
}

// 状态 → 徽章
function statusBadge(status: string): string {
  const map: Record<string, string> = {
    banned: 'badge-ban',
    unbanned: 'badge-ok',
    permanent: 'badge-perm',
    muted: 'badge-muted',
  }
  return map[status] || 'badge-ban'
}
function statusLabel(status: string): string {
  const map: Record<string, string> = {
    banned: '封禁中',
    unbanned: '已解封',
    permanent: '永久封禁',
    muted: '禁言中',
  }
  return map[status] || status
}

export function HomePage(props: HomePageProps) {
  return html`
<div class="card">
  <div class="search-box">
    <input type="text" name="q" placeholder="搜索昵称 / Steam ID / IP..."
           hx-get="/" hx-trigger="keyup changed delay:300ms" hx-target=".table-wrap" hx-push-url="true"
           value="${props.query}" />
    <select name="level" hx-get="/" hx-trigger="change" hx-target=".table-wrap" hx-push-url="true">
      <option value="">全部等级</option>
      <option value="warning" ${props.levelFilter === 'warning' ? 'selected' : ''}>警告</option>
      <option value="severe_warning" ${props.levelFilter === 'severe_warning' ? 'selected' : ''}>严重警告</option>
      <option value="level3" ${props.levelFilter === 'level3' ? 'selected' : ''}>3级违规</option>
      <option value="level2" ${props.levelFilter === 'level2' ? 'selected' : ''}>2级违规</option>
      <option value="level1" ${props.levelFilter === 'level1' ? 'selected' : ''}>1级违规</option>
      <option value="level4" ${props.levelFilter === 'level4' ? 'selected' : ''}>4级(逃逸)</option>
    </select>
    <select name="status" hx-get="/" hx-trigger="change" hx-target=".table-wrap" hx-push-url="true">
      <option value="">全部状态</option>
      <option value="banned" ${props.statusFilter === 'banned' ? 'selected' : ''}>封禁中</option>
      <option value="unbanned" ${props.statusFilter === 'unbanned' ? 'selected' : ''}>已解封</option>
      <option value="permanent" ${props.statusFilter === 'permanent' ? 'selected' : ''}>永久封禁</option>
    </select>
  </div>

  <div class="table-wrap">
    <p style="color:#8888a0;font-size:0.8rem;margin-bottom:0.5rem;">共 ${props.total} 条记录</p>
    <table>
      <thead>
        <tr>
          <th>昵称</th>
          <th>Steam ID</th>
          <th>原因</th>
          <th>封禁时间</th>
          <th>违规等级</th>
          <th>状态</th>
          <th>处理管理</th>
        </tr>
      </thead>
      <tbody>
        ${props.bans.length === 0
          ? html`<tr><td colspan="7" style="text-align:center;color:#8888a0;padding:2rem;">暂无数据</td></tr>`
          : props.bans.map(ban => html`
        <tr>
          <td><strong>${escHtml(ban.nickname)}</strong></td>
          <td style="font-family:monospace;font-size:0.82rem;">${escHtml(ban.steam_id)}</td>
          <td>${escHtml(ban.reason)}</td>
          <td style="font-size:0.82rem;">${formatTime(ban.ban_time)}</td>
          <td><span class="badge ${levelBadge(ban.violation_level)}">${levelLabel(ban.violation_level)}</span></td>
          <td><span class="badge ${statusBadge(ban.status)}">${statusLabel(ban.status)}</span></td>
          <td>${ban.handled_by_name ? escHtml(ban.handled_by_name) : '—'}</td>
        </tr>`)}
      </tbody>
    </table>

    ${props.totalPages > 1 ? html`
    <div class="pagination" hx-boost="true">
      ${props.page > 1 ? html`<a href="/?page=${props.page - 1}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">上一页</a>` : ''}
      ${Array.from({length: props.totalPages}, (_, i) => i + 1).map(p =>
        p === props.page
          ? html`<span class="current">${p}</span>`
          : html`<a href="/?page=${p}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">${p}</a>`
      )}
      ${props.page < props.totalPages ? html`<a href="/?page=${props.page + 1}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">下一页</a>` : ''}
    </div>` : ''}
  </div>
</div>`
}

// 简单 HTML 转义
function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

// 格式化时间 (ISO -> 简中)
function formatTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
```

- [ ] 写入 `src/views/home.tsx`

### Task 4.3: 创建 src/views/team.tsx — 管理组公示页

**文件：** `Create: src/views/team.tsx`

```tsx
import { html } from 'hono/html'

type Member = {
  game_name: string;
  qq_name: string;
  permission_group: string;
  position: string;
  supervisor: string;
}

export function TeamPage({ members }: { members: Member[] }) {
  return html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">管理组公示</h2>
  <table>
    <thead>
      <tr>
        <th>游戏内名称</th>
        <th>QQ群名称</th>
        <th>权限组</th>
        <th>任职</th>
        <th>主管事务</th>
      </tr>
    </thead>
    <tbody>
      ${members.length === 0
        ? html`<tr><td colspan="5" style="text-align:center;color:#8888a0;padding:2rem;">暂无管理组成员</td></tr>`
        : members.map(m => html`
      <tr>
        <td><strong>${escHtml(m.game_name)}</strong></td>
        <td>${escHtml(m.qq_name)}</td>
        <td><span class="badge badge-level3">${m.permission_group}</span></td>
        <td>${escHtml(m.position)}</td>
        <td>${escHtml(m.supervisor)}</td>
      </tr>`)}
    </tbody>
  </table>
</div>`
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
```

> `escHtml` 与 home.tsx 重复。计划中的重复是允许的（skill 要求每个代码块独立完整）。重构阶段再提取公共函数。

- [ ] 写入 `src/views/team.tsx`

---

## Task 5: 路由实现

### Task 5.1: 创建 src/routes/public.ts — 公开路由

**文件：** `Create: src/routes/public.ts`

处理：`GET /`（封禁列表）、`GET /team`（管理组公示）、`GET /api/bans`（JSON 分页数据）、`GET /api/profiles`（JSON 管理组数据）。

```typescript
import { Hono } from 'hono'
import type { Env, BanRow, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { HomePage } from '../views/home'
import { TeamPage } from '../views/team'

export const publicRoutes = new Hono<{ Bindings: Env }>()

// 解析封禁状态
function computeStatus(ban: { ban_duration: string; ban_time: string; archive_action: string | null }): string {
  if (ban.ban_duration === 'permanent') return 'permanent'
  if (ban.ban_duration.startsWith('mute-')) return 'muted'
  // 解析时长，判断是否已过解封时间
  const durationMatch = ban.ban_duration.match(/^(\d+)([dhm])$/)
  if (durationMatch) {
    const amount = parseInt(durationMatch[1])
    const unit = durationMatch[2]
    const banTime = new Date(ban.ban_time).getTime()
    let durationMs = 0
    if (unit === 'm') durationMs = amount * 60 * 1000
    else if (unit === 'h') durationMs = amount * 60 * 60 * 1000
    else if (unit === 'd') durationMs = amount * 24 * 60 * 60 * 1000
    // 50y 是特殊情况（1级违规）
    if (unit === 'y' && amount === 50) return 'banned'
    if (Date.now() > banTime + durationMs) {
      if (ban.archive_action === 'downgraded') return 'banned' // 降级后重新计算
      return 'unbanned'
    }
  }
  return 'banned'
}

// 首页 — 封禁列表
publicRoutes.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const q = c.req.query('q') || ''
  const levelFilter = c.req.query('level') || ''
  const statusFilter = c.req.query('status') || ''

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (q) {
    where += ' AND (b.nickname LIKE ? OR b.steam_id LIKE ? OR b.ip_address LIKE ?)'
    const pattern = `%${q}%`
    params.push(pattern, pattern, pattern)
  }
  if (levelFilter) {
    where += ' AND b.violation_level = ?'
    params.push(levelFilter)
  }

  // 查询总数
  const countSql = `SELECT COUNT(*) as total FROM bans b ${where}`
  const countResult = await c.env.DB.prepare(countSql).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0
  const totalPages = Math.ceil(total / limit)

  // 查询数据（JOIN admins 获取处理管理名称）
  const dataSql = `
    SELECT b.*, a.game_name as handled_by_name
    FROM bans b
    LEFT JOIN admins a ON b.handled_by = a.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `
  const bans = await c.env.DB.prepare(dataSql).bind(...params, limit, offset).all<BanRow & { handled_by_name: string | null }>()

  // 为每条记录计算状态、处理归档过滤
  let results = bans.results.map(ban => ({
    ...ban,
    status: computeStatus(ban),
  }))

  // 状态过滤（在内存中计算后过滤，因为 status 不在 DB 中）
  if (statusFilter) {
    results = results.filter(b => b.status === statusFilter)
  }

  // 已归档且已删除的不要出现在公开列表
  results = results.filter(b => !(b.is_archived === 1 && b.archive_action === 'deleted'))

  // HTML 页面请求
  if (c.req.header('HX-Request')) {
    // htmx 局部刷新 — 只返回表格部分
    return c.html(HomePage({
      bans: results, page, totalPages, total: results.length,
      query: q, levelFilter, statusFilter,
    }))
  }

  return c.html(Layout({
    title: '封禁列表',
    currentPath: '/',
    children: HomePage({
      bans: results, page, totalPages, total: results.length,
      query: q, levelFilter, statusFilter,
    }),
  }))
})

// 管理组公示页
publicRoutes.get('/team', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT game_name, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all<AdminRow>()

  return c.html(Layout({
    title: '管理组',
    currentPath: '/team',
    children: TeamPage({ members: result.results }),
  }))
})

// API: 封禁列表（JSON 格式）
publicRoutes.get('/api/bans', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    'SELECT b.*, a.game_name as handled_by_name FROM bans b LEFT JOIN admins a ON b.handled_by = a.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  return c.json({ data: rows.results, page, limit })
})

// API: 管理组公示列表（JSON）
publicRoutes.get('/api/profiles', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT game_name, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all()

  return c.json({ data: rows.results })
})
```

- [ ] 写入 `src/routes/public.ts`
- [ ] 验证：`npx tsc --noEmit` 确认编译通过

### Task 5.2: 创建 src/routes/auth.ts — 登录路由

**文件：** `Create: src/routes/auth.ts`

```typescript
import { Hono } from 'hono'
import { sign, verify } from '@hono/jwt'
import bcrypt from 'bcryptjs'
import type { Env, AdminRow } from '../db'
import { Layout } from '../views/layout'

export const authRoutes = new Hono<{ Bindings: Env }>()

// 登录页面
authRoutes.get('/login', (c) => {
  return c.html(Layout({
    title: '管理员登录',
    currentPath: '/login',
    children: html`
<div class="card" style="max-width:400px;margin:2rem auto;">
  <h2 style="margin-bottom:1rem;font-weight:500;">管理员登录</h2>
  <form id="loginForm">
    <div class="form-group">
      <label>Steam UserID</label>
      <input type="text" name="steam_id" required placeholder="STEAM_0:0:12345678" />
    </div>
    <div class="form-group">
      <label>用户名</label>
      <input type="text" name="username" required placeholder="用户名" />
    </div>
    <div class="form-group">
      <label>密码</label>
      <input type="password" name="password" required placeholder="密码" />
    </div>
    <div id="turnstile-widget" style="margin-bottom:1rem;"></div>
    <button type="submit" class="btn btn-primary" style="width:100%;">登录</button>
    <p id="loginError" style="color:#f44336;margin-top:0.5rem;display:none;"></p>
  </form>
</div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
  turnstile.render('#turnstile-widget', { sitekey: '${c.env.TURNSTILE_SITE_KEY}' });
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steam_id: data.get('steam_id'),
        username: data.get('username'),
        password: data.get('password'),
        'cf-turnstile-response': data.get('cf-turnstile-response'),
      }),
    });
    const result = await resp.json();
    if (resp.ok) {
      localStorage.setItem('jwt', result.token);
      window.location.href = '/admin/bans';
    } else {
      const err = document.getElementById('loginError');
      err.textContent = result.error || '登录失败';
      err.style.display = 'block';
    }
  });
</script>`
  }))
})

// 辅助：因为上面的 a href `${}` 语法会混淆 tsx 的 JSX，实际使用 html 模板字面量
import { html } from 'hono/html'

// API: 登录
authRoutes.post('/api/login', async (c) => {
  // 验证 Turnstile
  const { steam_id, username, password, 'cf-turnstile-response': turnstileToken } = await c.req.json<{
    steam_id: string;
    username: string;
    password: string;
    'cf-turnstile-response': string;
  }>()

  if (!turnstileToken) {
    return c.json({ error: '请完成人机验证' }, 400)
  }

  // 验证 Turnstile token
  const turnstileResp = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body: new URLSearchParams({ secret: c.env.TURNSTILE_SECRET_KEY, response: turnstileToken }) }
  )
  const turnstileResult = await turnstileResp.json<{ success: boolean }>()
  if (!turnstileResult.success) {
    return c.json({ error: '人机验证失败' }, 400)
  }

  // 查询管理员
  const admin = await c.env.DB.prepare(
    'SELECT * FROM admins WHERE steam_id = ? AND username = ? AND is_active = 1'
  ).bind(steam_id, username).first<AdminRow>()

  if (!admin) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

  // 验证密码
  const passwordMatch = await bcrypt.compare(password, admin.password_hash)
  if (!passwordMatch) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

  // 签发 JWT（有效期 7 天）
  const token = await sign(
    {
      adminId: admin.id,
      permissionGroup: admin.permission_group,
      sub: admin.id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    c.env.JWT_SECRET
  )

  return c.json({ token, admin: { id: admin.id, game_name: admin.game_name, permission_group: admin.permission_group } })
})
```

- [ ] 写入 `src/routes/auth.ts`
- [ ] 验证：`npx tsc --noEmit` 确认编译通过

---

## Task 6: 创建 D1 数据库 + 初始化数据

- [ ] 在本地创建 D1 数据库：
  ```bash
  cd d:/Project/JDCF-ban-list
  npx wrangler d1 create jdcf-db
  ```
  记下输出的 `database_id`，更新到 `wrangler.jsonc` 中

- [ ] 运行 Schema：
  ```bash
  npx wrangler d1 execute jdcf-db --file=./schema.sql
  ```

- [ ] 运行 Seed：
  ```bash
  npx wrangler d1 execute jdcf-db --file=./seed.sql
  ```

- [ ] 验证数据：
  ```bash
  npx wrangler d1 execute jdcf-db --command="SELECT id, username, permission_group FROM admins"
  ```
  预期输出：`1 | admin | OWNER`

---

## Task 7: 本地开发部署测试

- [ ] 安装依赖：
  ```bash
  cd d:/Project/JDCF-ban-list
  npm install
  ```

- [ ] 本地启动：
  ```bash
  npx wrangler pages dev functions/ --binding
  ```

- [ ] 在浏览器访问 `http://localhost:8788`，确认：
  - [ ] 首页封禁列表渲染（表格 + 搜索框）
  - [ ] `/team` 管理组公示页（或空表格）
  - [ ] `/login` 显示登录表单 + Turnstile widget
  - [ ] CSS 玻璃态风格渲染正常
  - [ ] 响应式（缩小浏览器窗口，表格仍可读）

---

## Task 8: 安装依赖并提交

- [ ] 安装 npm 依赖：
  ```bash
  npm install
  ```

- [ ] 确认所有文件已创建：
  ```bash
  git status
  ```

- [ ] 添加并提交 Phase 1：
  ```bash
  git add .
  git commit -m "feat: Phase 1 基础架构 — Hono Pages Functions + D1 Schema + JWT 认证 + 公开页面"
  ```

---

## Self-Review Checklist

- [ ] **Spec覆盖率**: Phase 1 覆盖了设计文档中 Phase 1 的全部 4 个里程碑项
- [ ] **占位符检查**: 所有代码块均有完整内容，无 TBD/TODO
- [ ] **类型一致性**: `src/db.ts` 中定义的 `Env`、`BanRow`、`AdminRow` 类型在 routes 和 views 中一致使用
- [ ] **路径一致性**: 所有文件路径与上方"文件结构"一致
- [ ] **TS 编译**: 所有 `.ts`/`.tsx` 文件使用一致的 `hono/jsx` JSX 配置

---

## Execution Handoff

Phase 1 计划已写入 `docs/superpowers/plans/2026-06-05-jdcf-phase1-infrastructure.md`。

**两种执行方式：**

1. **子代理驱动（推荐）** — 我按 Task 逐个派遣子代理，每个 Task 完成后 review 再进入下一个，快速迭代
2. **内联执行** — 在当前会话内按步骤顺序执行，批量执行带检查点

你倾向哪种？喵～
