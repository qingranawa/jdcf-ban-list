import { html } from 'hono/html'

export function AccountPage() {
  return html`
<div style="max-width:640px;">
  <h1 style="font-size:var(--fs-xl);font-weight:600;letter-spacing:-0.02em;margin-bottom:1.5rem;">账户设置</h1>

  <div class="card" style="margin-bottom:1rem;">
    <h3 style="margin-bottom:1rem;font-weight:500;">当前账户</h3>
    <div id="userInfo" style="font-size:var(--fs-sm);color:var(--text-secondary);">加载中...</div>
  </div>

  <div class="card" style="margin-bottom:1rem;">
    <h3 style="margin-bottom:1rem;font-weight:500;">修改信息</h3>
    <form id="accountForm">
      <div class="form-group">
        <label>游戏名称</label>
        <input type="text" name="game_name" id="inputGameName" placeholder="游戏内显示名称" />
      </div>
      <div class="form-group">
        <label>QQ名称</label>
        <input type="text" name="qq_name" id="inputQQName" placeholder="QQ群昵称" />
      </div>
      <div class="form-group">
        <label>新密码（留空不修改）</label>
        <input type="password" name="password" placeholder="留空不修改密码" autocomplete="new-password" />
      </div>
      <button type="submit" class="btn btn-primary">保存修改</button>
      <span id="saveMsg" style="margin-left:0.75rem;font-size:var(--fs-sm);color:var(--green);display:none;">已保存</span>
      <span id="saveErr" style="margin-left:0.75rem;font-size:var(--fs-sm);color:var(--red);display:none;"></span>
    </form>
  </div>

  <div class="card" style="text-align:center;padding:2rem;">
    <p style="margin-bottom:1rem;color:var(--text-secondary);font-size:var(--fs-sm);">管理后台入口</p>
    <a href="/admin/bans" class="btn btn-primary" style="font-size:var(--fs-base);padding:0.7rem 2rem;">进入管理后台</a>
  </div>
</div>

<script>
(function() {
  var jwt = localStorage.getItem('jwt');
  if (!jwt) {
    window.location.href = '/login';
    return;
  }

  // 解析 JWT payload (中间段)
  var payload = JSON.parse(atob(jwt.split('.')[1]));
  var adminId = payload.adminId;
  var group = payload.permissionGroup;
  var isOwner = group === 'OWNER';

  // 加载用户信息
  fetch('/api/account', { headers: { 'Authorization': 'Bearer ' + jwt } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      document.getElementById('userInfo').innerHTML =
        '<div style="margin-bottom:0.3rem;">权限组: <strong>' + group + '</strong></div>' +
        '<div style="margin-bottom:0.3rem;">用户名: <strong>' + esc(d.username) + '</strong></div>' +
        '<div style="margin-bottom:0.3rem;">游戏名: <strong>' + esc(d.game_name || '未设置') + '</strong></div>' +
        '<div style="margin-bottom:0.3rem;">QQ名: <strong>' + esc(d.qq_name || '未设置') + '</strong></div>';
      document.getElementById('inputGameName').value = d.game_name || '';
      document.getElementById('inputQQName').value = d.qq_name || '';
    })
    .catch(function() {
      document.getElementById('userInfo').textContent = '加载失败';
    });

  // 编辑表单
  document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var d = new FormData(e.target);
    var body = {
      game_name: d.get('game_name'),
      qq_name: d.get('qq_name'),
    };
    var pw = d.get('password');
    if (pw) body.password = pw;

    fetch('/api/account', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(body),
    }).then(function(r) { return r.json(); }).then(function(j) {
      if (j.success) {
        document.getElementById('saveMsg').style.display = '';
        document.getElementById('saveErr').style.display = 'none';
        setTimeout(function() { document.getElementById('saveMsg').style.display = 'none'; }, 2000);
      } else {
        document.getElementById('saveErr').textContent = j.error || '保存失败';
        document.getElementById('saveErr').style.display = '';
      }
    }).catch(function() {
      document.getElementById('saveErr').textContent = '网络错误';
      document.getElementById('saveErr').style.display = '';
    });
  });

  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
})();
</script>`
}
