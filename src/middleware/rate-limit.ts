const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

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
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }
}

export async function recordLoginFailure(
  db: D1Database, ip: string
): Promise<void> {
  try {
    await db.prepare(
      'INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)'
    ).bind(ip, Date.now()).run()
  } catch {}
}

export async function clearLoginRateLimit(
  db: D1Database, ip: string
): Promise<void> {
  try {
    await db.prepare(
      'DELETE FROM login_attempts WHERE ip = ?'
    ).bind(ip).run()
  } catch {}
}
