# 鸡蛋肠粉封禁查询

SCP: Secret Laboratory "[CN] 鸡蛋肠粉服务器" 封禁公示与管理系统。

**线上地址**: https://jdcf-ban-list.pages.dev

## 功能

- **封禁查询** — 公开搜索（昵称/Steam ID/IP）、按违规等级/封禁状态筛选、分页浏览所有封禁记录，含统计信息看板
- **首页警告标签** — Segmented Control 支持"全部/警告/禁言/封禁"快速过滤
- **管理组公示** — 公开查看管理团队信息
- **统计信息页** — 违规等级占比（饼图/环形图）、操作员处理排行（水平柱状图）、30 天趋势（折线图）、封禁时长分布（柱状图）
- **管理后台** — 封禁 CRUD、批量处理过期违规、重点观察名单、管理组管理、归档日志
- **权限分级** — OWNER → T6 → T5 → T4 → T3 → T2 → T1，逐级控制操作范围
- **JWT 认证** — Steam ID + 用户名 + 密码登录（HttpOnly Cookie + Bearer Header 双通道）
- **联合封禁管理员** — 每个封禁记录可指定多个联合操作员（co_handlers）
- **快速添加封禁** — 导航栏中可直接弹出全局弹窗添加封禁记录

## 技术架构

```
functions/[[path]].ts          ← Cloudflare Pages Functions 单一入口
src/
├── routes/                     ← 4 组路由（public / auth / admin / account）
│   ├── public.ts               ← 公开首页 + 搜索分页 + 统计信息 + 管理组公示
│   ├── auth.ts                 ← 登录 / JWT 签发 / 退出
│   ├── admin.ts                ← 封禁 CRUD + 批量处理 + 观察名单 + 归档 + 管理组管理
│   └── account.ts              ← 账户自助管理
├── views/                      ← Hono html 模板（服务端渲染）
│   ├── layout.ts               ← 公开布局（导航栏 + 全局添加封禁弹窗）
│   ├── admin-layout.ts         ← 后台侧边栏布局
│   ├── home.ts                 ← 首页组件（统计卡片 + 搜索 + 表格 + 分页）
│   ├── stats.ts                ← 统计信息页（Chart.js 图表）
│   ├── styles.ts               ← 共享 CSS Token 系统
│   ├── icons.ts                ← 内联 SVG 图标库
│   ├── config/bg-images.ts     ← 背景图配置与随机选取
│   └── ...                     ← 各功能页组件
├── middleware/auth.ts          ← JWT 认证（header + cookie 双通道）+ 权限校验
├── helpers/escape.ts           ← HTML 转义防 XSS
└── db.ts                       ← D1 绑定类型
```

- **运行时**: Cloudflare Pages Functions（Hono SSR + html 模板）
- **数据库**: Cloudflare D1（SQLite），7 张表
- **交互增强**: htmx 2.0.4 局部更新（搜索、分页无需整页刷新）
- **统计图表**: Chart.js v4（CDN），含自定义插件
- **样式**: 纯 CSS 暗色玻璃态（cyberpunk）主题，多背景图系统

## D1 数据库维护

### 绑定信息

```jsonc
// wrangler.jsonc
{
  "d1_databases": [{
    "binding": "DB",
    "database_name": "jdcf-db",
    "database_id": "21a26dff-75d7-4629-a008-fb6c9d603f95"
  }]
}
```

### 初始化表结构

```bash
npm run db:init
# 等同于
npx wrangler d1 execute jdcf-db --file=schema.sql
```

### 执行迁移

```bash
# 001: 添加 co_handlers 列（联合封禁管理员）
npx wrangler d1 execute jdcf-db --file=migrations/001_add_co_handlers.sql
```

### 创建初始管理员

```bash
# 首次部署用 init-db.js，会自动建表 + 创建 OWNER 账号
# 通过环境变量指定初始凭据（不设置则使用默认值）
set INIT_STEAM_ID=你的Steam64位ID
set INIT_ADMIN_USER=admin
set INIT_ADMIN_PASSWORD=你的密码
npm run db:seed
```

脚本会自动生成 bcrypt 哈希并插入数据库。如果不设环境变量，默认用户名 `admin`、密码 `change_me_123`、Steam ID 为占位符（部署后记得改）。

### 查询数据

```bash
# 在线查询
npx wrangler d1 execute jdcf-db --command="SELECT COUNT(*) FROM bans;"

# 交互式 SQL（需要安装 wrangler 3.60+）
npx wrangler d1 execute jdcf-db --command="SELECT * FROM bans WHERE steam_id = '76561198000000000';"
```

### 备份

```bash
npx wrangler d1 export jdcf-db --output=./backup-$(date +%Y%m%d).sql
```

### 数据修复

```bash
# 批量修改违规等级
npx wrangler d1 execute jdcf-db --command="UPDATE bans SET violation_level = 'level3' WHERE ban_duration = '30m';"
```

## Cloudflare Pages 部署

### 前置条件

1. 安装 [Node.js](https://nodejs.org) ≥ 18
2. `npm install -g wrangler`（或 `pnpm add -g wrangler`）
3. 登录 Cloudflare: `npx wrangler login`
4. 在 Cloudflare Dashboard 创建 Pages 项目，绑定 D1 数据库

### 本地开发

```bash
pnpm install
npx wrangler pages dev functions/ --binding DB=jdcf-db
```

浏览器打开 `http://localhost:8789`。

### 部署到生产

推送 `master` 分支后，Cloudflare Pages 自动部署，无需手动操作。

```bash
git push origin master
```

> 部署由 Cloudflare Dashboard 中 Pages 项目的 Git 集成驱动。每次 push 到 master 都会触发构建和发布。

### 环境变量

在 Cloudflare Pages Dashboard → Settings → Environment variables 中设置：

| 变量 | 说明 |
|------|------|
| `JWT_SECRET` | JWT 签名密钥，至少 32 字符随机字符串 |
| `CRON_ARCHIVE_SECRET` | Cron Worker 鉴权密钥（当前手动处理，可留空） |

### 日志查看

```bash
npx wrangler pages deployment tail
# 或
npx wrangler tail
```

## 权限模型

| 权限组 | 数值 | 权限范围 |
|--------|------|---------|
| OWNER | 0 | 全部权限 |
| T6 | 1 | 全部管理操作 + 注册新管理员 |
| T5 | 2 | 管理管理员账号 |
| T4 | 3 | 查看归档日志 |
| T3 | 4 | 维护重点观察名单 |
| T2 | 5 | — |
| T1 | 6 | 基础封禁管理 |

## 许可证

MIT License — 详见 [LICENSE](LICENSE)

## 联系方式

管理组内有技术能力的成员，欢迎参与维护本项目——请联系 清然（QQ: 2816401189）获取协作权限。

- **SCP:SL 服务器**: CN 鸡蛋肠粉服务器
