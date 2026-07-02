import { html } from 'hono/html'

export function LoginPage(props: { error: string }) {
  return html`
<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:70vh;padding:var(--spacing-lg);">
  <div style="width:100%;max-width:380px;">
    <div style="text-align:center;margin-bottom:var(--spacing-xl);">
      <div style="font-family:var(--sans);font-size:36px;font-weight:700;letter-spacing:-.03em;background:linear-gradient(135deg,var(--label-1) 30%,var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">管理员登录</div>
      <p style="font-size:15px;color:var(--label-2);margin-top:var(--spacing-xs);">CN 鸡蛋肠粉服务器</p>
    </div>

    <div class="cyber-card" style="padding:var(--spacing-lg);">
      <form id="loginForm">
        <div class="cyber-form-group">
          <label>Steam 64位ID</label>
          <input type="text" name="steam_id" inputmode="numeric" autocomplete="off" required placeholder="76561198874565964" class="cyber-input" />
        </div>
        <div class="cyber-form-group">
          <label>用户名</label>
          <input type="text" name="username" autocomplete="username" required placeholder="admin" class="cyber-input" />
        </div>
        <div class="cyber-form-group">
          <label>密码</label>
          <input type="password" name="password" autocomplete="current-password" required placeholder="密码" class="cyber-input" />
        </div>
        <p id="loginError" style="color:var(--red);margin-top:var(--spacing-sm);font-size:14px;text-align:center;display:none;"></p>
        <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;margin-top:var(--spacing-sm);justify-content:center;">登录</button>
      </form>
    </div>

    <p style="font-size:13px;color:var(--label-3);text-align:center;margin-top:var(--spacing-lg);">
      首次登录请联系 清然（QQ 2816401189）获取账号信息
    </p>
  </div>
</div>
<script>
(function(){
  function checkToken() {
    var t = localStorage.getItem('jwt');
    if (t) {
      try {
        var p = JSON.parse(atob(t.split('.')[1]));
        if (p.adminId && p.exp * 1000 > Date.now()) {
          window.location.href = '/admin/bans';
          return;
        }
      } catch(e) {}
    }
    // 服务端检查 HttpOnly cookie
    fetch('/api/auth/check').then(function(r){ return r.json(); }).then(function(j){
      if (j.valid) window.location.href = '/admin/bans';
    }).catch(function(){});
  }
  checkToken();
})();
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
          errEl.textContent = j.error || '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u5bc6\u7801';
          errEl.style.display = 'block';
          btn.textContent = '\u767b\u5f55';
          btn.disabled = false;
        }
      });
    }).catch(function() {
      errEl.textContent = '\u7f51\u7edc\u9519\u8bef\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u91cd\u8bd5';
      errEl.style.display = 'block';
      btn.textContent = '\u767b\u5f55';
      btn.disabled = false;
    });
  });
});
</script>`
}
