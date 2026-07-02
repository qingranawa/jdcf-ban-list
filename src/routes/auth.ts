import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import type { Env, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { LoginPage } from '../views/login'
import { checkLoginRateLimit, recordLoginFailure, clearLoginRateLimit } from '../middleware/rate-limit'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.get('/login', (c) => {
  return c.html(Layout({
    title: '管理员登录',
    currentPath: '/login',
    children: LoginPage({ error: '' }),
  }))
})

authRoutes.get('/logout', (c) => {
  return c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>localStorage.removeItem('jwt');window.location.href='/login'</script></body></html>`, 200, {
    'Set-Cookie': 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  })
})

// ── 推荐登录方式：fetch JSON ──
// ── JWT 自检 ──
authRoutes.get('/api/auth/check', async (c) => {
  const cookie = c.req.header('Cookie')
  const match = cookie?.match(/(?:^|;\s*)jwt=([^;]+)/)
  if (!match) return c.json({ valid: false })
  try {
    await verify(decodeURIComponent(match[1]), c.env.JWT_SECRET, 'HS256')
    return c.json({ valid: true })
  } catch {
    return c.json({ valid: false })
  }
})

authRoutes.post('/api/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown'

  const { allowed, remaining } = await checkLoginRateLimit(c.env.DB, ip)
  if (!allowed) {
    return c.json({ error: '登录尝试过于频繁，请 15 分钟后再试', remaining }, 429)
  }

  const { steam_id, username, password } = await c.req.json<{
    steam_id: string
    username: string
    password: string
  }>()

  const admin = await c.env.DB.prepare(
    'SELECT * FROM admins WHERE steam_id = ? AND username = ? AND is_active = 1'
  ).bind(steam_id, username).first<AdminRow>()

  if (!admin) {
    await recordLoginFailure(c.env.DB, ip)
    return c.json({ error: '账号或密码错误' }, 401)
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash)
  if (!passwordMatch) {
    await recordLoginFailure(c.env.DB, ip)
    return c.json({ error: '账号或密码错误' }, 401)
  }

  await clearLoginRateLimit(c.env.DB, ip)

  const token = await sign(
    {
      adminId: admin.id,
      gameName: admin.game_name,
      permissionGroup: admin.permission_group,
      sub: admin.id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    c.env.JWT_SECRET
  )

  return c.json(
    { token, admin: { id: admin.id, game_name: admin.game_name, permissionGroup: admin.permission_group } },
    200,
    { 'Set-Cookie': `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` }
  )
})


