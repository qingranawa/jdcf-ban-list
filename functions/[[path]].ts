import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'
import { adminRoutes } from '../src/routes/admin'
import { accountRoutes } from '../src/routes/account'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors({ origin: ['https://jdcf-ban-list.pages.dev', 'http://localhost:8789'], credentials: true }))

app.route('/', publicRoutes)
app.route('/', authRoutes)
app.route('/', adminRoutes)      // 需 JWT 认证的管理路由
app.route('/', accountRoutes)

const honoHandler = handle(app)

export const onRequest = honoHandler
