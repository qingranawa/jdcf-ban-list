import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import type { Env, AdminRow } from '../db'
import { Layout } from '../views/layout'
import { LoginPage } from '../views/login'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.get('/login', (c) => {
  return c.html(Layout({
    title: '管理员登录',
    currentPath: '/login',
    children: LoginPage(),
  }))
})

authRoutes.post('/api/login', async (c) => {
  const { steam_id, username, password } = await c.req.json<{
    steam_id: string;
    username: string;
    password: string;
  }>()

  const admin = await c.env.DB.prepare(
    'SELECT * FROM admins WHERE steam_id = ? AND username = ? AND is_active = 1'
  ).bind(steam_id, username).first<AdminRow>()

  if (!admin) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash)
  if (!passwordMatch) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

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

  return c.json({ token, admin: { id: admin.id, game_name: admin.game_name, permission_group: admin.permission_group } },
    200,
    { 'Set-Cookie': `jwt=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` }
  )
})
