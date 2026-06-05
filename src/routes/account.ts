import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import type { Env, AdminRow } from '../db'
import { authMiddleware, type Variables } from '../middleware/auth'
import { Layout } from '../views/layout'
import { AccountPage } from '../views/account'

export const accountRoutes = new Hono<{ Bindings: Env; Variables: Variables }>()
accountRoutes.use('*', authMiddleware)

// 账户页面
accountRoutes.get('/account', (c) => {
  return c.html(Layout({
    title: '账户',
    currentPath: '/account',
    children: AccountPage(),
    admin: { game_name: '', permission_group: c.get('permissionGroup') },
  }))
})

// API: 获取当前用户信息
accountRoutes.get('/api/account', async (c) => {
  const id = c.get('adminId')
  const admin = await c.env.DB.prepare(
    'SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor FROM admins WHERE id = ?'
  ).bind(id).first<AdminRow>()
  if (!admin) return c.json({ error: '用户不存在' }, 404)
  return c.json(admin)
})

// API: 修改当前用户信息
accountRoutes.put('/api/account', async (c) => {
  const id = c.get('adminId')
  const body = await c.req.json()

  let sql = `UPDATE admins SET game_name=?, qq_name=?, updated_at=datetime('now')`
  const params: unknown[] = [body.game_name || '', body.qq_name || '']

  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10)
    sql += `, password_hash=?`
    params.push(hash)
  }

  sql += ` WHERE id=?`
  params.push(id)

  await c.env.DB.prepare(sql).bind(...params).run()
  return c.json({ success: true })
})
