import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { icon } from './icons'

type AdminBan = { id: number; nickname: string; steam_id: string; ip_address: string; reason: string; ban_time: string; ban_duration: string; violation_level: string; status: string; notes: string; handled_by_name: string | null }

export function AdminBanTable(props: { bans: AdminBan[] }) {
  return html`
<div class="cyber-table-wrap">
<table class="cyber-table">
  <thead><tr>
    <th>ID</th><th>昵称</th><th>Steam ID</th><th>原因</th><th>时长</th><th>等级</th><th>状态</th><th>管理人</th><th>时间</th><th style="text-align:right;padding-right:var(--spacing-md);">操作</th>
  </tr></thead>
  <tbody>
    ${props.bans.length === 0 ? html`<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无封禁记录</td></tr>`
    : props.bans.map(b => html`<tr id="banRow${b.id}">
      <td style="color:var(--label-3);font-family:var(--mono);font-size:13px;">${b.id}</td>
      <td><strong style="font-family:var(--sans);">${escHtml(b.nickname)}</strong></td>
      <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(b.steam_id)}</code></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);" title="${escAttr(b.reason)}">${escHtml(b.reason)}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(b.ban_duration)}</td>
      <td><span class="cyber-badge ${lvBadge(b.violation_level)}">${escHtml(b.violation_level)}</span></td>
      <td><span class="cyber-badge ${stBadge(b.status)}">${escHtml(b.status)}</span></td>
      <td style="font-size:14px;color:var(--label-2);">${b.handled_by_name ? escHtml(b.handled_by_name) : '—'}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${fmt(b.ban_time)}</td>
      <td style="text-align:right;white-space:nowrap;padding-right:var(--spacing-md);">
        <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="editBan(${b.id})">编辑</button>
        <button class="cyber-btn cyber-btn-danger cyber-btn-small" onclick="deleteBan(${b.id})">删除</button>
      </td>
    </tr>`)}
  </tbody>
</table>
</div>`
}

function lvBadge(lv: string): string {
  const m: Record<string,string> = { warning:'cyber-badge-amber', level3:'cyber-badge-cyan', level2:'cyber-badge-magenta', level1:'cyber-badge-red' }
  return m[lv] || 'cyber-badge-neutral'
}
function stBadge(s: string): string {
  const m: Record<string,string> = { banned:'cyber-badge-magenta', unbanned:'cyber-badge-green', permanent:'cyber-badge-red' }
  return m[s] || 'cyber-badge-neutral'
}
function fmt(t: string): string { if (!t) return '—'; const d=new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

// ── Admin Ban Page ──
export function AdminBanPage(props: { bans: AdminBan[]; showArchived?: boolean }) {
  const archived = props.showArchived ?? false
  return html`
<div class="cyber-admin-content">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h2 class="page-title">封禁管理</h2>
    <button class="cyber-btn cyber-btn-primary" onclick="openBanSheet()">${icon('bolt',16)} 新增封禁</button>
  </div>

  <!-- tab: 活跃 / 已归档 -->
  <div style="display:flex;gap:0;margin-bottom:var(--spacing-lg);border:1px solid var(--separator);border-radius:8px;overflow:hidden;width:fit-content;">
    <a href="/admin/bans" style="padding:8px 18px;font-size:14px;font-family:var(--sans);text-decoration:none;color:var(--label-1);background:${archived ? 'transparent' : 'var(--magenta)'};${archived ? '' : 'color:#000;font-weight:600;'}transition:all .2s;">活跃封禁</a>
    <a href="/admin/bans?archived=1" style="padding:8px 18px;font-size:14px;font-family:var(--sans);text-decoration:none;color:var(--label-1);background:${archived ? 'var(--magenta)' : 'transparent'};${archived ? 'color:#000;font-weight:600;' : ''}transition:all .2s;">已归档</a>
  </div>

  <!-- search + filter -->
  <div style="display:flex;gap:var(--spacing-sm);margin-bottom:var(--spacing-lg);flex-wrap:wrap;">
    <div class="cyber-search" style="flex:1;min-width:200px;">
      <span class="search-icon">${icon('magnifyingglass',18)}</span>
      <input type="text" id="adminBanSearch" placeholder="搜索封禁记录…" onkeyup="applyFilter()" />
    </div>
    <select id="adminBanFilter" class="cyber-input" style="width:auto;min-width:120px;" onchange="applyFilter()">
      <option value="">全部</option>
      <option value="banned">封禁中</option>
      <option value="unbanned">已解封</option>
      <option value="permanent">永久</option>
    </select>
  </div>

  <div id="adminBanTable">
    ${AdminBanTable({ bans: props.bans })}
  </div>

  <!-- Add Ban Bottom Sheet -->
  <div id="banSheet" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="新增封禁" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeBanSheet()">
    <div class="cyber-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-header">
        <span class="sheet-title">新增封禁</span>
        <button type="button" class="sheet-close" onclick="closeBanSheet()">取消</button>
      </div>
      <div class="sheet-body">
        <form id="banForm">
          <div class="cyber-form-group"><label>昵称 *</label><input type="text" name="nickname" required class="cyber-input" /></div>
          <div class="cyber-form-group"><label>Steam ID *</label><input type="text" name="steam_id" required placeholder="76561199…" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>IP（选填）</label><input type="text" name="ip_address" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>原因</label><input type="text" name="reason" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>封禁时长</label><input type="text" name="ban_duration" placeholder="7d / 30m / 1h / permanent" class="cyber-input" /></div>
          <div class="cyber-form-group">
            <label>违规等级</label>
            <select name="violation_level" class="cyber-input">
              <option value="level3" selected>3级违规</option><option value="level2">2级违规</option>
              <option value="level1">1级违规</option><option value="warning">警告</option>
            </select>
          </div>
          <div class="cyber-form-group"><label>备注</label><textarea name="notes" rows="3" class="cyber-input"></textarea></div>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">提交封禁</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Edit page link -->
  <p style="margin-top:var(--spacing-md);text-align:center;font-size:13px;color:var(--label-3);">
    编辑页通过「编辑」按钮在新页面打开。
  </p>
</div>

<script>
const jwt = localStorage.getItem('jwt');
function openBanSheet() {
  document.getElementById('banForm').reset();
  document.getElementById('banSheet').classList.add('open');
}
function closeBanSheet() {
  document.getElementById('banSheet').classList.remove('open');
}
function editBan(id) {
  window.location.href = '/admin/bans/' + id;
}
async function deleteBan(id) {
  if (!confirm('确认删除封禁记录 #' + id + '？')) return;
  const resp = await fetch('/api/admin/bans/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + jwt } });
  if (resp.ok) {
    document.getElementById('banRow' + id)?.remove();
    showToast('已删除', 'success');
  } else {
    const r = await resp.json(); showToast(r.error || '删除失败', 'error');
  }
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
document.getElementById('banForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const resp = await fetch('/api/admin/bans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); showToast(r.error || '添加失败', 'error'); }
});
function applyFilter() {
  var q = document.getElementById('adminBanSearch')?.value?.toLowerCase() || '';
  var st = document.getElementById('adminBanFilter')?.value || '';
  var rows = document.querySelectorAll('#adminBanTable tbody tr');
  rows.forEach(function(r){
    var show = (!q || r.textContent.toLowerCase().includes(q));
    if (st) {
      var sc = r.querySelector('td:nth-child(7)');
      if (sc) show = show && sc.textContent.toLowerCase().includes(st);
    }
    r.style.display = show ? '' : 'none';
  });
}
</script>`
}
export const AdminBanListPage = AdminBanPage

export function AdminBanFormPage(props: { ban: Record<string, any> | null }) {
  return html`<div><h2 class="page-title">${props.ban ? '编辑封禁' : '新增封禁'}</h2></div>`
}
