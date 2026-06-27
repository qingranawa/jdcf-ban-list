# SCP:SL "CN 鸡蛋肠粉服务器" 封禁管理系统 — 设计规格

> 项目路径: `d:/Project/JDCF-ban-list/`
> 日期: 2026-06-05
> 状态: 设计已确认，待实现

---

## 1. 项目概述

为 SCP: Secret Laboratory 游戏服务器"CN 鸡蛋肠粉服务器"构建的封禁列表管理与管理员公示网站。

### 核心功能

- **公开封禁查询** — 所有人可查看封禁列表，支持搜索、筛选、分页
- **管理员公示** — 全员可见的管理团队成员信息
- **管理后台** — 管理员登录后可增删改封禁记录、管理公示表
- **黑名单总表** — 汇总所有被封禁玩家（仅 T3+ 管理员可见）
- **月度自动归档** — 每月1日对逾期封禁执行自动处理

### 目标用户

- 普通访客（SCP:SL 玩家）— 查询封禁信息
- 管理员团队（T1~T6 / OWNER）— 管理封禁与公示

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端渲染 | Hono + JSX SSR | 服务端渲染 HTML |
| 交互增强 | htmx | 按需局部刷新，零 JS bundle |
| 样式 | 原生 CSS | 玻璃态 + 瑞士平面设计 |
| 后端框架 | Hono (Cloudflare Pages Functions) | 边缘运行 |
| 数据库 | Cloudflare D1 (SQLite) | 单区域，低延迟 |
| 人机验证 | Cloudflare Turnstile | 前端嵌入，后端验证 |
| 定时任务 | 独立 Cloudflare Worker (Cron Trigger) | 每月1日触发归档 |
| Session | JWT (Bearer Token) | 登录态管理 |
| 部署 | Cloudflare Pages | 关联 git，自动部署 |

### 关键依赖

- `hono` — HTTP 框架
- `@hono/jwt` — JWT 中间件
- `bcryptjs` — 密码哈希（纯 JS，兼容边缘环境）
- `htmx` — 前端交互增强（CDN 引入，~14KB）
- `@turnstile/turnstile` — Turnstile 验证

---

## 3. 数据库设计

### 3.1 封禁表 `bans`

封禁记录表，公开可查。

```sql
CREATE TABLE bans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname    TEXT NOT NULL,
  steam_id    TEXT NOT NULL,
  ip_address  TEXT NOT NULL DEFAULT '',
  reason      TEXT NOT NULL DEFAULT '',
  ban_time    TEXT NOT NULL DEFAULT (datetime('now')),
  ban_duration TEXT NOT NULL,    -- 30m, 7d, 1y, 50y, permanent, mute-14d 等
  violation_level TEXT NOT NULL, -- warning, severe_warning, level3, level2, level1, level4
  notes       TEXT NOT NULL DEFAULT '',
  handled_by  INTEGER,           -- FK → admins.id
  is_archived INTEGER NOT NULL DEFAULT 0,  -- 0=未归档, 1=已归档
  archive_action TEXT,            -- deleted, downgraded, ignored, NULL
  archived_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**`status` 自动计算逻辑（读取时计算，非持久化字段）：**

```
ban_duration = 'permanent'  → status = 'permanent'
ban_duration 前缀 'mute-'   → status = 'muted'
ban_time + ban_duration < now() → if archive_action='downgraded' → 按新等级
                                → else status = 'unbanned'
其余 → status = 'banned'
```

### 3.2 管理员表 `admins`

管理员账户与公示信息合一（认证+权限+公示），公开 API 只暴露公示字段。

```sql
CREATE TABLE admins (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  steam_id         TEXT NOT NULL UNIQUE,   -- 登录凭证
  username         TEXT NOT NULL UNIQUE,   -- 登录凭证
  password_hash    TEXT NOT NULL,          -- bcrypt
  permission_group TEXT NOT NULL DEFAULT 'T1', -- T1, T2, T3, T4, T5, T6, OWNER
  game_name        TEXT NOT NULL DEFAULT '',    -- 游戏内名称（"处理管理"自动填充）
  qq_name          TEXT NOT NULL DEFAULT '',    -- QQ群内名称（公示用）
  position         TEXT NOT NULL DEFAULT '',    -- 任职（公示用）
  supervisor       TEXT NOT NULL DEFAULT '',    -- 主管事务（公示用）
  is_active        INTEGER NOT NULL DEFAULT 1, -- 1=启用 0=禁用
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**公开字段（`/api/profiles`）：** `game_name`, `qq_name`, `permission_group`, `position`, `supervisor`

**`permission_group` 从轻到重：** `T1` < `T2` < `T3` < `T4` < `T5` < `T6` < `OWNER`

### 3.3 黑名单总表 `blacklist`

所有被封禁玩家的汇总（T3+ 管理员可见）。每次创建封禁记录时自动 Upsert。

```sql
CREATE TABLE blacklist (
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
```

### 3.4 归档日志表

**摘要表 `archives`：**

```sql
CREATE TABLE archives (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_date     TEXT NOT NULL UNIQUE,  -- '2026-07-01'
  total_processed  INTEGER NOT NULL DEFAULT 0,
  l3_deleted       INTEGER NOT NULL DEFAULT 0,
  l2_downgraded    INTEGER NOT NULL DEFAULT 0,
  l1_ignored       INTEGER NOT NULL DEFAULT 0,
  l4_ignored       INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**明细表 `archive_items`：**

```sql
CREATE TABLE archive_items (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id       INTEGER NOT NULL,     -- FK → archives.id
  ban_id           INTEGER NOT NULL,     -- FK → bans.id
  nickname         TEXT NOT NULL,
  steam_id         TEXT NOT NULL,
  original_level   TEXT NOT NULL,
  new_level        TEXT,                 -- 仅 downgraded 时有值
  action           TEXT NOT NULL,        -- deleted, downgraded, ignored
  original_status  TEXT NOT NULL,
  original_duration TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.5 Session 表 `sessions`

JWT Token 黑名单/活跃会话管理（可选，也可完全依赖 JWT 过期时间）。

```sql
CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER NOT NULL,           -- FK → admins.id
  token_jti  TEXT NOT NULL UNIQUE,       -- JWT ID
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.6 索引

```sql
CREATE INDEX idx_bans_steam_id ON bans(steam_id);
CREATE INDEX idx_bans_status ON bans(status);
CREATE INDEX idx_bans_violation_level ON bans(violation_level);
CREATE INDEX idx_bans_handled_by ON bans(handled_by);
CREATE INDEX idx_bans_is_archived ON bans(is_archived);
CREATE INDEX idx_admins_permission_group ON admins(permission_group);
CREATE INDEX idx_blacklist_steam_id ON blacklist(steam_id);
CREATE INDEX idx_archive_items_archive_id ON archive_items(archive_id);
```

---

## 4. 前端路由

```
jdsc-ban-list.pages.dev/
│
├── /                          # 首页 — 封禁列表（公开）
│   ├── 搜索框 (nickname/steam_id/ip)
│   ├── 筛选 (违规等级 / 处理结果)
│   ├── 分页表格
│   └── 记录统计
│
├── /blacklist                 # 黑名单总表（T3+ 管理员可见）
│
├── /team                      # 管理员公示表（公开）
│
├── /login                     # 管理员登录
│
├── /admin                     # 管理后台（需登录）
│   ├── /admin/bans            # 封禁管理 — CRUD
│   ├── /admin/team            # 管理组管理 — CRUD（仅 OWNER）
│   ├── /admin/archive         # 归档记录查看
│   └── /admin/logout
```

---

## 5. API 设计

### 公共 API

| Method | Path | 说明 | 验证 |
|--------|------|------|------|
| GET | `/api/bans` | 封禁列表（分页+搜索+筛选） | 无 |
| GET | `/api/bans/:id` | 封禁详情 | 无 |
| GET | `/api/profiles` | 管理员公示列表 | 无 |

### 认证 API

| Method | Path | 说明 | 验证 |
|--------|------|------|------|
| POST | `/api/login` | 登录（返回 JWT） | Turnstile |

### 受保护 API（需 JWT Header: `Authorization: Bearer <token>`）

| Method | Path | 说明 | 权限 |
|--------|------|------|------|
| POST | `/api/bans` | 新增封禁 | T1+ |
| PUT | `/api/bans/:id` | 修改封禁 | 自己的：T1+ / 他人的：T5+ |
| DELETE | `/api/bans/:id` | 删除封禁 | 自己的：T1+ / 他人的：T5+ |
| GET | `/api/blacklist` | 黑名单总表 | T3+ |
| GET | `/api/admin/profiles` | 完整管理组列表（含敏感字段） | OWNER |
| POST | `/api/admin/profiles` | 新增管理员 | OWNER |
| PUT | `/api/admin/profiles/:id` | 修改管理员信息（含权限组） | OWNER |
| DELETE | `/api/admin/profiles/:id` | 删除管理员 | OWNER |
| GET | `/api/admin/archives` | 归档记录列表 | T4+ |

### 内部 API（Worker → Functions）

| Method | Path | 说明 | 鉴权 |
|--------|------|------|------|
| POST | `/api/cron/archive` | 月度归档 | Header `X-Cron-Secret` |

---

## 6. 权限矩阵

> 权限组排序：T1 < T2 < T3 < T4 < T5 < T6 < OWNER

| 操作 | T1 | T2 | T3 | T4 | T5 | T6 | OWNER |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:-----:|
| 查看封禁列表（公开） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 新增封禁记录 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 修改自己的封禁记录 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 修改他人的封禁记录 | — | — | — | — | ✅ | ✅ | ✅ |
| 删除自己的封禁记录 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 删除他人的封禁记录 | — | — | — | — | ✅ | ✅ | ✅ |
| 查看黑名单总表 | — | — | ✅ | ✅ | ✅ | ✅ | ✅ |
| 管理公示表（增删改管理员） | — | — | — | — | — | — | ✅ |
| 修改权限组 | — | — | — | — | — | — | ✅ |
| 查看归档记录 | — | — | — | ✅ | ✅ | ✅ | ✅ |
| 修改任意管理员账号 | — | — | — | — | — | — | ✅ |

> **"自己的"封禁记录** 判定：`bans.handled_by == current_admin.id`

---

## 7. 月度归档逻辑

### 触发方式

独立 Cloudflare Worker 配置 Cron Trigger：`0 0 1 * *`（每月1日 00:00 UTC），携带 `X-Cron-Secret` Token 请求 Pages Functions 的 `/api/cron/archive`。

### 处理规则

1. 查询所有 `is_archived = 0` 且 `status = 'unbanned'`（即已自然解封）的封禁记录
2. 对每条记录按 `violation_level` 执行：

| 违规等级 | 处理动作 | 说明 |
|----------|----------|------|
| 警告 / 严重警告 | 不处理（保留） | 不影响，不清除 |
| 3级违规 | **删除** | 记录软删除（或直接从公开列表隐藏），转存 archive_items |
| 2级违规 | **降级至三级** | violation_level → level3，适当调整时长；原快照写入 archive_items |
| 1级违规（50年） | **忽略** | 不动 |
| 4级违规（逃逸） | **忽略** | 不动 |

3. 统计本次归档的处理数据，写入 `archives` 表
4. 每条被处理的明细写入 `archive_items` 表

### 归档后数据可见性

- 已删除的封禁记录从公开列表隐藏，但在 archive_items 中可追溯
- 降级记录在公开列表中保留，但展示调整后的等级
- 归档日志可在 `/admin/archive` 查看（T4+）

---

## 8. 认证与安全

### 登录流程

1. 管理员在 `/login` 页面输入 Steam UserID、用户名、密码
2. 前端验证 Turnstile Token
3. POST `/api/login` → 验证密码 (bcrypt) → 返回 JWT (有效期 7 天)
4. JWT 存储在 `localStorage` 或 `cookie (httpOnly)` 中
5. 前端在每个受保护请求中携带 JWT

### Turnstile 集成

- 登录页、新增封禁表单嵌入 Turnstile widget
- 后端验证 Turnstile token 确保请求来自真人

### 安全措施

- 密码使用 bcrypt 哈希
- JWT 签名使用环境变量中的 Secret Key
- 管理员密码可由 OWNER 重置（重置为随机密码，下次登录强制修改）
- CORS 限制为 Pages 域名
- 所有写操作（POST/PUT/DELETE）需 Turnstile 或 JWT 认证
- Cron API 使用预共享 Secret Token 鉴权

---

## 9. 视觉设计

### 风格定位

**极简主义 + 瑞士平面设计 + 玻璃态**

### 色彩系统

- **底色**：深色主题为主（`#0a0a0f` → `#1a1a2e`），与游戏社区氛围统一
- **玻璃态**：`backdrop-filter: blur(20px)` + `background: rgba(255,255,255,0.03~0.08)`
- **强调色**：冷蓝 `#4a9eff`、青绿 `#00d4aa`，与 SCP 风格呼应
- **文本**：`#e8e8f0`（主）、`#8888a0`（副）
- **边框**：`rgba(255,255,255,0.06)` 极细分割

### 排版

- 字体：`Inter`, `system-ui`, `-apple-system`, `Segoe UI` 系统级字体栈
- 瑞士设计元素：网格对齐、大留白、信息层级清晰、无装饰元素

### 响应式

- Mobile First：表格在小屏自动变为卡片式布局
- 管理后台桌面优先（操作密集区域）

### 性能策略

- 所有 CSS 内联至 `<style>`，零外部样式表加载
- htmx 从 CDN 加载（14KB，缓存友好）
- 字体使用系统栈，零字体文件加载
- 首屏 HTML 直出，无客户端渲染等待

---

## 10. 部署架构

```
┌────────────────────────────────────────────────────┐
│ Cloudflare Pages (with Functions)                   │
│                                                     │
│  public/                     functions/             │
│  ├── static/                 └── api/           │
│  │   ├── style.css                ├── bans/        │
│  │   └── app.js                  ├── login.ts      │
│  ├── index.html                 ├── profiles.ts    │
│  ├── login.html                 ├── blacklist.ts   │
│  ├── team.html                  ├── admin/         │
│  └── admin/                     └── cron/          │
│      ├── bans.html                                    │
│      ├── team.html                                   │
│      └── archive.html                                │
│                                                     │
│  wrangler.jsonc → D1 binding: DB                     │
│                                                     │
└──────────────┬─────────────────────────────────────┘
               │
    ┌──────────┴──────────┐
    │  Cloudflare D1       │
    │  (database=jdsc-db)  │
    └─────────────────────┘

┌──────────────────────────────────────┐
│ Cloudflare Worker (独立, Cron Trigger) │
│                                      │
│ 每月1日 00:00 UTC → POST              │
│  → pages.dev/api/cron/archive        │
└──────────────────────────────────────┘
```

### 配置文件

`wrangler.jsonc` 配置：

```jsonc
{
  "name": "jdcf-ban-list",
  "pages_build_output_dir": "./dist",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "jdsc-db",
      "database_id": "<uuid>"
    }
  ],
  "vars": {
    "TURNSTILE_SITE_KEY": "...",
    "TURNSTILE_SECRET_KEY": "...",
    "JWT_SECRET": "...",
    "CRON_SECRET": "..."
  }
}
```

---

## 11. 里程碑与阶段

### Phase 1：基础架构
- [ ] 项目初始化（wrangler、目录结构）
- [ ] D1 数据库创建与 seed 脚本（含初始 OWNER）
- [ ] Hono 框架搭建 + 中间件（JWT、权限、Turnstile）
- [ ] 部署到 Cloudflare Pages

### Phase 2：公开页面
- [ ] 首页封禁列表（表格、分页、搜索）
- [ ] 管理员公示页面
- [ ] 视觉风格实现（玻璃态 + 瑞士设计）

### Phase 3：管理后台
- [ ] 登录系统（JWT + Turnstile）
- [ ] 封禁 CRUD（增删改 + 权限控制）
- [ ] 管理组 CRUD（仅 OWNER）
- [ ] 黑名单总表页面（T3+）

### Phase 4：归档系统
- [ ] 独立 Cron Worker
- [ ] 归档处理逻辑（3级删除 / 2级降级）
- [ ] 归档日志查看页面
- [ ] 黑名单表自动维护

### Phase 5：完善
- [ ] 错误处理与降级页面
- [ ] 响应式适配完善
- [ ] 数据导入（用户提供的初始数据）
- [ ] 文档更新

---

> 本规范所有设计决策已与用户确认。后续步骤：编写实施计划。
