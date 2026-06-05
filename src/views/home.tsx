import { html } from 'hono/html'

type HomePageProps = {
  bans: Array<{
    id: number;
    nickname: string;
    steam_id: string;
    ip_address: string;
    reason: string;
    ban_time: string;
    ban_duration: string;
    violation_level: string;
    status: string;
    notes: string;
    handled_by_name: string | null;
  }>;
  page: number;
  totalPages: number;
  total: number;
  query: string;
  levelFilter: string;
  statusFilter: string;
}

function levelBadge(level: string): string {
  const map: Record<string, string> = {
    warning: 'badge-warning',
    severe_warning: 'badge-warning',
    level3: 'badge-level3',
    level2: 'badge-level2',
    level1: 'badge-level1',
    level4: 'badge-level4',
  }
  return map[level] || 'badge-warning'
}

function levelLabel(level: string): string {
  const map: Record<string, string> = {
    warning: '警告',
    severe_warning: '严重警告',
    level3: '3级违规',
    level2: '2级违规',
    level1: '1级违规',
    level4: '4级(逃逸)',
  }
  return map[level] || level
}

function statusBadge(status: string): string {
  const map: Record<string, string> = {
    banned: 'badge-ban',
    unbanned: 'badge-ok',
    permanent: 'badge-perm',
    muted: 'badge-muted',
  }
  return map[status] || 'badge-ban'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    banned: '封禁中',
    unbanned: '已解封',
    permanent: '永久封禁',
    muted: '禁言中',
  }
  return map[status] || status
}

export function HomePage(props: HomePageProps) {
  return html`
<div class="card">
  <div class="search-box">
    <input type="text" name="q" placeholder="搜索昵称 / Steam ID / IP..."
           hx-get="/" hx-trigger="keyup changed delay:300ms" hx-target=".table-wrap" hx-push-url="true"
           value="${props.query}" />
    <select name="level" hx-get="/" hx-trigger="change" hx-target=".table-wrap" hx-push-url="true">
      <option value="">全部等级</option>
      <option value="warning" ${props.levelFilter === 'warning' ? 'selected' : ''}>警告</option>
      <option value="severe_warning" ${props.levelFilter === 'severe_warning' ? 'selected' : ''}>严重警告</option>
      <option value="level3" ${props.levelFilter === 'level3' ? 'selected' : ''}>3级违规</option>
      <option value="level2" ${props.levelFilter === 'level2' ? 'selected' : ''}>2级违规</option>
      <option value="level1" ${props.levelFilter === 'level1' ? 'selected' : ''}>1级违规</option>
      <option value="level4" ${props.levelFilter === 'level4' ? 'selected' : ''}>4级(逃逸)</option>
    </select>
    <select name="status" hx-get="/" hx-trigger="change" hx-target=".table-wrap" hx-push-url="true">
      <option value="">全部状态</option>
      <option value="banned" ${props.statusFilter === 'banned' ? 'selected' : ''}>封禁中</option>
      <option value="unbanned" ${props.statusFilter === 'unbanned' ? 'selected' : ''}>已解封</option>
      <option value="permanent" ${props.statusFilter === 'permanent' ? 'selected' : ''}>永久封禁</option>
    </select>
  </div>

  <div class="table-wrap">
    <p style="color:#8888a0;font-size:0.8rem;margin-bottom:0.5rem;">共 ${props.total} 条记录</p>
    <table>
      <thead>
        <tr>
          <th>昵称</th>
          <th>Steam ID</th>
          <th>原因</th>
          <th>封禁时间</th>
          <th>违规等级</th>
          <th>状态</th>
          <th>处理管理</th>
        </tr>
      </thead>
      <tbody>
        ${props.bans.length === 0
          ? html`<tr><td colspan="7" style="text-align:center;color:#8888a0;padding:2rem;">暂无数据</td></tr>`
          : props.bans.map(ban => html`
        <tr>
          <td><strong>${escHtml(ban.nickname)}</strong></td>
          <td style="font-family:monospace;font-size:0.82rem;">${escHtml(ban.steam_id)}</td>
          <td>${escHtml(ban.reason)}</td>
          <td style="font-size:0.82rem;">${formatTime(ban.ban_time)}</td>
          <td><span class="badge ${levelBadge(ban.violation_level)}">${levelLabel(ban.violation_level)}</span></td>
          <td><span class="badge ${statusBadge(ban.status)}">${statusLabel(ban.status)}</span></td>
          <td>${ban.handled_by_name ? escHtml(ban.handled_by_name) : '—'}</td>
        </tr>`)}
      </tbody>
    </table>

    ${props.totalPages > 1 ? html`
    <div class="pagination" hx-boost="true">
      ${props.page > 1 ? html`<a href="/?page=${props.page - 1}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">上一页</a>` : ''}
      ${Array.from({length: props.totalPages}, (_, i) => i + 1).map(p =>
        p === props.page
          ? html`<span class="current">${p}</span>`
          : html`<a href="/?page=${p}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">${p}</a>`
      )}
      ${props.page < props.totalPages ? html`<a href="/?page=${props.page + 1}&q=${encodeURIComponent(props.query)}&level=${props.levelFilter}">下一页</a>` : ''}
    </div>` : ''}
  </div>
</div>`
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function formatTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
