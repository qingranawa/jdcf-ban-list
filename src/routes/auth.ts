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
  <h2 style="margin-bottom:1.25rem;font-weight:600;">管理员登录</h2>
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
    <button type="submit" class="btn btn-primary" style="width:100%;">登录</button>
    <p id="loginError" style="color:var(--red);margin-top:0.75rem;display:none;font-size:var(--fs-sm);"></p>
  </form>
  <p style="font-size:var(--fs-xs);color:var(--text-tertiary);margin-top:1rem;text-align:center;">
    首次登录请联系服主获取账号信息
  </p>
</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var f = document.getElementById('loginForm');
  f.addEventListener('submit', function(e) {
    e.preventDefault();
    var d = new FormData(f);
    var btn = f.querySelector('button');
    var errEl = document.getElementById('loginError');
    btn.textContent = '登录中...';
    btn.disabled = true;
    errEl.style.display = 'none';
    fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        steam_id: d.get('steam_id'),
        username: d.get('username'),
        password: d.get('password'),
      }),
    }).then(function(r) {
      return r.json().then(function(j) {
        if (r.ok && j.token) {
          localStorage.setItem('jwt', j.token);
          window.location.href = '/admin/bans';
        } else {
          errEl.textContent = j.error || '登录失败，请检查账号密码';
          errEl.style.display = 'block';
          btn.textContent = '登录';
          btn.disabled = false;
        }
      });
    }).catch(function() {
      errEl.textContent = '网络错误，请刷新页面重试';
      errEl.style.display = 'block';
      btn.textContent = '登录';
      btn.disabled = false;
    });
  });
});
</script>`
  }))
})

// 退出登录（清除 cookie）
authRoutes.get('/logout', (c) => {
  c.header('Set-Cookie', 'jwt=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0')
  return c.html(Layout({
    title: '已退出', currentPath: '/',
    children: html`<div class="card" style="text-align:center;padding:3rem;"><p>已退出登录</p><a href="/" class="btn btn-primary" style="margin-top:1rem;">返回首页</a></div><script>localStorage.removeItem('jwt');</script>`,
  }))
})

authRoutes.post('/api/login', async (c) => {
  const { steam_id, username, password } = await c.req.json<{
    steam_id: string;
    username: string;
    password: string;
  }>()

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

  return c.json({ token, admin: { id: admin.id, game_name: admin.game_name, permission_group: admin.permission_group } },
    200,
    { 'Set-Cookie': `jwt=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800` }
  )
})
