// > Batch processing page — mass downgrade/delete expired bans
// ! Tab切换：上方两个卡片点击切换显示 2级表 / 3级表，默认显示 2级
import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { fmtDate as fmt, lvBadge, lvLabel } from '../helpers/format'

type ProcBan = { id: number; nickname: string; steam_id: string; reason: string; ban_time: string; ban_duration: string; violation_level: string }

export function AdminProcessPage(props: { level2Bans: ProcBan[]; level3Bans: ProcBan[] }) {
  return html`
<div class="cyber-admin-content">
  <h2 class="page-title" style="margin-bottom:var(--spacing-lg);">批量处理</h2>

  <!-- Tab 切换卡片 -->
  <div style="display:flex;gap:var(--spacing-lg);flex-wrap:wrap;margin-bottom:var(--spacing-lg);">
    <div class="glass-card process-tab-card active" data-tab="level2" style="flex:1;min-width:200px;cursor:pointer;" onclick="switchProcessTab('level2')">
      <div class="glass-card-inner" style="display:flex;gap:var(--spacing-sm);align-items:center;justify-content:space-between;background:transparent;box-shadow:none;padding:var(--spacing-lg);">
      <div>
        <div style="font-family:var(--sans);font-size:14px;color:var(--label-2);text-transform:uppercase;letter-spacing:.05em;">待处理 2级</div>
        <div id="l2Count" style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--blue);">${props.level2Bans.length}</div>
      </div>
      <button class="cyber-btn cyber-btn-primary" onclick="event.stopPropagation();downgradeAllL2()" id="downgradeBtn" ${props.level2Bans.length === 0 ? 'disabled' : ''}>
        一键降级2级
      </button>
      </div>
    </div>
    <div class="glass-card process-tab-card" data-tab="level3" style="flex:1;min-width:200px;cursor:pointer;" onclick="switchProcessTab('level3')">
      <div class="glass-card-inner" style="display:flex;gap:var(--spacing-sm);align-items:center;justify-content:space-between;background:transparent;box-shadow:none;padding:var(--spacing-lg);">
      <div>
        <div style="font-family:var(--sans);font-size:14px;color:var(--label-2);text-transform:uppercase;letter-spacing:.05em;">待处理 3级</div>
        <div id="l3Count" style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--cyan);">${props.level3Bans.length}</div>
      </div>
      <button class="cyber-btn cyber-btn-danger" onclick="event.stopPropagation();deleteAllL3()" id="deleteBtn" ${props.level3Bans.length === 0 ? 'disabled' : ''}>
        一键删除3级
      </button>
      </div>
    </div>
  </div>

  <!-- 2级表（默认显示） -->
  <div id="processTable-level2" class="process-table-pane" style="display:block;">
    <div style="font-family:var(--sans);font-size:14px;font-weight:600;color:var(--blue);margin-bottom:var(--spacing-sm);">2级违规（降级为 3 级）</div>
    <div class="glass-table-wrap"><div class="glass-table-inner">${renderTable(props.level2Bans, 'magenta')}</div></div>
  </div>

  <!-- 3级表（默认隐藏） -->
  <div id="processTable-level3" class="process-table-pane" style="display:none;">
    <div style="font-family:var(--sans);font-size:14px;font-weight:600;color:var(--cyan);margin-bottom:var(--spacing-sm);">3级违规（删除）</div>
    <div class="glass-table-wrap"><div class="glass-table-inner">${renderTable(props.level3Bans, 'cyan')}</div></div>
  </div>

  <div style="position:sticky;bottom:var(--spacing-lg);margin-top:var(--spacing-lg);z-index:10;border:1px solid var(--separator);border-radius:12px;padding:var(--spacing-md) var(--spacing-lg);display:flex;gap:var(--spacing-md);align-items:center;background:rgba(255,255,255,.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);">
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

<style>
.process-tab-card { transition: all .2s ease; border:1px solid transparent; }
.process-tab-card.active { border-color: var(--cyan); }
.process-tab-card.active .glass-card-inner { background: rgba(0,255,255,0.04); }
.process-table-pane { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
</style>

<script>
let currentProcessTab = 'level2';

function switchProcessTab(tab) {
  if (currentProcessTab === tab) return;
  currentProcessTab = tab;
  document.querySelectorAll('.process-tab-card').forEach(function(c) {
    c.classList.toggle('active', c.dataset.tab === tab);
  });
  document.querySelectorAll('.process-table-pane').forEach(function(p) {
    p.style.display = p.id === 'processTable-' + tab ? 'block' : 'none';
  });
  // 更新全选状态
  document.getElementById('selectAll').checked = false;
  updateCount();
}

const jwt = localStorage.getItem('jwt');

function getCurrentRows() {
  return document.querySelectorAll('#processTable-' + currentProcessTab + ' .proc-row');
}

function toggleAll() {
  var checked = document.getElementById('selectAll').checked;
  getCurrentRows().forEach(function(r) { r.querySelector('input[type=checkbox]').checked = checked; });
  updateCount();
}

function toggleTableRows(checkbox) {
  var table = checkbox.closest('table');
  table.querySelectorAll('.proc-row input[type=checkbox]').forEach(function(c) { c.checked = checkbox.checked; });
  updateCount();
}

function updateCount() {
  var n = 0;
  getCurrentRows().forEach(function(r) { if (r.querySelector('input[type=checkbox]').checked) n++; });
  document.getElementById('selectedCount').textContent = '已选 ' + n;
  document.getElementById('downgradeBtn2').disabled = n === 0;
  document.getElementById('deleteBtn2').disabled = n === 0;
}

function getSelected() {
  var ids = [];
  getCurrentRows().forEach(function(r) { if (r.querySelector('input[type=checkbox]').checked) ids.push(parseInt(r.dataset.id)); });
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

async function downgradeAllL2() {
  var ids = Array.from(document.querySelectorAll('#processTable-level2 .proc-row')).map(function(r) { return parseInt(r.dataset.id); });
  if (!ids.length) return;
  if (!confirm('确认将全部 ' + ids.length + ' 条 2 级违规降级为 3 级？')) return;
  var resp = await fetch('/api/admin/process/downgrade', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify({ ids: ids }),
  });
  if (resp.ok) { location.reload(); }
  else showToast('操作失败', 'error');
}

async function deleteAllL3() {
  var ids = Array.from(document.querySelectorAll('#processTable-level3 .proc-row')).map(function(r) { return parseInt(r.dataset.id); });
  if (!ids.length) return;
  if (!confirm('确认删除全部 ' + ids.length + ' 条 3 级违规？此操作不可撤销。')) return;
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
<table class="glass-table">
  <thead><tr>
    <th style="width:32px;"><input type="checkbox" style="accent-color:var(--cyan);width:14px;height:14px;" onchange="toggleTableRows(this)"></th>
    <th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>时长</th><th>时间</th>
  </tr></thead>
  <tbody>
    ${bans.map(b => html`
    <tr class="proc-row" data-id="${b.id}">
      <td><input type="checkbox" style="accent-color:var(--cyan);width:14px;height:14px;" onchange="updateCount()"></td>
      <td><strong style="font-family:var(--sans);">${escHtml(b.nickname)}</strong></td>
      <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(b.steam_id)}</code></td>
      <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--label-2);font-size:14px;" title="${escHtml(b.reason)}">${escHtml(b.reason)}</td>
      <td><span class="badge ${lvBadge(b.violation_level)}">${lvLabel(b.violation_level)}</span></td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(b.ban_duration)}</td>
      <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${fmt(b.ban_time)}</td>
    </tr>`)}
  </tbody>
</table>`
}