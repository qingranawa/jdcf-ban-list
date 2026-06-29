// > Admin routes — ban CRUD, batch processing, watchlist, team management
// ! 所有 /admin/* 和 /api/admin/* 路由均需 JWT 认证
import { Hono } from 'hono'
import { html } from 'hono/html'
import bcrypt from 'bcryptjs'
import type { Env, BanRow, WatchlistRow } from '../db'
import { computeStatus } from './public'
import { authMiddleware, requirePermission, GROUP_RANK } from '../middleware/auth'
import { escHtml, escAttr } from '../helpers/escape'
import { AdminLayout } from '../views/admin-layout'
import { AdminBanListPage } from '../views/admin-bans'
import { AdminProcessPage } from '../views/admin-process'
import { AdminWatchlistPage } from '../views/admin-watchlist'
import { AdminTeamPage } from '../views/admin-team'

export const adminRoutes = new Hono<{ Bindings: Env }>()
adminRoutes.use('/admin/*', authMiddleware)
adminRoutes.use('/api/admin/*', authMiddleware)

// ── 封禁管理 ──

// Admin ban list
adminRoutes.get('/admin/bans', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = Math.min(100, Math.max(10, parseInt(c.req.query('per_page') || '25')))
  const showArchived = c.req.query('archived') === '1'
  const limit = perPage
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = ?
     ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
  ).bind(showArchived ? 1 : 0, limit, offset).all<BanRow & { handled_by_name: string | null }>()

  const cnt = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM bans WHERE is_archived = ?'
  ).bind(showArchived ? 1 : 0).first<{ total: number }>()
  const total = cnt?.total || 0

  const bansWithStatus = rows.results.map(b => ({ ...b, status: computeStatus(b) }))

  return c.html(AdminLayout({
    title: '封禁管理', currentPath: '/admin/bans',
    children: AdminBanListPage({ bans: bansWithStatus, showArchived, page, perPage, total }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const ban = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id WHERE b.id = ?`
  ).bind(id).first<BanRow & { handled_by_name: string | null }>()
  if (!ban) return c.json({ error: '记录不存在' }, 404)
  return c.json({ ...ban, status: computeStatus(ban) })
})

// API: Create ban
adminRoutes.post('/api/admin/bans', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')
  if (!body.nickname || !body.steam_id) return c.json({ error: '昵称和 Steam ID 为必填' }, 400)
  if (body.ban_duration && !/^(\d+[dhmy]|mute-\d+[dhmy]|permanent|warning|cfba|50[Yy])$/.test(body.ban_duration)) {
    return c.json({ error: '封禁时长格式无效，支持: 数字+d/h/m/y, permanent, warning, cfba' }, 400)
  }

  const level = body.violation_level_custom || body.violation_level || 'level3'

  const result = await c.env.DB.prepare(
    `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, notes, handled_by, co_handlers)
     VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?)`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', level, body.notes || '', adminId, body.co_handlers || '').run()
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
    `UPDATE bans SET nickname=?, steam_id=?, ip_address=?, reason=?, ban_duration=?, violation_level=?, notes=?, co_handlers=?, updated_at=datetime('now') WHERE id=?`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', level, body.notes || '', body.co_handlers || '', id).run()
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

// ── 批量处理过期违规 ──

// * 复用 public.ts 的 computeStatus —— 返回 'unbanned' 就是已过期
function isBanExpired(ban: { ban_time: string; ban_duration: string; archive_action: string | null }): boolean {
  return computeStatus(ban) === 'unbanned'
}

// * D1 限制 100 bindings/statement，archive_items 每条 9 bindings，
// * 每批最多 11 条（11×9=99）避免超过限制
// ! 所有字段已参数化绑定，杜绝 SQL 注入
async function writeArchiveItemsChunked(
  db: D1Database,
  archiveId: number,
  bans: BanRow[],
  action: string,
  newLevel: string | null
) {
  const CHUNK = 11
  for (let i = 0; i < bans.length; i += CHUNK) {
    const chunk = bans.slice(i, i + CHUNK)
    const values = chunk.map(() =>
      `(?,?,?,?,?,?,?,?,?)`
    ).join(',')
    const params = chunk.flatMap(b => [
      archiveId, b.id, b.nickname, b.steam_id, b.violation_level,
      newLevel || null, action, 'unbanned', b.ban_duration
    ])
    await db.prepare(
      `INSERT INTO archive_items (archive_id, ban_id, nickname, steam_id, original_level, new_level, action, original_status, original_duration) VALUES ${values}`
    ).bind(...params).run()
  }
}

// 处理页，T1就能看
adminRoutes.get('/admin/process', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0
       AND b.violation_level IN ('level2', 'level3')
     ORDER BY b.ban_time ASC`
  ).all<BanRow & { handled_by_name: string | null }>()

  // 只显示实际已过期的
  const expired = rows.results.filter(b => isBanExpired(b))
  const level2Bans = expired.filter(b => b.violation_level === 'level2')
  const level3Bans = expired.filter(b => b.violation_level === 'level3')

  return c.html(AdminLayout({
    title: '处理', currentPath: '/admin/process',
    children: AdminProcessPage({ level2Bans, level3Bans }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// 待处理列表（JSON）
adminRoutes.get('/api/admin/process', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0
       AND b.violation_level IN ('level2', 'level3')
     ORDER BY b.ban_time ASC`
  ).all()
  return c.json({ data: rows.results.filter((b: any) => isBanExpired(b)) })
})

// * 批量删除 —— 标记 is_archived + archive_action='deleted' 扔归档
adminRoutes.post('/api/admin/process/delete', requirePermission('T5'), async (c) => {
  const body = await c.req.json()
  const ids: number[] = body.ids || []
  if (ids.length === 0) return c.json({ error: '请选择记录' }, 400)

  // 拿出勾选的记录
  const placeholders = ids.map(() => '?').join(',')
  const bans = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE id IN (${placeholders}) AND is_archived = 0 AND violation_level = 'level3'`
  ).bind(...ids).all<BanRow>()

  if (bans.results.length === 0) return c.json({ error: '没有可处理的记录' }, 400)

  // 标记已归档（删除）
  await c.env.DB.prepare(
    `UPDATE bans SET is_archived = 1, archive_action = 'deleted', archived_at = datetime('now') WHERE id IN (${placeholders})`
  ).bind(...ids).run()

  // 写归档日志摘要
  const archiveResult = await c.env.DB.prepare(
    `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
     VALUES (datetime('now'), ?, ?, 0, 0, 0)`
  ).bind(bans.results.length, bans.results.length).run()
  const archiveId = archiveResult.meta.last_row_id

  // 写归档明细（分包，避免 D1 100 binding 限制）
  await writeArchiveItemsChunked(c.env.DB, archiveId, bans.results, 'deleted', null)

  return c.json({ success: true, processed: bans.results.length })
})

// * 批量降级 —— level2→level3，记录不隐藏但留审计跟踪
adminRoutes.post('/api/admin/process/downgrade', requirePermission('T5'), async (c) => {
  const body = await c.req.json()
  const ids: number[] = body.ids || []
  if (ids.length === 0) return c.json({ error: '请选择记录' }, 400)

  const placeholders = ids.map(() => '?').join(',')
  const bans = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE id IN (${placeholders}) AND is_archived = 0`
  ).bind(...ids).all<BanRow>()

  if (bans.results.length === 0) return c.json({ error: '没有可处理的记录' }, 400)

  // 只升违规等级，保留可见
  await c.env.DB.prepare(
    `UPDATE bans SET violation_level = 'level3' WHERE id IN (${placeholders})`
  ).bind(...ids).run()

  // 写归档日志摘要（留审计）
  const archiveResult = await c.env.DB.prepare(
    `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
     VALUES (datetime('now'), ?, 0, ?, 0, 0)`
  ).bind(bans.results.length, bans.results.length).run()
  const archiveId = archiveResult.meta.last_row_id

  // 写归档明细（分包）
  await writeArchiveItemsChunked(c.env.DB, archiveId, bans.results, 'downgraded', 'level3')

  return c.json({ success: true, processed: bans.results.length })
})

// ── 重点观察名单 ──

// 观察页，T3以上能看
adminRoutes.get('/admin/watchlist', requirePermission('T3'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT w.*, a.game_name as added_by_name FROM watchlist w
     LEFT JOIN admins a ON w.added_by = a.id
     ORDER BY w.created_at DESC`
  ).all<WatchlistRow & { added_by_name: string | null }>()

  return c.html(AdminLayout({
    title: '重点观察', currentPath: '/admin/watchlist',
    children: AdminWatchlistPage({ items: rows.results }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// 观察列表 JSON
adminRoutes.get('/api/admin/watchlist', requirePermission('T3'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT w.*, a.game_name as added_by_name FROM watchlist w
     LEFT JOIN admins a ON w.added_by = a.id
     ORDER BY w.created_at DESC`
  ).all()
  return c.json({ data: rows.results })
})

// 单条详情
adminRoutes.get('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const entry = await c.env.DB.prepare('SELECT * FROM watchlist WHERE id = ?').bind(c.req.param('id')).first()
  if (!entry) return c.json({ error: '记录不存在' }, 404)
  return c.json(entry)
})

// 加一个
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

// 改一个
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

// 删一个
adminRoutes.delete('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const id = c.req.param('id')
  const existing = await c.env.DB.prepare('SELECT id FROM watchlist WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: '记录不存在' }, 404)
  await c.env.DB.prepare('DELETE FROM watchlist WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── 归档日志（T4以上看） ──
adminRoutes.get('/admin/archive', requirePermission('T4'), async (c) => {
  const items = await c.env.DB.prepare(`
    SELECT ai.*, ar.archive_date
    FROM archive_items ai
    JOIN archives ar ON ar.id = ai.archive_id
    ORDER BY ar.archive_date DESC, ai.id DESC
  `).all()
  const tableHtml = html`
<div class="cyber-admin-content" style="padding-bottom:6rem;">
  <h2 style="font-family:var(--sans);font-size:22px;font-weight:600;margin-bottom:var(--spacing-lg);">已归档记录</h2>
  ${items.results.length === 0
    ? html`<p style="color:var(--label-3);font-size:15px;">暂无归档记录</p>`
    : html`<div class="cyber-table-wrap"><table class="cyber-table">
      <thead><tr>
        <th>归档日期</th><th>昵称</th><th>Steam ID</th><th>原等级</th><th>操作</th><th>新等级</th><th>原时长</th>
      </tr></thead><tbody>
      ${items.results.map((r: any) => html`<tr>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${escAttr(r.archive_date)}</td>
        <td><strong style="font-family:var(--sans);">${escHtml(r.nickname)}</strong></td>
        <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.steam_id)}</code></td>
        <td><span class="cyber-badge ${r.original_level === 'level3' ? 'cyber-badge-cyan' : r.original_level === 'level2' ? 'cyber-badge-magenta' : r.original_level === 'level1' ? 'cyber-badge-red' : 'cyber-badge-amber'}">${escHtml(r.original_level)}</span></td>
        <td><span class="cyber-badge ${r.action === 'deleted' ? 'cyber-badge-red' : 'cyber-badge-amber'}">${r.action === 'deleted' ? '删除' : '降级'}</span></td>
        <td>${r.new_level ? html`<span class="cyber-badge cyber-badge-neutral">${escHtml(r.new_level)}</span>` : html`<span style="color:var(--label-3);">—</span>`}</td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.original_duration)}</td>
      </tr>`)}
    </tbody></table></div>`}
</div>`
  return c.html(AdminLayout({
    title: '归档日志', currentPath: '/admin/archive', children: tableHtml,
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

// ── 管理组管理（原 admin-team.ts，合并至此避免路由冲突） ──

adminRoutes.get('/admin/team', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active, created_at FROM admins ORDER BY id'
  ).all()

  return c.html(AdminLayout({
    title: '管理组管理',
    currentPath: '/admin/team',
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
    children: AdminTeamPage({ admins: rows.results as any[] }),
  }))
})

adminRoutes.get('/api/admin/profiles', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active FROM admins ORDER BY id').all()
  return c.json({ data: rows.results })
})

adminRoutes.get('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const admin = await c.env.DB.prepare('SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active FROM admins WHERE id = ?').bind(c.req.param('id')).first()
  if (!admin) return c.json({ error: '管理员不存在' }, 404)
  return c.json(admin)
})

adminRoutes.post('/api/admin/profiles', requirePermission('T5'), async (c) => {
  const body = await c.req.json()
  if (!body.steam_id || !body.username) return c.json({ error: 'Steam ID 和用户名为必填' }, 400)
  if (!body.password) return c.json({ error: '密码为必填' }, 400)
  const password = body.password
  const hash = await bcrypt.hash(password, 10)
  try {
    await c.env.DB.prepare(
      `INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.steam_id, body.username, hash, body.permission_group || 'T1',
           body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'').run()
    return c.json({ success: true })
  } catch { return c.json({ error: 'Steam ID 或用户名已存在' }, 409) }
})

adminRoutes.put('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  let sql = `UPDATE admins SET steam_id=?, username=?, permission_group=?, game_name=?, qq_name=?, position=?, supervisor=?, updated_at=datetime('now')`
  const params = [body.steam_id, body.username, body.permission_group||'T1', body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'']
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

adminRoutes.delete('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = Number(c.req.param('id'))
  if (id === c.get('adminId')) return c.json({ error: '不能删除自己' }, 400)
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

// ── 退出 ──
adminRoutes.get('/admin/logout', (c) => {
  return c.html(
    `<script>localStorage.removeItem('jwt');window.location.href='/login'</script>`
  )
})

// /logout 也能退，顺带清 cookie
adminRoutes.get('/logout', (c) => {
  return c.redirect('/admin/logout')
})
