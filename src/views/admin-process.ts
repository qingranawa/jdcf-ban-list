import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'

type ProcBan = { id: number; nickname: string; steam_id: string; reason: string; ban_time: string; ban_duration: string; violation_level: string }

export function AdminProcessPage(props: { level2Bans: ProcBan[]; level3Bans: ProcBan[] }) {
  return html`
<div class="cyber-admin-content">
  <h2 class="page-title" style="margin-bottom:var(--spacing-lg);">批量处理</h2>

  <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;margin-bottom:var(--spacing-lg);">
    <div class="cyber-card" style="flex:1;min-width:200px;padding:var(--spacing-lg);display:flex;gap:var(--spacing-sm);align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:var(--sans);font-size:14px;color:var(--label-2);text-transform:uppercase;letter-spacing:.05em;">待处理 2级</div>
        <div id="l2Count" style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--magenta);">${props.level2Bans.length}</div>
      </div>
      <button class="cyber-btn cyber-btn-primary" onclick="batchDowngrade()" id="downgradeBtn" ${props.level2Bans.length === 0 ? 'disabled' : ''}>
        降级为 3级
      </button>
    </div>
    <div class="cyber-card" style="flex:1;min-width:200px;padding:var(--spacing-lg);display:flex;gap:var(--spacing-sm);align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:var(--sans);font-size:14px;color:var(--label-2);text-transform:uppercase;letter-spacing:.05em;">待处理 3级</div>
        <div id="l3Count" style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--cyan);">${props.level3Bans.length}</div>
      </div>
      <button class="cyber-btn cyber-btn-danger" onclick="batchDelete()" id="deleteBtn" ${props.level3Bans.length === 0 ? 'disabled' : ''}>
        删除
      </button>
    </div>
  </div>

  <div style="display:grid;gap:var(--spacing-lg);grid-template-columns:1fr 1fr;">
    <div>
      <div style="font-family:var(--sans);font-size:14px;font-weight:600;color:var(--magenta);margin-bottom:var(--spacing-sm);">2级违规（降级为 3 级）</div>
      <div class="cyber-table-wrap">${renderTable(props.level2Bans, 'magenta')}</div>
    </div>
    <div>
      <div style="font-family:var(--sans);font-size:14px;font-weight:600;color:var(--cyan);margin-bottom:var(--spacing-sm);">3级违规（删除）</div>
      <div class="cyber-table-wrap">${renderTable(props.level3Bans, 'cyan')}</div>
    </div>
  </div>

  <div style="position:sticky;bottom:var(--spacing-lg);margin-top:var(--spacing-lg);z-index:10;border:1px solid var(--separator);border-radius:12px;padding:var(--spacing-md) var(--spacing-lg);display:flex;gap:var(--spacing-md);align-items:center;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">
    <label style="display:flex;align-items:center;gap:var(--spacing-sm);font-size:14px;color:var(--label-2);cursor:pointer;">
      <input type="checkbox" id="selectAll" onchange="toggleAll()" style="accent-color:var(--cyan);width:16px;height:16px;">
      全选
    </label>
    <span id="selectedCount" style="font-size:14px;color:var(--label-3);">已选 0</span>
    <span style="flex:1;"></span>
    <button class="cyber-btn cyber-btn-primary" onclick="batchDowngrade()" id="downgradeBtn2" disabled>降级选中</button>
    <button class="cyber-btn cyber-btn-danger" onclick="batchDelete()" id="deleteBtn2" disabled>删除选中</button>
  </div>
</div>

<script>
const jwt = localStorage.getItem('jwt');
const rows = document.querySelectorAll('.proc-row');
function toggleAll() {
  var checked = document.getElementById('selectAll').checked;
  rows.forEach(function(r) { r.querySelector('input[type=checkbox]').checked = checked; });
  updateCount();
}
rows.forEach(function(r) {
  r.querySelector('input[type=checkbox]').addEventListener('change', updateCount);
});
function updateCount() {
  var n = 0;
  rows.forEach(function(r) { if (r.querySelector('input[type=checkbox]').checked) n++; });
  document.getElementById('selectedCount').textContent = '已选 ' + n;
  document.getElementById('downgradeBtn2').disabled = n === 0;
  document.getElementById('deleteBtn2').disabled = n === 0;
}
function getSelected() {
  var ids = [];
  rows.forEach(function(r) { if (r.querySelector('input[type=checkbox]').checked) ids.push(parseInt(r.dataset.id)); });
  return ids;
}
async function batchDowngrade() {
  var ids = getSelected();
  if (!ids.length) return;
  if (!confirm('确认降级 ' + ids.length + ' 条记录为 3 级违规？')) return;
  var resp = await fetch('/api/admin/process/downgrade', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ ids: ids }),
  });
  if (resp.ok) { location.reload(); }
  else showToast('操作失败', 'error');
}
async function batchDelete() {
  var ids = getSelected();
  if (!ids.length) return;
  if (!confirm('确认删除 ' + ids.length + ' 条记录？此操作不可撤销。')) return;
  var resp = await fetch('/api/admin/process/delete', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ ids: ids }),
  });
  if (resp.ok) { location.reload(); }
  else showToast('操作失败', 'error');
}
function showToast(t, type) {
  var el = document.getElementById('cyberToast') || (function(){
    var d = document.createElement('div'); d.id = 'cyberToast'; d.className = 'cyber-toast';
    document.body.appendChild(d); return d;
  })();
  el.textContent = t; el.className = 'cyber-toast ' + type;
  el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); }, 2500);
}
</script>`
}

function renderTable(bans: ProcBan[], accent: string): ReturnType<typeof html> {
  if (bans.length === 0) return html`<div style="padding:2rem;text-align:center;color:var(--label-3);font-size:14px;">暂无待处理记录</div>`
  return html`
<table class="cyber-table">
  <thead><tr>
    <th style="width:32px;"><input type="checkbox" style="accent-color:var(--cyan);width:14px;height:14px;" onchange="updateCount()"></th>
    <th>昵称</th><th>Steam ID</th><th>原因</th><th>时长</th><th>时间</th>
  </tr></thead>
  <tbody>
    ${bans.map(b => html`
    <tr class="proc-row" data-id="${b.id}">
      <td><input type="checkbox" style="accent-color:var(--cyan);width:14px;height:14px;" onchange="updateCount()"></td>
      <td><strong style="font-family:var(--sans);">${escHtml(b.nickname)}</strong></td>
      <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(b.steam_id)}</code></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--label-2);font-size:14px;" title="${escHtml(b.reason)}">${escHtml(b.reason)}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(b.ban_duration)}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${fmt(b.ban_time)}</td>
    </tr>`)}
  </tbody>
</table>`
}

function fmt(t: string): string { if (!t) return '—'; const d=new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
