---
last_updated: 2026-06-29
updated_by: opencode
covers_branch: master
---

# 技术栈

## 运行时与框架

| 依赖 | 版本 | 用途 | 选择原因 |
|------|------|------|---------|
| Hono | ^4.6.0 | Web 框架，html SSR 渲染 | 轻量（~12KB），Cloudflare Pages 原生支持 |
| htmx | 2.0.4 (CDN) | 局部页面更新 | 14KB，无需整页刷新即可实现搜索/翻页 |
| Chart.js | 4.x (CDN) | 统计图表渲染 | 轻量（~60KB gzip），丰富的图表类型，自定义插件支持 |
| Cloudflare Pages Functions | — | 边缘运行时 | 与 D1 同区域低延迟，免费额度充足 |
| Cloudflare D1 | — | SQLite 数据库 | 边缘一致，零运维，与 Pages 同区域 |

## 前端依赖（CDN）

| 依赖 | 版本 | 用途 |
|------|------|------|
| htmx | 2.0.4 | 局部页面更新（搜索、分页） |
| Chart.js | 4.x | 统计图表（饼图、环形图、柱状图、折线图） |

## 认证与安全

| 依赖 | 版本 | 用途 |
|------|------|------|
| hono/jwt | 内建 | JWT 签发与验证（HS256） |
| bcryptjs | ^2.4.3 | 密码哈希（10 轮 salt） |

## 部署与工具

| 工具 | 版本 | 用途 |
|------|------|------|
| wrangler | ^3.60.0 | Pages 部署 + D1 管理 |
| TypeScript | ^5.5.0 | 类型检查 |

## 已放弃

- **Cloudflare Turnstile** — CDN 国内被屏蔽，登录表单改为纯 fetch 提交
- **Cron Worker 自动归档** — 改为管理后台手动处理页面
- **xlsx** — Excel 数据导入用 `import-bans.js` 一次性脚本，非持续依赖
