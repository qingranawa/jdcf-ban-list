// > 登录限流：按客户端 IP 记录 15 分钟内的失败次数
// ! D1 异常时采用“放行”策略，避免数据库短暂故障导致所有管理员无法登录
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

// * 返回剩余尝试次数；调用方据此决定是否立即拒绝登录请求
export async function checkLoginRateLimit(
  db: D1Database, ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const cutoff = Date.now() - WINDOW_MS
    const result = await db.prepare(
      'SELECT COUNT(*) as cnt FROM login_attempts WHERE ip = ? AND attempted_at > ?'
    ).bind(ip, cutoff).first<{ cnt: number }>()
    const count = result?.cnt || 0
    return { allowed: count < MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - count) }
  } catch {
    // ? 限流表不存在或查询失败时放行，部署时必须确保已执行 003 迁移
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }
}

// * 只记录失败尝试；登录成功后由 clearLoginRateLimit 清除该 IP 的历史记录
export async function recordLoginFailure(
  db: D1Database, ip: string
): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)'
    ).bind(ip, Date.now()).run()
  } catch {}
}

// * 清除成功登录 IP 的失败记录，避免旧失败次数影响下一次登录
export async function clearLoginRateLimit(
  db: D1Database, ip: string
): Promise<void> {
  try {
    await db.prepare(
      'DELETE FROM login_attempts WHERE ip = ?'
    ).bind(ip).run()
  } catch {}
}
