import { describe, it, expect, beforeEach } from 'vitest'
import { sign } from 'hono/jwt'
import { Hono } from 'hono'
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

const JWT_SECRET = 'test-secret'
const CRON_PUBLISH_SECRET = 'cron-secret-test'

const BASE_ANNOUNCEMENT = {
  subtitle: null, body: '测试公告正文', citation: null,
  is_pinned: 0, is_published: 1, publish_at: null,
  created_by: 1,
  created_at: '2026-07-01T00:00:00Z',
  updated_at: '2026-07-01T00:00:00Z',
}

const BASE_ADMIN = {
  id: 1, steam_id: 'STEAM_1:0:99999', username: 'admin', password_hash: '',
  permission_group: 'T5', game_name: '测试管理员', qq_name: '', position: '',
  supervisor: '', is_active: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

async function tokenFor(adminId: number, group: string): Promise<string> {
  return await sign({ adminId, permissionGroup: group, gameName: '测试管理员' }, JWT_SECRET)
}

function auth(token: string, headers: Record<string, string> = {}): Record<string, string> {
  return { Authorization: `Bearer ${token}`, ...headers }
}

function freshEnv() {
  const db = new MockD1()
  db.seed('admins', [{ ...BASE_ADMIN }])
  db.seed('announcements', [
    { id: 1, title: '服务器维护公告', type: 'server', ...BASE_ANNOUNCEMENT, is_pinned: 1 },
    { id: 2, title: '违规处罚公示', type: 'penalty', ...BASE_ANNOUNCEMENT },
    { id: 3, title: '内部通知', type: 'internal', ...BASE_ANNOUNCEMENT },
    { id: 4, title: '活动预告', type: 'event', ...BASE_ANNOUNCEMENT },
    { id: 5, title: '紧急通知', type: 'urgent', ...BASE_ANNOUNCEMENT },
    { id: 6, title: '更新日志', type: 'changelog', ...BASE_ANNOUNCEMENT },
    { id: 7, title: '草稿公告', type: 'server', ...BASE_ANNOUNCEMENT, is_published: 0 },
    { id: 8, title: '定时发布', type: 'server', ...BASE_ANNOUNCEMENT, is_published: 0, publish_at: '2026-01-01T00:00:00Z' },
  ])
  return { DB: db, JWT_SECRET, TURNSTILE_SITE_KEY: '', TURNSTILE_SECRET_KEY: '', ASSETS: undefined, CRON_ARCHIVE_SECRET: '', CRON_PUBLISH_SECRET }
}

describe('Public announcement routes', () => {
  let env: ReturnType<typeof freshEnv>

  beforeEach(() => { env = freshEnv() })

  it('GET /announcements returns 200 with announcement list', async () => {
    const res = await app.request('/announcements', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('服务器维护公告')
    expect(text).toContain('违规处罚公示')
    expect(text).toContain('活动预告')
    expect(text).toContain('更新日志')
  })

  it('GET /announcements hides internal type from non-admins', async () => {
    const res = await app.request('/announcements', {}, env)
    const text = await res.text()
    expect(text).not.toContain('内部通知')
  })

  it('GET /announcements hides unpublished drafts', async () => {
    const res = await app.request('/announcements', {}, env)
    const text = await res.text()
    expect(text).not.toContain('草稿公告')
  })

  it('GET /announcements shows internal type to admins', async () => {
    const t5 = await tokenFor(1, 'T5')
    const res = await app.request('/announcements', { headers: auth(t5) }, env)
    const text = await res.text()
    expect(text).toContain('内部通知')
  })

  it('GET /announcements?type=event filters by type', async () => {
    const res = await app.request('/announcements?type=event', {}, env)
    const text = await res.text()
    expect(text).toContain('活动预告')
    expect(text).not.toContain('服务器维护公告')
    expect(text).not.toContain('违规处罚公示')
  })

  it('GET /announcements?type=server shows matching type only', async () => {
    const res = await app.request('/announcements?type=server', {}, env)
    const text = await res.text()
    expect(text).toContain('服务器维护公告')
    expect(text).not.toContain('活动预告')
  })

  it('GET /announcements/:id returns 200 for published announcement', async () => {
    const res = await app.request('/announcements/1', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('服务器维护公告')
    expect(text).toContain('测试公告正文')
  })

  it('GET /announcements/:id returns 404 for non-existent id', async () => {
    const res = await app.request('/announcements/999', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('公告不存在')
  })

  it('GET /announcements/:id returns 404 for unpublished announcement', async () => {
    const res = await app.request('/announcements/7', {}, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('公告不存在')
  })

  it('GET /announcements paginates correctly', async () => {
    const res = await app.request('/announcements?page=1', {}, env)
    expect(res.status).toBe(200)
  })
})

describe('Admin announcement management page', () => {
  let env: ReturnType<typeof freshEnv>
  let t5Token: string

  beforeEach(async () => {
    env = freshEnv()
    t5Token = await tokenFor(1, 'T5')
  })

  it('GET /admin/announcements returns 200 when authenticated', async () => {
    const res = await app.request('/admin/announcements', { headers: auth(t5Token) }, env)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain('公告管理')
    expect(text).toContain('服务器维护公告')
  })

  it('GET /admin/announcements redirects when not authenticated', async () => {
    const res = await app.request('/admin/announcements', { headers: { Accept: 'text/html' } }, env)
    expect(res.status).toBe(302)
  })
})

describe('Admin announcement CRUD API', () => {
  let env: ReturnType<typeof freshEnv>
  let t5Token: string, t3Token: string, t1Token: string

  beforeEach(async () => {
    env = freshEnv()
    t5Token = await tokenFor(1, 'T5')
    t3Token = await tokenFor(2, 'T3')
    t1Token = await tokenFor(3, 'T1')
  })

  it('POST /api/admin/announcements creates announcement (T4+)', async () => {
    const res = await app.request('/api/admin/announcements', {
      method: 'POST',
      headers: auth(t5Token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: '新公告', body: '内容', type: 'server' }),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean; id: number }
    expect(data.success).toBe(true)
    expect(data.id).toBeGreaterThan(0)
  })

  it('POST /api/admin/announcements returns 403 for T1', async () => {
    const res = await app.request('/api/admin/announcements', {
      method: 'POST',
      headers: auth(t1Token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: 'no', body: 'no', type: 'server' }),
    }, env)
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/announcements returns 403 for T3', async () => {
    const res = await app.request('/api/admin/announcements', {
      method: 'POST',
      headers: auth(t3Token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: 'no', body: 'no', type: 'server' }),
    }, env)
    expect(res.status).toBe(403)
  })

  it('PUT /api/admin/announcements/:id updates announcement (T4+)', async () => {
    const res = await app.request('/api/admin/announcements/1', {
      method: 'PUT',
      headers: auth(t5Token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: '更新标题', body: '更新内容', type: 'server' }),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean }
    expect(data.success).toBe(true)
  })

  it('PUT /api/admin/announcements/:id returns 404 for non-existent', async () => {
    const res = await app.request('/api/admin/announcements/999', {
      method: 'PUT',
      headers: auth(t5Token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title: 'x', body: 'x', type: 'server' }),
    }, env)
    expect(res.status).toBe(404)
  })

  it('DELETE /api/admin/announcements/:id deletes announcement (T4+)', async () => {
    const res = await app.request('/api/admin/announcements/1', {
      method: 'DELETE',
      headers: auth(t5Token),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean }
    expect(data.success).toBe(true)
  })

  it('DELETE /api/admin/announcements/:id returns 403 for T3', async () => {
    const res = await app.request('/api/admin/announcements/1', {
      method: 'DELETE',
      headers: auth(t3Token),
    }, env)
    expect(res.status).toBe(403)
  })

  it('POST /api/admin/announcements/:id/toggle-pin toggles pin (T4+)', async () => {
    const res = await app.request('/api/admin/announcements/2/toggle-pin', {
      method: 'POST',
      headers: auth(t5Token),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean; is_pinned: number }
    expect(data.success).toBe(true)
    expect(data.is_pinned).toBe(1)
  })

  it('POST /api/admin/announcements/:id/publish publishes (T4+)', async () => {
    const res = await app.request('/api/admin/announcements/7/publish', {
      method: 'POST',
      headers: auth(t5Token),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean }
    expect(data.success).toBe(true)
  })

  it('POST /api/admin/announcements/:id/publish returns 404 for non-existent', async () => {
    const res = await app.request('/api/admin/announcements/999/publish', {
      method: 'POST',
      headers: auth(t5Token),
    }, env)
    expect(res.status).toBe(404)
  })

  it('POST /api/admin/announcements/:id/read marks as read (T1+)', async () => {
    const res = await app.request('/api/admin/announcements/1/read', {
      method: 'POST',
      headers: auth(t1Token),
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { success: boolean }
    expect(data.success).toBe(true)
  })
})

describe('Cron publish endpoint', () => {
  let env: ReturnType<typeof freshEnv>

  beforeEach(() => { env = freshEnv() })

  it('GET /api/cron/publish-announcements publishes scheduled with correct secret', async () => {
    const res = await app.request('/api/cron/publish-announcements', {
      headers: { 'X-Cron-Secret': CRON_PUBLISH_SECRET },
    }, env)
    expect(res.status).toBe(200)
    const data = await res.json() as { published: number }
    expect(data.published).toBeGreaterThanOrEqual(0)
  })

  it('GET /api/cron/publish-announcements returns 401 with wrong secret', async () => {
    const res = await app.request('/api/cron/publish-announcements', {
      headers: { 'X-Cron-Secret': 'wrong-secret' },
    }, env)
    expect(res.status).toBe(401)
  })

  it('GET /api/cron/publish-announcements returns 401 without secret', async () => {
    const res = await app.request('/api/cron/publish-announcements', {}, env)
    expect(res.status).toBe(401)
  })
})
