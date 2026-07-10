// > Public routes — ban list, team info, stats, announcements (no auth required)
import { Hono } from 'hono'
import { html } from 'hono/html'
import { verify } from 'hono/jwt'
import type { Env, BanRow, AdminRow, AnnouncementRow } from '../db'
import { Layout } from '../views/layout'
import { HomePage, BanTable } from '../views/home'
import { SearchPage } from '../views/search'
import { TeamPage } from '../views/team'
import { StatsPage, type StatsData } from '../views/stats'
import { fmtDuration, categorizeDuration, durCatColors, fmtDate } from '../helpers/format'
import { PlayerProfilePage, type PlayerProfileData } from '../views/player'
import { AnnouncementsPage, AnnouncementDetailPage } from '../views/announcements'
import { AdminProfilePage, type AdminProfileData } from '../views/admin-profile'

export const publicRoutes = new Hono<{ Bindings: Env }>()

// * Core status computer — used by both public and admin routes
// * Returns: 'banned' | 'unbanned' | 'permanent' | 'muted' | 'warning' | 'cfba'
// ? 移除 archive_action 检查是因为已归档记录不会在此路由出现
export function computeStatus(ban: { ban_duration: string; ban_time: string; archive_action: string | null }): string {
  // ! 警告不算封禁，没时效期限
  if (ban.ban_duration === 'warning') return 'warning'
  // ! 永久不解封
  if (ban.ban_duration === 'permanent') return 'permanent'
  if (ban.ban_duration === 'cfba') return 'cfba'
  // ! 50年等于永久
  if (/^50[Yy]$/.test(ban.ban_duration)) return 'banned'

  let dur = ban.ban_duration
  let isMute = false
  // 禁言：先把 mute- 前缀摘了再算时间
  if (dur.startsWith('mute-')) {
    dur = dur.slice(5)
    isMute = true
  }

  const match = dur.match(/^(\d+)([dhmy])$/i)
  if (match) {
    const amount = parseInt(match[1])
    const unit = match[2].toLowerCase()
    const banTime = new Date(ban.ban_time).getTime()
    const multipliers: Record<string, number> = { m: 60000, h: 3600000, d: 86400000, y: 31536000000 }
    const ms = amount * (multipliers[unit] || 0)
    // 还没到期
    if (Date.now() <= banTime + ms) {
      return isMute ? 'muted' : 'banned'
    }
    // 到期了
    return 'unbanned'
  }
  // cfba/警告等特殊值，直接当 banned
  return 'banned'
}

publicRoutes.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = Math.min(100, Math.max(10, parseInt(c.req.query('per_page') || '25')))
  const limit = perPage
  const offset = (page - 1) * limit
  const q = c.req.query('q') || ''
  const levelFilter = c.req.query('level') || ''
  const statusFilter = c.req.query('status') || ''

  let where = 'WHERE b.is_archived = 0'
  const params: unknown[] = []

  if (q) {
    where += ' AND (b.nickname LIKE ? ESCAPE \'\\\' OR b.steam_id LIKE ? ESCAPE \'\\\' OR b.ip_address LIKE ? ESCAPE \'\\\' OR b.reason LIKE ? ESCAPE \'\\\' OR b.notes LIKE ? ESCAPE \'\\\')'
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escaped}%`
    params.push(pattern, pattern, pattern, pattern, pattern)
  }
  if (levelFilter) {
    where += ' AND b.violation_level = ?'
    params.push(levelFilter)
  }

  let total: number
  let results: (BanRow & { handled_by_name: string | null; status: string })[]
  let totalPages: number

  if (statusFilter) {
    // status 在 JS 计算，无法用 SQL 分页，所以全量查再 JS 分页
    const allBans = await c.env.DB.prepare(
      `SELECT b.*, a.game_name as handled_by_name FROM bans b
       LEFT JOIN admins a ON b.handled_by = a.id
       ${where} ORDER BY b.created_at DESC`
    ).bind(...params).all<BanRow & { handled_by_name: string | null }>()
    const processed = allBans.results.map(ban => ({ ...ban, status: computeStatus(ban) }))
    const filtered = processed.filter(b => b.status === statusFilter)
    total = filtered.length
    totalPages = Math.ceil(total / limit)
    results = filtered.slice(offset, offset + limit)
  } else {
    const countSql = `SELECT COUNT(*) as total FROM bans b ${where}`
    const countResult = await c.env.DB.prepare(countSql).bind(...params).first<{ total: number }>()
    total = countResult?.total || 0
    totalPages = Math.ceil(total / limit)

    const bans = await c.env.DB.prepare(
      `SELECT b.*, a.game_name as handled_by_name FROM bans b
       LEFT JOIN admins a ON b.handled_by = a.id
       ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<BanRow & { handled_by_name: string | null }>()
    results = bans.results.map(ban => ({ ...ban, status: computeStatus(ban) }))
  }

  // * 没筛选项才跑统计，省一次 DB 查询
  let stats: { total: number; level3: number; level2: number; level1: number; level4: number; warning: number; other: number; banned: number } | undefined
  if (!q && !levelFilter && !statusFilter) {
    const s = await c.env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN violation_level='level3' THEN 1 ELSE 0 END) as l3,
        SUM(CASE WHEN violation_level='level2' THEN 1 ELSE 0 END) as l2,
        SUM(CASE WHEN violation_level='level1' THEN 1 ELSE 0 END) as l1,
        SUM(CASE WHEN violation_level='level4' THEN 1 ELSE 0 END) as l4,
        SUM(CASE WHEN violation_level='warning' THEN 1 ELSE 0 END) as warning,
        SUM(CASE WHEN violation_level NOT IN ('level3','level2','level1','level4','warning') THEN 1 ELSE 0 END) as other
       FROM bans WHERE is_archived = 0`
    ).first<{total:number;l3:number;l2:number;l1:number;l4:number;warning:number;other:number}>()
          const bannedCount = await c.env.DB.prepare(
        `SELECT COUNT(*) as c FROM bans WHERE is_archived = 0 AND ban_duration IN ('permanent','50y','50Y')`
      ).first<{c:number}>()
    stats = { total: s?.total||0, level3: s?.l3||0, level2: s?.l2||0, level1: s?.l1||0, level4: s?.l4||0, warning: s?.warning||0, other: s?.other||0, banned: bannedCount?.c||0 }
  }

    if (c.req.header('HX-Request')) {
    return c.html(BanTable({
      bans: results, page, totalPages, total, perPage,
      query: q, levelFilter, statusFilter,
    }))
  }

  return c.html(Layout({
    title: '封禁列表',
    currentPath: '/',
    children: HomePage({
      bans: results, page, totalPages, total, perPage,
      query: q, levelFilter, statusFilter, stats,
    }),
  }))
})

// ── 搜索页面 ──
publicRoutes.get('/search', async (c) => {
  const q = c.req.query('q') || ''
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const perPage = Math.min(100, Math.max(10, parseInt(c.req.query('per_page') || '25')))
  const limit = perPage
  const offset = (page - 1) * limit

  let results = []
  let total = 0

  if (q) {
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    const pattern = '%' + escaped + '%'

    const countResult = await c.env.DB.prepare(
      'SELECT COUNT(*) as total FROM bans b WHERE b.is_archived = 0 AND (b.nickname LIKE ? ESCAPE \'\\\' OR b.steam_id LIKE ? ESCAPE \'\\\' OR b.ip_address LIKE ? ESCAPE \'\\\' OR b.reason LIKE ? ESCAPE \'\\\' OR b.notes LIKE ? ESCAPE \'\\\')'
    ).bind(pattern, pattern, pattern, pattern, pattern).first()
    total = countResult?.total || 0

    const rows = await c.env.DB.prepare(
      'SELECT b.*, a.game_name as handled_by_name FROM bans b' +
      ' LEFT JOIN admins a ON b.handled_by = a.id' +
      ' WHERE b.is_archived = 0 AND (b.nickname LIKE ? ESCAPE \'\\\' OR b.steam_id LIKE ? ESCAPE \'\\\' OR b.ip_address LIKE ? ESCAPE \'\\\' OR b.reason LIKE ? ESCAPE \'\\\' OR b.notes LIKE ? ESCAPE \'\\\')' +
      ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
    ).bind(pattern, pattern, pattern, pattern, pattern, limit, offset).all()
    results = rows.results.map((b) => ({ ...b, status: computeStatus(b) }))
  }

  const totalPages = Math.ceil(total / limit) || 1

  return c.html(Layout({
    title: q ? (q + ' - 搜索结果') : '搜索',
    currentPath: '/',
    children: SearchPage({ query: q, results, total, page, totalPages, perPage }),
  }))
})
publicRoutes.get('/team', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT steam_id, game_name, username, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all<AdminRow>()

  return c.html(Layout({
    title: '管理组',
    currentPath: '/team',
    children: TeamPage({ admins: result.results }),
  }))
})

// ── 玩家档案页（按 ban id 查询）──
publicRoutes.get('/player/:id', async (c) => {
  const id = c.req.param('id')

  const banRecord = await c.env.DB.prepare(
    'SELECT nickname, steam_id FROM bans WHERE id = ?'
  ).bind(id).first<{ nickname: string; steam_id: string }>()

  if (!banRecord) {
    return c.html(Layout({
      title: '玩家档案', currentPath: '/',
      children: PlayerProfilePage({
        nickname: '—', steam_id: id,
        totalBans: 0, currentStatus: '', currentStatusLabel: '无记录',
        currentStatusColor: 'cyber-badge-neutral', highestLevel: '—', highestLevelColor: '',
        onWatchlist: false, watchlistReason: null,
        firstBanDate: '—', lastBanDate: '—', maskedIp: null, bans: [],
      }),
    }))
  }

  // 如果 steam_id 是占位符，用 nickname 查询
  const steam_id = banRecord.steam_id
  const isPlaceholder = !steam_id || steam_id.length < 6 || steam_id === 'N/A' || steam_id === 'unknown' || steam_id === '0'
  const queryField = isPlaceholder ? 'b.nickname' : 'b.steam_id'
  const queryValue = isPlaceholder ? banRecord.nickname : steam_id

  const bans = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE ${queryField} = ? AND b.is_archived = 0
     ORDER BY b.created_at DESC`
  ).bind(queryValue).all<BanRow & { handled_by_name: string | null }>()

  if (bans.results.length === 0) {
    return c.html(Layout({
      title: '玩家档案', currentPath: '/',
      children: PlayerProfilePage({
        nickname: banRecord.nickname, steam_id,
        totalBans: 0, currentStatus: '', currentStatusLabel: '无记录',
        currentStatusColor: 'cyber-badge-neutral', highestLevel: '—', highestLevelColor: '',
        onWatchlist: false, watchlistReason: null,
        firstBanDate: '—', lastBanDate: '—', maskedIp: null, bans: [],
      }),
    }))
  }

  const watchEntry = await c.env.DB.prepare(
    'SELECT reason, notes FROM watchlist WHERE steam_id = ?'
  ).bind(steam_id).first<{ reason: string; notes: string }>()

  const processed = bans.results.map(b => ({ ...b, status: computeStatus(b) }))
  const totalBans = processed.length
  const currentStatus = processed[0].status
  const currentStatusLabel = statusLabel(currentStatus)
  const currentStatusColor = statusBadgeColor(currentStatus)

  const levelOrder: Record<string, number> = { level1: 0, level2: 1, level3: 2, warning: 3 }
  const sortedByLevel = [...processed].sort((a, b) =>
    (levelOrder[a.violation_level] ?? 99) - (levelOrder[b.violation_level] ?? 99)
  )
  const highestLevel = sortedByLevel[0].violation_level
  const highestLevelColor = lvStatColor(highestLevel)

  const dates = processed.map(b => b.ban_time).filter(Boolean).sort()
  const firstBanDate = fmtDate(dates[0])
  const lastBanDate = fmtDate(dates[dates.length - 1])

  const ip = processed.find(b => b.ip_address)?.ip_address || null
  const maskedIp = ip ? ip.replace(/\.\d+$/, '.***') : null

  const nickname = processed[0].nickname || '—'

  const onWatchlist = !!watchEntry
  const watchlistReason = watchEntry?.reason || null

  const profileData: PlayerProfileData = {
    nickname,
    steam_id,
    totalBans,
    currentStatus,
    currentStatusLabel,
    currentStatusColor,
    highestLevel,
    highestLevelColor,
    onWatchlist,
    watchlistReason,
    firstBanDate,
    lastBanDate,
    maskedIp,
    bans: processed.map(b => ({
      ban_time: b.ban_time,
      reason: b.reason,
      ban_duration: b.ban_duration,
      violation_level: b.violation_level,
      status: b.status,
      handled_by_name: b.handled_by_name,
    })),
  }

  return c.html(Layout({
    title: `${nickname} - 玩家档案`,
    currentPath: '/',
    children: PlayerProfilePage(profileData),
  }))
})

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    banned: '封禁中', unbanned: '已解封', permanent: '永久封禁',
    muted: '禁言中', warning: '警告', cfba: 'CF封禁',
  }
  return m[s] || s
}

function statusBadgeColor(s: string): string {
  const m: Record<string, string> = {
    banned: 'cyber-badge-red', permanent: 'cyber-badge-red',
    unbanned: 'cyber-badge-green', muted: 'cyber-badge-amber',
    warning: 'cyber-badge-neutral', cfba: 'cyber-badge-neutral',
  }
  return m[s] || 'cyber-badge-neutral'
}

function lvStatColor(lv: string): string {
  const m: Record<string, string> = {
    level1: 'sr', level2: 'sm', level3: '', warning: 'sa',
  }
  return m[lv] || ''
}

publicRoutes.get('/stats', async (c) => {
  const s = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN violation_level='level3' THEN 1 ELSE 0 END) as l3,
      SUM(CASE WHEN violation_level='level2' THEN 1 ELSE 0 END) as l2,
      SUM(CASE WHEN violation_level='level1' THEN 1 ELSE 0 END) as l1,
      SUM(CASE WHEN violation_level='level4' THEN 1 ELSE 0 END) as l4,
      SUM(CASE WHEN violation_level='warning' THEN 1 ELSE 0 END) as warning,
      SUM(CASE WHEN violation_level NOT IN ('level3','level2','level1','level4','warning') THEN 1 ELSE 0 END) as other
     FROM bans WHERE is_archived = 0`
  ).first<{total:number;l3:number;l2:number;l1:number;l4:number;warning:number;other:number}>()

  const topDay = await c.env.DB.prepare(
    `SELECT DATE(ban_time) as label, COUNT(*) as count FROM bans WHERE is_archived = 0 GROUP BY label ORDER BY count DESC LIMIT 1`
  ).first<{label:string;count:number}>()

  const topMonth = await c.env.DB.prepare(
    `SELECT strftime('%Y-%m', ban_time) as label, COUNT(*) as count FROM bans WHERE is_archived = 0 GROUP BY label ORDER BY count DESC LIMIT 1`
  ).first<{label:string;count:number}>()

  const topYear = await c.env.DB.prepare(
    `SELECT strftime('%Y', ban_time) as label, COUNT(*) as count FROM bans WHERE is_archived = 0 GROUP BY label ORDER BY count DESC LIMIT 1`
  ).first<{label:string;count:number}>()

  const durations = await c.env.DB.prepare(
    `SELECT ban_duration, COUNT(*) as count FROM bans WHERE is_archived = 0 GROUP BY ban_duration ORDER BY count DESC LIMIT 10`
  ).all<{ban_duration:string;count:number}>()

  const topOperators = await c.env.DB.prepare(
    `SELECT COALESCE(a.game_name, '系统') as name, COUNT(*) as count
     FROM bans b LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.is_archived = 0
     GROUP BY b.handled_by ORDER BY count DESC LIMIT 5`
  ).all<{name:string;count:number}>()

  const dailyTrend = await c.env.DB.prepare(
    `SELECT DATE(ban_time) as date, COUNT(*) as count
     FROM bans WHERE is_archived = 0 AND ban_time >= datetime('now', '-30 days')
     GROUP BY DATE(ban_time) ORDER BY date ASC`
  ).all<{date:string;count:number}>()

  const allDurationRows = await c.env.DB.prepare(
    `SELECT ban_duration FROM bans WHERE is_archived = 0`
  ).all<{ban_duration:string}>()

  const total = s?.total || 0
  const levels: StatsData['levels'] = [
    { label: '3级违规', value: s?.l3||0, color: '#00f0ff' },
    { label: '2级违规', value: s?.l2||0, color: '#ff00aa' },
    { label: '1级', value: s?.l1||0, color: '#ff3355' },
    { label: '4级(逃逸)', value: s?.l4||0, color: '#ffb000' },
    { label: '警告', value: s?.warning||0, color: '#66ffcc' },
    { label: '其他', value: s?.other||0, color: '#888888' },
  ].filter(l => l.value > 0)

  const catMap = new Map<string, number>()
  for (const r of allDurationRows.results || []) {
    const cat = categorizeDuration(r.ban_duration)
    catMap.set(cat, (catMap.get(cat) || 0) + 1)
  }
  const durationCategories: StatsData['durationCategories'] = Array.from(catMap.entries())
    .map(([label, count]) => ({ label, count, color: durCatColors[label] || '#888888' }))
    .sort((a, b) => b.count - a.count)

  return c.html(Layout({
    title: '统计信息',
    currentPath: '/stats',
    children: StatsPage({
      total,
      levels,
      topDay: topDay || null,
      topMonth: topMonth || null,
      topYear: topYear || null,
      durations: (durations?.results||[]).map(d => ({ label: fmtDuration(d.ban_duration), count: d.count })),
      topOperators: topOperators?.results || [],
      dailyTrend: dailyTrend?.results || [],
      durationCategories,
    }),
  }))
})

publicRoutes.get('/api/bans', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    'SELECT b.*, a.game_name as handled_by_name FROM bans b LEFT JOIN admins a ON b.handled_by = a.id WHERE NOT (b.is_archived = 1 AND b.archive_action = \'deleted\') ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  return c.json({ data: rows.results, page, limit })
})

publicRoutes.get('/api/profiles', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT game_name, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all()

  return c.json({ data: rows.results })
})

// ── 公告列表 ──
publicRoutes.get('/announcements', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const type = c.req.query('type') || ''
  const limit = 10
  const offset = (page - 1) * limit

  let adminGroup: string | null = null
  const authHeader = c.req.header('Authorization')
  const cookie = c.req.header('Cookie')
  let token: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }
  if (!token && cookie) {
    const match = cookie.match(/(?:^|;\s*)jwt=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
      adminGroup = (payload.permissionGroup as string) || null
    } catch { /* ignore */ }
  }

  let where = 'a.is_published = 1'
  const params: unknown[] = []

  const isAdmin = adminGroup && ['OWNER', 'T6', 'T5', 'T4', 'T3', 'T2', 'T1'].includes(adminGroup)
  where += ' AND (a.type != ? OR ? IS NOT NULL)'
  params.push('internal', isAdmin ? 'yes' : null)

  if (type) {
    where += ' AND a.type = ?'
    params.push(type)
  }

  const countResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as total FROM announcements a WHERE ${where}`
  ).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0
  const totalPages = Math.ceil(total / limit)

  const rows = await c.env.DB.prepare(
    `SELECT a.*, adm.game_name as created_by_name
     FROM announcements a
     LEFT JOIN admins adm ON a.created_by = adm.id
     WHERE ${where}
     ORDER BY a.is_pinned DESC, a.publish_at DESC, a.created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset).all<AnnouncementRow & { created_by_name: string | null }>()
  const announcements = rows.results.map(a => ({ ...a, created_by_name: a.created_by_name || '' }))

  return c.html(Layout({
    title: '公告',
    currentPath: '/announcements',
    children: AnnouncementsPage({
      announcements,
      currentType: type || '',
      page,
      totalPages,
      adminGroup,
    }),
  }))
})

// ── 公告详情 ──
publicRoutes.get('/announcements/:id', async (c) => {
  const id = c.req.param('id')
  const row = await c.env.DB.prepare(
    `SELECT a.*, adm.game_name as created_by_name
     FROM announcements a
     LEFT JOIN admins adm ON a.created_by = adm.id
     WHERE a.id = ? AND a.is_published = 1`
  ).bind(id).first<AnnouncementRow & { created_by_name: string | null }>()

  if (!row) {
    return c.html(Layout({
      title: '公告不存在',
      currentPath: '/announcements',
      children: html`<div class="cyber-admin-content"><p style="color:var(--label-3);font-size:15px;text-align:center;padding:4rem 0;">公告不存在</p></div>`,
    }))
  }

  const announcement = { ...row, created_by_name: row.created_by_name || '' }

  let detailAdminGroup: string | null = null
  const authHeader = c.req.header('Authorization')
  const cookie = c.req.header('Cookie')
  let token: string | null = null
  if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.slice(7)
  if (!token && cookie) {
    const match = cookie.match(/(?:^|;\s*)jwt=([^;]+)/)
    if (match) token = decodeURIComponent(match[1])
  }
  if (token) {
    try {
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
      detailAdminGroup = (payload.permissionGroup as string) || null
    } catch { /* ignore */ }
  }

  return c.html(Layout({
    title: announcement.title,
    currentPath: '/announcements',
    children: AnnouncementDetailPage({ announcement, adminGroup: detailAdminGroup }),
  }))
})



// ── 管理员详情页 ──
publicRoutes.get('/admin-profile/:id', async (c) => {
  const id = c.req.param('id')

  const admin = await c.env.DB.prepare(
    'SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active FROM admins WHERE id = ?'
  ).bind(id).first<AdminRow>()

  if (!admin) {
    return c.html(Layout({
      title: '管理员不存在', currentPath: '/',
      children: html`<div style="max-width:800px;margin:0 auto;padding:4rem;text-align:center;color:var(--label-3);font-size:15px;">管理员不存在</div>`,
    }))
  }

  const bans = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.handled_by = ? AND b.violation_level != 'admin_discipline' AND b.is_archived = 0
     ORDER BY b.created_at DESC LIMIT 20`
  ).bind(id).all<BanRow & { handled_by_name: string | null }>()
  const bansWithStatus = bans.results.map(b => ({ ...b, status: computeStatus(b) }))

  const disciplines = await c.env.DB.prepare(
    `SELECT b.*, a.game_name as handled_by_name FROM bans b
     LEFT JOIN admins a ON b.handled_by = a.id
     WHERE b.steam_id = ? AND b.violation_level = 'admin_discipline'
     ORDER BY b.created_at DESC LIMIT 20`
  ).bind(admin.steam_id).all<BanRow & { handled_by_name: string | null }>()

  const auditLogs = await c.env.DB.prepare(
    'SELECT id, action, target_type, target_id, detail, created_at FROM audit_log WHERE admin_id = ? ORDER BY created_at DESC LIMIT 50'
  ).bind(id).all<{ id: number; action: string; target_type: string; target_id: number | null; detail: string | null; created_at: string }>()

  const banCount = bansWithStatus.length
  const disciplineCount = disciplines.results.length
  const levelOrder: Record<string, number> = { level1: 0, level2: 1, level3: 2, warning: 3, admin_discipline: 4 }
  const sortedByLevel = [...bansWithStatus].sort((a, b) =>
    (levelOrder[a.violation_level] ?? 99) - (levelOrder[b.violation_level] ?? 99)
  )
  const highestLevel = sortedByLevel[0]?.violation_level || ''
  const auditLogCount = auditLogs.results.length

  const profileData: AdminProfileData = {
    id: admin.id, steam_id: admin.steam_id, username: admin.username,
    game_name: admin.game_name, permission_group: admin.permission_group,
    qq_name: admin.qq_name, position: admin.position, supervisor: admin.supervisor,
    is_active: admin.is_active,
    banCount, disciplineCount, highestLevel, auditLogCount,
    bans: bansWithStatus.map(b => ({
      id: b.id, nickname: b.nickname, reason: b.reason,
      ban_time: b.ban_time, ban_duration: b.ban_duration,
      violation_level: b.violation_level, status: b.status,
    })),
    disciplines: disciplines.results.map(d => ({
      id: d.id, ban_duration: d.ban_duration, reason: d.reason,
      ban_time: d.ban_time, handled_by_name: d.handled_by_name,
      co_handlers: d.co_handlers, notes: d.notes,
    })),
    auditLogs: auditLogs.results,
  }

  return c.html(Layout({
    title: `${admin.game_name || admin.username} - 管理员档案`,
    currentPath: '/',
    children: AdminProfilePage(profileData),
  }))
})

// ── Cron: 发布定时公告 ──
publicRoutes.get('/api/cron/publish-announcements', async (c) => {
  const secret = c.req.header('X-Cron-Secret')
  if (!secret || secret !== c.env.CRON_PUBLISH_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const result = await c.env.DB.prepare(
    `UPDATE announcements SET is_published = 1
     WHERE is_published = 0 AND publish_at IS NOT NULL AND publish_at <= datetime('now')`
  ).run()

  return c.json({ published: result.meta.changes })
})
