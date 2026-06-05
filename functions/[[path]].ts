import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'
import { adminRoutes, cronRoutes } from '../src/routes/admin'
import { adminTeamRoutes } from '../src/routes/admin-team'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: ['https://jdcf-ban-list.pages.dev', 'http://localhost:8789'], credentials: true }))

app.route('/', publicRoutes)
app.route('/', authRoutes)
app.route('/', cronRoutes)      // 无 JWT 认证的归档 API
app.route('/', adminRoutes)      // 需 JWT 认证的管理路由
app.route('/', adminTeamRoutes)

export const onRequest = handle(app)
