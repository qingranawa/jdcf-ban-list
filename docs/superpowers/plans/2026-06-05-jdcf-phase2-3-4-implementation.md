# Phase 2-4: 封禁查询 + 管理后台 + 归档系统 实施计划

> **For agentic workers:** Use superpowers:subagent-driven-development to implement task-by-task.

**Goal:** 完成封禁查询网站的全部功能：公开查询完善、管理后台 CRUD、月度归档系统

**Architecture:** 在 Phase 1 已完成的 Hono SSR + D1 + JWT 基础上，新增 admin 路由（`/admin/*` 受保护）和独立 Cron Worker。

**Current state:** Phase 1 已完成 — 公开封禁列表、管理组公示、JWT 登录、D1 远程数据库(156条数据)

**Design Spec:** `docs/superpowers/specs/2026-06-05-jdcf-ban-list-design.md`

---

## Task 1: Admin 路由 + 封禁 CRUD API

**文件：** `Create: src/routes/admin.ts`

新增管理后台路由，包含封禁记录的增删改 API。
所有 `/admin/*` 路由需要 JWT 认证，使用 `authMiddleware` + `requirePermission`。

```typescript
import { Hono } from 'hono'
import type { Env } from '../db'
import { authMiddleware, requirePermission } from '../middleware/auth'
import { Layout } from '../views/layout'
import { AdminBanListPage, AdminBanFormPage } from '../views/admin-bans'

export const adminRoutes = new Hono<{ Bindings: Env }>()

// 所有 admin 路由需要登录
adminRoutes.use('*', authMiddleware)

// ── 封禁列表管理 ──
adminRoutes.get('/admin/bans', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all()

  const countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM bans').first<{ total: number }>()
  const total = countResult?.total || 0

  return c.html(Layout({
    title: '封禁管理',
    currentPath: '/admin/bans',
    children: AdminBanListPage({
      bans: rows.results.map(r => ({ ...r })),
      page, totalPages: Math.ceil(total / limit), total,
    }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// ── 新增封禁页面 ──
adminRoutes.get('/admin/bans/new', requirePermission('T1'), (c) => {
  return c.html(Layout({
    title: '新增封禁',
    currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban: null }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// ── 编辑封禁页面 ──
adminRoutes.get('/admin/bans/:id/edit', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const ban = await c.env.DB.prepare('SELECT * FROM bans WHERE id = ?').bind(id).first()
  if (!ban) return c.text('未找到该记录', 404)

  return c.html(Layout({
    title: '编辑封禁',
    currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// ── API: 新增封禁 ──
adminRoutes.post('/api/admin/bans', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')

  // 验证
  if (!body.nickname || !body.steam_id) {
    return c.json({ error: '昵称和 Steam ID 为必填' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, notes, handled_by)
     VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`
  ).bind(
    body.nickname, body.steam_id, body.ip_address || '',
    body.reason || '', body.ban_duration || '30m',
    body.violation_level || 'level3', body.notes || '', adminId
  ).run()

  // 异步更新黑名单总表
  await c.env.DB.prepare(
    `INSERT INTO blacklist (steam_id, nickname, ip_address, ban_count, last_ban_at, latest_violation_level)
     VALUES (?, ?, ?, 1, datetime('now'), ?)
     ON CONFLICT(steam_id) DO UPDATE SET
       ban_count = ban_count + 1,
       last_ban_at = datetime('now'),
       latest_violation_level = ?,
       nickname = ?,
       updated_at = datetime('now')`
  ).bind(body.steam_id, body.nickname, body.ip_address || '',
         body.violation_level || 'level3', body.violation_level || 'level3', body.nickname).run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// ── API: 修改封禁 ──
adminRoutes.put('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')
  const body = await c.req.json()

  // 权限检查: 修改他人的需要 T5+
  const existing = await c.env.DB.prepare('SELECT handled_by FROM bans WHERE id = ?').bind(id).first<{ handled_by: number }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  if (existing.handled_by !== adminId) {
    const rank = { OWNER:0, T6:1, T5:2, T4:3, T3:4, T2:5, T1:6 }
    if ((rank[adminGroup] || 99) > 2) return c.json({ error: '权限不足，无法修改他人的封禁记录' }, 403)
  }

  await c.env.DB.prepare(
    `UPDATE bans SET nickname=?, steam_id=?, ip_address=?, reason=?, ban_duration=?, violation_level=?, notes=?, updated_at=datetime('now')
     WHERE id=?`
  ).bind(
    body.nickname, body.steam_id, body.ip_address || '',
    body.reason || '', body.ban_duration || '30m',
    body.violation_level || 'level3', body.notes || '', id
  ).run()

  return c.json({ success: true })
})

// ── API: 删除封禁 ──
adminRoutes.delete('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')

  const existing = await c.env.DB.prepare('SELECT handled_by FROM bans WHERE id = ?').bind(id).first<{ handled_by: number }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  if (existing.handled_by !== adminId) {
    const rank = { OWNER:0, T6:1, T5:2, T4:3, T3:4, T2:5, T1:6 }
    if ((rank[adminGroup] || 99) > 2) return c.json({ error: '权限不足，无法删除他人的封禁记录' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM bans WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── 黑名单总表 (T3+) ──
adminRoutes.get('/admin/blacklist', requirePermission('T3'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    'SELECT * FROM blacklist ORDER BY last_ban_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  const cnt = await c.env.DB.prepare('SELECT COUNT(*) as total FROM blacklist').first<{ total: number }>()

  return c.html(Layout({
    title: '黑名单总表',
    currentPath: '/admin/blacklist',
    children: htmlView(rows.results, page, Math.ceil((cnt?.total||0)/limit), cnt?.total||0),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

import { html } from 'hono/html'

function htmlView(rows: any[], page: number, totalPages: number, total: number) {
  return html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">黑名单总表</h2>
  <p style="color:#8888a0;font-size:0.8rem;margin-bottom:0.5rem;">共 ${total} 名被封禁玩家</p>
  <table>
    <thead><tr>
      <th>Steam ID</th><th>昵称</th><th>累计封禁</th><th>最近违规</th><th>首次封禁</th><th>最后封禁</th>
    </tr></thead>
    <tbody>${rows.length === 0 ? html`<tr><td colspan="6" style="text-align:center;padding:2rem;color:#8888a0;">暂无数据</td></tr>`
      : rows.map((r: any) => html`<tr>
        <td style="font-family:monospace;font-size:0.82rem;">${escHtml(r.steam_id)}</td>
        <td>${escHtml(r.nickname)}</td>
        <td>${r.ban_count} 次</td>
        <td><span class="badge badge-level${r.latest_violation_level === 'level1' ? '1' : r.latest_violation_level === 'level2' ? '2' : '3'}">${r.latest_violation_level}</span></td>
        <td style="font-size:0.82rem;">${r.first_ban_at ? r.first_ban_at.slice(0,10) : '—'}</td>
        <td style="font-size:0.82rem;">${r.last_ban_at ? r.last_ban_at.slice(0,10) : '—'}</td>
      </tr>`)}
    </tbody>
  </table>
  ${totalPages > 1 ? html`<div class="pagination">
    ${page > 1 ? html`<a href="/admin/blacklist?page=${page-1}">上一页</a>` : ''}
    ${Array.from({length: totalPages}, (_,i)=>i+1).map(p => p === page ? html`<span class="current">${p}</span>` : html`<a href="/admin/blacklist?page=${p}">${p}</a>`)}
    ${page < totalPages ? html`<a href="/admin/blacklist?page=${page+1}">下一页</a>` : ''}
  </div>` : ''}
</div>`
}

function escHtml(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
```

**修改：** `functions/[[path]].ts` 注册 adminRoutes

```typescript
// 在 imports 中添加:
import { adminRoutes } from '../src/routes/admin'

// 在 app.route 中添加:
app.route('/', adminRoutes)
```

- [ ] 创建 `src/routes/admin.ts`
- [ ] 修改 `functions/[[path]].ts` 注册 adminRoutes
- [ ] 验证：`npx tsc --noEmit` 通过

---

## Task 2: Admin 封禁管理视图

**文件：** `Create: src/views/admin-bans.tsx`

```tsx
import { html } from 'hono/html'

export function AdminBanListPage(props: { bans: any[]; page: number; totalPages: number; total: number }) {
  return html`
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <h2 style="font-weight:500;">封禁管理</h2>
    <a href="/admin/bans/new" class="btn btn-primary">+ 新增封禁</a>
  </div>
  <table>
    <thead><tr>
      <th>ID</th><th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>时长</th><th>操作</th>
    </tr></thead>
    <tbody>
      ${props.bans.length === 0 ? html`<tr><td colspan="7" style="text-align:center;padding:2rem;color:#8888a0;">暂无数据</td></tr>`
      : props.bans.map(b => html`<tr>
        <td>${b.id}</td>
        <td><strong>${escHtml(b.nickname)}</strong></td>
        <td style="font-family:monospace;font-size:0.82rem;">${escHtml(b.steam_id)}</td>
        <td>${escHtml(b.reason)}</td>
        <td><span class="badge badge-${b.violation_level === 'level3' ? 'level3' : b.violation_level === 'level2' ? 'level2' : 'level1'}">${b.violation_level}</span></td>
        <td>${b.ban_duration}</td>
        <td>
          <a href="/admin/bans/${b.id}/edit" class="btn btn-ghost" style="padding:0.2rem 0.5rem;font-size:0.78rem;">编辑</a>
          <button class="btn btn-danger" style="padding:0.2rem 0.5rem;font-size:0.78rem;"
                  hx-delete="/api/admin/bans/${b.id}" hx-confirm="确认删除这条封禁记录？" hx-target="closest tr" hx-swap="delete">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  ${props.totalPages > 1 ? html`<div class="pagination">
    ${props.page > 1 ? html`<a href="/admin/bans?page=${props.page-1}">上一页</a>` : ''}
    ${Array.from({length: props.totalPages}, (_,i)=>i+1).map(p => p === props.page ? html`<span class="current">${p}</span>` : html`<a href="/admin/bans?page=${p}">${p}</a>`)}
    ${props.page < props.totalPages ? html`<a href="/admin/bans?page=${props.page+1}">下一页</a>` : ''}
  </div>` : ''}
</div>`
}

export function AdminBanFormPage(props: { ban: any }) {
  const b = props.ban
  return html`
<div class="card" style="max-width:600px;">
  <h2 style="margin-bottom:1rem;font-weight:500;">${b ? '编辑封禁' : '新增封禁'}</h2>
  <form id="banForm">
    <div class="form-group">
      <label>昵称 *</label>
      <input type="text" name="nickname" value="${b ? escAttr(b.nickname) : ''}" required />
    </div>
    <div class="form-group">
      <label>Steam ID *</label>
      <input type="text" name="steam_id" value="${b ? escAttr(b.steam_id) : ''}" required placeholder="76561199..." />
    </div>
    <div class="form-group">
      <label>IP 地址</label>
      <input type="text" name="ip_address" value="${b ? escAttr(b.ip_address) : ''}" />
    </div>
    <div class="form-group">
      <label>封禁时长</label>
      <select name="ban_duration">
        <option value="30m" ${b?.ban_duration === '30m' ? 'selected' : ''}>30 分钟</option>
        <option value="1h" ${b?.ban_duration === '1h' ? 'selected' : ''}>1 小时</option>
        <option value="3h" ${b?.ban_duration === '3h' ? 'selected' : ''}>3 小时</option>
        <option value="1d" ${b?.ban_duration === '1d' ? 'selected' : ''}>1 天</option>
        <option value="3d" ${b?.ban_duration === '3d' ? 'selected' : ''}>3 天</option>
        <option value="7d" ${b?.ban_duration === '7d' ? 'selected' : ''}>7 天</option>
        <option value="14d" ${b?.ban_duration === '14d' ? 'selected' : ''}>14 天</option>
        <option value="30d" ${b?.ban_duration === '30d' ? 'selected' : ''}>30 天</option>
        <option value="1y" ${b?.ban_duration === '1y' ? 'selected' : ''}>1 年</option>
        <option value="50y" ${b?.ban_duration === '50y' ? 'selected' : ''}>50 年</option>
        <option value="permanent" ${b?.ban_duration === 'permanent' ? 'selected' : ''}>永久</option>
      </select>
    </div>
    <div class="form-group">
      <label>违规等级</label>
      <select name="violation_level">
        <option value="warning" ${b?.violation_level === 'warning' ? 'selected' : ''}>警告</option>
        <option value="severe_warning" ${b?.violation_level === 'severe_warning' ? 'selected' : ''}>严重警告</option>
        <option value="level3" ${b?.violation_level === 'level3' || !b ? 'selected' : ''}>3级违规</option>
        <option value="level2" ${b?.violation_level === 'level2' ? 'selected' : ''}>2级违规</option>
        <option value="level1" ${b?.violation_level === 'level1' ? 'selected' : ''}>1级违规</option>
        <option value="level4" ${b?.violation_level === 'level4' ? 'selected' : ''}>4级(逃逸)</option>
      </select>
    </div>
    <div class="form-group">
      <label>原因</label>
      <textarea name="reason">${b ? escAttr(b.reason) : ''}</textarea>
    </div>
    <div class="form-group">
      <label>备注</label>
      <textarea name="notes">${b ? escAttr(b.notes) : ''}</textarea>
    </div>
    <button type="submit" class="btn btn-primary">${b ? '保存修改' : '创建封禁'}</button>
    <a href="/admin/bans" class="btn btn-ghost">取消</a>
  </form>
</div>
<script>
document.getElementById('banForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const jwt = localStorage.getItem('jwt');
  const method = ${b ? "'PUT'" : "'POST'"};
  const url = ${b ? `'/api/admin/bans/${b.id}'` : "'/api/admin/bans'"};
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { window.location.href = '/admin/bans'; }
  else { const r = await resp.json(); alert(r.error || '操作失败'); }
});
</script>`
}

function escHtml(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function escAttr(s: string): string { return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
```

- [ ] 创建 `src/views/admin-bans.tsx`

---

## Task 3: Admin 管理组管理 (OWNER only)

**文件：** `Create: src/routes/admin-team.ts`（作为一个新路由文件）

管理组 CRUD 页面 + API，仅 OWNER 权限组可访问。

```typescript
import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import type { Env, AdminRow } from '../db'
import { authMiddleware, requirePermission } from '../middleware/auth'
import { Layout } from '../views/layout'

export const adminTeamRoutes = new Hono<{ Bindings: Env }>()
adminTeamRoutes.use('*', authMiddleware)

// 管理组列表
adminTeamRoutes.get('/admin/team', requirePermission('OWNER'), async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active, created_at FROM admins ORDER BY id'
  ).all<AdminRow>()

  return c.html(Layout({
    title: '管理组管理',
    currentPath: '/admin/team',
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
    children: html`
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <h2 style="font-weight:500;">管理组管理</h2>
    <button class="btn btn-primary" onclick="showAddForm()">+ 新增管理员</button>
  </div>
  <table>
    <thead><tr>
      <th>ID</th><th>Steam ID</th><th>用户名</th><th>权限组</th><th>游戏名</th><th>QQ名</th><th>任职</th><th>状态</th><th>操作</th>
    </tr></thead>
    <tbody>
      ${rows.results.length === 0 ? html`<tr><td colspan="9" style="text-align:center;padding:2rem;color:#8888a0;">暂无管理员</td></tr>`
      : rows.results.map(a => html`<tr>
        <td>${a.id}</td>
        <td style="font-family:monospace;font-size:0.82rem;">${escHtml(a.steam_id)}</td>
        <td>${escHtml(a.username)}</td>
        <td><span class="badge ${a.permission_group === 'OWNER' ? 'badge-level1' : 'badge-level3'}">${a.permission_group}</span></td>
        <td>${escHtml(a.game_name)}</td>
        <td>${escHtml(a.qq_name)}</td>
        <td>${escHtml(a.position)}</td>
        <td>${a.is_active ? '✅' : '❌'}</td>
        <td>
          <button class="btn btn-ghost" style="padding:0.2rem 0.5rem;font-size:0.78rem;" onclick="editAdmin(${a.id})">编辑</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
</div>

<!-- 编辑弹窗 (简单内联) -->
<div id="adminModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;align-items:center;justify-content:center;">
<div class="card" style="max-width:500px;width:90%;">
  <h3 id="modalTitle" style="margin-bottom:1rem;">新增管理员</h3>
  <form id="adminForm">
    <input type="hidden" name="id" />
    <div class="form-group"><label>Steam ID</label><input type="text" name="steam_id" required /></div>
    <div class="form-group"><label>用户名</label><input type="text" name="username" required /></div>
    <div class="form-group"><label>密码 (留空不修改)</label><input type="password" name="password" /></div>
    <div class="form-group">
      <label>权限组</label>
      <select name="permission_group">
        <option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option>
        <option value="T4">T4</option><option value="T5">T5</option><option value="T6">T6</option>
        <option value="OWNER">OWNER</option>
      </select>
    </div>
    <div class="form-group"><label>游戏名称</label><input type="text" name="game_name" /></div>
    <div class="form-group"><label>QQ名称</label><input type="text" name="qq_name" /></div>
    <div class="form-group"><label>任职</label><input type="text" name="position" /></div>
    <div class="form-group"><label>主管事务</label><input type="text" name="supervisor" /></div>
    <button type="submit" class="btn btn-primary">保存</button>
    <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
  </form>
</div></div>

<script>
const jwt = localStorage.getItem('jwt');
async function showAddForm() {
  document.getElementById('adminForm').reset();
  document.getElementById('adminForm').querySelector('[name=id]').value = '';
  document.getElementById('modalTitle').textContent = '新增管理员';
  document.getElementById('adminModal').style.display = 'flex';
}
async function editAdmin(id) {
  const resp = await fetch('/api/admin/profiles/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
  const data = await resp.json();
  const form = document.getElementById('adminForm');
  form.querySelector('[name=id]').value = data.id;
  form.querySelector('[name=steam_id]').value = data.steam_id;
  form.querySelector('[name=username]').value = data.username;
  form.querySelector('[name=password]').value = '';
  form.querySelector('[name=permission_group]').value = data.permission_group;
  form.querySelector('[name=game_name]').value = data.game_name;
  form.querySelector('[name=qq_name]').value = data.qq_name;
  form.querySelector('[name=position]').value = data.position;
  form.querySelector('[name=supervisor]').value = data.supervisor;
  document.getElementById('modalTitle').textContent = '编辑管理员';
  document.getElementById('adminModal').style.display = 'flex';
}
function closeModal() { document.getElementById('adminModal').style.display = 'none'; }
document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const id = data.id;
  delete data.id;
  if (!data.password) delete data.password;
  const method = id ? 'PUT' : 'POST';
  const url = id ? '/api/admin/profiles/' + id : '/api/admin/profiles';
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); alert(r.error || '操作失败'); }
});
</script>`
  }))
})

import { html } from 'hono/html'

// API: 管理员列表 (完整)
adminTeamRoutes.get('/api/admin/profiles', requirePermission('OWNER'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM admins ORDER BY id').all()
  return c.json({ data: rows.results })
})

// API: 单个管理员
adminTeamRoutes.get('/api/admin/profiles/:id', requirePermission('OWNER'), async (c) => {
  const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE id = ?').bind(c.req.param('id')).first()
  if (!admin) return c.json({ error: '管理员不存在' }, 404)
  return c.json(admin)
})

// API: 新增管理员
adminTeamRoutes.post('/api/admin/profiles', requirePermission('OWNER'), async (c) => {
  const body = await c.req.json()
  if (!body.steam_id || !body.username) return c.json({ error: 'Steam ID 和用户名为必填' }, 400)

  const password = body.password || 'change_me_123'
  const hash = await bcrypt.hash(password, 10)

  try {
    await c.env.DB.prepare(
      `INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.steam_id, body.username, hash, body.permission_group || 'T1',
           body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'').run()
    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Steam ID 或用户名已存在' }, 409)
  }
})

// API: 修改管理员
adminTeamRoutes.put('/api/admin/profiles/:id', requirePermission('OWNER'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()

  let sql = `UPDATE admins SET steam_id=?, username=?, permission_group=?, game_name=?, qq_name=?, position=?, supervisor=?, updated_at=datetime('now')`
  const params = [body.steam_id, body.username, body.permission_group, body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'']

  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10)
    sql += `, password_hash=?`
    params.push(hash)
  }

  sql += ` WHERE id=?`
  params.push(id)

  await c.env.DB.prepare(sql).bind(...params).run()
  return c.json({ success: true })
})

// API: 删除管理员
adminTeamRoutes.delete('/api/admin/profiles/:id', requirePermission('OWNER'), async (c) => {
  const id = c.req.param('id')
  // 不允许删除自己
  if (Number(id) === c.get('adminId')) return c.json({ error: '不能删除自己' }, 400)
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// API: 退出登录
adminTeamRoutes.get('/admin/logout', (c) => {
  return c.html(Layout({
    title: '已退出',
    currentPath: '/',
    children: html`<div class="card" style="text-align:center;padding:3rem;"><p>已退出登录</p><a href="/" class="btn btn-primary" style="margin-top:1rem;">返回首页</a></div><script>localStorage.removeItem('jwt');</script>`,
  }))
})

function escHtml(s: string): string { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
```

**修改：** `functions/[[path]].ts` 注册 adminTeamRoutes

```typescript
import { adminTeamRoutes } from '../src/routes/admin-team'
app.route('/', adminTeamRoutes)
```

- [ ] 创建 `src/routes/admin-team.ts`
- [ ] 更新 `functions/[[path]].ts`
- [ ] 验证：`npx tsc --noEmit`

---

## Task 4: Cron Worker + 月度归档 (Phase 4)

**文件：** `Create: worker-cron/index.ts`

独立部署的 Cloudflare Worker，每月1日 00:00 UTC 触发。

```typescript
// 独立 Cron Worker
// 部署：cd worker-cron && npx wrangler deploy
export default {
  async scheduled(event, env, ctx) {
    const pagesUrl = env.PAGES_URL || 'https://jdcf-ban-list.pages.dev'
    const secret = env.CRON_SECRET

    const resp = await fetch(`${pagesUrl}/api/cron/archive`, {
      method: 'POST',
      headers: { 'X-Cron-Secret': secret },
    })

    const result = await resp.json()
    console.log('Archive result:', JSON.stringify(result))
  },
}
```

**文件：** `Create: worker-cron/wrangler.jsonc`

```jsonc
{
  "name": "jdcf-ban-archive",
  "main": "index.ts",
  "compatibility_date": "2025-07-18",
  "triggers": { "crons": ["0 0 1 * *"] },
  "vars": {
    "PAGES_URL": "https://jdcf-ban-list.pages.dev",
    "CRON_SECRET": "dev-cron-secret-change-in-production"
  }
}
```

**修改：** `src/routes/admin.ts` 添加归档 API（`POST /api/cron/archive`）

在 `adminRoutes` 中添加：

```typescript
// 归档 API (Cron Worker 调用)
adminRoutes.post('/api/cron/archive', async (c) => {
  const secret = c.req.header('X-Cron-Secret')
  if (secret !== c.env.CRON_SECRET) return c.json({ error: '未授权' }, 401)

  // 查询已解封的未归档记录（3级和2级）
  const archives = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE is_archived = 0
     AND violation_level IN ('level3', 'level2')
     AND ban_duration NOT IN ('permanent', '50y', '50Y')`
  ).all()

  let l3Deleted = 0, l2Downgraded = 0, l1Ignored = 0, l4Ignored = 0

  for (const ban of archives.results) {
    // 3级违规 → 删除
    if (ban.violation_level === 'level3') {
      // 检查是否已解封
      const status = computeStatusSimple(ban)
      if (status === 'unbanned') {
        await c.env.DB.prepare(
          "UPDATE bans SET is_archived = 1, archive_action = 'deleted', archived_at = datetime('now') WHERE id = ?"
        ).bind(ban.id).run()
        l3Deleted++
      }
    }
    // 2级违规 → 降级到 level3
    else if (ban.violation_level === 'level2' && computeStatusSimple(ban) === 'unbanned') {
      await c.env.DB.prepare(
        "UPDATE bans SET is_archived = 1, archive_action = 'downgraded', violation_level = 'level3', archived_at = datetime('now') WHERE id = ?"
      ).bind(ban.id).run()
      l2Downgraded++
    }
  }

  // 写入归档日志
  await c.env.DB.prepare(
    `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
     VALUES (date('now'), ?, ?, ?, ?, ?)`
  ).bind(l3Deleted + l2Downgraded, l3Deleted, l2Downgraded, l1Ignored, l4Ignored).run()

  return c.json({ success: true, l3_deleted: l3Deleted, l2_downgraded: l2Downgraded })
})

// 辅助：简单 status 计算（仅判断是否已解封）
function computeStatusSimple(ban: any): string {
  if (ban.ban_duration === 'permanent') return 'banned'
  const m = ban.ban_duration.match(/^(\d+)([dhm])$/)
  if (!m) return 'banned'
  const amount = parseInt(m[1]), unit = m[2]
  let ms = unit === 'm' ? amount * 60000 : unit === 'h' ? amount * 3600000 : amount * 86400000
  return Date.now() > new Date(ban.ban_time).getTime() + ms ? 'unbanned' : 'banned'
}
```

**修改：** `src/routes/admin.ts` 添加归档日志查看

```typescript
adminRoutes.get('/admin/archive', requirePermission('T4'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM archives ORDER BY archive_date DESC').all()
  return c.html(Layout({
    title: '归档日志',
    currentPath: '/admin/archive',
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
    children: html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">归档日志</h2>
  ${rows.results.length === 0 ? html`<p style="color:#8888a0;">暂无归档记录</p>`
  : html`<table><thead><tr><th>归档日期</th><th>总计处理</th><th>3级删除</th><th>2级降级</th><th>1级忽略</th><th>4级忽略</th></tr></thead><tbody>
    ${rows.results.map((r: any) => html`<tr>
      <td>${r.archive_date}</td><td>${r.total_processed}</td><td>${r.l3_deleted}</td><td>${r.l2_downgraded}</td><td>${r.l1_ignored}</td><td>${r.l4_ignored}</td>
    </tr>`)}
  </tbody></table>`}
</div>`
  }))
})
```

- [ ] 创建 `worker-cron/index.ts`
- [ ] 创建 `worker-cron/wrangler.jsonc`
- [ ] 更新 `src/routes/admin.ts`（归档 API + 归档日志查看）
- [ ] 验证：`npx tsc --noEmit`

---

## Task 5: Layout 导航更新 + 全部路由注册

**修改：** `src/views/layout.tsx` — 更新导航栏，管理员登录后显示管理后台入口

```tsx
// 在 nav 中找到后台/退出链接部分，替换为:
${admin ? html`
  <a href="/admin/bans" data-current="${currentPath.startsWith('/admin/bans') ? 'active' : ''}">封禁管理</a>
  <a href="/admin/team" data-current="${currentPath.startsWith('/admin/team') ? 'active' : ''}">管理组</a>
  <a href="/admin/blacklist" data-current="${currentPath.startsWith('/admin/blacklist') ? 'active' : ''}">黑名单</a>
  <a href="/admin/archive" data-current="${currentPath.startsWith('/admin/archive') ? 'active' : ''}">归档</a>
  <a href="/admin/logout">退出</a>
` : html`<a href="/login">登录</a>`}
```

**修改：** `functions/[[path]].ts` — 完整路由注册

```typescript
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'
import { adminRoutes } from '../src/routes/admin'
import { adminTeamRoutes } from '../src/routes/admin-team'

const app = new Hono<{ Bindings: Env }>()
app.use('*', cors())
app.route('/', publicRoutes)
app.route('/', authRoutes)
app.route('/', adminRoutes)
app.route('/', adminTeamRoutes)
export const onRequest = handle(app)
```

- [ ] 更新 `src/views/layout.tsx`
- [ ] 更新 `functions/[[path]].ts`
- [ ] 验证：`npx tsc --noEmit`

---

## 验证清单

- [ ] `GET /` — 公开封禁列表（搜索/筛选/分页正常）
- [ ] `GET /team` — 管理组公示
- [ ] `GET /login` — 登录页面（Turnstile widget 显示）
- [ ] `POST /api/login` — JWT 登录
- [ ] `GET /admin/bans` — 封禁管理（需登录）
- [ ] `POST /api/admin/bans` — 新增封禁
- [ ] `PUT /api/admin/bans/:id` — 修改封禁
- [ ] `DELETE /api/admin/bans/:id` — 删除封禁
- [ ] `GET /admin/team` — 管理组管理（仅 OWNER）
- [ ] `GET /admin/blacklist` — 黑名单总表（T3+）
- [ ] `GET /admin/archive` — 归档日志（T4+）
- [ ] `POST /api/cron/archive` — 归档 API
- [ ] `GET /admin/logout` — 退出登录
- [ ] TypeScript 编译无错误
