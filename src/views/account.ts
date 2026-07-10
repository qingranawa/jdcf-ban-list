// > Account settings page — tabbed layout with account info, my bans, my records, my info
import { html } from 'hono/html'

export function AccountPage() {
  return html`
<div class="reveal" style="max-width:700px;margin:0 auto;padding:var(--spacing-lg) var(--spacing-md);">

  <h1 style="font-family:var(--display);font-size:28px;font-weight:700;letter-spacing:-.02em;margin-bottom:var(--spacing-lg);background:linear-gradient(135deg,var(--cyan),#0088ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">账户中心</h1>

  <!-- Tab Bar — cyber-segmented style -->
  <div class="cyber-segmented" id="accountTabs" style="display:flex;margin-bottom:var(--spacing-lg);border-radius:100px;overflow:hidden;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:3px;">
    <button class="tab-btn active" data-tab="account" style="flex:1;padding:8px 12px;border:none;background:var(--cyan);color:#000;font-weight:600;font-family:var(--sans);font-size:12px;cursor:pointer;border-radius:100px;transition:all 0.3s cubic-bezier(0.32,0.72,0,1);">账号管理</button>
    <button class="tab-btn" data-tab="mybans" style="flex:1;padding:8px 12px;border:none;background:transparent;color:var(--label-3);font-family:var(--sans);font-size:12px;cursor:pointer;border-radius:100px;transition:all 0.3s cubic-bezier(0.32,0.72,0,1);">我的封禁</button>
    <button class="tab-btn" data-tab="records" style="flex:1;padding:8px 12px;border:none;background:transparent;color:var(--label-3);font-family:var(--sans);font-size:12px;cursor:pointer;border-radius:100px;transition:all 0.3s cubic-bezier(0.32,0.72,0,1);">我的记录</button>
    <button class="tab-btn" data-tab="info" style="flex:1;padding:8px 12px;border:none;background:transparent;color:var(--label-3);font-family:var(--sans);font-size:12px;cursor:pointer;border-radius:100px;transition:all 0.3s cubic-bezier(0.32,0.72,0,1);">我的信息</button>
  </div>

  <!-- ═══ Tab 1: 账号管理 ═══ -->
  <div id="tab-account" class="tab-content">
    <div class="glass-card" style="margin-bottom:var(--spacing-md);">
      <div class="glass-card-inner">
        <div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:var(--spacing-md);">当前信息</div>
        <div id="userInfo" style="display:flex;flex-direction:column;gap:10px;">
          <div class="skeleton-line" style="height:16px;width:60%;background:rgba(255,255,255,0.04);border-radius:4px;"></div>
          <div class="skeleton-line" style="height:16px;width:80%;background:rgba(255,255,255,0.04);border-radius:4px;"></div>
          <div class="skeleton-line" style="height:16px;width:45%;background:rgba(255,255,255,0.04);border-radius:4px;"></div>
        </div>
      </div>
    </div>

    <div class="glass-card" style="margin-bottom:var(--spacing-md);">
      <div class="glass-card-inner">
        <div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:var(--spacing-md);">修改信息</div>
        <div style="display:flex;flex-direction:column;gap:var(--spacing-sm);">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;color:var(--label-3);">游戏名称</label>
            <input type="text" id="inputGameName" placeholder="游戏内显示名称" class="cyber-input" />
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;color:var(--label-3);">QQ名称</label>
            <input type="text" id="inputQQName" placeholder="QQ群昵称" class="cyber-input" />
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:13px;color:var(--label-3);">新密码（留空不修改）</label>
            <input type="password" id="inputPassword" placeholder="留空不修改" autocomplete="new-password" class="cyber-input" />
          </div>
        </div>
      </div>
    </div>

    <div style="display:flex;gap:var(--spacing-sm);align-items:center;margin-bottom:var(--spacing-lg);">
      <button class="cyber-btn cyber-btn-primary" id="saveAccountBtn" style="flex:1;justify-content:center;">保存修改</button>
      <span id="saveMsg" style="font-size:14px;color:var(--green);display:none;">已保存 ✓</span>
      <span id="saveErr" style="font-size:14px;color:var(--red);display:none;"></span>
    </div>

    <a href="/admin/bans" class="cyber-btn cyber-btn-ghost" style="display:flex;justify-content:center;gap:8px;margin-top:var(--spacing-md);">
      进入管理后台 →
    </a>
  </div>

  <!-- ═══ Tab 2: 我的封禁 ═══ -->
  <div id="tab-mybans" class="tab-content" style="display:none;">
    <div id="mybans-content" style="padding:1rem 0;">
      <div class="skeleton-line" style="height:40px;width:100%;margin:8px 0;border-radius:8px;background:rgba(255,255,255,0.03);"></div>
      <div class="skeleton-line" style="height:40px;width:100%;margin:8px 0;border-radius:8px;background:rgba(255,255,255,0.03);"></div>
    </div>
  </div>

  <!-- ═══ Tab 3: 我的记录 ═══ -->
  <div id="tab-records" class="tab-content" style="display:none;">
    <div id="records-content" style="padding:1rem 0;color:var(--label-3);font-size:14px;text-align:center;">加载中...</div>
  </div>

  <!-- ═══ Tab 4: 我的信息 ═══ -->
  <div id="tab-info" class="tab-content" style="display:none;">
    <div id="info-content" style="padding:1rem 0;color:var(--label-3);font-size:14px;text-align:center;">加载中...</div>
  </div>
</div>

<!-- Edit Ban Modal (Tab 2) -->
<div id="accountEditSheet" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="编辑封禁" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeAccountEditSheet()">
  <div class="cyber-sheet">
    <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
      <span class="sheet-title">编辑封禁</span>
      <button type="button" class="sheet-close" onclick="closeAccountEditSheet()">✕</button>
    </div>
    <div class="sheet-body">
      <form id="accEditBanForm">
        <input type="hidden" name="id" />
        <div class="cyber-form-group"><label>昵称</label><input type="text" name="nickname" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>Steam ID</label><input type="text" name="steam_id" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>原因</label><input type="text" name="reason" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>封禁时长</label><input type="text" name="ban_duration" placeholder="7d / 30m / 1h / permanent" class="cyber-input" /></div>
        <div class="cyber-form-group">
          <label>违规等级</label>
          <select name="violation_level" class="cyber-input">
            <option value="level3">3级违规</option><option value="level2">2级违规</option>
            <option value="level1">1级违规</option><option value="warning">警告</option>
          </select>
        </div>
        <div class="cyber-form-group"><label>备注</label><textarea name="notes" rows="3" class="cyber-input"></textarea></div>
        <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">保存修改</button>
      </form>
    </div>
  </div>
</div>

<script>
(function() {
  var jwt = localStorage.getItem('jwt');
  if (!jwt) { window.location.href = '/login'; return; }

  var payload = null;
  try { payload = JSON.parse(atob(jwt.split('.')[1])); } catch(e) { window.location.href = '/login'; return; }
  var group = payload.permissionGroup || '';

  var accountData = null;
  var mybansData = null;
  var recordsData = null;
  var mybansLoaded = false;
  var recordsLoaded = false;
  var infoLoaded = false;

  // ── Tab Switching (event delegation) ──
  document.getElementById('accountTabs').addEventListener('click', function(e) {
    var btn = e.target.closest('.tab-btn');
    if (!btn) return;
    var tab = btn.dataset.tab;
    if (!tab) return;

    // Update button styles
    document.querySelectorAll('#accountTabs .tab-btn').forEach(function(b) {
      b.style.background = 'transparent';
      b.style.color = 'var(--label-3)';
      b.style.fontWeight = '400';
    });
    btn.style.background = 'var(--cyan)';
    btn.style.color = '#000';
    btn.style.fontWeight = '600';

    // Show selected tab
    document.querySelectorAll('.tab-content').forEach(function(el) { el.style.display = 'none'; });
    var content = document.getElementById('tab-' + tab);
    if (content) content.style.display = 'block';

    // Load data on first access
    if (tab === 'mybans' && !mybansLoaded) loadMyBans();
    if (tab === 'records' && !recordsLoaded) loadMyRecords();
    if (tab === 'info' && !infoLoaded) loadMyInfo();
  });

  // ── Load Account Info ──
  function loadAccount() {
    var infoEl = document.getElementById('userInfo');
    fetch('/api/account', { headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) {
        if (!r.ok) throw new Error('Request failed');
        return r.json();
      })
      .then(function(d) {
        accountData = d;
        infoEl.innerHTML =
          '<div style="display:flex;flex-wrap:wrap;gap:8px 24px;">' +
          '<div style="flex:1;min-width:180px;"><span style="color:var(--label-3);font-size:13px;">权限组</span><div><span class="badge badge-cyan" style="margin-top:4px;">' + esc(group) + '</span></div></div>' +
          '<div style="flex:1;min-width:180px;"><span style="color:var(--label-3);font-size:13px;">用户名</span><div style="color:var(--label-1);font-weight:500;margin-top:4px;">' + esc(d.username) + '</div></div>' +
          '<div style="flex:1;min-width:180px;"><span style="color:var(--label-3);font-size:13px;">游戏名</span><div style="color:var(--label-1);margin-top:4px;">' + esc(d.game_name || '未设置') + '</div></div>' +
          '<div style="flex:1;min-width:180px;"><span style="color:var(--label-3);font-size:13px;">QQ名</span><div style="color:var(--label-1);margin-top:4px;">' + esc(d.qq_name || '未设置') + '</div></div>' +
          '</div>';
        document.getElementById('inputGameName').value = d.game_name || '';
        document.getElementById('inputQQName').value = d.qq_name || '';
      })
      .catch(function() {
        infoEl.innerHTML = '<div style="color:var(--red);font-size:14px;display:flex;align-items:center;gap:12px;">加载失败 <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="loadAccount()">重试</button></div>';
      });
  }
  // Expose to onclick
  window.loadAccount = loadAccount;
  loadAccount();

  // ── Save Account ──
  document.getElementById('saveAccountBtn').addEventListener('click', function() {
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
        loadAccount();
      } else {
        document.getElementById('saveErr').textContent = j.error || '保存失败';
        document.getElementById('saveErr').style.display = '';
      }
    }).catch(function() {
      document.getElementById('saveErr').textContent = '网络错误';
      document.getElementById('saveErr').style.display = '';
    });
  });

  // ── Tab 2: My Bans ──
  function loadMyBans() {
    var el = document.getElementById('mybans-content');
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--label-3);">加载中...</div>';
    fetch('/api/account/my-bans', { headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        mybansLoaded = true;
        mybansData = d;
        renderMyBans(1);
      })
      .catch(function() {
        el.innerHTML = '<div style="color:var(--red);padding:2rem;text-align:center;">加载失败 <button class="cyber-btn cyber-btn-ghost" onclick="loadMyBans()">重试</button></div>';
      });
  }

  function renderMyBans(page) {
    var data = mybansData;
    if (!data || !data.data || data.data.length === 0) {
      document.getElementById('mybans-content').innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--label-3);font-size:15px;">暂无封禁记录</div>';
      return;
    }
    var h = '<div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">';
    h += '<thead><tr><th>昵称</th><th>Steam ID</th><th>原因</th><th>时长</th><th>等级</th><th>时间</th><th>操作</th></tr></thead><tbody>';
    data.data.forEach(function(b) {
      var lvClass = lvBadge(b.violation_level);
      var lvLabelText = lvLabel(b.violation_level);
      h += '<tr id="myban-' + b.id + '">';
      h += '<td data-label="昵称"><a href="/player/' + b.id + '" style="color:var(--label-1);text-decoration:none;font-weight:600;">' + esc(b.nickname) + '</a></td>';
      h += '<td data-label="Steam ID"><code style="font-size:13px;color:var(--label-2);">' + esc(b.steam_id) + '</code></td>';
      h += '<td data-label="原因" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(b.reason) + '</td>';
      h += '<td data-label="时长" style="font-family:var(--mono);font-size:13px;color:var(--label-2);">' + esc(b.ban_duration) + '</td>';
      h += '<td data-label="等级"><span class="badge ' + lvClass + '">' + lvLabelText + '</span></td>';
      h += '<td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);">' + fmtDate(b.ban_time) + '</td>';
      h += '<td data-label="操作" style="white-space:nowrap;">';
      h += '<button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="accEditBan(' + b.id + ')">编辑</button>';
      h += '<button class="cyber-btn cyber-btn-danger cyber-btn-small" onclick="accDeleteBan(' + b.id + ')">删除</button>';
      h += '</td></tr>';
    });
    h += '</tbody></table></div></div>';

    if (data.total > 25) {
      var totalPages = Math.ceil(data.total / 25);
      h += '<div class="glass-pagination" style="margin-top:16px;"><span class="info">共 ' + data.total + ' 条</span><div class="glass-pages">';
      for (var i = 1; i <= Math.min(totalPages, 5); i++) {
        if (i === page) {
          h += '<span class="glass-page-btn current">' + i + '</span>';
        } else {
          h += '<button class="glass-page-btn" onclick="loadMyBansPage(' + i + ')">' + i + '</button>';
        }
      }
      h += '</div></div></div>';
    }
    document.getElementById('mybans-content').innerHTML = h;
  }

  window.loadMyBansPage = function(page) {
    document.getElementById('mybans-content').innerHTML = '<div style="text-align:center;padding:2rem;color:var(--label-3);">加载中...</div>';
    fetch('/api/account/my-bans?page=' + page, { headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        mybansData = d;
        renderMyBans(page);
      })
      .catch(function() {
        document.getElementById('mybans-content').innerHTML = '<div style="color:var(--red);padding:2rem;text-align:center;">加载失败 <button class="cyber-btn cyber-btn-ghost" onclick="loadMyBans()">重试</button></div>';
      });
  };

  // ── Tab 2: Edit Ban ──
  window.accEditBan = async function(id) {
    var resp = await fetch('/api/admin/bans/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
    if (!resp.ok) { showToast('获取记录失败', 'error'); return; }
    var d = await resp.json();
    var f = document.getElementById('accEditBanForm');
    f.querySelector('[name=id]').value = d.id;
    f.querySelector('[name=nickname]').value = d.nickname;
    f.querySelector('[name=steam_id]').value = d.steam_id;
    f.querySelector('[name=reason]').value = d.reason || '';
    f.querySelector('[name=ban_duration]').value = d.ban_duration || '';
    f.querySelector('[name=violation_level]').value = d.violation_level || 'level3';
    f.querySelector('[name=notes]').value = d.notes || '';
    document.getElementById('accountEditSheet').classList.add('open');
  };

  window.closeAccountEditSheet = function() {
    document.getElementById('accountEditSheet').classList.remove('open');
  };

  window.accDeleteBan = function(id) {
    if (!confirm('确认删除封禁记录 #' + id + '？此操作不可撤销。')) return;
    fetch('/api/admin/bans/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) {
        if (r.ok) {
          var row = document.getElementById('myban-' + id);
          if (row) row.style.display = 'none';
          showToast('已删除', 'success');
        } else {
          r.json().then(function(d) { showToast(d.error || '删除失败', 'error'); });
        }
      })
      .catch(function() { showToast('请求失败', 'error'); });
  };

  // ── Tab 3: My Records ──
  function loadMyRecords() {
    var el = document.getElementById('records-content');
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--label-3);">加载中...</div>';
    fetch('/api/account/my-records', { headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        recordsLoaded = true;
        recordsData = d;
        renderMyRecords();
      })
      .catch(function() {
        el.innerHTML = '<div style="color:var(--red);padding:2rem;text-align:center;">加载失败 <button class="cyber-btn cyber-btn-ghost" onclick="loadMyRecords()">重试</button></div>';
      });
  }

  function renderMyRecords() {
    var data = recordsData;
    if (!data || !data.data || data.data.length === 0) {
      document.getElementById('records-content').innerHTML = '<div style="text-align:center;padding:3rem 1rem;color:var(--label-3);font-size:15px;">暂无相关记录</div>';
      return;
    }
    var h = '<div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">';
    h += '<thead><tr><th>昵称</th><th>Steam ID</th><th>原因</th><th>时长</th><th>等级</th><th>操作员</th><th>时间</th></tr></thead><tbody>';
    data.data.forEach(function(b) {
      var lvClass = lvBadge(b.violation_level);
      var lvLabelText = lvLabel(b.violation_level);
      h += '<tr>';
      h += '<td data-label="昵称"><a href="/player/' + b.id + '" style="color:var(--label-1);text-decoration:none;font-weight:600;">' + esc(b.nickname) + '</a></td>';
      h += '<td data-label="Steam ID"><code style="font-size:13px;color:var(--label-2);">' + esc(b.steam_id) + '</code></td>';
      h += '<td data-label="原因" style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(b.reason) + '</td>';
      h += '<td data-label="时长" style="font-family:var(--mono);font-size:13px;color:var(--label-2);">' + esc(b.ban_duration) + '</td>';
      h += '<td data-label="等级"><span class="badge ' + lvClass + '">' + lvLabelText + '</span></td>';
      h += '<td data-label="操作员" style="font-size:13px;color:var(--label-2);">' + esc(b.handled_by_name || '系统') + '</td>';
      h += '<td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);">' + fmtDate(b.ban_time) + '</td>';
      h += '</tr>';
    });
    h += '</tbody></table></div></div>';
    document.getElementById('records-content').innerHTML = h;
  }

  // ── Tab 4: My Info ──
  function loadMyInfo() {
    var el = document.getElementById('info-content');
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--label-3);">加载中...</div>';
    fetch('/api/account', { headers: { 'Authorization': 'Bearer ' + jwt } })
      .then(function(r) {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then(function(d) {
        infoLoaded = true;
        var h = '<div class="glass-card"><div class="glass-card-inner">';
        h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
        h += '<div><div style="color:var(--label-3);font-size:13px;">用户名</div><div style="color:var(--label-1);font-weight:500;margin-top:4px;">' + esc(d.username) + '</div></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">Steam ID</div><code style="color:var(--label-1);font-family:var(--mono);font-size:13px;margin-top:4px;display:block;">' + esc(d.steam_id) + '</code></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">权限组</div><div style="margin-top:4px;"><span class="badge badge-cyan">' + esc(group) + '</span></div></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">游戏名</div><div style="color:var(--label-1);margin-top:4px;">' + esc(d.game_name || '未设置') + '</div></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">QQ名</div><div style="color:var(--label-1);margin-top:4px;">' + esc(d.qq_name || '未设置') + '</div></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">职位</div><div style="color:var(--label-1);margin-top:4px;">' + esc(d.position || '未设置') + '</div></div>';
        h += '<div><div style="color:var(--label-3);font-size:13px;">上级</div><div style="color:var(--label-1);margin-top:4px;">' + esc(d.supervisor || '未设置') + '</div></div>';
        if (d.created_at) {
          h += '<div><div style="color:var(--label-3);font-size:13px;">注册时间</div><div style="color:var(--label-1);margin-top:4px;">' + fmtDate(d.created_at) + '</div></div>';
        }
        h += '</div></div>';
        el.innerHTML = h;
      })
      .catch(function() {
        el.innerHTML = '<div style="color:var(--red);padding:2rem;text-align:center;">加载失败 <button class="cyber-btn cyber-btn-ghost" onclick="loadMyInfo()">重试</button></div>';
      });
  }

  // ── Edit ban form submit ──
  document.getElementById('accEditBanForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var data = Object.fromEntries(new FormData(this));
    var id = data.id; delete data.id;
    var resp = await fetch('/api/admin/bans/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(data),
    });
    if (resp.ok) {
      closeAccountEditSheet();
      showToast('已修改', 'success');
      loadMyBans();
    } else {
      var r = await resp.json(); showToast(r.error || '修改失败', 'error');
    }
  });

  // ── Utility ──
  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  }
  function lvBadge(lv) {
    var m = { warning:'badge-amber', severe_warning:'badge-amber', level3:'badge-cyan', level2:'badge-magenta', level1:'badge-red', level4:'badge-neutral', mute:'badge-neutral', cfba_ban:'badge-red' };
    return m[lv] || 'badge-neutral';
  }
  function lvLabel(lv) {
    var m = { warning:'警告', severe_warning:'严重警告', level3:'3级违规', level2:'2级违规', level1:'1级', level4:'4级(逃逸)', mute:'禁言', cfba_ban:'CFBA' };
    return m[lv] || lv;
  }
  function showToast(t, type) {
    var el = document.getElementById('cyberToast') || (function(){
      var d = document.createElement('div'); d.id = 'cyberToast'; d.className = 'cyber-toast';
      d.setAttribute('role','status'); d.setAttribute('aria-live','polite');
      document.body.appendChild(d); return d;
    })();
    el.textContent = t; el.className = 'cyber-toast ' + type;
    el.classList.add('show');
    setTimeout(function(){ el.classList.remove('show'); }, 2500);
  }
})();
</script>`
}
