---
last_updated: 2026-06-07
updated_by: superpowers-memory:update
triggered_by_plan: 2026-06-05-jdcf-phase2-3-4-implementation.md
---

# 约定

## 命名

- 表名: 全小写（`bans`, `admins`, `watchlist`, `archives`, `archive_items`, `sessions`）
- 字段: snake_case，所有表含 `id`(PK)、`created_at`、`updated_at`
- TypeScript: camelCase，视图文件 `.tsx`（Hono JSX 不支持内联 style 对象，必须用 html 模板字面量）

## API 风格

- RESTful JSON API，路由挂载在 `/api/` 前缀下（`/api/admin/bans` 等）
- 认证: `Authorization: Bearer <JWT>` header（API 调用）；httpOnly `jwt` cookie（页面导航自动携带）
- 分页: 查询参数 `?page=1&limit=20`
- 错误: HTTP 状态码 + JSON `{ error: string }`
- HTML 请求（`Accept: text/html`）认证失败 → 重定向 `/login`；JSON 请求 → 返回 401/403

## 权限模型

- `GROUP_RANK` 数值对比：`OWNER:0, T6:1, T5:2, T4:3, T3:4, T2:5, T1:6` — 越小权限越高
- `requirePermission('T5')` = 要求 rank ≤ 2（即 T5/T6/OWNER）
- 修改/删除封禁记录需"本人创建"或"T5+"（rank ≤ 2）
- 管理组管理（注册/修改/删除管理员）→ T5+

## 视图与前端

- 深色主题（`color-scheme: dark` + `background: #1a1a2a`），瑞士平面设计风格
- 玻璃态效果：`backdrop-filter: blur()` + `rgba` 半透明
- 两套独立布局：公开 `Layout`（顶部固定导航栏）+ 后台 `AdminLayout`（侧边栏）
- 响应式：768px 断点，侧边栏收窄为图标模式
- htmx 局部更新：服务端检测 `HX-Request` header 返回片段而非整页

## 数据库

- SQLite（D1 兼容），时间字段用 TEXT（`datetime('now')` 格式）
- 封禁状态不在库中存储，由 `computeStatus()` 实时计算
- 归档不是物理删除，标记 `is_archived = 1` + `archive_action`
- 旧表 `blacklist` 已被 `watchlist` 替代

## Git 与分支

- 分支命名: `feat/`, `fix/`, `refactor/`, `chore/`, `style/`, `docs/`
- Commit: Conventional Commits `type(scope): 概要`
- 从 `master` 拉分支，squash merge 回 `master`

## Cross-cutting concerns

- **认证**: 所有 `/admin/*` 路由通过 `authMiddleware`，双通道 JWT（header+cookie）→ `src/middleware/auth.ts`
- **权限**: `requirePermission(minGroup)` 中间件做 GROUP_RANK 对比 → `src/middleware/auth.ts`
- **转义**: 输出到 HTML 一律通过 `escHtml()`/`escAttr()`，防 XSS → `src/helpers/escape.ts`
- **错误处理**: `try/catch` 在 D1 绑定调用处，返回 JSON error → 各路由文件
