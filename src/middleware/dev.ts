import { createMiddleware } from 'hono/factory'
import { sign } from 'hono/jwt'
import type { Env } from '../db'
import { seedDatabase } from '../dev-seed'

const GROUP_RANK: Record<string, number> = {
  OWNER: 0, T6: 1, T5: 2, T4: 3, T3: 4, T2: 5, T1: 6,
}
const RANK_TO_GROUP = Object.entries(GROUP_RANK).reduce<Record<number, string>>((acc, [g, r]) => { acc[r] = g; return acc }, {})

const DEV_ADMIN_STEAM_ID = '76561198000000001'

let seeded = false

export const devMiddleware = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  if (!c.env.DEV_MODE) return next()

  if (c.req.query('dev') !== '1') return next()

  if (!seeded) {
    await seedDatabase(c.env.DB)
    seeded = true
  }

  let targetGroup = 'OWNER'
  const lvlParam = c.req.query('lvl')
  if (lvlParam !== undefined) {
    const rank = parseInt(lvlParam)
    if (!isNaN(rank) && RANK_TO_GROUP[rank]) {
      targetGroup = RANK_TO_GROUP[rank]
    }
  }

  const admin = await c.env.DB.prepare(
    'SELECT id, permission_group, game_name FROM admins WHERE steam_id = ?'
  ).bind(DEV_ADMIN_STEAM_ID).first<{ id: number; permission_group: string; game_name: string }>()

  if (!admin) return next()

  const token = await sign({
    adminId: admin.id,
    gameName: admin.game_name,
    permissionGroup: targetGroup,
    sub: admin.id.toString(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  }, c.env.JWT_SECRET)

  c.header('Set-Cookie', `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`)

  await next()
})
