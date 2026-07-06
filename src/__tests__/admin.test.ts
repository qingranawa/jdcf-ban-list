import { describe, it, expect, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import { Hono } from 'hono'
import { computeStatus } from '../routes/public'
import { MockD1 } from './mock-d1'
import { publicRoutes } from '../routes/public'
import { authRoutes } from '../routes/auth'
import { adminRoutes } from '../routes/admin'
import { accountRoutes } from '../routes/account'

const app = new Hono<{ Bindings: Record<string, unknown> }>()
app.route('/', publicRoutes)
app.route('/', authRoutes)
app.route('/', adminRoutes)
app.route('/', accountRoutes)

const BASE_BAN = {
  id: 1, nickname: 'test_player', steam_id: 'STEAM_1:0:12345', ip_address: '',
  reason: '违规', ban_time: '2026-06-30T00:00:00Z', ban_duration: '30d',
  violation_level: 'level2', notes: '', handled_by: 1,
  co_handlers: '', is_archived: 0, archive_action: null, archived_at: null,
  created_at: '2026-06-30T00:00:00Z', updated_at: '2026-06-30T00:00:00Z',
}

const BASE_ADMIN = {
  id: 1, steam_id: 'STEAM_1:0:99999', username: 'admin', password_hash: '',
  permission_group: 'T5', game_name: '测试管理员', qq_name: '', position: '',
  supervisor: '', is_active: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

const JWT_SECRET = 'test-secret'

async function tokenFor(adminId: number, group: string): Promise<string> {
  return await sign({ adminId, permissionGroup: group, gameName: '测试管理员' }, JWT_SECRET)
}

function freshEnv() {
  const db = new MockD1()
  db.seed('admins', [{ ...BASE_ADMIN }])
  db.seed('bans', [
    { ...BASE_BAN, id: 1, ban_duration: '30d', violation_level: 'level2', handled_by: 1 },
    { ...BASE_BAN, id: 2, nickname: 'hacker', ban_duration: 'permanent', violation_level: 'level1', handled_by: 1 },
    { ...BASE_BAN, id: 3, nickname: 'spammer', ban_duration: '7d', violation_level: 'level3', handled_by: 1 },
    { ...BASE_BAN, id: 4, nickname: 'archived', ban_duration: '15d', violation_level: 'level2', is_archived: 1, handled_by: 1 },
  ])
  return { DB: db, JWT_SECRET, TURNSTILE_SITE_KEY: '', TURNSTILE_SECRET_KEY: '', ASSETS: undefined, CRON_ARCHIVE_SECRET: '' }
}

function auth(token: string, headers: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${token}`, ...headers }
}

describe('Public routes', () => {
  let env: ReturnType<typeof freshEnv>

  beforeEach(() => { env = freshEnv() })

  it('GET / returns 200 + HTML', async () => {
    const res = await app.request('/', {}, env)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('test_player')
  })

  it('GET /team returns 200 + HTML', async () => {
    const res = await app.request('/team', {}, env)
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('测试管理员')
  })

  it('GET /player/:id returns 200 for existing ban id', async () => {
    const res = await app.request('/player/1', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('test_player')
    expect(text).toContain('STEAM_1:0:12345')
  })

  it('GET /player/:id returns empty state for unknown id', async () => {
    const res = await app.request('/player/999', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('没有找到该玩家的封禁记录')
  })
})

describe('Auth', () => {
  it('GET /api/auth/check without token returns valid:false (200)', async () => {
    const res = await app.request('/api/auth/check', {}, freshEnv())
    expect(res.status).toBe(200)
    const data = await res.json() as { valid: boolean }
    expect(data.valid).toBe(false)
  })

  it('POST /api/login with wrong credentials returns 401', async () => {
    const res = await app.request('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steam_id: 'STEAM_1:0:99999', username: 'admin', password: 'wrong' }),
    }, freshEnv())
    expect(res.status).toBe(401)
  })
})

describe('Admin API', () => {
  let env: ReturnType<typeof freshEnv>
  let t5Token: string, t3Token: string, t6Token: string

  beforeEach(async () => {
    env = freshEnv()
    t5Token = await tokenFor(1, 'T5')
    t3Token = await tokenFor(2, 'T3')
    t6Token = await tokenFor(3, 'T6')
  })

  describe('GET /admin/bans', () => {
    it('returns 200 + HTML with ban list', async () => {
      const res = await app.request('/admin/bans', { headers: auth(t5Token) }, env)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain('test_player')
      expect(text).toContain('hacker')
    })

    it('filters by search query', async () => {
      const res = await app.request('/admin/bans?q=hacker', { headers: auth(t5Token) }, env)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain('hacker')
      expect(text).not.toContain('spammer')
    })

    it('filters by archived', async () => {
      const res = await app.request('/admin/bans?archived=1', { headers: auth(t5Token) }, env)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toContain('archived')
    })

    it('blocks unauthenticated requests with redirect', async () => {
      const res = await app.request('/admin/bans', { headers: { Accept: 'text/html' } }, env)
      expect(res.status).toBe(302)
    })
  })

  describe('GET /api/admin/bans/:id', () => {
    it('returns ban details for valid id', async () => {
      const res = await app.request('/api/admin/bans/1', { headers: auth(t5Token) }, env)
      expect(res.status).toBe(200)
      const data = await res.json() as { nickname: string; steam_id: string; status: string }
      expect(data.nickname).toBe('test_player')
      expect(data.steam_id).toBe('STEAM_1:0:12345')
      expect(data.status).toBeDefined()
    })

    it('returns 404 for non-existent id', async () => {
      const res = await app.request('/api/admin/bans/999', { headers: auth(t5Token) }, env)
      expect(res.status).toBe(404)
      const data = await res.json() as { error: string }
      expect(data.error).toContain('不存在')
    })
  })

  describe('POST /api/admin/bans', () => {
    it('creates a ban with valid data', async () => {
      const res = await app.request('/api/admin/bans', {
        method: 'POST', headers: auth(t5Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nickname: 'new_guy', steam_id: 'STEAM_1:1:55555', reason: '测试', ban_duration: '7d' }),
      }, env)
      expect(res.status).toBe(200)
      const data = await res.json() as { success: boolean; id: number }
      expect(data.success).toBe(true)
      expect(data.id).toBeGreaterThan(0)
    })

    it('returns 400 when nickname is missing', async () => {
      const res = await app.request('/api/admin/bans', {
        method: 'POST', headers: auth(t5Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ steam_id: 'STEAM_1:1:55555' }),
      }, env)
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid duration', async () => {
      const res = await app.request('/api/admin/bans', {
        method: 'POST', headers: auth(t5Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nickname: 'x', steam_id: 'STEAM_1:1:66666', ban_duration: 'invalid' }),
      }, env)
      expect(res.status).toBe(400)
    })

    it('returns 401 without token', async () => {
      const res = await app.request('/api/admin/bans', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: 'x', steam_id: 'STEAM_1:1:77777' }),
      }, env)
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /api/admin/bans/:id', () => {
    it('updates own ban', async () => {
      const res = await app.request('/api/admin/bans/1', {
        method: 'PUT', headers: auth(t5Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nickname: 'updated', steam_id: 'STEAM_1:0:12345', ban_duration: '15d' }),
      }, env)
      expect(res.status).toBe(200)
      expect((await res.json() as { success: boolean }).success).toBe(true)
    })

    it('returns 403 for low-rank updating others ban (T3 trying T5 record)', async () => {
      const res = await app.request('/api/admin/bans/1', {
        method: 'PUT', headers: auth(t3Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nickname: 'no_access', steam_id: 'STEAM_1:0:12345' }),
      }, env)
      expect(res.status).toBe(403)
    })

    it('allows T5+ to update others ban', async () => {
      const res = await app.request('/api/admin/bans/1', {
        method: 'PUT', headers: auth(t6Token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ nickname: 'updated_by_t6', steam_id: 'STEAM_1:0:12345' }),
      }, env)
      expect(res.status).toBe(200)
    })
  })

  describe('DELETE /api/admin/bans/:id (soft delete)', () => {
    it('soft deletes own ban', async () => {
      const res = await app.request('/api/admin/bans/1', {
        method: 'DELETE', headers: auth(t5Token),
      }, env)
      expect(res.status).toBe(200)
      expect((await res.json() as { success: boolean }).success).toBe(true)
    })

    it('soft deleted ban no longer appears in active list', async () => {
      await app.request('/api/admin/bans/1', { method: 'DELETE', headers: auth(t5Token) }, env)
      const res = await app.request('/admin/bans', { headers: auth(t5Token) }, env)
      const text = await res.text()
      expect(text).not.toContain('test_player')
    })
  })

  describe('computeStatus', () => {
    it('classifies permanent as permanent', () => {
      expect(computeStatus({ ban_duration: 'permanent', ban_time: '', archive_action: null })).toBe('permanent')
    })
    it('classifies active 30d as banned', () => {
      expect(computeStatus({ ban_duration: '30d', ban_time: new Date().toISOString(), archive_action: null })).toBe('banned')
    })
  })
})
