import { Hono } from 'hono'
import type { Env, BanRow, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { HomePage } from '../views/home'
import { TeamPage } from '../views/team'

export const publicRoutes = new Hono<{ Bindings: Env }>()

function computeStatus(ban: { ban_duration: string; ban_time: string; archive_action: string | null }): string {
  if (ban.ban_duration === 'permanent') return 'permanent'
  if (ban.ban_duration.startsWith('mute-')) return 'muted'
  const durationMatch = ban.ban_duration.match(/^(\d+)([dhm])$/)
  if (durationMatch) {
    const amount = parseInt(durationMatch[1])
    const unit = durationMatch[2]
    const banTime = new Date(ban.ban_time).getTime()
    let durationMs = 0
    if (unit === 'm') durationMs = amount * 60 * 1000
    else if (unit === 'h') durationMs = amount * 60 * 60 * 1000
    else if (unit === 'd') durationMs = amount * 24 * 60 * 60 * 1000
    if (unit === 'y' && amount === 50) return 'banned'
    if (Date.now() > banTime + durationMs) {
      if (ban.archive_action === 'downgraded') return 'banned'
      return 'unbanned'
    }
  }
  return 'banned'
}

publicRoutes.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit
  const q = c.req.query('q') || ''
  const levelFilter = c.req.query('level') || ''
  const statusFilter = c.req.query('status') || ''

  let where = 'WHERE 1=1'
  const params: unknown[] = []

  if (q) {
    where += ' AND (b.nickname LIKE ? OR b.steam_id LIKE ? OR b.ip_address LIKE ?)'
    const pattern = `%${q}%`
    params.push(pattern, pattern, pattern)
  }
  if (levelFilter) {
    where += ' AND b.violation_level = ?'
    params.push(levelFilter)
  }

  const countSql = `SELECT COUNT(*) as total FROM bans b ${where}`
  const countResult = await c.env.DB.prepare(countSql).bind(...params).first<{ total: number }>()
  const total = countResult?.total || 0
  const totalPages = Math.ceil(total / limit)

  // 统计数据（仅在无筛选时计算）
  let stats = undefined
  if (!q && !levelFilter && !statusFilter) {
    const s = await c.env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN violation_level='level3' THEN 1 ELSE 0 END) as l3,
        SUM(CASE WHEN violation_level='level2' THEN 1 ELSE 0 END) as l2,
        SUM(CASE WHEN violation_level='level1' THEN 1 ELSE 0 END) as l1,
        SUM(CASE WHEN violation_level='level4' THEN 1 ELSE 0 END) as l4
       FROM bans`
    ).first<{total:number;l3:number;l2:number;l1:number;l4:number}>()
    // 粗略统计封禁中数量（已知数据大部分已解封）
    const bannedCount = await c.env.DB.prepare(
      `SELECT COUNT(*) as c FROM bans WHERE ban_duration IN ('permanent','50y','50Y')`
    ).first<{c:number}>()
    stats = { total: s?.total||0, level3: s?.l3||0, level2: s?.l2||0, level1: s?.l1||0, banned: bannedCount?.c||0 }
  }

  const dataSql = `
    SELECT b.*, a.game_name as handled_by_name
    FROM bans b
    LEFT JOIN admins a ON b.handled_by = a.id
    ${where}
    ORDER BY b.created_at DESC
    LIMIT ? OFFSET ?
  `
  const bans = await c.env.DB.prepare(dataSql).bind(...params, limit, offset).all<BanRow & { handled_by_name: string | null }>()

  let results = bans.results.map(ban => ({
    ...ban,
    status: computeStatus(ban),
  }))

  if (statusFilter) {
    results = results.filter(b => b.status === statusFilter)
  }

  results = results.filter(b => !(b.is_archived === 1 && b.archive_action === 'deleted'))

  if (c.req.header('HX-Request')) {
    return c.html(HomePage({
      bans: results, page, totalPages, total,
      query: q, levelFilter, statusFilter, stats,
    }))
  }

  return c.html(Layout({
    title: '封禁列表',
    currentPath: '/',
    children: HomePage({
      bans: results, page, totalPages, total,
      query: q, levelFilter, statusFilter, stats,
    }),
  }))
})

publicRoutes.get('/team', async (c) => {
  const result = await c.env.DB.prepare(
    'SELECT game_name, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all<AdminRow>()

  return c.html(Layout({
    title: '管理组',
    currentPath: '/team',
    children: TeamPage({ members: result.results }),
  }))
})

publicRoutes.get('/api/bans', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'))
  const limit = 20
  const offset = (page - 1) * limit

  const rows = await c.env.DB.prepare(
    'SELECT b.*, a.game_name as handled_by_name FROM bans b LEFT JOIN admins a ON b.handled_by = a.id ORDER BY b.created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all()

  return c.json({ data: rows.results, page, limit })
})

publicRoutes.get('/api/profiles', async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT game_name, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all()

  return c.json({ data: rows.results })
})
