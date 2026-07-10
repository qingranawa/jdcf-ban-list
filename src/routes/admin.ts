// > Admin routes — ban CRUD, batch processing, watchlist, team management, announcements
// ! 所有 /admin/* 和 /api/admin/* 路由均需 JWT 认证
import { Hono } from 'hono'
import { html } from 'hono/html'
import bcrypt from 'bcryptjs'
import type { Env, BanRow, WatchlistRow, AnnouncementRow } from '../db'
import { computeStatus } from './public'
import { authMiddleware, requirePermission, GROUP_RANK, checkOwnership } from '../middleware/auth'
import { escHtml, escAttr } from '../helpers/escape'
import { lvBadge, lvLabel } from '../helpers/format'
import { AdminLayout } from '../views/admin-layout'
import { AdminBanListPage } from '../views/admin-bans'
import { AdminProcessPage } from '../views/admin-process'
import { AdminWatchlistPage } from '../views/admin-watchlist'
import { AdminTeamPage } from '../views/admin-team'
import { AdminAnnouncementsPage } from '../views/admin-announcements'

export const adminRoutes = new Hono<{ Bindings: Env }>()
adminRoutes.use('/admin/*', authMiddleware)
adminRoutes.use('/api/admin/*', authMiddleware)

// ── 审计日志助手（fire-and-forget，不阻塞主操作）──
async function writeAuditLog(
  db: D1Database,
  adminId: number,
  action: string,
  targetType: string,
  targetId: number | null,
  detail: string | null
): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO audit_log (admin_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)'
    ).bind(adminId, action, targetType, targetId, detail).run()
  } catch (e) {
    console.error('Audit log failed:', e)
  }
}

// ── 封禁管理 ──

// Admin ban list
adminRoutes.get('/admin/bans', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = Math.min(100, Math.max(10, parseInt(c.req.query('per_page') || '25')))
  const showArchived = c.req.query('archived') === '1'
  const q = c.req.query('q') || ''
  const statusFilter = c.req.query('status') || ''
  const limit = perPage
  const offset = (page - 1) * limit

  let where = 'b.is_archived = ?'
  const params: unknown[] = [showArchived ? 1 : 0]

  if (q) {
    where += ' AND (b.nickname LIKE ? ESCAPE \'\\\' OR b.steam_id LIKE ? ESCAPE \'\\\' OR b.ip_address LIKE ? ESCAPE \'\\\' OR b.reason LIKE ? ESCAPE \'\\\' OR b.notes LIKE ? ESCAPE \'\\\')'
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escaped}%`
    params.push(pattern, pattern, pattern, pattern, pattern)
  }

  let total: number
  let bansWithStatus: (BanRow & { handled_by_name: string | null; status: string })[]

  if (statusFilter) {
    const allBans = await c.env.DB.prepare(
      `SELECT b.*, a.game_name as handled_by_name FROM bans b
       LEFT JOIN admins a ON b.handled_by = a.id
       WHERE ${where} ORDER BY b.created_at DESC`
    ).bind(...params).all<BanRow & { handled_by_name: string | null }>()
    const processed = allBans.results.map(b => ({ ...b, status: computeStatus(b) }))
    const filtered = processed.filter(b => b.status === statusFilter)
    total = filtered.length
    bansWithStatus = filtered.slice(offset, offset + limit)
  } else {
    const cnt = await c.env.DB.prepare(
      `SELECT COUNT(*) as total FROM bans b WHERE ${where}`
    ).bind(...params).first<{ total: number }>()
    total = cnt?.total || 0

    const rows = await c.env.DB.prepare(
      `SELECT b.*, a.game_name as handled_by_name FROM bans b
       LEFT JOIN admins a ON b.handled_by = a.id
       WHERE ${where}
       ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<BanRow & { handled_by_name: string | null }>()
    bansWithStatus = rows.results.map(b => ({ ...b, status: computeStatus(b) }))
  }

  return c.html(AdminLayout({
    title: '封禁管理', currentPath: '/admin/bans',
    children: AdminBanListPage({ bans: bansWithStatus, showArchived, page, perPage, total, query: q }),
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
  try {
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

    const newId = result?.meta?.last_row_id ?? null
    writeAuditLog(c.env.DB, adminId, 'create_ban', 'ban', newId, `昵称: ${body.nickname}, Steam: ${body.steam_id}`)
    return c.json({ success: true, id: newId })
  } catch (e: any) {
    console.error('Create ban error:', e)
    return c.json({ error: e?.message || '服务器内部错误' }, 500)
  }
})

// API: Update ban
adminRoutes.put('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')
  const body = await c.req.json()

  const existing = await c.env.DB.prepare('SELECT handled_by, nickname FROM bans WHERE id = ?').bind(id).first<{ handled_by: number; nickname: string }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  const ownership = checkOwnership(existing.handled_by, adminId, adminGroup)
  if (!ownership.allowed) return c.json({ error: ownership.error }, 403)

  const level = body.violation_level_custom || body.violation_level || 'level3'

  await c.env.DB.prepare(
    `UPDATE bans SET nickname=?, steam_id=?, ip_address=?, reason=?, ban_duration=?, violation_level=?, notes=?, co_handlers=?, updated_at=datetime('now') WHERE id=?`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', level, body.notes || '', body.co_handlers || '', id).run()

  await writeAuditLog(c.env.DB, adminId, 'edit_ban', 'ban', Number(id), `昵称: ${existing.nickname}`)
  return c.json({ success: true })
})

// API: Soft delete ban
adminRoutes.delete('/api/admin/bans/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const adminGroup = c.get('permissionGroup')
  const existing = await c.env.DB.prepare('SELECT handled_by, nickname FROM bans WHERE id = ?').bind(id).first<{ handled_by: number; nickname: string }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  const ownership = checkOwnership(existing.handled_by, adminId, adminGroup)
  if (!ownership.allowed) return c.json({ error: ownership.error }, 403)

  await c.env.DB.prepare(
    "UPDATE bans SET is_archived = 1, archive_action = 'deleted', archived_at = datetime('now') WHERE id = ?"
  ).bind(id).run()

  await writeAuditLog(c.env.DB, adminId, 'delete_ban', 'ban', Number(id), `昵称: ${existing.nickname} (软删除)`)
  return c.json({ success: true })
})

// API: Unarchive ban (restore from archive)
adminRoutes.post('/api/admin/bans/:id/unarchive', requirePermission('T4'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT handled_by, nickname FROM bans WHERE id = ?').bind(id).first<{ handled_by: number; nickname: string }>()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  const ownership = checkOwnership(existing.handled_by, adminId, c.get('permissionGroup'))
  if (!ownership.allowed) return c.json({ error: ownership.error }, 403)

  await c.env.DB.prepare(
    "UPDATE bans SET is_archived = 0, archive_action = NULL, archived_at = NULL WHERE id = ?"
  ).bind(id).run()

  await c.env.DB.prepare(
    "UPDATE archive_items SET action = 'restored' WHERE ban_id = ? AND action = 'deleted'"
  ).bind(id).run()

  await writeAuditLog(c.env.DB, adminId, 'unarchive_ban', 'ban', Number(id), `昵称: ${existing.nickname} (恢复)`)
  return c.json({ success: true })
})

// ── CSV 导出 ──
adminRoutes.get('/api/admin/bans/export', requirePermission('T1'), async (c) => {
  const rows = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0 ORDER BY b.created_at DESC`
  ).all<BanRow & { handled_by_name: string | null }>()

  function csvQuote(s: string | null): string {
    return '"' + (s || '').replace(/"/g, '""') + '"'
  }

  const headers = ['ID', '昵称', 'Steam ID', 'IP', '原因', '封禁时间', '时长', '违规等级', '状态', '操作员', '备注']
  const csvContent = [headers.join(',')]
  for (const r of rows.results) {
    csvContent.push([
      r.id, csvQuote(r.nickname), r.steam_id, r.ip_address,
      csvQuote(r.reason), r.ban_time, r.ban_duration, r.violation_level,
      computeStatus(r), csvQuote(r.handled_by_name || ''), csvQuote(r.notes || '')
    ].join(','))
  }

  return c.body('\uFEFF' + csvContent.join('\n'), 200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="jdcf-bans.csv"',
  })
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

  await writeAuditLog(c.env.DB, c.get('adminId'), 'process_delete', 'ban', archiveId, `批量删除 ${bans.results.length} 条记录`)
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

  await writeAuditLog(c.env.DB, c.get('adminId'), 'process_downgrade', 'ban', archiveId, `批量降级 ${bans.results.length} 条记录`)
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
    await writeAuditLog(c.env.DB, adminId, 'watchlist_create', 'watchlist', result.meta.last_row_id as number, `Steam: ${body.steam_id}`)
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch {
    return c.json({ error: '该 Steam ID 已在观察列表中' }, 409)
  }
})

// 改一个
adminRoutes.put('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT id FROM watchlist WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: '记录不存在' }, 404)

  await c.env.DB.prepare(
    `UPDATE watchlist SET steam_id = ?, nickname = ?, reason = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(body.steam_id, body.nickname || '', body.reason || '', body.notes || '', id).run()
  await writeAuditLog(c.env.DB, adminId, 'watchlist_edit', 'watchlist', Number(id), null)
  return c.json({ success: true })
})

// 删一个
adminRoutes.delete('/api/admin/watchlist/:id', requirePermission('T3'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT id FROM watchlist WHERE id = ?').bind(id).first()
  if (!existing) return c.json({ error: '记录不存在' }, 404)
  await c.env.DB.prepare('DELETE FROM watchlist WHERE id = ?').bind(id).run()
  await writeAuditLog(c.env.DB, adminId, 'watchlist_delete', 'watchlist', Number(id), null)
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
<script>
var jwt = localStorage.getItem('jwt');
function unarchiveBan(id) {
  if (!confirm('确认恢复此封禁记录？恢复后将在封禁列表中可见。')) return;
  fetch('/api/admin/bans/' + id + '/unarchive', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + jwt },
  }).then(function(r) {
    if (r.ok) { location.reload(); }
    else { r.json().then(function(d) { alert(d.error || '操作失败'); }); }
  }).catch(function() { alert('请求失败'); });
}
</script>
<div class="cyber-admin-content" style="padding-bottom:6rem;">
  <h2 class="page-title" style="margin-bottom:var(--spacing-lg);">已归档记录</h2>
  ${items.results.length === 0
    ? html`<p style="color:var(--label-3);font-size:15px;">暂无归档记录</p>`
    : html`<div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
      <thead><tr>
        <th>归档日期</th><th>昵称</th><th>Steam ID</th><th>原等级</th><th>状态</th><th>新等级</th><th>原时长</th><th>操作</th>
      </tr></thead><tbody>
      ${items.results.map((r: Record<string, unknown>) => html`<tr>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${escAttr(r.archive_date)}</td>
        <td><strong style="font-family:var(--sans);">${escHtml(r.nickname)}</strong></td>
        <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.steam_id)}</code></td>
        <td><span class="cyber-badge ${lvBadge(String(r.original_level))}">${lvLabel(String(r.original_level))}</span></td>
        <td><span class="cyber-badge ${r.action === 'deleted' ? 'cyber-badge-red' : r.action === 'restored' ? 'cyber-badge-green' : 'cyber-badge-amber'}">${r.action === 'deleted' ? '删除' : r.action === 'restored' ? '恢复' : '降级'}</span></td>
        <td>${r.new_level ? html`<span class="cyber-badge ${lvBadge(String(r.new_level))}">${lvLabel(String(r.new_level))}</span>` : html`<span style="color:var(--label-3);">—</span>`}</td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.original_duration)}</td>
        <td>${r.action === 'deleted' ? html`<button class="cyber-btn cyber-btn-danger cyber-btn-small" onclick="unarchiveBan(${escAttr(r.ban_id)})">恢复</button>` : html`<span style="color:var(--label-3);">—</span>`}</td>
      </tr>`)}
    </tbody></table></div></div>`}
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
    children: AdminTeamPage({ admins: rows.results as unknown as { id: number; steam_id: string; username: string; permission_group: string; game_name: string; qq_name: string; position: string; supervisor: string; is_active: number; created_at: string }[] }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
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
  const adminId = c.get('adminId')
  if (!body.steam_id || !body.username) return c.json({ error: 'Steam ID 和用户名为必填' }, 400)
  if (!body.password) return c.json({ error: '密码为必填' }, 400)
  const password = body.password
  const hash = await bcrypt.hash(password, 10)
  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.steam_id, body.username, hash, body.permission_group || 'T1',
           body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'').run()
    await writeAuditLog(c.env.DB, adminId, 'admin_create', 'admin', result.meta.last_row_id as number, `用户名: ${body.username}`)
    return c.json({ success: true })
  } catch { return c.json({ error: 'Steam ID 或用户名已存在' }, 409) }
})

adminRoutes.put('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
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
  await writeAuditLog(c.env.DB, adminId, 'admin_edit', 'admin', Number(id), null)
  return c.json({ success: true })
})

adminRoutes.delete('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = Number(c.req.param('id'))
  const adminId = c.get('adminId')
  if (id === adminId) return c.json({ error: '不能删除自己' }, 400)
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  await writeAuditLog(c.env.DB, adminId, 'admin_delete', 'admin', id, null)
  return c.json({ success: true })
})

// ── 公告管理 ──

adminRoutes.get('/admin/announcements', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const adminId = c.get('adminId')

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM announcements'
  ).first<{ total: number }>()
  const total = countResult?.total || 0
  const totalPages = Math.ceil(total / limit)

  const rows = await c.env.DB.prepare(
    `SELECT a.*, adm.game_name as created_by_name,
      (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id) as read_count,
      (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id AND ar.admin_id = ?) as has_read
     FROM announcements a
     LEFT JOIN admins adm ON a.created_by = adm.id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(adminId, limit, offset).all()

  const arows = rows.results as (AnnouncementRow & { created_by_name: string; read_count: number; has_read: number })[]

  return c.html(AdminLayout({
    title: '公告管理',
    currentPath: '/admin/announcements',
    children: AdminAnnouncementsPage({
      announcements: arows.map(a => ({
        id: a.id, title: a.title, subtitle: a.subtitle, body: a.body,
        citation: a.citation, type: a.type, is_pinned: a.is_pinned,
        is_published: a.is_published, publish_at: a.publish_at,
        created_by_name: a.created_by_name, created_at: a.created_at,
        read_count: a.read_count, is_read: a.has_read,
      })),
      page,
      totalPages,
      total,
    }),
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/api/admin/announcements', requirePermission('T1'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const countResult = await c.env.DB.prepare(
    'SELECT COUNT(*) as total FROM announcements'
  ).first<{ total: number }>()
  const total = countResult?.total || 0

  const rows = await c.env.DB.prepare(
    `SELECT a.*, adm.game_name as created_by_name,
      (SELECT COUNT(*) FROM announcement_reads ar WHERE ar.announcement_id = a.id) as read_count
     FROM announcements a
     LEFT JOIN admins adm ON a.created_by = adm.id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all()

  return c.json({ data: rows.results, total, page })
})

adminRoutes.get('/api/admin/announcements/:id', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const a = await c.env.DB.prepare('SELECT * FROM announcements WHERE id = ?').bind(id).first()
  if (!a) return c.json({ error: '公告不存在' }, 404)
  return c.json(a)
})

adminRoutes.post('/api/admin/announcements', requirePermission('T4'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')
  const isPublished = body.is_draft === '1' ? 0 : (body.publish_at ? 0 : 1)

  const result = await c.env.DB.prepare(
    `INSERT INTO announcements (title, subtitle, body, citation, type, is_pinned, is_published, publish_at, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(body.title, body.subtitle || '', body.body, body.citation || '',
         body.type || 'server', body.is_pinned === '1' ? 1 : 0, isPublished,
         body.publish_at || null, adminId).run()

  await writeAuditLog(c.env.DB, adminId, 'announcement_create', 'announcement', result.meta.last_row_id as number, `标题: ${body.title}`)
  return c.json({ success: true, id: result.meta.last_row_id })
})

adminRoutes.put('/api/admin/announcements/:id', requirePermission('T4'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const body = await c.req.json()

  const existing = await c.env.DB.prepare('SELECT id, title FROM announcements WHERE id = ?').bind(id).first<{ id: number; title: string }>()
  if (!existing) return c.json({ error: '公告不存在' }, 404)

  const isPublished = body.is_draft === '1' ? 0 : (body.publish_at ? 0 : 1)

  await c.env.DB.prepare(
    `UPDATE announcements SET title=?, subtitle=?, body=?, citation=?, type=?, is_pinned=?, is_published=?, publish_at=?, updated_at=datetime('now') WHERE id=?`
  ).bind(body.title, body.subtitle || '', body.body, body.citation || '',
         body.type || 'server', body.is_pinned === '1' ? 1 : 0, isPublished,
         body.publish_at || null, id).run()

  await writeAuditLog(c.env.DB, adminId, 'announcement_edit', 'announcement', Number(id), `标题: ${body.title}`)
  return c.json({ success: true })
})

adminRoutes.delete('/api/admin/announcements/:id', requirePermission('T4'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT id, title FROM announcements WHERE id = ?').bind(id).first<{ id: number; title: string }>()
  if (!existing) return c.json({ error: '公告不存在' }, 404)

  await c.env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id).run()
  await writeAuditLog(c.env.DB, adminId, 'announcement_delete', 'announcement', Number(id), `标题: ${existing.title}`)
  return c.json({ success: true })
})

adminRoutes.post('/api/admin/announcements/:id/toggle-pin', requirePermission('T4'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT id, is_pinned, title FROM announcements WHERE id = ?').bind(id).first<{ id: number; is_pinned: number; title: string }>()
  if (!existing) return c.json({ error: '公告不存在' }, 404)

  const newPinned = existing.is_pinned ? 0 : 1
  await c.env.DB.prepare("UPDATE announcements SET is_pinned = ?, updated_at = datetime('now') WHERE id = ?").bind(newPinned, id).run()
  await writeAuditLog(c.env.DB, adminId, 'announcement_toggle_pin', 'announcement', Number(id), `标题: ${existing.title}, 置顶: ${newPinned}`)
  return c.json({ success: true, is_pinned: newPinned })
})

adminRoutes.post('/api/admin/announcements/:id/publish', requirePermission('T4'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')
  const existing = await c.env.DB.prepare('SELECT id, title FROM announcements WHERE id = ?').bind(id).first<{ id: number; title: string }>()
  if (!existing) return c.json({ error: '公告不存在' }, 404)

  await c.env.DB.prepare("UPDATE announcements SET is_published = 1, updated_at = datetime('now') WHERE id = ?").bind(id).run()
  await writeAuditLog(c.env.DB, adminId, 'announcement_publish', 'announcement', Number(id), `标题: ${existing.title}`)
  return c.json({ success: true })
})

adminRoutes.post('/api/admin/announcements/:id/read', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const adminId = c.get('adminId')

  await c.env.DB.prepare(
    "INSERT OR IGNORE INTO announcement_reads (announcement_id, admin_id, read_at) VALUES (?, ?, datetime('now'))"
  ).bind(id, adminId).run()

  return c.json({ success: true })
})

// ── 退出 ──
adminRoutes.get('/admin/logout', (c) => {
  return c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>localStorage.removeItem('jwt');window.location.href='/login'</script></body></html>`, 200, {
    'Set-Cookie': 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  })
})

// /logout 也能退，顺带清 cookie
adminRoutes.get('/logout', (c) => {
  return c.redirect('/admin/logout')
})
