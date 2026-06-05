import { html } from 'hono/html'

export function AdminBanListPage(props: { bans: any[]; page: number; totalPages: number; total: number }) {
  return html`
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <h2 style="font-weight:500;">封禁管理</h2>
    <a href="/admin/bans/new" class="btn btn-primary">+ 新增封禁</a>
  </div>
  <table>
    <thead><tr>
      <th>ID</th><th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>时长</th><th>操作</th>
    </tr></thead>
    <tbody>
      ${props.bans.length === 0 ? html`<tr><td colspan="7" style="text-align:center;padding:2rem;color:#8888a0;">暂无数据</td></tr>`
      : props.bans.map((b: any) => html`<tr>
        <td>${b.id}</td>
        <td><strong>${esc(b.nickname)}</strong></td>
        <td style="font-family:monospace;font-size:0.82rem;">${esc(b.steam_id)}</td>
        <td>${esc(b.reason)}</td>
        <td><span class="badge ${b.violation_level === 'level3' ? 'badge-level3' : b.violation_level === 'level2' ? 'badge-level2' : 'badge-level1'}">${b.violation_level}</span></td>
        <td>${b.ban_duration}</td>
        <td>
          <a href="/admin/bans/${b.id}/edit" class="btn btn-ghost" style="padding:0.2rem 0.5rem;font-size:0.78rem;">编辑</a>
          <button class="btn btn-danger" style="padding:0.2rem 0.5rem;font-size:0.78rem;"
                  hx-delete="/api/admin/bans/${b.id}" hx-confirm="确认删除这条封禁记录？" hx-target="closest tr" hx-swap="delete">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  ${props.totalPages > 1 ? html`<div class="pagination">
    ${props.page > 1 ? html`<a href="/admin/bans?page=${props.page-1}">上一页</a>` : ''}
    ${Array.from({length: props.totalPages}, (_,i)=>i+1).map(p => p === props.page ? html`<span class="current">${p}</span>` : html`<a href="/admin/bans?page=${p}">${p}</a>`)}
    ${props.page < props.totalPages ? html`<a href="/admin/bans?page=${props.page+1}">下一页</a>` : ''}
  </div>` : ''}
</div>`
}

export function AdminBanFormPage(props: { ban: any }) {
  const b = props.ban
  return html`
<div class="card" style="max-width:600px;">
  <h2 style="margin-bottom:1rem;font-weight:500;">${b ? '编辑封禁' : '新增封禁'}</h2>
  <form id="banForm">
    <div class="form-group">
      <label>昵称 *</label>
      <input type="text" name="nickname" value="${b ? escAttr(b.nickname) : ''}" required />
    </div>
    <div class="form-group">
      <label>Steam ID *</label>
      <input type="text" name="steam_id" value="${b ? escAttr(b.steam_id) : ''}" required placeholder="76561199..." />
    </div>
    <div class="form-group">
      <label>IP 地址</label>
      <input type="text" name="ip_address" value="${b ? escAttr(b.ip_address) : ''}" />
    </div>
    <div class="form-group">
      <label>封禁时长</label>
      <select name="ban_duration">
        <option value="30m" ${b?.ban_duration === '30m' ? 'selected' : ''}>30 分钟</option>
        <option value="1h" ${b?.ban_duration === '1h' ? 'selected' : ''}>1 小时</option>
        <option value="3h" ${b?.ban_duration === '3h' ? 'selected' : ''}>3 小时</option>
        <option value="1d" ${b?.ban_duration === '1d' ? 'selected' : ''}>1 天</option>
        <option value="3d" ${b?.ban_duration === '3d' ? 'selected' : ''}>3 天</option>
        <option value="7d" ${b?.ban_duration === '7d' ? 'selected' : ''}>7 天</option>
        <option value="14d" ${b?.ban_duration === '14d' ? 'selected' : ''}>14 天</option>
        <option value="30d" ${b?.ban_duration === '30d' ? 'selected' : ''}>30 天</option>
        <option value="1y" ${b?.ban_duration === '1y' ? 'selected' : ''}>1 年</option>
        <option value="50y" ${b?.ban_duration === '50y' ? 'selected' : ''}>50 年</option>
        <option value="permanent" ${b?.ban_duration === 'permanent' ? 'selected' : ''}>永久</option>
      </select>
    </div>
    <div class="form-group">
      <label>违规等级</label>
      <select name="violation_level">
        <option value="warning" ${b?.violation_level === 'warning' ? 'selected' : ''}>警告</option>
        <option value="severe_warning" ${b?.violation_level === 'severe_warning' ? 'selected' : ''}>严重警告</option>
        <option value="level3" ${b?.violation_level === 'level3' || !b ? 'selected' : ''}>3级违规</option>
        <option value="level2" ${b?.violation_level === 'level2' ? 'selected' : ''}>2级违规</option>
        <option value="level1" ${b?.violation_level === 'level1' ? 'selected' : ''}>1级违规</option>
        <option value="level4" ${b?.violation_level === 'level4' ? 'selected' : ''}>4级(逃逸)</option>
      </select>
    </div>
    <div class="form-group">
      <label>原因</label>
      <textarea name="reason">${b ? escAttr(b.reason) : ''}</textarea>
    </div>
    <div class="form-group">
      <label>备注</label>
      <textarea name="notes">${b ? escAttr(b.notes) : ''}</textarea>
    </div>
    <button type="submit" class="btn btn-primary">${b ? '保存修改' : '创建封禁'}</button>
    <a href="/admin/bans" class="btn btn-ghost">取消</a>
  </form>
</div>
<script>
document.getElementById('banForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const jwt = localStorage.getItem('jwt');
  const method = ${b ? "'PUT'" : "'POST'"};
  const url = ${b ? `'/api/admin/bans/${b.id}'` : "'/api/admin/bans'"};
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { window.location.href = '/admin/bans'; }
  else { const r = await resp.json(); alert(r.error || '操作失败'); }
});
</script>`
}

function esc(s: string): string { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }
function escAttr(s: string): string { return (s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
