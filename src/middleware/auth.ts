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
}

// 手动验证 JWT — 支持动态 secret（从 c.env 读取）
export const authMiddleware = createMiddleware<{ Variables: Variables; Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '缺少认证凭据' }, 401)
  }

  const token = authHeader.slice(7)
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    if (!payload.adminId || !payload.permissionGroup) {
      return c.json({ error: '无效的认证凭据' }, 401)
    }
    c.set('jwtPayload', payload)
    c.set('adminId', payload.adminId as number)
    c.set('permissionGroup', payload.permissionGroup as string)
    await next()
  } catch {
    return c.json({ error: '认证凭据已过期或无效' }, 401)
  }
})

export const requirePermission = (minGroup: string) =>
  createMiddleware<{ Variables: Variables; Bindings: Env }>(async (c, next) => {
    const payload = c.get('jwtPayload')
    if (!payload || !payload.adminId || !payload.permissionGroup) {
      return c.json({ error: '无效的认证凭据' }, 401)
    }

    const userRank = GROUP_RANK[payload.permissionGroup as string]
    const requiredRank = GROUP_RANK[minGroup]

    if (userRank === undefined || requiredRank === undefined) {
      return c.json({ error: '权限组配置错误' }, 500)
    }

    if (userRank > requiredRank) {
      return c.json({ error: '权限不足' }, 403)
    }

    c.set('adminId', payload.adminId as number)
    c.set('permissionGroup', payload.permissionGroup as string)
    await next()
  })

export function getJwtPayload(c: { get: (key: string) => unknown }) {
  const payload = c.get('jwtPayload') as Record<string, unknown> | undefined
  return payload ?? null
}
