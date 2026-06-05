---
last_updated: 2026-06-05
updated_by: superpowers-memory:rebuild
triggered_by_plan: null
---

# 技术栈

> 项目尚未实现。以下为规划的技术栈。

## 核心

- **运行时**: Cloudflare Pages Functions（边缘计算）
- **Web 框架**: Hono（JSX SSR 渲染）
- **交互增强**: htmx（14KB CDN 引入）
- **样式**: 原生 CSS（玻璃态 + 瑞士平面设计）

## 数据与认证

- **数据库**: Cloudflare D1（SQLite）
- **认证**: JWT（`@hono/jwt`）+ bcryptjs
- **人机验证**: Cloudflare Turnstile

## 部署与 CI

- **部署**: Cloudflare Pages（关联 git 自动部署）
- **定时任务**: Cloudflare Worker（独立部署，Cron Trigger `0 0 1 * *`）
- **配置**: `wrangler.jsonc`
