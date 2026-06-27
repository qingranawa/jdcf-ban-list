import { Hono } from 'hono'
import type { Env, BanRow, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { HomePage, BanTable } from '../views/home'
import { TeamPage } from '../views/team'

export const publicRoutes = new Hono<{ Bindings: Env }>()

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
  const limit = 20
  const offset = (page - 1) * limit
  const q = c.req.query('q') || ''
  const levelFilter = c.req.query('level') || ''
  const statusFilter = c.req.query('status') || ''

  let where = 'WHERE b.is_archived = 0'
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

  // 没筛选项才跑统计，省一次DB查询
  let stats = undefined
  if (!q && !levelFilter && !statusFilter) {
    const s = await c.env.DB.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN violation_level='level3' THEN 1 ELSE 0 END) as l3,
        SUM(CASE WHEN violation_level='level2' THEN 1 ELSE 0 END) as l2,
        SUM(CASE WHEN violation_level='level1' THEN 1 ELSE 0 END) as l1,
        SUM(CASE WHEN violation_level='level4' THEN 1 ELSE 0 END) as l4
       FROM bans WHERE is_archived = 0`
    ).first<{total:number;l3:number;l2:number;l1:number;l4:number}>()
          const bannedCount = await c.env.DB.prepare(
        `SELECT COUNT(*) as c FROM bans WHERE is_archived = 0 AND ban_duration IN ('permanent','50y','50Y')`
      ).first<{c:number}>()
    stats = { total: s?.total||0, level3: s?.l3||0, level2: s?.l2||0, level1: s?.l1||0, banned: bannedCount?.c||0 }
  }

  if (c.req.header('HX-Request')) {
    return c.html(BanTable({
      bans: results, page, totalPages, total,
      query: q, levelFilter, statusFilter,
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
    'SELECT game_name, username, qq_name, permission_group, position, supervisor FROM admins WHERE is_active = 1 ORDER BY id ASC'
  ).all<AdminRow>()

  return c.html(Layout({
    title: '管理组',
    currentPath: '/team',
    children: TeamPage({ admins: result.results }),
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
