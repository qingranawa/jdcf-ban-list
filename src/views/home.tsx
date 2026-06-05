import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'

type Ban = {
  id: number; nickname: string; steam_id: string; ip_address: string;
  reason: string; ban_time: string; ban_duration: string;
  violation_level: string; status: string; notes: string;
  handled_by_name: string | null;
}

type TableProps = {
  bans: Ban[]; page: number; totalPages: number; total: number;
  query: string; levelFilter: string; statusFilter: string;
}

function levelBadge(lv: string): string {
  const m: Record<string,string> = { warning:'badge-warning', severe_warning:'badge-warning', level3:'badge-level3', level2:'badge-level2', level1:'badge-level1', level4:'badge-level4', mute:'badge-muted', cfba_ban:'badge-perm' }
  return m[lv] || 'badge-warning'
}
function levelLabel(lv: string): string {
  const m: Record<string,string> = { warning:'警告', severe_warning:'严重警告', level3:'3级违规', level2:'2级违规', level1:'1级违规', level4:'4级(逃逸)', mute:'禁言', cfba_ban:'CFBA封禁' }
  return m[lv] || lv
}
function statusBadge(s: string): string {
  const m: Record<string,string> = { banned:'badge-ban', unbanned:'badge-ok', permanent:'badge-perm', muted:'badge-muted', warning:'badge-warning', cfba:'badge-perm' }
  return m[s] || 'badge-ban'
}
function statusLabel(s: string): string {
  const m: Record<string,string> = { banned:'封禁中', unbanned:'已解封', permanent:'永久封禁', muted:'禁言中', warning:'警告生效', cfba:'CFBA封禁' }
  return m[s] || s
}

// ── 纯表格 + 分页（htmx HX-Request 局部刷新用） ──
export function BanTable(props: TableProps) {
  return html`
<div class="card ban-table-wrap">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
    <span style="font-size:var(--fs-sm);color:var(--text-secondary);">共 <strong style="color:var(--text);">${props.total}</strong> 条记录</span>
  </div>
  <div style="overflow-x:auto;">
  <table>
    <thead><tr>
      <th>昵称</th><th>Steam ID</th><th>原因</th><th>封禁时间</th>
      <th>时长</th><th>违规等级</th><th>状态</th><th>备注</th><th>处理管理</th>
    </tr></thead>
    <tbody>${props.bans.length === 0 ? html`
      <tr><td colspan="9" style="text-align:center;padding:3rem 1rem;color:var(--text-tertiary);">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🔍</div>
        <div style="font-size:var(--fs-sm);">没有找到匹配的封禁记录</div>
      </td></tr>`
      : props.bans.map(ban => html`
      <tr>
        <td><strong>${escHtml(ban.nickname)}</strong></td>
        <td><code style="font-family:var(--mono);font-size:var(--fs-xs);color:var(--text-secondary);">${escHtml(ban.steam_id)}</code></td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escAttr(ban.reason)}">${escHtml(ban.reason)}</td>
        <td style="white-space:nowrap;font-size:var(--fs-sm);color:var(--text-secondary);">${fmtTime(ban.ban_time)}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${escHtml(ban.ban_duration)}</td>
        <td><span class="badge ${levelBadge(ban.violation_level)}">${levelLabel(ban.violation_level)}</span></td>
        <td><span class="badge ${statusBadge(ban.status)}">${statusLabel(ban.status)}</span></td>
        <td style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:var(--fs-sm);color:var(--text-tertiary);" title="${escAttr(ban.notes)}">${ban.notes ? escHtml(ban.notes) : '—'}</td>
        <td style="font-size:var(--fs-sm);color:var(--text-secondary);">${ban.handled_by_name ? escHtml(ban.handled_by_name) : '—'}</td>
      </tr>`)}
    </tbody>
  </table>
  </div>
  ${props.totalPages > 1 ? html`
  <div class="pagination">
    ${props.page > 1 ? html`<a href="?page=${props.page-1}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${props.page-1}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target=".ban-table-wrap" hx-push-url="true">← 上一页</a>` : ''}
    ${genPages(props.page, props.totalPages).map(p =>
      p === props.page ? html`<span class="current">${p}</span>`
      : html`<a href="?page=${p}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${p}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target=".ban-table-wrap" hx-push-url="true">${p}</a>`
    )}
    ${props.page < props.totalPages ? html`<a href="?page=${props.page+1}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${props.page+1}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target=".ban-table-wrap" hx-push-url="true">下一页 →</a>` : ''}
  </div>` : ''}
</div>`
}

// ── 完整首页（首次加载） ──
type HomePageProps = TableProps & {
  stats?: { total: number; level3: number; level2: number; level1: number; banned: number };
}

export function HomePage(props: HomePageProps) {
  const s = props.stats
  return html`
${s ? html`
<div class="stat-grid">
  <div class="card stat-card">
    <div class="value" style="color:var(--text);">${s.total}</div>
    <div class="label">总封禁记录</div>
  </div>
  <div class="card stat-card">
    <div class="value" style="color:var(--orange);">${s.level3}</div>
    <div class="label">3级违规</div>
  </div>
  <div class="card stat-card">
    <div class="value" style="color:var(--red);">${s.level2}</div>
    <div class="label">2级违规</div>
  </div>
  <div class="card stat-card">
    <div class="value" style="color:var(--pink);">${s.level1}</div>
    <div class="label">1级违规</div>
  </div>
</div>` : ''}

<div class="search-box">
  <input type="text" name="q" placeholder="搜索昵称 / Steam ID / IP…"
         hx-get="/" hx-trigger="keyup changed delay:300ms" hx-target=".ban-table-wrap" hx-push-url="true"
         value="${escAttr(props.query)}" />
  <select name="level" hx-get="/" hx-trigger="change" hx-target=".ban-table-wrap" hx-push-url="true">
    <option value="">全部等级</option>
    <option value="warning" ${props.levelFilter==='warning'?'selected':''}>警告</option>
    <option value="severe_warning" ${props.levelFilter==='severe_warning'?'selected':''}>严重警告</option>
    <option value="level3" ${props.levelFilter==='level3'?'selected':''}>3级违规</option>
    <option value="level2" ${props.levelFilter==='level2'?'selected':''}>2级违规</option>
    <option value="level1" ${props.levelFilter==='level1'?'selected':''}>1级违规</option>
    <option value="level4" ${props.levelFilter==='level4'?'selected':''}>4级(逃逸)</option>
  </select>
  <select name="status" hx-get="/" hx-trigger="change" hx-target=".ban-table-wrap" hx-push-url="true">
    <option value="">全部状态</option>
    <option value="banned" ${props.statusFilter==='banned'?'selected':''}>封禁中</option>
    <option value="unbanned" ${props.statusFilter==='unbanned'?'selected':''}>已解封</option>
    <option value="permanent" ${props.statusFilter==='permanent'?'selected':''}>永久封禁</option>
    <option value="muted" ${props.statusFilter==='muted'?'selected':''}>禁言中</option>
  </select>
</div>

${BanTable(props)}

<!-- 快捷添加按钮（仅登录后可见） -->
<button id="quickBanBtn" style="display:none;position:fixed;bottom:2rem;right:2rem;width:56px;height:56px;border-radius:50%;border:none;background:var(--accent);color:#fff;font-size:1.5rem;cursor:pointer;box-shadow:0 4px 20px rgba(91,141,239,0.4);z-index:100;" onclick="showQuickBan()">＋</button>

<!-- 快捷添加弹窗 -->
<div id="quickBanModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:200;align-items:center;justify-content:center;">
<div class="card" style="max-width:480px;width:90%;padding:1.5rem;">
  <h3 style="margin-bottom:1rem;font-weight:500;">快速添加封禁</h3>
  <form id="quickBanForm">
    <div class="form-group"><label>昵称 *</label><input type="text" name="nickname" required /></div>
    <div class="form-group"><label>Steam ID *</label><input type="text" name="steam_id" required placeholder="76561199..." /></div>
    <div class="form-group"><label>原因</label><input type="text" name="reason" /></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
      <div class="form-group">
        <label>时长</label>
        <select name="ban_duration">
          <option value="30m">30分钟</option><option value="1h">1小时</option><option value="3h">3小时</option>
          <option value="1d">1天</option><option value="3d">3天</option><option value="7d">7天</option>
          <option value="14d">14天</option><option value="30d">30天</option><option value="1y">1年</option>
          <option value="50y">50年</option><option value="permanent">永久</option>
        </select>
      </div>
      <div class="form-group">
        <label>等级</label>
        <select name="violation_level">
          <option value="warning">警告</option><option value="level3" selected>3级违规</option>
          <option value="level2">2级违规</option><option value="level1">1级违规</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:0.5rem;margin-top:0.5rem;">
      <button type="submit" class="btn btn-primary">添加</button>
      <button type="button" class="btn btn-ghost" onclick="hideQuickBan()">取消</button>
    </div>
    <p id="quickBanMsg" style="margin-top:0.5rem;font-size:var(--fs-sm);color:var(--green);display:none;"></p>
  </form>
</div></div>

<script>
(function() {
  var jwt = localStorage.getItem('jwt');
  if (jwt) document.getElementById('quickBanBtn').style.display = '';
})();
function showQuickBan() { document.getElementById('quickBanModal').style.display = 'flex'; }
function hideQuickBan() { document.getElementById('quickBanModal').style.display = 'none'; }
document.addEventListener('DOMContentLoaded', function() {
  var f = document.getElementById('quickBanForm');
  if (!f) return;
  f.addEventListener('submit', function(e) {
    e.preventDefault();
    var d = Object.fromEntries(new FormData(f));
    var jwt = localStorage.getItem('jwt');
    var msg = document.getElementById('quickBanMsg');
    fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(d),
    }).then(function(r) { return r.json(); }).then(function(j) {
      if (j.success) {
        msg.textContent = '✅ 添加成功，页面即将刷新';
        msg.style.display = '';
        msg.style.color = 'var(--green)';
        setTimeout(function() { location.reload(); }, 1000);
      } else {
        msg.textContent = j.error || '添加失败';
        msg.style.display = '';
        msg.style.color = 'var(--red)';
      }
    }).catch(function() {
      msg.textContent = '网络错误';
      msg.style.display = '';
      msg.style.color = 'var(--red)';
    });
  });
});
</script>`
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

function enc(s: string): string { return encodeURIComponent(s) }
function fmtTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
