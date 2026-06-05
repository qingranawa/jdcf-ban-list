---
last_updated: 2026-06-05
updated_by: superpowers-memory:rebuild
triggered_by_plan: null
---

# 功能特性

> 项目尚未实现。所有功能处于设计阶段。

## Planned

### 封禁查询（公开）
- **Enables**: 玩家搜索/筛选封禁记录
- **Actors**: 所有访客
- 入口: 首页 `/`
- 状态: 设计完成，待实现

### 管理员公示（公开）
- **Enables**: 查看管理团队信息
- **Actors**: 所有访客
- 入口: `/team`
- 状态: 设计完成，待实现

### 封禁管理（后台）
- **Enables**: 管理员增删改封禁记录
- **Actors**: T1~T6 / OWNER
- 入口: `/admin/bans`（需登录）
- 状态: 设计完成，待实现

### 管理组管理（后台）
- **Enables**: OWNER 管理所有管理员账号与权限
- **Actors**: 仅 OWNER
- 入口: `/admin/team`（需登录+OWNER）
- 状态: 设计完成，待实现

### 黑名单总表
- **Enables**: T3+ 管理员查看所有被封禁玩家汇总
- **Actors**: T3~T6 / OWNER
- 入口: `/blacklist`
- 状态: 设计完成，待实现

### 月度归档
- **Enables**: 每月1日自动处理过期封禁（3级删除、2级降级）
- **Actors**: Cron Worker
- 状态: 设计完成，待实现
