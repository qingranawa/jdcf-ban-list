import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { icon } from './icons'

type Ban = {
  id: number; nickname: string; steam_id: string; ip_address: string;
  reason: string; ban_time: string; ban_duration: string;
  violation_level: string; status: string; notes: string;
  handled_by_name: string | null; co_handlers: string;
}

type TableProps = {
  bans: Ban[]; page: number; totalPages: number; total: number; perPage: number;
  query: string; levelFilter: string; statusFilter: string;
}

function levelBadge(lv: string): string {
  const m: Record<string,string> = { warning:'cyber-badge-amber', severe_warning:'cyber-badge-amber', level3:'cyber-badge-cyan', level2:'cyber-badge-magenta', level1:'cyber-badge-red', level4:'cyber-badge-neutral', mute:'cyber-badge-neutral', cfba_ban:'cyber-badge-red', '1级':'cyber-badge-red', '2级':'cyber-badge-magenta', '3级':'cyber-badge-cyan' }
  return m[lv] || 'cyber-badge-neutral'
}
function levelLabel(lv: string): string {
  const m: Record<string,string> = { warning:'警告', severe_warning:'严重警告', level3:'3级违规', level2:'2级违规', level1:'1级', level4:'4级(逃逸)', mute:'禁言', cfba_ban:'CFBA' }
  return m[lv] || lv
}
function statusBadge(s: string): string {
  const m: Record<string,string> = { banned:'cyber-badge-magenta', unbanned:'cyber-badge-green', permanent:'cyber-badge-red', muted:'cyber-badge-amber', warning:'cyber-badge-amber', cfba:'cyber-badge-red' }
  return m[s] || 'cyber-badge-magenta'
}
function fmtDuration(d: string): string {
  if (!d) return '—'
  const m: Record<string,string> = { m:'分钟', h:'小时', d:'天', y:'年', permanent:'永久', warning:'警告', cfba:'CFBA', mute:'禁言' }
  const parts = d.match(/^([a-z]+)-(\d+)([mhdy])$/)
  if (d.startsWith('mute-')) return '禁言' + d.replace('mute-', '')
  if (m[d]) return m[d]
  if (parts) return parts[2] + m[parts[3]] || ''
  return d
}
function statusLabel(s: string): string {
  const m: Record<string,string> = { banned:'封禁中', unbanned:'已解封', permanent:'永久', muted:'禁言中', warning:'警告', cfba:'CFBA' }
  return m[s] || s
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
function fmtHandlers(name: string | null, co: string | null): string {
  const parts: string[] = []
  if (name) parts.push(name)
  if (co) co.split(',').map(s => s.trim()).filter(Boolean).forEach(s => parts.push(s))
  return parts.length ? parts.join(', ') : (name === null ? '系统' : '—')
}
function fmtTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

// ── Search + filter + table (htmx partial) ──
export function BanTable(props: TableProps) {
  return html`
<div id="list-wrap">
<div style="padding:0 var(--spacing-md) var(--spacing-md);">
  <div class="cyber-search">
    <span class="search-icon">${icon('magnifyingglass', 18)}</span>
    <input type="search" name="q" placeholder="搜索昵称 / Steam ID / IP…" autocomplete="off"
           hx-get="/" hx-trigger="keyup changed delay:300ms, search" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap"
           value="${escAttr(props.query)}" />
  </div>
</div>

<div style="padding:0 var(--spacing-md) var(--spacing-md);">
  <div class="cyber-segmented">
    <button class="${!props.levelFilter && !props.statusFilter ? 'active' : ''}" data-level="" data-status=""
            hx-get="/?q=${enc(props.query)}" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">全部</button>
    <button class="${props.levelFilter === 'level3' ? 'active' : ''}" data-level="level3" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level3" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">3级</button>
    <button class="${props.levelFilter === 'level2' ? 'active' : ''}" data-level="level2" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level2" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">2级</button>
    <button class="${props.levelFilter === 'level1' ? 'active' : ''}" data-level="level1" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level1" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">1级</button>
    <button class="${props.levelFilter === 'warning' ? 'active' : ''}" data-level="warning" data-status=""
            hx-get="/?q=${enc(props.query)}&level=warning" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">警告</button>
    <button class="${props.statusFilter === 'banned' ? 'active' : ''}" data-level="" data-status="banned"
            hx-get="/?q=${enc(props.query)}&status=banned" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">封禁中</button>
  </div>
</div>

<div class="table-wrap" style="padding:0 var(--spacing-md) var(--spacing-md);">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 2px var(--spacing-sm);">
    <span style="font-size:13px;color:var(--label-2);font-family:var(--sans);">共 <strong style="color:var(--cyan);">${props.total}</strong> 条记录</span>
    <select onchange="window.location.href='/?per_page='+this.value+'&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" style="background:rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid var(--glass-border);border-radius:var(--radius-sm);padding:4px 8px;font-size:13px;color:var(--label-2);font-family:var(--sans);cursor:pointer;">
      <option value="10" ${props.perPage===10?'selected':''}>10条/页</option>
      <option value="25" ${props.perPage===25?'selected':''}>25条/页</option>
      <option value="50" ${props.perPage===50?'selected':''}>50条/页</option>
      <option value="100" ${props.perPage===100?'selected':''}>100条/页</option>
    </select>
  </div>
  <div class="cyber-table-wrap">
  <table class="cyber-table">
    <thead><tr>
      <th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>状态</th><th>操作员</th><th>时长</th><th>时间</th>
    </tr></thead>
    <tbody>      ${props.bans.length === 0 ? html`
      <tr><td colspan="8" style="text-align:center;padding:3rem 1rem;color:var(--label-3);font-size:15px;">没有找到匹配的封禁记录</td></tr>`
      : props.bans.map(ban => html`
      <tr>
        <td><a href="/player/${encodeURIComponent(ban.steam_id)}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(ban.nickname)}</a></td>
        <td><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(ban.steam_id)}</code></td>
        <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);" title="${escAttr(ban.reason)}">${escHtml(ban.reason)}</td>
        <td><span class="cyber-badge ${levelBadge(ban.violation_level)}">${levelLabel(ban.violation_level)}</span></td>
        <td><span class="cyber-badge ${statusBadge(ban.status)}">${statusLabel(ban.status)}</span></td>
        <td style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fmtHandlers(ban.handled_by_name, ban.co_handlers)}</td>
        <td style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fmtDuration(ban.ban_duration)}</td>
        <td style="white-space:nowrap;font-size:13px;color:var(--label-3);font-family:var(--mono);">${fmtTime(ban.ban_time)}</td>
      </tr>`)}
    </tbody>
  </table>
  </div>

  ${props.totalPages > 1 ? html`
  <div class="cyber-pagination">
    ${props.page > 1 ? html`<a href="?page=${props.page-1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${props.page-1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target="#list-wrap" hx-push-url="true">←</a>` : ''}
    ${genPages(props.page, props.totalPages).map(p => typeof p === 'number' ? html`
      ${p === props.page ? html`<span class="current" aria-current="page">${p}</span>` : html`<a href="?page=${p}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${p}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target="#list-wrap" hx-push-url="true">${p}</a>`}`
    : html`<span>…</span>`)}
    ${props.page < props.totalPages ? html`<a href="?page=${props.page+1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-get="/?page=${props.page+1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}" hx-target="#list-wrap" hx-push-url="true">→</a>` : ''}
  </div>` : ''}
</div>
</div>`
}

// * 首页完整渲染 — 包含统计卡片（仅首次加载时渲染）
// * HTMX 局部刷新时只复用 BanTable，不重复渲染 HomePage
type HomePageProps = TableProps & {
  stats?: { total: number; level3: number; level2: number; level1: number; level4: number; warning: number; other: number; banned: number };
}

export function HomePage(props: HomePageProps) {
  const s = props.stats
  return html`
<div class="cyber-page hero-diagonal" style="max-width:900px;margin:0 auto;">

  <div style="padding:var(--spacing-xl) var(--spacing-md) var(--spacing-lg);position:relative;">
    <h1 class="cyber-title" style="font-size:38px;">封禁查询</h1>
    <p style="font-size:15px;color:var(--label-2);margin-top:var(--spacing-xs);">CN 鸡蛋肠粉服务器 · 违规封禁记录公示</p>
  </div>

  ${s ? html`
  <div class="cyber-stats" style="padding:0 var(--spacing-md) var(--spacing-lg);">
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-cyan">${s.total}</div>
      <div class="cyber-stat-label">总封禁</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-amber">${s.level3}</div>
      <div class="cyber-stat-label">3级违规</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-magenta">${s.level2}</div>
      <div class="cyber-stat-label">2级违规</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value stat-red">${s.level1}</div>
      <div class="cyber-stat-label">1级违规</div>
    </div>
    <div class="cyber-stat-card">
      <div class="cyber-stat-value" style="background:linear-gradient(135deg,var(--amber),#886600);-webkit-background-clip:text;background-clip:text;">${s.warning||0}</div>
      <div class="cyber-stat-label">警告/其他</div>
    </div>
  </div>` : ''}

  ${BanTable(props)}
</div>

`
}
