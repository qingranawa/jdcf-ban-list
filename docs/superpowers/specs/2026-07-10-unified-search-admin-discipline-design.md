# 统一搜索 + 管理员详情页 + 违纪处罚系统 设计文档

> **Goal:** 改造现有搜索页面支持跨实体搜索（玩家/管理员/封禁条目），新增管理员详情页，新增违纪处罚（admin_discipline）系统

**Architecture:** 复用现有 bans 表 + audit_log 表，不新增表结构；搜索页改为左右分栏布局；管理员详情页采用与玩家详情页一致的玻璃态卡片设计语言

**Tech Stack:** Hono SSR, Cloudflare D1, hono/html tagged templates, glass-card design system, computeStatus

---

## 1. 数据库设计

### 违纪处罚复用 bans 表

违纪处罚（admin_discipline）直接复用 `bans` 表，不新增独立表：

| bans 字段 | 违纪处罚用途 |
|-----------|-------------|
| `violation_level` | 固定值 `'admin_discipline'` |
| `ban_duration` | 处罚类型中文编码：`记过`、`记大过`、`停权1天`、`停权3天`、`停权7天`、`停权30天`、`免除职务`、`复职_停权7天`、`复职_停权14天`、`复职_停权30天`、`永久免职`、`公开道歉` |
| `steam_id` | 受罚管理员的 Steam64 |
| `nickname` | 受罚管理员的 game_name |
| `handled_by` | 执行处罚的管理员 ID |
| `co_handlers` | 联合判定管理员名（逗号分隔） |
| `reason` | 处罚原因 |
| `notes` | 附加说明（如考究结果等） |

### 影响范围

- `computeStatus()` 函数需要新增 `admin_discipline` 处理逻辑
- 违纪处罚**不参与**批量处理、归档流程
- 违纪处罚在公开搜索中不可见（但管理员详情页中可见——那是管理员的个人页）
- 违纪处罚在 `/stats` 统计中独立统计
- 违纪处罚**不自动过期**，即使 `停权7天` 等时限处罚也由管理员手动复职，`computeStatus` 统一返回 `admin_discipline`

---

## 2. 路由设计

| 方法 | 路由 | 说明 | 权限 |
|------|------|------|------|
| GET | `/admin-profile/:id` | 管理员详情页 | 公开 |
| GET | `/api/admin-profiles/:id` | 管理员详情 API | 公开 |
| - | `/search?q=xxx` | 改造现有搜索页 | 公开 |

### 现有路由不受影响

- `/player/:id` — 不变
- `/admin/bans` — 不变
- `/admin/process` — 不变

---

## 3. 搜索页改造

### 布局（左右分栏）

```
┌─────────────────────────────────────────────────────┐
│  🔍 [________________________] [搜索]               │
├────────────────────────┬────────────────────────────┤
│    封禁记录（左列）     │    管理员/玩家（右列）      │
│                        │                            │
│  .glass-table-wrap     │  .search-result-cards      │
│  ┌ 昵称│Steam│...┐    │  ┌── 玩家卡片 ────────┐   │
│  │ row 1          │    │  │ [头像] 昵称 Steam   │   │
│  │ row 2          │    │  │ 总封禁: 5 最高: 2级 │   │
│  │ row 3          │    │  └────────────────────┘   │
│  │ ...            │    │  ┌── 管理员卡片 ──────┐   │
│  └────────────────┘    │  │ [头像] 名称 权限组   │   │
│                        │  │ Steam64 职位         │   │
│                        │  └────────────────────┘   │
│                        │                            │
└────────────────────────┴────────────────────────────┘
```

### 左列：封禁记录表
- 现有的 `.glass-table-wrap` > `.glass-table-inner` > `.glass-table`
- 跟现在的搜索结果一样，显示匹配的封禁记录
- 表头：昵称、Steam ID、原因、等级、状态、操作员、时长、时间

### 右列：管理员/玩家卡片
- 垂直排列的卡片列表
- **管理员卡片**（搜索 nickname 和 game_name 匹配）：
  - 卡片结构：`.glass-card` > `.glass-card-inner`
  - 头像（首字母渐变色圆）
  - 姓名 / Steam64 / 权限组 badge
  - 职位 / 主管事务
  - 点击跳转到 `/admin-profile/:id`
- **玩家卡片**（搜索 nickname 和 steam_id 匹配）：
  - 卡片结构：`.glass-card` > `.glass-card-inner`
  - 头像（首字母渐变色圆）
  - 昵称 / Steam ID
  - 总封禁数 / 最高违规等级 / 当前状态
  - 点击跳转到 `/player/:ban-id`

### 搜索逻辑
- `query` 同时模糊匹配：
  1. `bans` 表：nickname、steam_id、ip_address、reason、notes（已有）
  2. `admins` 表：game_name、username、steam_id（新增跨表搜索）
- 去重：管理员的唯一性由 steam_id 保证
- 分页：左列封禁表 + 右列卡片各自分页（右列默认最多展示 10 个）

### 移动端适配
- `<768px`：左右分栏折叠为单列竖排
- 顺序：搜索框 → 右列卡片（管理员/玩家）→ 左列封禁表
- 使用 `grid-template-columns: 1fr` 或 `flex-direction: column`

---

## 4. 管理员详情页

### URL: `/admin-profile/:id`

### 布局（与玩家详情页统一风格）

```
┌─────────────────────────────────────────────────────┐
│  封禁列表 / 管理组 / 管理员名                        │
├─────────────────────────────────────────────────────┤
│  .glass-card > .glass-card-inner                     │
│  [头像] 管理员名 + 权限组 badge + 当前违纪状态      │
│          Steam64: 76561199...                        │
│          QQ / 职位 / 主管事务                        │
├──────────┬──────────┬──────────┬────────────────────┤
│ 封禁处理   │ 违纪处罚  │ 最高违规  │ 总操作数          │
│  42 条    │  1 条     │ 2 级违规 │  156 次            │
│  (4 卡片，每格 .glass-card > .glass-card-inner)     │
├─────────────────────────────────────────────────────┤
│  经手封禁记录（他封了别人）                           │
│  .glass-table-wrap > .glass-table-inner > .glass-table│
│  时间 │ 玩家 │ 原因 │ 等级 │ 状态 │ 时长             │
├─────────────────────────────────────────────────────┤
│  违纪处罚记录（他被处罚）                             │
│  .glass-table-wrap > .glass-table-inner > .glass-table│
│  时间 │ 处罚类型 │ 执行人 │ 联合判定 │ 备注           │
├─────────────────────────────────────────────────────┤
│  审计日志（他的所有操作）                             │
│  .glass-table-wrap > .glass-table-inner > .glass-table│
│  时间 │ 操作类型 │ 目标类型 │ 目标 ID │ 详情          │
└─────────────────────────────────────────────────────┘
```

### 四个统计卡片
| 统计项 | SQL |
|--------|-----|
| 封禁处理 | `SELECT COUNT(*) FROM bans WHERE handled_by = ? AND is_archived = 0 AND violation_level != 'admin_discipline'` |
| 违纪处罚 | `SELECT COUNT(*) FROM bans WHERE steam_id = ? AND violation_level = 'admin_discipline'` |
| 最高违规 | `SELECT violation_level FROM bans WHERE handled_by = ? ORDER BY ... LIMIT 1` |
| 总操作数 | `SELECT COUNT(*) FROM audit_log WHERE admin_id = ?` |

### 三个表格
| 表格 | 数据源 | 排序 |
|------|--------|------|
| 经手封禁记录 | `bans WHERE handled_by = :adminId AND violation_level != 'admin_discipline'` | `created_at DESC` |
| 违纪处罚记录 | `bans WHERE steam_id = :adminSteamId AND violation_level = 'admin_discipline'` | `created_at DESC` |
| 审计日志 | `audit_log WHERE admin_id = :adminId` | `created_at DESC` |

---

## 5. 违纪处罚管理系统

### 封禁表单新增「违纪处罚」

在 `/admin/bans` 的创建/编辑表单中：
- 违规等级下拉新增选项：`违纪处罚`
- 选择 `违纪处罚` 后，封禁时长下拉改为违纪处罚类型选择：
  - 记过
  - 记大过
  - 停权1天、停权3天、停权7天、停权30天
  - 免除职务
  - 复职_停权7天、复职_停权14天、复职_停权30天
  - 永久免职
  - 公开道歉
- Steam ID 字段标签改为「受罚管理员 Steam64」
- 联合封禁管理员字段标签改为「联合判定管理员」

### 违纪处罚不参与的逻辑
- 不进入批量处理页面
- 不进入归档流程
- 不被 `computeStatus()` 计算为 `unbanned`
- 不被 `/stats` 统计到等级分布中
- 不被公开搜索展示（仅管理员搜索可见）

---

## 6. computeStatus 变更

违纪处罚不参与自动状态计算——所有违纪处罚统一返回 `admin_discipline` 状态，由管理员手动管理（复职、撤销）：

```typescript
function computeStatus(ban: { ban_duration: string; ban_time: string; archive_action: string | null; violation_level: string }): string {
  // 违纪处罚 — 不自动解封，状态由管理员手动管理
  if (ban.violation_level === 'admin_discipline') {
    return 'admin_discipline'
  }
  // ... 现有逻辑不变
}
```

违纪处罚的 `status` 统一返回 `admin_discipline`，在公众搜索页不渲染（只出现在管理员详情页和管理后台）。

---

## 7. 管理员详情页视图（admin-profile.ts）

新建 `src/views/admin-profile.ts`，遵循 `.glass-card` > `.glass-card-inner` 双层结构：

- AdminProfilePage 组件接收完整的管理员资料 + 三个表格数据
- badge 样式统一使用 `.badge` + `.badge-*` 系统（与 player.ts 一致）
- 所有卡片引用 `.glass-card` 外框 + `.glass-card-inner` 内容层

---

## 8. 不涉及变更的现有文件

| 文件 | 说明 |
|------|------|
| `src/views/layout.ts` | 不变 |
| `src/views/admin-layout.ts` | 不变 |
| `src/views/home.ts` | 不变 |
| `src/views/admin-bans.ts` | 仅表单新增违纪处罚选项 |
| `src/views/styles.ts` | 不变（已有一整套玻璃态样式） |
| `src/helpers/format.ts` | 新增违纪处罚标签函数 |
| `src/db.ts` | 不变 |
| `src/middleware/auth.ts` | 不变 |

---

## 9. 实现顺序

1. 新增 `computeStatus` 违纪处罚逻辑
2. 新建管理员详情页路由 + 视图（`public.ts` + `admin-profile.ts`）
3. 管理员详情页数据查询
4. 搜索页改造（左右分栏 + 跨实体搜索）
5. 违纪处罚表单 UI
6. 测试

---

## 10. 测试要点

- 管理员详情页：数据正确性（经手封禁、违纪处罚、审计日志条数）
- 跨实体搜索：管理员按 name/game_name 搜出来、去重逻辑
- 违纪处罚：不参与批量处理、不参与归档、不参与统计
- 搜索页左右分栏响应式（移动端是否竖排？）
