import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'

type WatchlistRowView = {
  id: number;
  steam_id: string;
  nickname: string | null;
  reason: string | null;
  added_by: number | null;
  added_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export function AdminWatchlistPage(props: { entries: WatchlistRowView[] }) {
  return html`
<h1>重点观察</h1>

<div id="message" class="message"></div>

<div style="margin-bottom:1rem;">
  <button class="btn btn-primary" onclick="openAddModal()">＋ 添加</button>
</div>

<div class="card" style="padding:0;overflow:hidden;">
  <div style="overflow-x:auto;">
  <table>
    <thead><tr>
      <th>ID</th>
      <th>Steam ID</th>
      <th>昵称</th>
      <th>原因</th>
      <th>添加人</th>
      <th>备注</th>
      <th>添加时间</th>
      <th style="padding-right:1rem;text-align:right;">操作</th>
    </tr></thead>
    <tbody>
      ${props.entries.length === 0 ? html`
      <tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--text-tertiary);font-size:var(--fs-sm);">暂无观察记录</td></tr>`
      : props.entries.map(e => html`
      <tr>
        <td style="color:var(--text-tertiary);">${e.id}</td>
        <td><code style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-secondary);">${escHtml(e.steam_id)}</code></td>
        <td>${escHtml(e.nickname || '—')}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(e.reason)}">${escHtml(e.reason || '—')}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${escHtml(e.added_by_name || '—')}</td>
        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--fs-sm);color:var(--text-secondary);" title="${escAttr(e.notes)}">${escHtml(e.notes || '—')}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${(e.created_at||'').slice(0,10)}</td>
        <td style="padding-right:1rem;text-align:right;white-space:nowrap;">
          <button class="btn btn-ghost" style="padding:0.25rem 0.6rem;font-size:var(--fs-xs);" onclick="openEditModal(${e.id})">编辑</button>
          <button class="btn btn-danger" style="padding:0.25rem 0.6rem;font-size:var(--fs-xs);" onclick="deleteEntry(${e.id})">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  </div>
</div>

<!-- 添加/编辑模态框 -->
<div id="watchModal" class="modal-overlay">
  <div class="card modal-content">
    <h3 id="modalTitle" style="margin-bottom:1rem;font-weight:500;">添加观察</h3>
    <form id="watchForm">
      <input type="hidden" name="id" value="" id="editId" />
      <div class="form-group">
        <label>Steam ID *</label>
        <input type="text" name="steam_id" id="inputSteamId" required placeholder="76561199…" />
      </div>
      <div class="form-group">
        <label>昵称</label>
        <input type="text" name="nickname" id="inputNickname" placeholder="玩家昵称" />
      </div>
      <div class="form-group">
        <label>原因</label>
        <textarea name="reason" id="inputReason" placeholder="添加原因"></textarea>
      </div>
      <div class="form-group">
        <label>备注</label>
        <textarea name="notes" id="inputNotes" placeholder="备注信息"></textarea>
      </div>
      <div style="display:flex;gap:0.5rem;">
        <button type="submit" class="btn btn-primary">保存</button>
        <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
      </div>
    </form>
  </div>
</div>

<script>
const jwt = localStorage.getItem('jwt');
if (!jwt) { window.location.href = '/login'; }

function showMessage(text, type) {
  var el = document.getElementById('message');
  el.textContent = text;
  el.className = 'message ' + type;
}

function openAddModal() {
  document.getElementById('watchForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('modalTitle').textContent = '添加观察';
  document.getElementById('watchModal').classList.add('open');
}

function closeModal() {
  document.getElementById('watchModal').classList.remove('open');
}

async function openEditModal(id) {
  var resp = await fetch('/api/admin/watchlist/' + id, {
    headers: { 'Authorization': 'Bearer ' + jwt }
  });
  if (!resp.ok) { showMessage('加载失败', 'error'); return; }
  var data = await resp.json();
  document.getElementById('editId').value = data.id;
  document.getElementById('inputSteamId').value = data.steam_id;
  document.getElementById('inputNickname').value = data.nickname || '';
  document.getElementById('inputReason').value = data.reason || '';
  document.getElementById('inputNotes').value = data.notes || '';
  document.getElementById('modalTitle').textContent = '编辑观察';
  document.getElementById('watchModal').classList.add('open');
}

document.getElementById('watchForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  var data = Object.fromEntries(new FormData(e.target));
  var id = data.id;
  delete data.id;
  var method = id ? 'PUT' : 'POST';
  var url = id ? '/api/admin/watchlist/' + id : '/api/admin/watchlist';
  var resp = await fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  var result = await resp.json();
  if (result.success) {
    showMessage('操作成功', 'success');
    closeModal();
    setTimeout(function() { location.reload(); }, 800);
  } else {
    showMessage(result.error || '操作失败', 'error');
  }
});

async function deleteEntry(id) {
  if (!confirm('确认删除这条观察记录？')) return;
  var resp = await fetch('/api/admin/watchlist/' + id, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + jwt },
  });
  var result = await resp.json();
  if (result.success) {
    showMessage('已删除', 'success');
    setTimeout(function() { location.reload(); }, 800);
  } else {
    showMessage(result.error || '删除失败', 'error');
  }
}

// 点击遮罩关闭模态框
document.getElementById('watchModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
</script>`
}
