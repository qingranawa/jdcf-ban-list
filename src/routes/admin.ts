import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env, BanRow, WatchlistRow } from '../db'
import { authMiddleware, requirePermission, GROUP_RANK } from '../middleware/auth'
import { escHtml, escAttr } from '../helpers/escape'
import { AdminLayout } from '../views/admin-layout'
import { AdminBanListPage, AdminBanFormPage } from '../views/admin-bans'
import { AdminProcessPage } from '../views/admin-process'
import { AdminWatchlistPage } from '../views/admin-watchlist'

// ── Admin 路由（需 JWT 认证） ──
export const adminRoutes = new Hono<{ Bindings: Env }>()
adminRoutes.use('/admin/*', authMiddleware)
adminRoutes.use('/api/admin/*', authMiddleware)

// ── 封禁管理 ──

// Admin ban list
adminRoutes.get('/admin/bans', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
  ).bind(limit, offset).all<BanRow & { handled_by_name: string | null }>()

  const cnt = await c.env.DB.prepare('SELECT COUNT(*) as total FROM bans').first<{ total: number }>()
  const total = cnt?.total || 0

  return c.html(AdminLayout({
    title: '封禁管理', currentPath: '/admin/bans',
    children: AdminBanListPage({ bans: rows.results, page, totalPages: Math.ceil(total / limit), total }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/admin/bans/new', requirePermission('T1'), (c) => {
  return c.html(AdminLayout({
    title: '新增封禁', currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban: null }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/admin/bans/:id/edit', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const ban = await c.env.DB.prepare('SELECT * FROM bans WHERE id = ?').bind(id).first<BanRow>()
  if (!ban) return c.text('未找到该记录', 404)
  return c.html(AdminLayout({
    title: '编辑封禁', currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// API: Create ban
adminRoutes.post('/api/admin/bans', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')
  if (!body.nickname || !body.steam_id) return c.json({ error: '昵称和 Steam ID 为必填' }, 400)

  const level = body.violation_level_custom || body.violation_level || 'level3'

  const result = await c.env.DB.prepare(
    `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, notes, handled_by)
     VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', level, body.notes || '', adminId).run()
  return c.json({ success: true, id: result.meta.last_row_id })
})

// API: Update ban
adminRoutes.put('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')
  const body = await c.req.json()

  const existing = await c.env.DB.prepare('SELECT handled_by FROM bans WHERE id = ?').bind(id).first<{ handled_by: number }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)
  if (existing.handled_by !== adminId && (GROUP_RANK[adminGroup] ?? 99) > 2) {
    return c.json({ error: '权限不足，无法修改他人记录' }, 403)
  }

  const level = body.violation_level_custom || body.violation_level || 'level3'

  await c.env.DB.prepare(
    `UPDATE bans SET nickname=?, steam_id=?, ip_address=?, reason=?, ban_duration=?, violation_level=?, notes=?, updated_at=datetime('now') WHERE id=?`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', level, body.notes || '', id).run()
  return c.json({ success: true })
})

// API: Delete ban
adminRoutes.delete('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')
  const existing = await c.env.DB.prepare('SELECT handled_by FROM bans WHERE id = ?').bind(id).first<{ handled_by: number }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)
  if (existing.handled_by !== adminId && (GROUP_RANK[adminGroup] ?? 99) > 2) {
    return c.json({ error: '权限不足，无法删除他人记录' }, 403)
  }
  await c.env.DB.prepare('DELETE FROM bans WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── 处理页面 ──

// 判断封禁是否已过期（基于 ban_time + ban_duration）
function isBanExpired(ban: { ban_time: string; ban_duration: string }): boolean {
  if (ban.ban_duration === 'permanent') return false
  if (/^50[Yy]$/.test(ban.ban_duration)) return false
  if (ban.ban_duration === 'warning' || ban.ban_duration === 'cfba') return false
  let dur = ban.ban_duration
  if (dur.startsWith('mute-')) dur = dur.slice(5)
  const m = dur.match(/^(\d+)([dhm])$/i)
  if (!m) return false
  const amount = parseInt(m[1])
  const unit = m[2].toLowerCase()
  const ms = unit === 'm' ? amount * 60000 : unit === 'h' ? amount * 3600000 : amount * 86400000
  return Date.now() > new Date(ban.ban_time).getTime() + ms
}

// 处理页面（T1+）
adminRoutes.get('/admin/process', requirePermission('T1'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0
       AND b.violation_level IN ('level2', 'level3')
     ORDER BY b.ban_time ASC`
  ).all<BanRow & { handled_by_name: string | null }>()

  // 只显示实际已过期的
  const expired = rows.results.filter(b => isBanExpired(b))

  return c.html(AdminLayout({
    title: '处理', currentPath: '/admin/process',
    children: AdminProcessPage({ bans: expired }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// API: 待处理列表
adminRoutes.get('/api/admin/process', requirePermission('T1'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0
       AND b.violation_level IN ('level2', 'level3')
     ORDER BY b.ban_time ASC`
  ).all()
  return c.json({ data: rows.results.filter((b: any) => isBanExpired(b)) })
})

// API: 批量删除（归档为已删除）
adminRoutes.post('/api/admin/process/delete', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const ids: number[] = body.ids || []
  if (ids.length === 0) return c.json({ error: '请选择记录' }, 400)

  // 查询选中的 ban 记录
  const placeholders = ids.map(() => '?').join(',')
  const bans = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE id IN (${placeholders}) AND is_archived = 0`
  ).bind(...ids).all<BanRow>()

  if (bans.results.length === 0) return c.json({ error: '没有可处理的记录' }, 400)

  // 更新为已归档（删除）
  await c.env.DB.prepare(
    `UPDATE bans SET is_archived = 1, archive_action = 'deleted', archived_at = datetime('now') WHERE id IN (${placeholders})`
  ).bind(...ids).run()

  // 写归档摘要
  const archiveResult = await c.env.DB.prepare(
    `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
     VALUES (date('now'), ?, ?, 0, 0, 0)`
  ).bind(bans.results.length, bans.results.length).run()
  const archiveId = archiveResult.meta.last_row_id

  // 写归档明细
  for (const ban of bans.results) {
    await c.env.DB.prepare(
      `INSERT INTO archive_items (archive_id, ban_id, nickname, steam_id, original_level, new_level, action, original_status, original_duration)
       VALUES (?, ?, ?, ?, ?, NULL, 'deleted', 'unbanned', ?)`
    ).bind(archiveId, ban.id, ban.nickname, ban.steam_id, ban.violation_level, ban.ban_duration).run()
  }

  return c.json({ success: true, processed: bans.results.length })
})

// API: 批量降级（level2 → level3）
adminRoutes.post('/api/admin/process/downgrade', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const ids: number[] = body.ids || []
  if (ids.length === 0) return c.json({ error: '请选择记录' }, 400)

  const placeholders = ids.map(() => '?').join(',')
  const bans = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE id IN (${placeholders}) AND is_archived = 0 AND violation_level = 'level2'`
  ).bind(...ids).all<BanRow>()

  if (bans.results.length === 0) return c.json({ error: '没有可降级的 2 级违规记录' }, 400)

  // 更新为已归档（降级）
  await c.env.DB.prepare(
    `UPDATE bans SET is_archived = 1, archive_action = 'downgraded', violation_level = 'level3', archived_at = datetime('now') WHERE id IN (${placeholders})`
  ).bind(...ids).run()

  // 写归档摘要
  const archiveResult = await c.env.DB.prepare(
    `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
     VALUES (date('now'), ?, 0, ?, 0, 0)`
  ).bind(bans.results.length, bans.results.length).run()
  const archiveId = archiveResult.meta.last_row_id

  // 写归档明细
  for (const ban of bans.results) {
    await c.env.DB.prepare(
      `INSERT INTO archive_items (archive_id, ban_id, nickname, steam_id, original_level, new_level, action, original_status, original_duration)
       VALUES (?, ?, ?, ?, ?, 'level3', 'downgraded', 'unbanned', ?)`
    ).bind(archiveId, ban.id, ban.nickname, ban.steam_id, ban.violation_level, ban.ban_duration).run()
  }

  return c.json({ success: true, processed: bans.results.length })
})

// ── 重点观察（Watchlist） ──

// 观察列表页（T3+）
adminRoutes.get('/admin/watchlist', requirePermission('T3'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT w.*, a.game_name as added_by_name FROM watchlist w
     LEFT JOIN admins a ON w.added_by = a.id
     ORDER BY w.created_at DESC`
  ).all<WatchlistRow & { added_by_name: string | null }>()

  return c.html(AdminLayout({
    title: '重点观察', currentPath: '/admin/watchlist',
    children: AdminWatchlistPage({ entries: rows.results }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// API: 观察列表
adminRoutes.get('/api/admin/watchlist', requirePermission('T3'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT w.*, a.game_name as added_by_name FROM watchlist w
     LEFT JOIN admins a ON w.added_by = a.id
     ORDER BY w.created_at DESC`
  ).all()
  return c.json({ data: rows.results })
})

// API: 单条观察
adminRoutes.get('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const entry = await c.env.DB.prepare('SELECT * FROM watchlist WHERE id = ?').bind(c.req.param('id')).first()
  if (!entry) return c.json({ error: '记录不存在' }, 404)
  return c.json(entry)
})

// API: 添加观察
adminRoutes.post('/api/admin/watchlist', requirePermission('T3'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')
  if (!body.steam_id) return c.json({ error: 'Steam ID 为必填' }, 400)

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO watchlist (steam_id, nickname, reason, added_by, notes)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(body.steam_id, body.nickname || '', body.reason || '', adminId, body.notes || '').run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch {
    return c.json({ error: '该 Steam ID 已在观察列表中' }, 409)
  }
})

// API: 编辑观察
adminRoutes.put('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const existing = await c.env.DB.prepare('SELECT id FROM watchlist WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  await c.env.DB.prepare(
    `UPDATE watchlist SET steam_id = ?, nickname = ?, reason = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(body.steam_id, body.nickname || '', body.reason || '', body.notes || '', id).run()
  return c.json({ success: true })
})

// API: 删除观察
adminRoutes.delete('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT id FROM watchlist WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: '记录不存在' }, 404)
  await c.env.DB.prepare('DELETE FROM watchlist WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── 归档日志页面（T4+） ──
adminRoutes.get('/admin/archive', requirePermission('T4'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM archives ORDER BY archive_date DESC').all()
  const tableHtml = html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">归档日志</h2>
  ${rows.results.length === 0
    ? html`<p style="color:var(--text-tertiary);">暂无归档记录</p>`
    : html`<table><thead><tr><th>日期</th><th>处理总数</th><th>3级删除</th><th>2级降级</th><th>1级忽略</th><th>4级忽略</th></tr></thead><tbody>
      ${rows.results.map((r: any) => html`<tr><td>${escAttr(r.archive_date)}</td><td>${r.total_processed}</td><td>${r.l3_deleted}</td><td>${r.l2_downgraded}</td><td>${r.l1_ignored}</td><td>${r.l4_ignored}</td></tr>`)}
    </tbody></table>`}
</div>`
  return c.html(AdminLayout({
    title: '归档日志', currentPath: '/admin/archive', children: tableHtml,
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// ── 退出登录 ──
adminRoutes.get('/admin/logout', (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  return c.html(AdminLayout({
    title: '已退出', currentPath: '/logout',
    children: html`<div class="card" style="text-align:center;padding:3rem;"><p>已退出登录</p><a href="/" class="btn btn-primary" style="margin-top:1rem;">返回首页</a></div><script>localStorage.removeItem('jwt');</script>`,
    admin: { game_name: '', permission_group: '' },
  }))
})

// ── 兼容：/logout 也退出（带 cookie 清除） ──
adminRoutes.get('/logout', (c) => {
  return c.redirect('/admin/logout')
})
