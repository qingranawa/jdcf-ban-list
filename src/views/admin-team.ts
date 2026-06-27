import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { icon } from './icons'

type Admin = { id: number; steam_id: string; username: string; permission_group: string; game_name: string; qq_name: string; position: string; supervisor: string; is_active: number; created_at: string }

export function AdminTeamPage(props: { admins: Admin[] }) {
  return html`
<div class="cyber-admin-content">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h2 class="page-title">管理组管理</h2>
    <button class="cyber-btn cyber-btn-primary" onclick="openAddSheet()">${icon('bolt',16)} 新增</button>
  </div>

  <div class="cyber-table-wrap">
  <table class="cyber-table">
    <thead><tr>
      <th>ID</th><th>Steam ID</th><th>用户名</th><th>权限组</th><th>游戏名</th><th>QQ</th><th>任职</th><th>状态</th><th style="text-align:right;padding-right:var(--spacing-md);">操作</th>
    </tr></thead>
    <tbody>
      ${props.admins.length === 0 ? html`<tr><td colspan="9" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无管理员</td></tr>`
      : props.admins.map(a => html`
      <tr>
        <td style="color:var(--label-3);font-family:var(--mono);font-size:13px;">${a.id}</td>
        <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(a.steam_id)}</code></td>
        <td><strong style="font-family:var(--sans);">${escHtml(a.username)}</strong></td>
        <td><span class="cyber-badge ${a.permission_group === 'OWNER' ? 'cyber-badge-magenta' : 'cyber-badge-cyan'}">${a.permission_group}</span></td>
        <td style="font-size:14px;">${escHtml(a.game_name)}</td>
        <td style="font-size:14px;color:var(--label-2);">${escHtml(a.qq_name)}</td>
        <td style="font-size:14px;color:var(--label-2);">${escHtml(a.position)}</td>
        <td style="font-size:14px;">${a.is_active ? html`<span class="cyber-badge cyber-badge-green">活跃</span>` : html`<span class="cyber-badge cyber-badge-neutral">停用</span>`}</td>
        <td style="text-align:right;white-space:nowrap;padding-right:var(--spacing-md);">
          <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="openEditSheet(${a.id})">编辑</button>
          <button class="cyber-btn cyber-btn-danger cyber-btn-small" data-username="${escAttr(a.username)}" onclick="deleteAdmin(${a.id},this.dataset.username)">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  </div>

  <!-- Add/Edit Bottom Sheet -->
  <div id="adminSheet" class="cyber-sheet-overlay" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeSheet()">
    <div class="cyber-sheet">
      <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
        <span class="sheet-title" id="sheetTitle">新增管理员</span>
        <button type="button" class="sheet-close" onclick="closeSheet()">✕</button>
      </div>
      <div class="sheet-body">
        <form id="adminForm">
          <input type="hidden" name="id" />
          <div class="cyber-form-group"><label>Steam ID *</label><input type="text" name="steam_id" required class="cyber-input" /></div>
          <div class="cyber-form-group"><label>用户名 *</label><input type="text" name="username" required class="cyber-input" /></div>
          <div class="cyber-form-group"><label>密码 (留空不修改)</label><input type="password" name="password" class="cyber-input" /></div>
          <div class="cyber-form-group">
            <label>权限组</label>
            <select name="permission_group" class="cyber-input">
              <option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option>
              <option value="T4">T4</option><option value="T5">T5</option><option value="T6">T6</option>
              <option value="OWNER">OWNER</option>
            </select>
          </div>
          <div class="cyber-form-group"><label>游戏名称</label><input type="text" name="game_name" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>QQ名称</label><input type="text" name="qq_name" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>任职</label><input type="text" name="position" class="cyber-input" /></div>
          <div class="cyber-form-group"><label>主管事务</label><input type="text" name="supervisor" class="cyber-input" /></div>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">保存</button>
        </form>
      </div>
    </div>
  </div>
</div>

<script>
const jwt = localStorage.getItem('jwt');
function openAddSheet() {
  document.getElementById('adminForm').reset();
  document.getElementById('adminForm').querySelector('[name=id]').value = '';
  document.getElementById('sheetTitle').textContent = '新增管理员';
  document.getElementById('adminSheet').classList.add('open');
}
function closeSheet() { document.getElementById('adminSheet').classList.remove('open'); }
async function openEditSheet(id) {
  const resp = await fetch('/api/admin/profiles/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
  const data = await resp.json();
  const form = document.getElementById('adminForm');
  form.querySelector('[name=id]').value = data.id;
  form.querySelector('[name=steam_id]').value = data.steam_id;
  form.querySelector('[name=username]').value = data.username;
  form.querySelector('[name=password]').value = '';
  form.querySelector('[name=permission_group]').value = data.permission_group;
  form.querySelector('[name=game_name]').value = data.game_name;
  form.querySelector('[name=qq_name]').value = data.qq_name;
  form.querySelector('[name=position]').value = data.position;
  form.querySelector('[name=supervisor]').value = data.supervisor;
  document.getElementById('sheetTitle').textContent = '编辑管理员';
  document.getElementById('adminSheet').classList.add('open');
}
async function deleteAdmin(id, name) {
  if (!confirm('确认删除管理员「' + name + '」(ID: ' + id + ')？')) return;
  const resp = await fetch('/api/admin/profiles/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + jwt } });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); showToast(r.error || '删除失败', 'error'); }
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
document.getElementById('adminForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  const id = data.id; delete data.id;
  if (!data.password) delete data.password;
  const method = id ? 'PUT' : 'POST';
  const url = id ? '/api/admin/profiles/' + id : '/api/admin/profiles';
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); showToast(r.error || '操作失败', 'error'); }
});
</script>`
}
