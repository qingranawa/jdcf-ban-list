// > Public routes — ban list, team info, stats (no auth required)
import { Hono } from 'hono'
import type { Env, BanRow, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { HomePage, BanTable } from '../views/home'
import { TeamPage } from '../views/team'
import { StatsPage, type StatsData } from '../views/stats'

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
    where += ' AND (b.nickname LIKE ? ESCAPE \'\\\' OR b.steam_id LIKE ? ESCAPE \'\\\' OR b.ip_address LIKE ? ESCAPE \'\\\')'
    const escaped = q.replace(/[%_\\]/g, '\\$&')
    const pattern = `%${escaped}%`
    params.push(pattern, pattern, pattern)
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

function fmtDuration(d: string): string {
  if (!d) return '—'
  const m: Record<string,string> = { m:'分钟', h:'小时', d:'天', y:'年', permanent:'永久', warning:'警告', cfba:'CFBA', mute:'禁言' }
  if (d.startsWith('mute-')) return '禁言' + d.replace('mute-', '')
  if (m[d]) return m[d]
  const parts = d.match(/^(\d+)([dhmy])$/i)
  if (parts) return parts[1] + m[parts[2].toLowerCase()] || ''
  return d
}

function categorizeDuration(d: string): string {
  if (/^(permanent|50[Yy])$/.test(d)) return '永久'
  if (d === 'warning') return '警告'
  if (d.startsWith('mute-')) return '禁言'
  if (d === 'cfba') return 'CFBA'
  const m = d.match(/^(\d+)([dhmy])$/i)
  if (!m) return '其他'
  const n = parseInt(m[1]), u = m[2].toLowerCase()
  if (u === 'm') return '分钟'
  if (u === 'h') return '小时'
  if (u === 'd') { if (n <= 7) return '1-7天'; if (n <= 30) return '8-30天'; return '30天以上' }
  if (u === 'y') return '1年以上'
  return '其他'
}
const durCatColors: Record<string, string> = {
  '永久': '#ff3355', '警告': '#66ffcc', '禁言': '#ffb000', 'CFBA': '#ff00aa',
  '1-7天': '#00f0ff', '8-30天': '#00aaff', '30天以上': '#0066ff',
  '小时': '#8866ff', '分钟': '#cc66ff', '1年以上': '#ff66aa', '其他': '#888888'
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
