import { html } from 'hono/html'

// ── 封禁管理列表页 ──
export function AdminBanListPage(props: { bans: any[]; page: number; totalPages: number; total: number }) {
  return html`
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">
  <div>
    <h1 style="font-size:var(--fs-xl);font-weight:600;letter-spacing:-0.02em;">封禁管理</h1>
    <p style="font-size:var(--fs-sm);color:var(--text-tertiary);margin-top:0.2rem;">共 ${props.total} 条记录</p>
  </div>
  <a href="/admin/bans/new" class="btn btn-primary">＋ 新增封禁</a>
</div>

<div class="card" style="padding:0;overflow:hidden;">
  <div style="overflow-x:auto;">
  <table>
    <thead><tr>
      <th style="padding-left:1rem;">ID</th>
      <th>昵称</th>
      <th>Steam ID</th>
      <th>原因</th>
      <th>等级</th>
      <th>时长</th>
      <th style="padding-right:1rem;text-align:right;">操作</th>
    </tr></thead>
    <tbody>
      ${props.bans.length === 0 ? html`
      <tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text-tertiary);font-size:var(--fs-sm);">暂无封禁记录</td></tr>`
      : props.bans.map(b => html`
      <tr>
        <td style="padding-left:1rem;color:var(--text-tertiary);">${b.id}</td>
        <td><strong>${esc(b.nickname)}</strong></td>
        <td><code style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-secondary);">${esc(b.steam_id)}</code></td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(b.reason)}">${esc(b.reason)}</td>
        <td><span class="badge ${b.violation_level === 'level3' ? 'badge-level3' : b.violation_level === 'level2' ? 'badge-level2' : 'badge-level1'}">${b.violation_level.replace('level','Lv.')}</span></td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${b.ban_duration}</td>
        <td style="padding-right:1rem;text-align:right;white-space:nowrap;">
          <a href="/admin/bans/${b.id}/edit" class="btn btn-ghost" style="padding:0.25rem 0.6rem;font-size:var(--fs-xs);">编辑</a>
          <button class="btn btn-danger" style="padding:0.25rem 0.6rem;font-size:var(--fs-xs);"
                  hx-delete="/api/admin/bans/${b.id}" hx-confirm="确认删除 #${b.id} 这条封禁记录？" hx-target="closest tr" hx-swap="delete">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  </div>
  ${props.totalPages > 1 ? html`
  <div style="padding:0.8rem 1rem;border-top:1px solid var(--glass-border);">
    <div class="pagination" style="margin:0;">
      ${props.page > 1 ? html`<a href="/admin/bans?page=${props.page-1}">←</a>` : ''}
      ${Array.from({length:props.totalPages},(_,i)=>i+1).map(p =>
        p === props.page ? html`<span class="current">${p}</span>` : html`<a href="/admin/bans?page=${p}">${p}</a>`)}
      ${props.page < props.totalPages ? html`<a href="/admin/bans?page=${props.page+1}">→</a>` : ''}
    </div>
  </div>` : ''}
</div>`
}

// ── 封禁表单页（新增/编辑） ──
export function AdminBanFormPage(props: { ban: any }) {
  const b = props.ban
  return html`
<div style="max-width:640px;">
  <div style="margin-bottom:1.5rem;">
    <a href="/admin/bans" style="color:var(--text-secondary);font-size:var(--fs-sm);text-decoration:none;">← 返回封禁管理</a>
    <h1 style="font-size:var(--fs-xl);font-weight:600;letter-spacing:-0.02em;margin-top:0.5rem;">${b ? '编辑封禁' : '新增封禁'}</h1>
  </div>

  <div class="card">
    <form id="banForm">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 1rem;">
        <div class="form-group">
          <label>昵称 *</label>
          <input type="text" name="nickname" value="${b ? escAttr(b.nickname) : ''}" required placeholder="玩家昵称" />
        </div>
        <div class="form-group">
          <label>Steam ID *</label>
          <input type="text" name="steam_id" value="${b ? escAttr(b.steam_id) : ''}" required placeholder="76561199…" />
        </div>
        <div class="form-group">
          <label>IP 地址</label>
          <input type="text" name="ip_address" value="${b ? escAttr(b.ip_address) : ''}" placeholder="可选" />
        </div>
        <div class="form-group">
          <label>封禁时长</label>
          <select name="ban_duration">
            <option value="30m" ${b?.ban_duration==='30m'?'selected':''}>30 分钟</option>
            <option value="1h" ${b?.ban_duration==='1h'?'selected':''}>1 小时</option>
            <option value="3h" ${b?.ban_duration==='3h'?'selected':''}>3 小时</option>
            <option value="1d" ${b?.ban_duration==='1d'?'selected':''}>1 天</option>
            <option value="3d" ${b?.ban_duration==='3d'?'selected':''}>3 天</option>
            <option value="7d" ${b?.ban_duration==='7d'?'selected':''}>7 天</option>
            <option value="14d" ${b?.ban_duration==='14d'?'selected':''}>14 天</option>
            <option value="30d" ${b?.ban_duration==='30d'?'selected':''}>30 天</option>
            <option value="1y" ${b?.ban_duration==='1y'?'selected':''}>1 年</option>
            <option value="50y" ${b?.ban_duration==='50y'?'selected':''}>50 年</option>
            <option value="permanent" ${b?.ban_duration==='permanent'?'selected':''}>永久</option>
          </select>
        </div>
        <div class="form-group">
          <label>违规等级</label>
          <select name="violation_level">
            <option value="warning" ${b?.violation_level==='warning'?'selected':''}>警告</option>
            <option value="severe_warning" ${b?.violation_level==='severe_warning'?'selected':''}>严重警告</option>
            <option value="level3" ${b?.violation_level==='level3'||!b?'selected':''}>3级违规</option>
            <option value="level2" ${b?.violation_level==='level2'?'selected':''}>2级违规</option>
            <option value="level1" ${b?.violation_level==='level1'?'selected':''}>1级违规</option>
            <option value="level4" ${b?.violation_level==='level4'?'selected':''}>4级(逃逸)</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:span 2;">
          <label>原因</label>
          <textarea name="reason" placeholder="封禁原因">${b ? escAttr(b.reason) : ''}</textarea>
        </div>
        <div class="form-group" style="grid-column:span 2;">
          <label>备注</label>
          <textarea name="notes" placeholder="备注信息（可选）">${b ? escAttr(b.notes) : ''}</textarea>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
        <button type="submit" class="btn btn-primary">${b ? '保存修改' : '创建封禁'}</button>
        <a href="/admin/bans" class="btn btn-ghost">取消</a>
      </div>
    </form>
  </div>
</div>
<script>
document.getElementById('banForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
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
