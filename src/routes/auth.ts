import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import bcrypt from 'bcryptjs'
import { html } from 'hono/html'
import type { Env, AdminRow } from '../db'
import { Layout } from '../views/layout'

export const authRoutes = new Hono<{ Bindings: Env }>()

authRoutes.get('/login', (c) => {
  return c.html(Layout({
    title: '管理员登录',
    currentPath: '/login',
    children: html`
<div class="card" style="max-width:400px;margin:2rem auto;">
  <h2 style="margin-bottom:1rem;font-weight:500;">管理员登录</h2>
  <form id="loginForm">
    <div class="form-group">
      <label>Steam 64位ID</label>
      <input type="text" name="steam_id" required placeholder="76561198874565964" />
    </div>
    <div class="form-group">
      <label>用户名</label>
      <input type="text" name="username" required placeholder="admin" />
    </div>
    <div class="form-group">
      <label>密码</label>
      <input type="password" name="password" required placeholder="密码" />
    </div>
    <div id="turnstile-widget" style="margin-bottom:1rem;min-height:65px;"></div>
    <button type="submit" class="btn btn-primary" style="width:100%;">登录</button>
    <p id="loginError" style="color:#f44336;margin-top:0.5rem;display:none;"></p>
  </form>
  <p style="font-size:var(--fs-xs);color:var(--text-tertiary);margin-top:1rem;text-align:center;">
    首次登录请联系服主获取账号信息
  </p>
</div>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
<script>
var turnstileReady = false;
turnstileRenderTimer = setTimeout(function() {
  if (!turnstileReady) {
    var w = document.getElementById('turnstile-widget');
    if (w) w.innerHTML = '';
  }
}, 3000);
window.onloadTurnstileCallback = function() {
  turnstileReady = true;
  clearTimeout(turnstileRenderTimer);
  turnstile.render('#turnstile-widget', { sitekey: '${c.env.TURNSTILE_SITE_KEY}' });
};
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  var form = e.target;
  var data = new FormData(form);
  var token = data.get('cf-turnstile-response') || 'bypass';
  var resp = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      steam_id: data.get('steam_id'),
      username: data.get('username'),
      password: data.get('password'),
      'cf-turnstile-response': token,
    }),
  });
  var result = await resp.json();
  if (resp.ok) {
    localStorage.setItem('jwt', result.token);
    window.location.href = '/admin/bans';
  } else {
    var err = document.getElementById('loginError');
    err.textContent = result.error || '登录失败';
    err.style.display = 'block';
  }
});
</script>`
  }))
})

authRoutes.post('/api/login', async (c) => {
  const { steam_id, username, password, 'cf-turnstile-response': turnstileToken } = await c.req.json<{
    steam_id: string;
    username: string;
    password: string;
    'cf-turnstile-response': string;
  }>()

  // 开发模式：测试密钥时跳过 Turnstile 验证
  const isTestKey = c.env.TURNSTILE_SECRET_KEY === '1x00000000000000000000AA'

  if (!isTestKey) {
    if (!turnstileToken) {
      return c.json({ error: '请完成人机验证' }, 400)
    }

    const turnstileResp = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: new URLSearchParams({ secret: c.env.TURNSTILE_SECRET_KEY, response: turnstileToken }) }
    )
    const turnstileResult = await turnstileResp.json<{ success: boolean }>()
    if (!turnstileResult.success) {
      return c.json({ error: '人机验证失败' }, 400)
    }
  }

  const admin = await c.env.DB.prepare(
    'SELECT * FROM admins WHERE steam_id = ? AND username = ? AND is_active = 1'
  ).bind(steam_id, username).first<AdminRow>()

  if (!admin) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

  const passwordMatch = await bcrypt.compare(password, admin.password_hash)
  if (!passwordMatch) {
    return c.json({ error: '账号或密码错误' }, 401)
  }

  const token = await sign(
    {
      adminId: admin.id,
      permissionGroup: admin.permission_group,
      sub: admin.id.toString(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    c.env.JWT_SECRET
  )

  return c.json({ token, admin: { id: admin.id, game_name: admin.game_name, permission_group: admin.permission_group } })
})
