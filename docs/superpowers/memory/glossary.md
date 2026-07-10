---
last_updated: 2026-07-10
updated_by: superpowers-memory:ingest
covers_branch: master@95e3818
triggered_by_plan: null
---

# 术语表

**封禁记录** — 玩家因违规被服务器封禁的完整记录。→ bans 表

**违规等级** — level1(最重)~level3+warning+cfba+level4(逃逸)。→ bans.violation_level

**封禁状态** — computeStatus() 实时计算 6 种状态: warning/permanent/cfba/banned/muted/unbanned。→ src/routes/public.ts

**权限组** — OWNER(0)>T6(1)>T5(2)>T4(3)>T3(4)>T2(5)>T1(6)，越小越高。→ src/middleware/auth.ts

**JWT 双通道** — Authorization header（API）+ httpOnly cookie（页面导航，无 Secure）。→ src/middleware/auth.ts

**公告系统** — T4+ 发布/编辑公告，6 种类型，支持 Markdown/置顶/定时/已读。→ announcements 表

**内部通知** — 公告类型之一，仅 T3+ 可见。→ announcements.type = 'internal'

**登录限流** — 同一 IP 5 次登录失败后锁定 15 分钟。→ login_attempts 表, src/middleware/rate-limit.ts

**审计日志** — 封禁/公告/管理组 CRUD 操作的 fire-and-forget 记录。→ audit_log 表, src/routes/admin.ts

**联合封禁** — 多人同时操作同一封禁记录，co_handlers JSON 字段存储。→ bans.co_handlers

**Dev Mode** — DEV_MODE 环境变量+dev.ts 中间件，开发环境绕过 JWT 认证。→ src/middleware/dev.ts
