---
last_updated: 2026-06-05
updated_by: superpowers-memory:rebuild
triggered_by_plan: null
---

# 约定

> 项目尚未实现。以下为设计阶段约定的规范。

## 数据库命名
- 表名: 全小写复数形式（`bans`, `admins`, `blacklist`, `archives`）
- 字段: snake_case
- 所有表包含 `id`(PK)、`created_at`、`updated_at`

## API 风格
- RESTful JSON API
- 认证: `Authorization: Bearer <JWT>` 头
- 分页: 查询参数 `?page=1&limit=20`
- 错误: HTTP 状态码 + JSON body `{ error: string }`

## 权限校验
- 中间件模式，按路由配置 `requireAuth(level)` 或 `requirePermission(minGroup)`
- 权限组比较: `T1` < `T2` < `T3` < `T4` < `T5` < `T6` < `OWNER`

## 视觉
- 深色主题
- 原生 CSS，无框架
- 响应式（Mobile First）
- 零外部字体加载
