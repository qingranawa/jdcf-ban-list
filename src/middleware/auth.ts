// > JWT authentication & role-based access control middleware
// ! 权限组等级: OWNER(0) < T6(1) < T5(2) < T4(3) < T3(4) < T2(5) < T1(6)
// ! 数值越小权限越高 — requirePermission('T5') 表示 T5 及更高（数值 ≤ 2）
import { verify, type JwtVariables } from 'hono/jwt'
import { createMiddleware } from 'hono/factory'
import type { Env } from '../db'

export const GROUP_RANK: Record<string, number> = {
  OWNER: 0,
  T6: 1,
  T5: 2,
  T4: 3,
  T3: 4,
  T2: 5,
  T1: 6,
}

export type Variables = JwtVariables & {
  adminId: number;
  permissionGroup: string;
  gameName: string;
}

// * JWT 校验 — 同时支持 Authorization header 和 HttpOnly cookie
// * header 用于 API 请求，cookie 用于页面导航（由 Set-Cookie 设置）
export const authMiddleware = createMiddleware<{ Variables: Variables; Bindings: Env }>(async (c, next) => {
  let token: string | null = null

  // * header 优先（API 调用场景）
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  // * cookie 兜底（页面导航场景，由登录 Set-Cookie 设置）
  if (!token) {
    const cookie = c.req.header('Cookie')
    if (cookie) {
      const match = cookie.match(/(?:^|;\s*)jwt=([^;]+)/)
      if (match) token = decodeURIComponent(match[1])
    }
  }

  if (!token) {
    const accept = c.req.header('Accept') || ''
    if (accept.includes('text/html')) return c.redirect('/login')
    return c.json({ error: '缺少认证凭据' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    // ? 仅检查 adminId 和 permissionGroup 存在性，不做运行时类型校验
    if (!payload.adminId || !payload.permissionGroup) {
      const accept = c.req.header('Accept') || ''
      if (accept.includes('text/html')) return c.redirect('/login')
      return c.json({ error: '无效的认证凭据' }, 401)
    }
    c.set('jwtPayload', payload)
    c.set('adminId', payload.adminId as number)
    c.set('permissionGroup', payload.permissionGroup as string)
    c.set('gameName', (payload.gameName as string) || '')
    await next()
  } catch {
    // * JWT 过期或签名不匹配
    const accept = c.req.header('Accept') || ''
    if (accept.includes('text/html')) return c.redirect('/login')
    return c.json({ error: '认证凭据已过期或无效' }, 401)
  }
})

// * 权限守卫 — 比较当前用户权限组与要求的最小权限组
// * 例：requirePermission('T5') → T5/6/OWNER 可通过
export const requirePermission = (minGroup: string) =>
  createMiddleware<{ Variables: Variables; Bindings: Env }>(async (c, next) => {
    const payload = c.get('jwtPayload')
    if (!payload || !payload.adminId || !payload.permissionGroup) {
      return c.json({ error: '无效的认证凭据' }, 401)
    }

    const userRank = GROUP_RANK[payload.permissionGroup as string]
    const requiredRank = GROUP_RANK[minGroup]

    // ? 配置错误（例如 minGroup 不存在于 GROUP_RANK）时返回 500
    if (userRank === undefined || requiredRank === undefined) {
      return c.json({ error: '权限组配置错误' }, 500)
    }

    // * 数值越大权限越低，所以 userRank > requiredRank 表示权限不足
    if (userRank > requiredRank) {
      const accept = c.req.header('Accept') || ''
      if (accept.includes('text/html')) return c.redirect('/login')
      return c.json({ error: '权限不足' }, 403)
    }

    c.set('adminId', payload.adminId as number)
    c.set('permissionGroup', payload.permissionGroup as string)
    c.set('gameName', (payload.gameName as string) || '')
    await next()
  })

export function getJwtPayload(c: { get: (key: string) => unknown }) {
  const payload = c.get('jwtPayload') as Record<string, unknown> | undefined
  return payload ?? null
}
