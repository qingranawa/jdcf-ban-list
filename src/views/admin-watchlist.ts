// > Watchlist page — track suspicious players across sessions
// ! T3 及以上可访问；Steam ID 在该列表中唯一（UNIQUE 约束）
import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { icon } from './icons'

type Watch = { id: number; steam_id: string; nickname: string | null; reason: string | null; notes: string | null; created_at: string }

export function AdminWatchlistPage(props: { items: Watch[] }) {
  return html`
<div class="cyber-admin-content">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h2 class="page-title">重点观察</h2>
    <button class="cyber-btn cyber-btn-primary" onclick="openSheet()">${icon('bolt',16)} 新增</button>
  </div>

  <div class="glass-table-wrap"><div class="glass-table-inner">
  <table class="glass-table">
    <thead><tr>
      <th>Steam ID</th><th>昵称</th><th>原因</th><th>备注</th><th>添加时间</th><th style="text-align:right;padding-right:var(--spacing-md);">操作</th>
    </tr></thead>
    <tbody>
      ${props.items.length === 0 ? html`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无观察对象</td></tr>`
      : props.items.map(w => html`
      <tr id="watchRow${w.id}">
        <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(w.steam_id)}</code></td>
        <td><strong style="font-family:var(--sans);">${escHtml(w.nickname)}</strong></td>
        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--label-2);font-size:14px;">${escHtml(w.reason)}</td>
        <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--label-2);font-size:14px;">${escHtml(w.notes)}</td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${fmt(w.created_at)}</td>
        <td style="text-align:right;white-space:nowrap;padding-right:var(--spacing-md);">
          <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="editWatch(${w.id})">编辑</button>
          <button class="cyber-btn cyber-btn-danger cyber-btn-small" onclick="deleteWatch(${w.id})">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  </div></div>

  <!-- Bottom Sheet -->
  <div id="watchSheet" class="cyber-sheet-overlay" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeSheet()">
    <div class="cyber-sheet">
      <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
        <span class="sheet-title" id="sheetTitle">新增观察对象</span>
        <button type="button" class="sheet-close" onclick="closeSheet()">✕</button>
      </div>
      <div class="sheet-body">
        <form id="watchForm">
          <input type="hidden" name="id" />
          <div class="cyber-form-group"><label>Steam ID *</label><input type="text" name="steam_id" required placeholder="76561199…" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>昵称 *</label><input type="text" name="nickname" required class="cyber-input" /></div>
          <div class="cyber-form-group"><label>原因</label><input type="text" name="reason" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>备注</label><textarea name="notes" rows="3" class="cyber-input"></textarea></div>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">保存</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
const jwt = localStorage.getItem('jwt');
function openSheet() {
  document.getElementById('watchForm').reset();
  document.getElementById('watchForm').querySelector('[name=id]').value = '';
  document.getElementById('sheetTitle').textContent = '新增观察对象';
  document.getElementById('watchSheet').classList.add('open');
}
function closeSheet() { document.getElementById('watchSheet').classList.remove('open'); }
async function editWatch(id) {
  const resp = await fetch('/api/admin/watchlist/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
  if (!resp.ok) { showToast('获取记录失败', 'error'); return; }
  const d = await resp.json();
  const f = document.getElementById('watchForm');
  f.querySelector('[name=id]').value = d.id;
  f.querySelector('[name=steam_id]').value = d.steam_id;
  f.querySelector('[name=nickname]').value = d.nickname;
  f.querySelector('[name=reason]').value = d.reason;
  f.querySelector('[name=notes]').value = d.notes;
  document.getElementById('sheetTitle').textContent = '编辑观察对象';
  document.getElementById('watchSheet').classList.add('open');
}
async function deleteWatch(id) {
  if (!confirm('确认移除该观察对象？')) return;
  const resp = await fetch('/api/admin/watchlist/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + jwt } });
  if (resp.ok) { document.getElementById('watchRow' + id)?.remove(); showToast('已移除', 'success'); }
  else { const r = await resp.json(); showToast(r.error || '删除失败', 'error'); }
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
document.getElementById('watchForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const id = data.id; delete data.id;
  const method = id ? 'PUT' : 'POST';
  const url = id ? '/api/admin/watchlist/' + id : '/api/admin/watchlist';
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); showToast(r.error || '操作失败', 'error'); }
});
</script>`
}

function fmt(t: string): string { if (!t) return '—'; const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }
