// > Cloudflare Pages entry point — mounts all route modules
// ! CORS 白名单需同步自定义域名变更
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { devMiddleware } from '../src/middleware/dev'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'
import { adminRoutes } from '../src/routes/admin'
import { accountRoutes } from '../src/routes/account'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: ['https://jdcf-ban-list.pages.dev', 'http://localhost:8789'], credentials: true }))
app.use('*', devMiddleware)

app.route('/', publicRoutes)
app.route('/', authRoutes)
app.route('/', adminRoutes)
app.route('/', accountRoutes)

// * Catches all unhandled promise rejections from route handlers
app.onError((err, c) => {
  console.error('Unhandled error:', err?.stack || err?.message || err)
  return c.json({ error: '服务器内部错误', detail: c.env.DEV_MODE ? (err?.message || String(err)) : undefined }, 500)
})

const honoHandler = handle(app)

export const onRequest = honoHandler
