import { Hono } from 'hono'
import { html } from 'hono/html'
import type { Env, BanRow } from '../db'
import { authMiddleware, requirePermission, GROUP_RANK } from '../middleware/auth'
import { escHtml, escAttr } from '../helpers/escape'
import { Layout } from '../views/layout'
import { AdminBanListPage, AdminBanFormPage } from '../views/admin-bans'

// ── Cron 路由（无 JWT 认证） ──
export const cronRoutes = new Hono<{ Bindings: Env }>()

cronRoutes.post('/api/cron/archive', async (c) => {
  const secret = c.req.header('X-Cron-Secret')
  if (secret !== c.env.CRON_ARCHIVE_SECRET) return c.json({ error: '未授权' }, 401)

  const result = await c.env.DB.prepare(
    `SELECT * FROM bans WHERE is_archived = 0
     AND violation_level IN ('level3', 'level2')
     AND ban_duration NOT IN ('permanent', '50y', '50Y', 'cfba')`
  ).all<BanRow>()

  let l3Deleted = 0, l2Downgraded = 0
  const items: { ban: BanRow; action: string; newLevel?: string }[] = []

  for (const ban of result.results) {
    // 解析时长（支持 mute- 前缀）
    let dur = ban.ban_duration
    if (dur.startsWith('mute-')) dur = dur.slice(5)
    const match = dur.match(/^(\d+)([dhm])$/i)
    if (!match) continue

    const amount = parseInt(match[1])
    const unit = match[2].toLowerCase()
    let ms = unit === 'm' ? amount * 60000 : unit === 'h' ? amount * 3600000 : amount * 86400000
    if (Date.now() <= new Date(ban.ban_time).getTime() + ms) continue

    if (ban.violation_level === 'level3') {
      await c.env.DB.prepare("UPDATE bans SET is_archived=1, archive_action='deleted', archived_at=datetime('now') WHERE id=?").bind(ban.id).run()
      l3Deleted++
      items.push({ ban, action: 'deleted' })
    } else if (ban.violation_level === 'level2') {
      await c.env.DB.prepare("UPDATE bans SET is_archived=1, archive_action='downgraded', violation_level='level3', archived_at=datetime('now') WHERE id=?").bind(ban.id).run()
      l2Downgraded++
      items.push({ ban, action: 'downgraded', newLevel: 'level3' })
    }
  }

  // 写入归档摘要
  if (l3Deleted > 0 || l2Downgraded > 0) {
    const archiveResult = await c.env.DB.prepare(
      `INSERT INTO archives (archive_date, total_processed, l3_deleted, l2_downgraded, l1_ignored, l4_ignored)
       VALUES (date('now'), ?, ?, ?, 0, 0)`
    ).bind(l3Deleted + l2Downgraded, l3Deleted, l2Downgraded).run()
    const archiveId = archiveResult.meta.last_row_id

    // 写入归档明细
    for (const item of items) {
      await c.env.DB.prepare(
        `INSERT INTO archive_items (archive_id, ban_id, nickname, steam_id, original_level, new_level, action, original_status, original_duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(archiveId, item.ban.id, item.ban.nickname, item.ban.steam_id,
             item.ban.violation_level, item.newLevel || null, item.action,
             'unbanned', item.ban.ban_duration).run()
    }
  }

  return c.json({ success: true, l3_deleted: l3Deleted, l2_downgraded: l2Downgraded })
})

// ── Admin 路由（需 JWT 认证） ──
export const adminRoutes = new Hono<{ Bindings: Env }>()
adminRoutes.use('/admin/*', authMiddleware)
adminRoutes.use('/api/admin/*', authMiddleware)

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

  return c.html(Layout({
    title: '封禁管理', currentPath: '/admin/bans',
    children: AdminBanListPage({ bans: rows.results, page, totalPages: Math.ceil(total / limit), total }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/admin/bans/new', requirePermission('T1'), (c) => {
  return c.html(Layout({
    title: '新增封禁', currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban: null }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

adminRoutes.get('/admin/bans/:id/edit', requirePermission('T1'), async (c) => {
  const id = c.req.param('id')
  const ban = await c.env.DB.prepare('SELECT * FROM bans WHERE id = ?').bind(id).first<BanRow>()
  if (!ban) return c.text('未找到该记录', 404)
  return c.html(Layout({
    title: '编辑封禁', currentPath: '/admin/bans',
    children: AdminBanFormPage({ ban }),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// API: Create ban
adminRoutes.post('/api/admin/bans', requirePermission('T1'), async (c) => {
  const body = await c.req.json()
  const adminId = c.get('adminId')
  if (!body.nickname || !body.steam_id) return c.json({ error: '昵称和 Steam ID 为必填' }, 400)

  const result = await c.env.DB.prepare(
    `INSERT INTO bans (nickname, steam_id, ip_address, reason, ban_time, ban_duration, violation_level, notes, handled_by)
     VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', body.violation_level || 'level3', body.notes || '', adminId).run()

  await c.env.DB.prepare(
    `INSERT INTO blacklist (steam_id, nickname, ip_address, ban_count, last_ban_at, latest_violation_level)
     VALUES (?, ?, ?, 1, datetime('now'), ?)
     ON CONFLICT(steam_id) DO UPDATE SET
       ban_count = ban_count + 1, last_ban_at = datetime('now'),
       latest_violation_level = ?, nickname = ?, updated_at = datetime('now')`
  ).bind(body.steam_id, body.nickname, body.ip_address || '',
         body.violation_level || 'level3', body.violation_level || 'level3', body.nickname).run()
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

  await c.env.DB.prepare(
    `UPDATE bans SET nickname=?, steam_id=?, ip_address=?, reason=?, ban_duration=?, violation_level=?, notes=?, updated_at=datetime('now') WHERE id=?`
  ).bind(body.nickname, body.steam_id, body.ip_address || '', body.reason || '',
         body.ban_duration || '30m', body.violation_level || 'level3', body.notes || '', id).run()
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

// 归档日志页面
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
  return c.html(Layout({
    title: '归档日志', currentPath: '/admin/archive', children: tableHtml,
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// Blacklist page (T3+)
adminRoutes.get('/admin/blacklist', requirePermission('T3'), async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const rows = await c.env.DB.prepare('SELECT * FROM blacklist ORDER BY last_ban_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all()
  const cnt = await c.env.DB.prepare('SELECT COUNT(*) as total FROM blacklist').first<{ total: number }>()
  const total = cnt?.total || 0

  function levelBadge(lv: string): string {
    const m: Record<string,string> = { level3:'badge-level3', level2:'badge-level2', level1:'badge-level1', level4:'badge-level4' }
    return m[lv] || 'badge-level3'
  }

  const tableHtml = html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">黑名单总表</h2>
  <p style="color:var(--text-tertiary);font-size:var(--fs-sm);margin-bottom:0.75rem;">共 ${total} 名被封禁玩家</p>
  <table>
    <thead><tr><th>Steam ID</th><th>昵称</th><th>累计封禁</th><th>最近违规</th><th>首次封禁</th><th>最后封禁</th></tr></thead>
    <tbody>${rows.results.length === 0
      ? html`<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-tertiary);">暂无数据</td></tr>`
      : rows.results.map((r: any) => html`<tr>
        <td><code style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-secondary);">${escHtml(r.steam_id)}</code></td>
        <td>${escHtml(r.nickname)}</td>
        <td>${r.ban_count} 次</td>
        <td><span class="badge ${levelBadge(r.latest_violation_level)}">${escHtml(r.latest_violation_level)}</span></td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${(r.first_ban_at||'').slice(0,10)||'—'}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${(r.last_ban_at||'').slice(0,10)||'—'}</td>
      </tr>`)}
    </tbody>
  </table>
  ${total > limit ? html`<div class="pagination">
    ${Array.from({length: Math.ceil(total/limit)}, (_,i)=>i+1).map(p =>
      p === page ? html`<span class="current">${p}</span>` : html`<a href="/admin/blacklist?page=${p}">${p}</a>`)}
  </div>` : ''}
</div>`
  return c.html(Layout({ title: '黑名单总表', currentPath: '/admin/blacklist', children: tableHtml,
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})
