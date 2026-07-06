import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { fmtDate as fmt, lvBadge, lvLabel, stBadge, fmtHandlers } from '../helpers/format'
import { icon } from './icons'

type AdminBan = { id: number; nickname: string; steam_id: string; ip_address: string; reason: string; ban_time: string; ban_duration: string; violation_level: string; status: string; notes: string; handled_by_name: string | null; co_handlers: string }

export function AdminBanTable(props: { bans: AdminBan[] }) {
  return html`
<div class="cyber-table-wrap">
<table class="cyber-table">
  <thead><tr>
    <th>ID</th><th>昵称</th><th>Steam ID</th><th>原因</th><th>时长</th><th>等级</th><th>状态</th><th>操作员</th><th>时间</th><th style="text-align:right;padding-right:var(--spacing-md);">操作</th>
  </tr></thead>
  <tbody>
    ${props.bans.length === 0 ? html`<tr><td colspan="10" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无封禁记录</td></tr>`
    : props.bans.map(b => html`<tr id="banRow${b.id}">
      <td style="color:var(--label-3);font-family:var(--mono);font-size:13px;">${b.id}</td>
      <td><a href="/player/${b.id}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(b.nickname)}</a></td>
      <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(b.steam_id)}</code></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);" title="${escAttr(b.reason)}">${escHtml(b.reason)}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(b.ban_duration)}</td>
      <td><span class="cyber-badge ${lvBadge(b.violation_level)}">${lvLabel(b.violation_level)}</span></td>
      <td><span class="cyber-badge ${stBadge(b.status)}">${escHtml(b.status)}</span></td>
      <td style="font-size:14px;color:var(--label-2);">${fmtHandlers(b.handled_by_name, b.co_handlers)}</td>
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

function genPages(current: number, total: number): (number|string)[] {
  if (total <= 7) return Array.from({length:total},(_,i)=>i+1)
  const pages: (number|string)[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current-1); i <= Math.min(total-1, current+1); i++) pages.push(i)
  if (current < total-2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
}

// ── Admin Ban Page ──
export function AdminBanPage(props: { bans: AdminBan[]; showArchived?: boolean; page?: number; perPage?: number; total?: number; query?: string }) {
  const archived = props.showArchived ?? false
  const page = props.page || 1
  const perPage = props.perPage || 25
  const total = props.total || 0
  const query = props.query || ''
  const totalPages = Math.ceil(total / perPage)
  const qs = (p: number) => `page=${p}&per_page=${perPage}${archived ? '&archived=1' : ''}${query ? '&q=' + encodeURIComponent(query) : ''}`
  const pageUrl = (p: number) => `/admin/bans?${qs(p)}`
  const perPageHtml = html`
<select class="cyber-input" style="width:auto;min-width:90px;" onchange="location.href='/admin/bans?${query ? 'q='+encodeURIComponent(query)+'&' : ''}page=1&per_page='+this.value+'${archived ? '&archived=1' : ''}'">
  <option value="10" ${perPage===10?'selected':''}>10条/页</option>
  <option value="25" ${perPage===25?'selected':''}>25条/页</option>
  <option value="50" ${perPage===50?'selected':''}>50条/页</option>
  <option value="100" ${perPage===100?'selected':''}>100条/页</option>
</select>`
  return html`
<div class="cyber-admin-content">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h2 class="page-title">封禁管理</h2>
    <div style="display:flex;gap:var(--spacing-sm);">
      <a href="/api/admin/bans/export" class="cyber-btn cyber-btn-ghost" download>${icon('download',16)} 导出 CSV</a>
      <button class="cyber-btn cyber-btn-primary" onclick="openBanSheet()">${icon('bolt',16)} 新增封禁</button>
    </div>
  </div>

  <!-- search + filter + per-page -->
  <div style="display:flex;gap:var(--spacing-sm);margin-bottom:var(--spacing-lg);flex-wrap:wrap;">
    <div class="cyber-search" style="flex:1;min-width:200px;">
      <span class="search-icon">${icon('magnifyingglass',18)}</span>
      <input type="text" id="adminBanSearch" placeholder="搜索昵称/Steam ID/IP/原因/备注…" value="${escAttr(query)}" onkeyup="applyFilter()" />
    </div>
    <select id="adminBanFilter" class="cyber-input" style="width:auto;min-width:120px;" onchange="applyFilter()">
      <option value="">全部状态</option>
      <option value="banned">封禁中</option>
      <option value="permanent">永久封禁</option>
      <option value="unbanned">已解封</option>
      <option value="warning">警告</option>
      <option value="muted">禁言中</option>
      <option value="cfba">CF封禁</option>
    </select>
  </div>

  <div id="adminBanTable">
    ${AdminBanTable({ bans: props.bans })}
  </div>

  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--spacing-lg);">
    <span style="font-size:13px;color:var(--label-3);">共 ${total} 条，第 ${page}/${totalPages} 页</span>
    <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
    ${perPageHtml}
      ${totalPages > 1 ? html`
      <div class="cyber-pagination" style="margin-top:0;">
        ${page > 1 ? html`<a href="${pageUrl(page-1)}">←</a>` : ''}
        ${genPages(page, totalPages).map(p => typeof p === 'number' ? html`
          ${p === page ? html`<span class="current" aria-current="page">${p}</span>` : html`<a href="${pageUrl(p)}">${p}</a>`}`
        : html`<span>…</span>`)}
        ${page < totalPages ? html`<a href="${pageUrl(page+1)}">→</a>` : ''}
      </div>` : ''}
    </div>
  </div>

  <!-- Add Ban Modal -->
  <div id="banSheet" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="新增封禁" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeBanSheet()">
    <div class="cyber-sheet">
      <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
        <span class="sheet-title">新增封禁</span>
        <button type="button" class="sheet-close" onclick="closeBanSheet()">✕</button>
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
          <div class="cyber-form-group"><label>联合封禁管理员（选填）</label><input type="text" name="co_handlers" placeholder="用逗号分隔多个管理员" class="cyber-input" /></div>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">提交封禁</button>
        </form>
      </div>
    </div>
  </div>

  <!-- Edit Ban Modal -->
  <div id="editBanSheet" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="编辑封禁" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeEditSheet()">
    <div class="cyber-sheet">
      <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
        <span class="sheet-title">编辑封禁</span>
        <button type="button" class="sheet-close" onclick="closeEditSheet()">✕</button>
      </div>
      <div class="sheet-body">
        <form id="editBanForm">
          <input type="hidden" name="id" />
          <div class="cyber-form-group"><label>昵称 *</label><input type="text" name="nickname" required class="cyber-input" /></div>
          <div class="cyber-form-group"><label>Steam ID *</label><input type="text" name="steam_id" required placeholder="76561199…" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>IP（选填）</label><input type="text" name="ip_address" class="cyber-input" /></div>
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
          <div class="cyber-form-group"><label>联合封禁管理员（选填）</label><input type="text" name="co_handlers" placeholder="用逗号分隔多个管理员" class="cyber-input" /></div>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">保存修改</button>
        </form>
      </div>
    </div>
  </div>
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
function closeEditSheet() {
  document.getElementById('editBanSheet').classList.remove('open');
}
async function editBan(id) {
  const resp = await fetch('/api/admin/bans/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
  if (!resp.ok) { showToast('获取记录失败', 'error'); return; }
  const d = await resp.json();
  const f = document.getElementById('editBanForm');
  f.querySelector('[name=id]').value = d.id;
  f.querySelector('[name=nickname]').value = d.nickname;
  f.querySelector('[name=steam_id]').value = d.steam_id;
  f.querySelector('[name=ip_address]').value = d.ip_address || '';
  f.querySelector('[name=reason]').value = d.reason || '';
  f.querySelector('[name=ban_duration]').value = d.ban_duration || '';
  f.querySelector('[name=violation_level]').value = d.violation_level || 'level3';
  f.querySelector('[name=notes]').value = d.notes || '';
  f.querySelector('[name=co_handlers]').value = d.co_handlers || '';
  document.getElementById('editBanSheet').classList.add('open');
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
document.getElementById('editBanForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const id = data.id; delete data.id;
  const resp = await fetch('/api/admin/bans/' + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); showToast(r.error || '修改失败', 'error'); }
});
function applyFilter() {
  var q = document.getElementById('adminBanSearch')?.value?.trim() || '';
  var st = document.getElementById('adminBanFilter')?.value || '';
  var params = new URLSearchParams();
  if (q) params.set('q', q);
  if (st) params.set('status', st);
  params.set('page', '1');
  location.href = '/admin/bans?' + params.toString();
}
</script>`
}
export const AdminBanListPage = AdminBanPage
