import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'

type ProcessBanRow = {
  id: number;
  nickname: string;
  steam_id: string;
  reason: string;
  ban_time: string;
  ban_duration: string;
  violation_level: string;
  notes: string;
  handled_by: number | null;
  handled_by_name: string | null;
}

export function AdminProcessPage(props: { bans: ProcessBanRow[] }) {
  return html`
<h1>处理页面</h1>

<div id="message" class="message"></div>

<div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
  <button class="btn btn-danger" onclick="batchDelete()">🗑 删除选中</button>
  <button class="btn btn-primary" onclick="batchDowngrade()">⬇ 降级选中</button>
  <span style="font-size:var(--fs-sm);color:var(--text-tertiary);align-self:center;margin-left:0.5rem;">
    勾选已过期的 2/3 级违规记录进行批量处理
  </span>
</div>

<div class="card" style="padding:0;overflow:hidden;">
  <div style="overflow-x:auto;">
  <table>
    <thead><tr>
      <th style="width:36px;padding-left:1rem;"><input type="checkbox" id="selectAll" onchange="toggleAll(this)" /></th>
      <th>ID</th>
      <th>昵称</th>
      <th>Steam ID</th>
      <th>原因</th>
      <th>封禁时间</th>
      <th>时长</th>
      <th>等级</th>
      <th>处理人</th>
    </tr></thead>
    <tbody>
      ${props.bans.length === 0 ? html`
      <tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--text-tertiary);font-size:var(--fs-sm);">暂无待处理记录</td></tr>`
      : props.bans.map(b => html`
      <tr>
        <td style="padding-left:1rem;"><input type="checkbox" class="ban-check" value="${b.id}" data-level="${escAttr(b.violation_level)}" /></td>
        <td style="color:var(--text-tertiary);">${b.id}</td>
        <td><strong>${escHtml(b.nickname)}</strong></td>
        <td><code style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-secondary);">${escHtml(b.steam_id)}</code></td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(b.reason)}">${escHtml(b.reason)}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${(b.ban_time||'').slice(0,10)}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${escHtml(b.ban_duration)}</td>
        <td><span class="badge ${b.violation_level === 'level3' ? 'badge-level3' : 'badge-level2'}">${b.violation_level.replace('level','Lv.')}</span></td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${escHtml(b.handled_by_name || '—')}</td>
      </tr>`)}
    </tbody>
  </table>
  </div>
</div>

<script>
const jwt = localStorage.getItem('jwt');
if (!jwt) { window.location.href = '/login'; }

function toggleAll(master) {
  document.querySelectorAll('.ban-check').forEach(cb => cb.checked = master.checked);
}

function getSelected() {
  return Array.from(document.querySelectorAll('.ban-check:checked')).map(cb => parseInt(cb.value));
}

function showMessage(text, type) {
  var el = document.getElementById('message');
  el.textContent = text;
  el.className = 'message ' + type;
}

async function batchDelete() {
  var ids = getSelected();
  if (ids.length === 0) { showMessage('请至少选择一条记录', 'error'); return; }
  if (!confirm('确认删除选中的 ' + ids.length + ' 条记录？')) return;
  var resp = await fetch('/api/admin/process/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ ids: ids }),
  });
  var data = await resp.json();
  if (data.success) {
    showMessage('成功处理 ' + data.processed + ' 条记录', 'success');
    setTimeout(function() { location.reload(); }, 1000);
  } else {
    showMessage(data.error || '操作失败', 'error');
  }
}

async function batchDowngrade() {
  var ids = getSelected();
  if (ids.length === 0) { showMessage('请至少选择一条记录', 'error'); return; }
  // 只允许 level2 降级
  var allLevel2 = document.querySelectorAll('.ban-check:checked');
  var valid = true;
  allLevel2.forEach(function(cb) {
    if (cb.dataset.level !== 'level2') valid = false;
  });
  if (!valid) { showMessage('降级操作仅适用于 2 级违规记录', 'error'); return; }
  if (!confirm('确认将选中的 ' + ids.length + ' 条记录降级为 3 级？')) return;
  var resp = await fetch('/api/admin/process/downgrade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ ids: ids }),
  });
  var data = await resp.json();
  if (data.success) {
    showMessage('成功降级 ' + data.processed + ' 条记录', 'success');
    setTimeout(function() { location.reload(); }, 1000);
  } else {
    showMessage(data.error || '操作失败', 'error');
  }
}
</script>`
}
