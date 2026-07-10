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
  const m: Record<string,string> = { warning:'badge-amber', severe_warning:'badge-amber', level3:'badge-cyan', level2:'badge-magenta', level1:'badge-red', level4:'badge-neutral', mute:'badge-neutral', cfba_ban:'badge-red', '1级':'badge-red', '2级':'badge-magenta', '3级':'badge-cyan' }
  return m[lv] || 'badge-neutral'
}
function levelLabel(lv: string): string {
  const m: Record<string,string> = { warning:'警告', severe_warning:'严重警告', level3:'3级违规', level2:'2级违规', level1:'1级', level4:'4级(逃逸)', mute:'禁言', cfba_ban:'CFBA' }
  return m[lv] || lv
}
function statusBadge(s: string): string {
  const m: Record<string,string> = { banned:'badge-magenta', unbanned:'badge-green', permanent:'badge-red', muted:'badge-amber', warning:'badge-amber', cfba:'badge-red' }
  return m[s] || 'badge-magenta'
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
  <div class="hero-search" style="max-width:100%;">
    <input type="search" name="q" placeholder="搜索昵称 / Steam ID / IP…" autocomplete="off"
           hx-get="/" hx-trigger="keyup changed delay:300ms, search" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap"
           value="${escAttr(props.query)}" />
    <button>搜索</button>
  </div>
</div>

<div style="padding:0 var(--spacing-md) var(--spacing-md);">
  <div class="filter-group">
    <button class="filter-pill ${!props.levelFilter && !props.statusFilter ? 'active' : ''}" data-level="" data-status=""
            hx-get="/?q=${enc(props.query)}" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">全部</button>
    <button class="filter-pill ${props.levelFilter === 'level3' ? 'active' : ''}" data-level="level3" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level3" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">3级</button>
    <button class="filter-pill ${props.levelFilter === 'level2' ? 'active' : ''}" data-level="level2" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level2" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">2级</button>
    <button class="filter-pill ${props.levelFilter === 'level1' ? 'active' : ''}" data-level="level1" data-status=""
            hx-get="/?q=${enc(props.query)}&level=level1" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">1级</button>
    <button class="filter-pill ${props.levelFilter === 'warning' ? 'active' : ''}" data-level="warning" data-status=""
            hx-get="/?q=${enc(props.query)}&level=warning" hx-target="#list-wrap" hx-push-url="true" hx-indicator="#list-wrap">警告</button>
    <button class="filter-pill ${props.statusFilter === 'banned' ? 'active' : ''}" data-level="" data-status="banned"
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
  <div class="glass-table-wrap">
  <div class="glass-table-inner">
  <table class="glass-table">
    <thead><tr>
      <th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>状态</th><th>操作员</th><th>时长</th><th>时间</th>
    </tr></thead>
    <tbody>      ${props.bans.length === 0 ? html`
      <tr><td colspan="8" style="text-align:center;padding:3rem 1rem;color:var(--label-3);font-size:15px;">没有找到匹配的封禁记录</td></tr>`
      : props.bans.map(ban => html`
      <tr>
        <td data-label="昵称"><a href="/player/${ban.id}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(ban.nickname)}</a></td>
        <td data-label="Steam ID"><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);letter-spacing:-.3px;">${escHtml(ban.steam_id)}</code></td>
        <td data-label="原因" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);" title="${escAttr(ban.reason)}">${escHtml(ban.reason)}</td>
        <td data-label="等级"><span class="badge ${levelBadge(ban.violation_level)}">${levelLabel(ban.violation_level)}</span></td>
        <td data-label="状态"><span class="badge ${statusBadge(ban.status)}">${statusLabel(ban.status)}</span></td>
        <td data-label="操作员" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fmtHandlers(ban.handled_by_name, ban.co_handlers)}</td>
        <td data-label="时长" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fmtDuration(ban.ban_duration)}</td>
        <td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);font-family:var(--mono);">${fmtTime(ban.ban_time)}</td>
      </tr>`)}
    </tbody>
  </table>
  </div>
  </div>

  ${props.totalPages > 1 ? html`
  <div class="glass-pagination">
    <span class="info">共 ${props.total} 条，第 ${props.page}/${props.totalPages} 页</span>
    <div class="glass-pages">
    ${props.page > 1 ? html`<button class="glass-page-btn" onclick="location.href='/?page=${props.page-1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}'">←</button>` : ''}
    ${genPages(props.page, props.totalPages).map(p => typeof p === 'number' ? html`
      ${p === props.page ? html`<span class="glass-page-btn current">${p}</span>` : html`<button class="glass-page-btn" onclick="location.href='/?page=${p}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}'">${p}</button>`}`
    : html`<span class="glass-page-btn" style="border-color:transparent;cursor:default;">…</span>`)}
    ${props.page < props.totalPages ? html`<button class="glass-page-btn" onclick="location.href='/?page=${props.page+1}&per_page=${props.perPage}&q=${enc(props.query)}&level=${props.levelFilter}&status=${props.statusFilter}'">→</button>` : ''}
    </div>
  </div>` : ''}
</div>
</div>`
}

// * 首页完整渲染 — 包含 Hero 区、Bento 统计、封禁列表
// * HTMX 局部刷新时只复用 BanTable，不重复渲染 HomePage
type HomePageProps = TableProps & {
  stats?: { total: number; level3: number; level2: number; level1: number; level4: number; warning: number; other: number; banned: number };
}

export function HomePage(props: HomePageProps) {
  const s = props.stats
  const sBanned = s?.banned ?? 0
  const sTotal = s?.total ?? 0
  return html`
<!-- Hero Section -->
<section class="hero-section">
  <div class="hero-content">
    <div class="hero-eyebrow reveal">
      <span class="dot"></span>
      封禁管理系统
    </div>
    <h1 class="reveal-blur" data-delay="200">JDCF<br>封禁管理</h1>
    <p class="reveal" data-delay="400">查询、管理、追踪服务器封禁记录，维护公平的游戏环境</p>
    <form action="/search" method="get" class="hero-search reveal" data-delay="600">
      <input type="search" name="q" placeholder="搜索玩家昵称或 Steam ID…" autocomplete="off" value="${escAttr(props.query)}">
      <button type="submit">搜索</button>
    </form>
  </div>
  <div class="scroll-indicator">
    <span class="mouse"></span>
    <span>向下滚动</span>
  </div>
</section>

${s ? html`
<!-- Divider -->
<div class="section-divider reveal"><span>✦</span></div>

<!-- Bento Stats -->
<div class="bento-stats stagger-children reveal">
  <div class="bento-card">
    <div class="bento-card-inner" style="display:flex;align-items:center;gap:20px;">
      <div>
        <div class="bento-label">总计封禁</div>
        <div class="bento-number">${sTotal}</div>
        <div class="bento-detail">含 ${s.level1} 条 1 级</div>
      </div>
      <div style="margin-left:auto;width:64px;height:64px;border-radius:16px;background:rgba(0,255,255,0.04);border:1px solid rgba(0,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:28px;opacity:0.5;">⚡</div>
    </div>
  </div>
  <div class="bento-card">
    <div class="bento-card-inner">
      <div class="bento-label">生效中</div>
      <div class="bento-number" style="background:linear-gradient(135deg,#00ff88,#00cc66);-webkit-background-clip:text;background-clip:text;">${sBanned}</div>
      <div class="bento-detail" style="color:rgba(0,255,128,0.5);">${sTotal > 0 ? '● ' + Math.round(sBanned/sTotal*100) + '% 占比' : ''}</div>
    </div>
  </div>
  <div class="bento-card">
    <div class="bento-card-inner">
      <div class="bento-label">3 级违规</div>
      <div class="bento-number">${s.level3}</div>
      <div class="bento-detail">Level 3</div>
    </div>
  </div>
  <div class="bento-card">
    <div class="bento-card-inner">
      <div class="bento-label">2 级违规</div>
      <div class="bento-number" style="background:linear-gradient(135deg,#ff00aa,#cc0088);-webkit-background-clip:text;background-clip:text;">${s.level2}</div>
      <div class="bento-detail">Level 2</div>
    </div>
  </div>
</div>` : ''}

<!-- Section Header -->
<div class="section-header reveal" style="margin-top:0;">
  <h2>封禁记录</h2>
  <p>查看所有封禁记录</p>
</div>

${BanTable(props)}

<!-- Counter Animation Script -->
<script>
(function() {
  var statNumbers = document.querySelectorAll('.bento-number');
  var counterObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var target = parseInt(el.textContent.replace(/[,.]/g, '')) || 0;
        if (target > 0) {
          var start = performance.now();
          var duration = 1200;
          function update(now) {
            var progress = Math.min((now - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
          }
          requestAnimationFrame(update);
        }
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(function(el) { counterObserver.observe(el); });
})();
</script>
`
}
