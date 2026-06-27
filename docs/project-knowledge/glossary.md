---
last_updated: 2026-06-07
updated_by: superpowers-memory:update
triggered_by_plan: 2026-06-05-jdcf-phase2-3-4-implementation.md
---

# 术语表

**封禁记录** — 玩家因违规被服务器封禁的完整记录。→ `bans` 表，src/routes/public.ts

**违规等级** — level1(50y/最重)、level2(7d~1y)、level3(30m~7d)、level4/逃逸(14d)、warning(警告)、cfba → `bans.violation_level`

**封禁状态** — computeStatus() 实时计算的 6 种状态: warning/permanent/cfba/banned/muted/unbanned → src/routes/public.ts

**ban_duration 格式** — `永久: permanent/cfba`、`数字+单位: 30m/7d/24h/50y`、`禁言: mute-30m` → regex `/^(\d+)([dhm])$/i`

**权限组** — OWNER(0)>T6(1)>T5(2)>T4(3)>T3(4)>T2(5)>T1(6)，数值越小权限越高 → src/middleware/auth.ts

**重点观察名单** — T3+ 手动维护的观察列表 → `watchlist` 表，src/routes/admin.ts

**归档** — 过期违规的处理记录，写入 `archives`(摘要) + `archive_items`(明细) → schema.sql

**JWT 双通道** — Authorization header（fetch/API 调用）+ httpOnly jwt cookie（页面导航）→ src/middleware/auth.ts
