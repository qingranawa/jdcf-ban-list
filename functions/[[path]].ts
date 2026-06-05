import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import type { Env } from '../src/db'
import { publicRoutes } from '../src/routes/public'
import { authRoutes } from '../src/routes/auth'

const app = new Hono<{ Bindings: Env }>()

app.use('*', cors())

app.route('/', publicRoutes)
app.route('/', authRoutes)

export const onRequest = handle(app)
