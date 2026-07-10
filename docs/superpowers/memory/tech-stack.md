---
last_updated: 2026-07-02
updated_by: superpowers-memory:update
covers_branch: master@5d8e1ee
triggered_by_plan: 2026-07-02-announcements-plan.md
---

# 技术栈

## 运行时与框架

| 依赖 | 版本 | 用途 |
|------|------|------|
| Hono | ^4.6.0 | Web 框架，SSR |
| htmx | 2.0.4 (CDN) | 局部更新 |
| Chart.js | 4.x (CDN) | 统计图表 |
| marked | latest (CDN) | Markdown 渲染（公告正文） |
| Cloudflare Pages Functions | — | 边缘运行时 |
| Cloudflare D1 | — | SQLite 数据库 |

## 认证与安全

| 依赖 | 用途 |
|------|------|
| hono/jwt | JWT 签发验证（HS256） |
| bcryptjs | 密码哈希（10 轮 salt） |

## 环境变量

| 变量 | 用途 |
|------|------|
| JWT_SECRET | JWT 签名密钥 |
| CRON_ARCHIVE_SECRET | Cron Worker 归档鉴权 |
| CRON_PUBLISH_SECRET | Cron Worker 定时发布公告鉴权 |
| DB | D1 数据库绑定 |
