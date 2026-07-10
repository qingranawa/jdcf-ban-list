---
last_updated: 2026-07-10
updated_by: superpowers-memory:ingest
covers_branch: master@95e3818
triggered_by_plan: null
---

# 约定

## 命名

- 表名: 全小写（`bans`, `admins`, `watchlist`, `archives`, `archive_items`, `sessions`, `login_attempts`, `audit_log`）
- 字段: snake_case，所有表含 `id`(PK)、`created_at`、`updated_at`
- TypeScript: camelCase，视图文件 `.ts`（Hono html 模板不支持内联 style 对象，必须用 html 模板字面量）

## API 风格

- RESTful JSON API，路由挂载在 `/api/` 前缀下（`/api/admin/bans` 等）
- 认证: `Authorization: Bearer <JWT>` header（API 调用）；httpOnly `jwt` cookie（页面导航自动携带，无 Secure 标志）
- 分页: 查询参数 `?page=1&limit=20`（支持 10/25/50/100 每页切换）
- 错误: HTTP 状态码 + JSON `{ error: string }`
- HTML 请求（`Accept: text/html`）认证失败 → 重定向 `/login`；JSON 请求 → 返回 401/403
- htmx 局部更新: 服务端检测 `HX-Request` header 返回片段而非整页

## 权限模型

- `GROUP_RANK` 数值对比：`OWNER:0, T6:1, T5:2, T4:3, T3:4, T2:5, T1:6` — 越小权限越高
- `requirePermission('T5')` = 要求 rank ≤ 2（即 T5/T6/OWNER）
- 修改/删除封禁记录需"本人创建"或"T5+"（rank ≤ 2）— 使用 `checkOwnership()` 工具函数判断
- 管理组管理（注册/修改/删除管理员）→ T5+

## 审计日志

- 封禁/公告/管理组 CRUD 操作统一通过 `writeAuditLog(db, adminId, action, targetType, targetId, detail?)` 记录
- `writeAuditLog` 是 fire-and-forget 模式：调用处用 `void writeAuditLog(...)` 或 `try { await writeAuditLog(...) } catch {}` 包裹
- 审计日志不可配置，不阻塞业务操作。`audit_log` 表不存在时静默跳过（try-catch 兜底）
- 批量归档操作不写 audit_log

## 公告编辑流程

- 新建和编辑共享同一个模态框表单（`NewAnnouncementModal()` 在 `announcements.ts`）
- 表单包含隐藏 `input[name=id]` 字段，空值=新建，有值=编辑
- `editAnnounce(id)` 通过 `GET /api/admin/announcements/:id` 获取数据，填充表单，切换标题为"编辑公告"
- `openAnnounceModal()` 重置表单+清空 id+标题设为"新建公告"
- 提交时依据 id 有无选择 POST（新建）或 PUT（编辑）
- 编辑 API 路径：`PUT /api/admin/announcements/:id`

## 视图与前端

- Cyberpunk 玻璃态暗色主题（`color-scheme: dark`），CSS Token 系统统一输出自 `src/views/styles.ts`
  - 背景: `rgba(0,0,0,.45)` + `backdrop-filter: blur(8px)` 毛玻璃；导航栏已升级为 `rgba(255,255,255,0.1)` + `backdrop-filter: blur(16px)` 白色毛玻璃
  - 色调: 青色 `#00e5ff`、品红 `#ff00e5`、琥珀 `#ffab00`
  - 文本: 主白 `#e0e0e0`、次灰 `#a0a0b0`
- 字体: 无衬线字体族（`-apple-system, 'Segoe UI', Roboto, sans-serif`）
- CSS Token 系统（`styles.ts`）包含：导航栏、搜索框、表格、Segmented Control、按钮、徽标、弹窗、Toast、表单、统计卡片、分页、多背景图
- 图标使用内联 SVG，统一输出自 `src/views/icons.ts`（24 个图标）
- 两套独立布局：公开 `Layout`（导航栏，含全局添加封禁弹窗）+ 后台 `AdminLayout`（移动端底部 Tab Bar + 桌面端侧边栏，响应式 768px 断点）
- 所有新视图 CSS 类名使用 `cyber-` 前缀（`cyber-table`, `cyber-btn`, `cyber-card`, `cyber-input`, `cyber-badge`, `cyber-sheet` 等）
- 模态框系统（cyber-sheet）：z-index 10000，居中方案为 `padding: 64px 0; overflow-y: auto;` + `margin: auto` 以避免内容溢出屏幕顶部
- 背景图系统：CSS `background-image` 多层叠加（随机图 + 3.jpg 兜底），`<link rel="preload">` 提前加载随机图，`window.onload` 预填全部图片缓存
- 配色使用玻璃态暗色系，`rgba(0,0,0,变数)` 三级透明背景

## 数据库

- SQLite（D1 兼容），时间字段用 TEXT（`datetime('now')` 格式）
- 封禁状态不在库中存储，由 `computeStatus()` 实时计算
- 归档不是物理删除，标记 `is_archived = 1` + `archive_action`
- 旧表 `blacklist` 已被 `watchlist` 替代
- 数据库迁移放在 `migrations/` 目录，按顺序命名（`001_add_co_handlers.sql`, `003_login_rate_limit.sql`, `004_audit_log.sql` 等）

## Git 与分支

- 分支命名: `feat/`, `fix/`, `refactor/`, `chore/`, `style/`, `docs/`
- Commit: Conventional Commits `type(scope): 概要`
- 从 `master` 拉分支，squash merge 回 `master`

## Cross-cutting concerns

- **认证**: 所有 `/admin/*` 路由通过 `authMiddleware`，双通道 JWT（header+cookie，无 Secure）→ `src/middleware/auth.ts`
- **登录限流**: POST /api/login 通过 `checkLoginRateLimit` / `recordLoginFailure` / `clearLoginRateLimit` 控制 → `src/middleware/rate-limit.ts`
- **Dev Mode**: DEV_MODE 环境变量启用后，dev.ts 中间件在本地开发环境绕过 JWT 认证 → `src/middleware/dev.ts`
- **审计日志**: `writeAuditLog(db, adminId, action, targetType, targetId, detail)` fire-and-forget → `src/routes/admin.ts`
- **玩家档案 URL**: `/player/:id` 先查 ban 记录获取 steam_id，steam_id 为占位符时回退昵称查询 → `src/routes/public.ts`
- **登录页 JWT 自检**: 页面加载时检查 localStorage 有效 JWT，存在则自动跳转 `/admin/bans` → `src/views/login.ts`
- **退出**: 同时清除 localStorage JWT 和 HttpOnly cookie → `src/routes/auth.ts`，`src/routes/admin.ts`
- **权限**: `requirePermission(minGroup)` 中间件做 GROUP_RANK 对比 → `src/middleware/auth.ts`；`checkOwnership(ownerId, currentAdminId, currentGroup, minOverrideRank?)` 用于操作级校验
- **转义**: 输出到 HTML 一律通过 `escHtml()`/`escAttr()`，防 XSS → `src/helpers/escape.ts`
- **错误处理**: `app.onError` 全局捕获 + 各路由 `try/catch`，返回 JSON error → `functions/[[path]].ts`
- **SQL 注入防护**: LIKE 查询转义 `%` `_` `\` + `ESCAPE '\'` 子句；模板参数使用 `?` 绑定
- **输入校验**: ban_duration 使用 regex `/^(\d+[dhmy]|mute-\d+[dhmy]|permanent|warning|cfba|50[Yy])$/` 校验
