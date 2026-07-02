---
last_updated: 2026-07-02
updated_by: superpowers-memory:update
covers_branch: master@5d8e1ee
triggered_by_plan: 2026-07-02-announcements-plan.md
---

# 术语表

**封禁记录** — 玩家因违规被服务器封禁的完整记录。→ bans 表

**违规等级** — level1(最重)~level3+warning+cfba+level4(逃逸)。→ bans.violation_level

**封禁状态** — computeStatus() 实时计算 6 种状态: warning/permanent/cfba/banned/muted/unbanned。→ src/routes/public.ts

**权限组** — OWNER(0)>T6(1)>T5(2)>T4(3)>T3(4)>T2(5)>T1(6)，越小越高。→ src/middleware/auth.ts

**JWT 双通道** — Authorization header（API）+ httpOnly cookie（页面导航，无 Secure）。→ src/middleware/auth.ts

**公告系统** — T4+ 发布公告，6 种类型，支持 Markdown/置顶/定时/已读。→ announcements 表

**内部通知** — 公告类型之一，仅 T3+ 可见。→ announcements.type = 'internal'
