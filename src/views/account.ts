import { html } from 'hono/html'

export function AccountPage() {
  return html`
<div style="max-width:500px;margin:0 auto;padding:var(--spacing-lg) var(--spacing-md);">
  <h1 class="cyber-title" style="font-size:32px;margin-bottom:var(--spacing-lg);">账户设置</h1>

  <div class="cyber-grouped" style="margin-bottom:var(--spacing-lg);">
    <div class="cyber-grouped-item" style="font-size:14px;font-weight:600;color:var(--label-2);">当前信息</div>
    <div id="userInfo" class="cyber-grouped-item" style="flex-direction:column;align-items:flex-start;gap:var(--spacing-xs);">
      <div style="color:var(--label-2);font-size:14px;">加载中...</div>
    </div>
  </div>

  <div class="cyber-grouped" style="margin-bottom:var(--spacing-lg);">
    <div class="cyber-grouped-item" style="font-size:14px;font-weight:600;color:var(--label-2);">修改信息</div>
    <div class="cyber-grouped-item" style="flex-direction:column;align-items:stretch;gap:var(--spacing-sm);">
      <div class="cell-label">游戏名称</div>
      <input type="text" id="inputGameName" placeholder="游戏内显示名称" class="cyber-input" />
    </div>
    <div class="cyber-grouped-item" style="flex-direction:column;align-items:stretch;gap:var(--spacing-sm);">
      <div class="cell-label">QQ名称</div>
      <input type="text" id="inputQQName" placeholder="QQ群昵称" class="cyber-input" />
    </div>
    <div class="cyber-grouped-item" style="flex-direction:column;align-items:stretch;gap:var(--spacing-sm);border-bottom:none;">
      <div class="cell-label">新密码</div>
      <input type="password" id="inputPassword" placeholder="留空不修改" autocomplete="new-password" class="cyber-input" />
    </div>
  </div>

  <div style="display:flex;gap:var(--spacing-sm);align-items:center;">
    <button class="cyber-btn cyber-btn-primary" style="flex:1;" onclick="saveAccount()">保存修改</button>
    <span id="saveMsg" style="font-size:14px;color:var(--green);display:none;">已保存</span>
    <span id="saveErr" style="font-size:14px;color:var(--red);display:none;"></span>
  </div>

  <div class="cyber-card" style="margin-top:var(--spacing-lg);padding:var(--spacing-lg);text-align:center;">
    <a href="/admin/bans" class="cyber-btn cyber-btn-ghost">进入管理后台 →</a>
  </div>
</div>

<script>
(function() {
  var jwt = localStorage.getItem('jwt');
  if (!jwt) { window.location.href = '/login'; return; }

  var payload = JSON.parse(atob(jwt.split('.')[1]));
  var group = payload.permissionGroup;

  fetch('/api/account', { headers: { 'Authorization': 'Bearer ' + jwt } })
    .then(function(r) { return r.json(); })
    .then(function(d) {
      document.getElementById('userInfo').innerHTML =
        '<div style="font-size:14px;"><strong style="color:var(--label-1);">权限组:</strong> <span class="cyber-badge cyber-badge-cyan">' + group + '</span></div>' +
        '<div style="font-size:14px;"><strong style="color:var(--label-1);">用户名:</strong> ' + esc(d.username) + '</div>' +
        '<div style="font-size:14px;"><strong style="color:var(--label-1);">游戏名:</strong> ' + esc(d.game_name || '未设置') + '</div>' +
        '<div style="font-size:14px;"><strong style="color:var(--label-1);">QQ名:</strong> ' + esc(d.qq_name || '未设置') + '</div>';
      document.getElementById('inputGameName').value = d.game_name || '';
      document.getElementById('inputQQName').value = d.qq_name || '';
    })
    .catch(function() {
      document.getElementById('userInfo').innerHTML = '<div style="color:var(--red);font-size:14px;">加载失败</div>';
    });

  window.saveAccount = function() {
    var body = {
      game_name: document.getElementById('inputGameName').value,
      qq_name: document.getElementById('inputQQName').value,
    };
    var pw = document.getElementById('inputPassword').value;
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
  };

  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
})();
</script>`
}
