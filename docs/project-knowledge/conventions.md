---
last_updated: 2026-06-26
updated_by: opencode
covers_branch: master@iOS-ui-redesign
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

- iOS 深色主题（`color-scheme: dark`），iOS 系统色板（systemBackground: #000000, secondarySystemBackground: #1C1C1E, tertiarySystemBackground: #2C2C2E, label/secondaryLabel/tertiaryLabel, separator, red/green/orange）
- SF Pro 字体族（`-apple-system, Helvetica Neue, SF Pro Display, SF Pro Text`）
- CSS Token 系统统一输出自 `src/views/styles.ts`（包含 Tab Bar、Table、Search、Segmented Control、Button、Badge、Bottom Sheet、Toast、Skeleton、Form、Stats、Swipe、Load More、Empty State）
- 图标使用 SF Symbols 风格内联 SVG，统一输出自 `src/views/icons.ts`（14 个图标：person, person-fill, house, house-fill, shield, bell, info, magnifyingglass, gear, gear-fill, square.and.pencil, trash, xmark, checkmark）
- 两套独立布局：公开 `Layout`（底部 Tab Bar，含封禁列表/管理组/登录三标签）+ 后台 `AdminLayout`（移动端底部 Tab Bar + 桌面端侧边栏，响应式 768px 断点）
- 所有新视图 CSS 类名使用 `ios-` 前缀（`ios-table`, `ios-btn`, `ios-badge`, `ios-grouped`, `ios-search`, `ios-sheet`, `ios-toast` 等）
- 旧类名（`card`, `badge`, `btn`, `form-group`, `modal` 等）已废弃，逐步清理中
- htmx 局部更新：服务端检测 `HX-Request` header 返回片段而非整页
- 配色使用纯色分层背景（无玻璃态效果），`bg-primary`/`bg-secondary`/`bg-tertiary` 三级深色分层

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
