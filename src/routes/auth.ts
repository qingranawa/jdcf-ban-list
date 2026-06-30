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
    children: LoginPage({ error: '' }),
  }))
})

authRoutes.get('/logout', (c) => {
  return c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>localStorage.removeItem('jwt');window.location.href='/login'</script></body></html>`, 200, {
    'Set-Cookie': 'jwt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  })
})

// ── 推荐登录方式：fetch JSON ──
authRoutes.post('/api/login', async (c) => {
  const { steam_id, username, password } = await c.req.json<{
    steam_id: string
    username: string
    password: string
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

  return c.json(
    { token, admin: { id: admin.id, game_name: admin.game_name, permission_group: admin.permission_group } },
    200,
    { 'Set-Cookie': `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` }
  )
})

// ── 后备：form POST ──
authRoutes.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const steam_id = (body.steam_id as string || '').trim()
  const username = (body.username as string || '').trim()
  const password = body.password as string || ''

  if (!steam_id || !username || !password) {
    return c.html(Layout({
      title: '管理员登录',
      currentPath: '/login',
      children: LoginPage({ error: '请填写所有字段' }),
    }))
  }

  const admin = await c.env.DB.prepare(
    'SELECT * FROM admins WHERE steam_id = ? AND username = ? AND is_active = 1'
  ).bind(steam_id, username).first<AdminRow>()

  if (!admin) {
    return c.html(Layout({
      title: '管理员登录',
      currentPath: '/login',
      children: LoginPage({ error: '账号或密码错误' }),
    }))
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash)
  if (!passwordMatch) {
    return c.html(Layout({
      title: '管理员登录',
      currentPath: '/login',
      children: LoginPage({ error: '账号或密码错误' }),
    }))
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

  const safeToken = token.replace(/</g, '\\u003c')
  return c.html(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>localStorage.setItem('jwt','${safeToken}');window.location.href='/admin/bans'</script></body></html>`,
    200,
    { 'Set-Cookie': `jwt=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800` }
  )
})
