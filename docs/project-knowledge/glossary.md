---
last_updated: 2026-06-29
updated_by: opencode
covers_branch: master
---

# 术语表

**封禁记录** — 玩家因违规被服务器封禁的完整记录，含封禁管理员和联合封禁管理员。→ `bans` 表，src/routes/public.ts

**违规等级** — level1(50y/最重)、level2(7d~1y)、level3(30m~7d)、level4/逃逸(14d)、warning(警告)、cfba → `bans.violation_level`

**封禁状态** — computeStatus() 实时计算的 6 种状态: warning/permanent/cfba/banned/muted/unbanned → src/routes/public.ts

**ban_duration 格式** — `永久: permanent/cfba`、`数字+单位: 30m/7d/24h/50y`、`禁言: mute-30m` → regex `/^(\d+[dhmy]|mute-\d+[dhmy]|permanent|warning|cfba|50[Yy])$/`

**权限组** — OWNER(0)>T6(1)>T5(2)>T4(3)>T3(4)>T2(5)>T1(6)，数值越小权限越高 → src/middleware/auth.ts

**重点观察名单** — T3+ 手动维护的观察列表 → `watchlist` 表，src/routes/admin.ts

**归档** — 过期违规的处理记录，写入 `archives`(摘要) + `archive_items`(明细) → schema.sql

**JWT 双通道** — Authorization header（fetch/API 调用）+ httpOnly jwt cookie（页面导航，无 Secure 标志支持 HTTP）→ src/middleware/auth.ts

**联合封禁管理员 (co_handlers)** — 逗号分隔的字符串，存储在 `bans.co_handlers` 列，展示为 `[主操作员], [联合1], [联合2]` → migrations/001_add_co_handlers.sql

**统计信息页** — `/stats` 路由提供违规等级占比、操作员排行、30 天趋势、时长分类图表 → src/views/stats.ts

**pctLabelPlugin** — Chart.js 自定义 `afterDraw` 插件，在饼图/环形图切片上显示百分比标签（带背景 pill）→ src/views/stats.ts

**背景图预加载** — CSS `background-image` 多图层叠加 + `<link rel="preload">` + `window.onload` 预填缓存，无 JS 切换 → src/views/layout.ts, src/config/bg-images.ts

**全局添加封禁弹窗** — 导航栏"添加封禁"按钮触发的全屏居中弹窗，在所有页面可用 → src/views/layout.ts
