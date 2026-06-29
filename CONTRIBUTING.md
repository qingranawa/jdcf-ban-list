# 参与贡献

感谢你对鸡蛋肠粉封禁查询项目的关注。

## 邀请有技术能力的管理组成员

如果你同时满足以下条件：

1. 是 鸡蛋肠粉服务器 **管理组的正式成员**
2. 具备前端或后端开发能力（JavaScript / TypeScript / Cloudflare 平台）
3. 希望参与维护和迭代封禁查询系统

**欢迎联系**，申请加入本仓库的 Collaborator。本项目负责人审核通过后，你将获得 push 权限。

## 非管理组成员

本仓库目前仅接受管理组成员的直接贡献。如果你发现了 Bug 或有改进建议，可以通过以下方式反馈：

- 在服务器群内联系管理员
- 通过 GitHub Issues 提交问题报告

---

## 项目知识库

在动手写代码之前，建议先浏览 `docs/project-knowledge/`，里面记录了项目的完整上下文：

| 文件 | 内容 |
|------|------|
| [architecture.md](docs/project-knowledge/architecture.md) | 系统架构：分层设计、登录/搜索/归档流程的序列图、封禁状态机和归档状态机、关键设计决策 |
| [features.md](docs/project-knowledge/features.md) | 功能总览：哪些功能已实现、入口在哪、权限要求 |
| [tech-stack.md](docs/project-knowledge/tech-stack.md) | 技术栈：运行时、依赖版本、选型原因、已放弃的方案 |
| [conventions.md](docs/project-knowledge/conventions.md) | 开发约定：命名规范、API 风格、权限模型、跨切面关注点（认证/转义/错误处理） |
| [glossary.md](docs/project-knowledge/glossary.md) | 术语定义：封禁记录、违规等级、duration 格式、权限组、JWT 双通道等 |
| [index.md](docs/project-knowledge/index.md) | 索引：每个文件的摘要，帮助快速定位 |

---

## 代码结构

```
functions/[[path]].ts          ← Cloudflare Pages Functions 单一入口，挂载所有路由
src/
├── routes/                     ← 路由层——处理请求、调 DB、返回 HTML 或 JSON
│   ├── public.ts               ← 公开首页、搜索分页、统计信息、管理组公示、状态计算
│   ├── auth.ts                 ← 登录表单 + POST /api/login 签发 JWT
│   ├── admin.ts                ← 封禁 CRUD、批量处理过期违规、观察名单、归档日志、管理组管理
│   └── account.ts              ← 自助账户查询和修改
├── views/                      ← Hono html 服务端模板（返回完整 HTML 页面或 htmx 片段）
│   ├── layout.ts               ← 公开页布局（导航栏 + 全局添加封禁弹窗 + 页脚）
│   ├── admin-layout.ts         ← 后台侧边栏布局（独立于公开布局）
│   ├── home.ts                 ← 首页：统计卡片 + 搜索筛选 + 封禁表格 + 分页
│   ├── stats.ts                ← 统计信息页：Chart.js 图表（饼图/柱状图/折线图）
│   ├── styles.ts               ← 共享 CSS Token 系统（cyberpunk 玻璃态）
│   ├── icons.ts                ← 内联 SVG 图标库
│   ├── team.ts                 ← 管理组公示页
│   ├── account.ts              ← 账户设置页（客户端 JS 调用 API）
│   ├── login.ts                ← 管理员登录页
│   ├── admin-bans.ts           ← 封禁管理列表 + 新增/编辑表单
│   ├── admin-process.ts        ← 批量处理过期违规页
│   ├── admin-watchlist.ts      ← 重点观察名单页
│   └── admin-team.ts           ← 管理组管理页
├── config/
│   └── bg-images.ts            ← 背景图配置与随机选取
├── middleware/auth.ts          ← JWT 认证中间件（header + cookie 双通道）+ 权限分级校验
├── helpers/escape.ts           ← HTML/属性转义工具（XSS 防护）
└── db.ts                       ← D1 绑定类型定义、行类型

scripts/
├── init-db.js                  ← D1 建表 + 种子数据初始化
└── import-bans.js              ← Excel 封禁数据导入脚本（一次性）

worker-cron/                    ← Cron Worker（当前未启用，改为手动处理）
schema.sql                      ← 完整 DDL（7 张表 + 索引）
seed.sql                        ← 初始管理员账号
migrations/
└── 001_add_co_handlers.sql     ← 联合封禁管理员字段迁移
```

### 关键设计决策

- **Hono html 模板不是 React** — 视图文件用 `.ts` 扩展名但走 Hono 的 `html` 模板字面量，不支持 React 的 style 对象语法，所有 CSS 必须写字符串
- **htmx 局部更新** — 服务端检测 `HX-Request` 请求头，有则只返回片段（如 `BanTable`），没有则返回完整页面
- **状态不存库** — `computeStatus()` 在每次读取时根据 `ban_duration` + `ban_time` + `archive_action` 实时计算
- **JWT 双通道** — API 调用走 `Authorization: Bearer` header，页面导航走 httpOnly `jwt` cookie（避免浏览器页面请求 401）
- **GROUP_RANK 数值** — OWNER=0 权限最高，T1=6 最低，`requirePermission('T5')` 要求当前用户 rank ≤ 2
- **Cyberpunk 玻璃态 UI** — 暗色主题，`backdrop-filter: blur(8px)` 毛玻璃效果，霓虹色调（青/品红/琥珀），CSS Token 统一管理于 `styles.ts`
- **多背景图系统** — CSS `background-image` 多图层叠加（随机图 + `3.jpg` 兜底），`<link rel="preload">` 提前加载，无 JS 切换
- **Chart.js 统计图表** — v4 CDN，饼图/环形图使用 `aspectRatio: 1` 自定义 `afterDraw` 插件显示百分比标签

---

## 开发环境搭建

### 前置条件

- Node.js ≥ 18
- pnpm（`npm install -g pnpm`）
- Cloudflare 账号 + Wrangler CLI 登录

### Cloudflare 权限

协作开发需要操作 D1 数据库和 Pages 部署，你需要把 Cloudflare 账号加入项目：

1. 你注册一个 [Cloudflare](https://dash.cloudflare.com/sign-up) 账号
2. 把注册邮箱发给 清然（QQ: 2816401189）
3. 清然在 Cloudflare Dashboard → Pages → jdcf-ban-list → Settings → Members 中添加你为 **Collaborator**
4. 你在本地生成 API Token：Dashboard → 右上角头像 → My Profile → API Tokens → Create Token → 选 **"Workers"** 模板，授权范围勾选 `Account Resources: All accounts` → `All zones`
5. 把 Token 设到本地：`npx wrangler login` 或在 `~/.wrangler/config/default.toml` 中配置

> API Token 是**私密的**，不要提交到仓库或发给任何人。

### 本地运行

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器（需要 D1 本地模拟或远程绑定）
npx wrangler pages dev functions/ --binding DB=jdcf-db

# 浏览器打开 http://localhost:8789
```

### 数据库操作

```bash
# 建表
npx wrangler d1 execute jdcf-db --file=schema.sql

# 执行迁移
npx wrangler d1 execute jdcf-db --file=migrations/001_add_co_handlers.sql

# 导入种子数据
npx wrangler d1 execute jdcf-db --file=seed.sql

# 执行单条 SQL
npx wrangler d1 execute jdcf-db --command="SELECT COUNT(*) FROM bans;"

# 导出备份
npx wrangler d1 export jdcf-db --output=./backup.sql
```

### 部署

```bash
# 手动部署
pnpm run deploy

# 或推 GitHub → Cloudflare Pages 自动部署
git push origin master
```

### 环境变量

本地开发时在 `.dev.vars` 中设置：

```
JWT_SECRET=你的32字符以上随机字符串
```

生产环境在 Cloudflare Pages Dashboard → Settings → Environment variables 中配置。

---

## 开发流程

### 1. 拉分支

```bash
git checkout master
git pull origin master
git checkout -b feat/要做的功能
```

分支命名：`feat/<描述>` / `fix/<描述>` / `refactor/<描述>` / `chore/<描述>`

### 2. 开发

- 路由逻辑写 `src/routes/`，页面模板写 `src/views/`
- 新增路由后在 `functions/[[path]].ts` 挂载
- 修改数据库结构后同步更新 `schema.sql`、`migrations/` 和 `src/db.ts` 类型
- 改完代码跑一下知识库更新：让 Claude Code 执行"跑kb"

### 3. 自测

```bash
# 本地跑一遍确认不崩
npx wrangler pages dev functions/ --binding DB=jdcf-db

# TypeScript 编译检查
npx tsc --noEmit

# 走一遍关键路径：
# - 首页加载、搜索、翻页
# - 登录流程
# - 后台各页面
# - API 响应是否正确
```

### 4. 提交

```bash
git add <具体文件>           # 不要 git add .
git commit -m "feat(scope): 做了什么"
git push origin feat/要做的功能
```

Commit 格式：`type(scope): 概要`

| type | 用途 | 示例 |
|------|------|------|
| feat | 新功能 | `feat(auth): 添加记住密码功能` |
| fix | 修 Bug | `fix(ban): 修复禁言状态不过期` |
| refactor | 重构 | `refactor(admin): 提取公共校验逻辑` |
| style | 样式/格式 | `style(nav): 导航栏增加渐变效果` |
| docs | 文档 | `docs: 更新 README 部署说明` |
| chore | 工具/配置 | `chore: 升级 wrangler 到 4.x` |

### 5. 创建 PR

推送后在 GitHub 仓库页面创建 Pull Request，写清楚改了什么、为什么这样改。

**PR 必须至少 1 人审核通过（approve）后才能合并。** 这是仓库分支保护规则强制要求的，不能绕过。没有 approve 的 PR 无法 merge。

审核者应检查：
- 代码逻辑是否正确
- 是否遵循了项目约定（见上文"代码结构"和下文"代码规范"）
- 本地能否跑通
- 有没有遗留的调试代码

### 6. 合并后

- 点击 Squash merge 合并到 master
- 删除功能分支（PR 页面有按钮）
- **推送 master 后 Cloudflare Pages 自动部署**，等一两分钟刷新线上确认
- 如有数据库变更（schema.sql 或 migrations/ 改了），手动同步到 D1
- 跑一次"跑kb"更新项目知识库

---

## 代码规范

- TypeScript 用 camelCase 命名，注释写中文
- 用 Prettier 格式化（`npx prettier --write .`）
- HTML 输出一律通过 `escHtml()` / `escAttr()` 转义，别裸拼字符串
- `console.log` / `debugger` 别留在生产代码里
- 不引入新依赖除非确有必要，先和 清然 确认
- 不要改无关代码、不要顺手重构、不要清理别人的"死代码"
- 新视图 CSS 类名使用 `cyber-` 前缀（`cyber-table`, `cyber-btn`, `cyber-card`, `cyber-input`, `cyber-badge` 等）
- 遵循 `styles.ts` 中定义的 CSS Token 系统（玻璃态背景、霓虹色板、间距体系）
