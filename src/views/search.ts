// > Search results page — cross-entity search: bans (left) + admins/players (right)
// ! All cards use .glass-card > .glass-card-inner double-bezel structure
import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { lvBadge as lb, lvLabel as ll } from '../helpers/format'
import { fmtDuration as fd } from '../helpers/format'

type BanResult = {
  id: number; nickname: string; steam_id: string; reason: string;
  ban_duration: string; ban_time: string; violation_level: string;
  status: string; handled_by_name: string | null;
}
type AdminResult = {
  id: number; steam_id: string; username: string; permission_group: string;
  game_name: string; qq_name: string; position: string; supervisor: string;
}
type PlayerResult = {
  id: number; nickname: string; steam_id: string; banCount: number; highestLevel: string;
}

type SearchPageProps = {
  query: string;
  bans: BanResult[]; total: number;
  admins: AdminResult[];
  players: PlayerResult[];
  page: number; totalPages: number; perPage: number;
}

function stLabel(s: string): string {
  const m: Record<string,string> = { banned:'封禁中', unbanned:'已解封', permanent:'永久', muted:'禁言中', warning:'警告', cfba:'CFBA' }
  return m[s] || s
}
function fmtTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function enc(s: string): string { return encodeURIComponent(s) }

function MainContent(props: SearchPageProps) {
  if (!props.query) {
    return html`
    <div style="text-align:center;padding:80px 24px;">
      <div style="font-size:48px;margin-bottom:16px;opacity:0.2;">🔍</div>
      <h2 style="font-size:20px;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:8px;">搜索封禁记录、玩家、管理员</h2>
      <p style="font-size:14px;color:rgba(255,255,255,0.25);">输入关键词搜索</p>
    </div>`
  }

  const hasBans = props.bans.length > 0
  const hasAdmins = props.admins.length > 0
  const hasPlayers = props.players.length > 0
  const hasAny = hasBans || hasAdmins || hasPlayers

  if (!hasAny) {
    return html`
    <div style="text-align:center;padding:80px 24px;">
      <div style="font-size:48px;margin-bottom:16px;opacity:0.2;">🔍</div>
      <h2 style="font-size:20px;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:8px;">未找到匹配的记录</h2>
      <p style="font-size:14px;color:rgba(255,255,255,0.25);">
        没有与 "<strong style="color:var(--label-2);">${escHtml(props.query)}</strong>" 相关的结果
      </p>
    </div>`
  }

  let bansSection
  if (hasBans) {
    bansSection = html`
    <div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
      <thead><tr>
        <th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>状态</th><th>操作员</th><th>时长</th><th>时间</th>
      </tr></thead>
      <tbody>
      ${props.bans.map(r => html`
        <tr>
          <td data-label="昵称"><a href="/player/${r.id}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;">${escHtml(r.nickname)}</a></td>
          <td data-label="Steam ID"><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.steam_id)}</code></td>
          <td data-label="原因" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);">${escHtml(r.reason)}</td>
          <td data-label="等级"><span class="badge ${lb(r.violation_level).replace('cyber-badge-','badge-')}">${ll(r.violation_level)}</span></td>
          <td data-label="状态"><span class="badge badge-${r.status === 'banned' ? 'magenta' : r.status === 'unbanned' ? 'green' : r.status === 'permanent' ? 'red' : 'amber'}">${stLabel(r.status)}</span></td>
          <td data-label="操作员" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${r.handled_by_name || '系统'}</td>
          <td data-label="时长" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fd(r.ban_duration)}</td>
          <td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);font-family:var(--mono);">${fmtTime(r.ban_time)}</td>
        </tr>`)}
      </tbody>
    </table></div></div>
    ${props.totalPages > 1 ? html`
    <div class="glass-pagination" style="margin-top:var(--spacing-md);">
      <span class="info">共 ${props.total} 条，第 ${props.page}/${props.totalPages} 页</span>
      <div class="glass-pages">
        ${props.page > 1 ? html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${props.page-1}&per_page=${props.perPage}'">←</button>` : ''}
        ${Array.from({length:Math.min(props.totalPages,7)},(_,i)=>i+1).map(p => html`
          ${p === props.page ? html`<span class="glass-page-btn current">${p}</span>` : html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${p}&per_page=${props.perPage}'">${p}</button>`}
        `)}
        ${props.page < props.totalPages ? html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${props.page+1}&per_page=${props.perPage}'">→</button>` : ''}
      </div>
    </div>` : ''}`
  } else {
    bansSection = html`
    <div style="text-align:center;padding:40px 24px;color:var(--label-3);font-size:14px;">无匹配封禁记录</div>`
  }

  let adminSection
  if (hasAdmins) {
    adminSection = html`
    <div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:4px;">管理员</div>
    ${props.admins.map(a => html`
    <a href="/admin-profile/${a.id}" style="text-decoration:none;">
      <div class="glass-card">
        <div class="glass-card-inner" style="display:flex;align-items:center;gap:12px;padding:var(--spacing-md);">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#000;font-family:var(--sans);flex-shrink:0;">
            ${(a.game_name || a.username).charAt(0)}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-1);">${escHtml(a.game_name || a.username)}</div>
            <div style="font-size:12px;color:var(--label-3);">${escHtml(a.steam_id)} · ${a.permission_group}</div>
          </div>
        </div>
      </div>
    </a>`)}`
  } else {
    adminSection = html``
  }

  let playerSection
  if (hasPlayers) {
    playerSection = html`
    <div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:4px;margin-top:8px;">玩家</div>
    ${props.players.map(p => html`
    <a href="/player/${p.id}" style="text-decoration:none;">
      <div class="glass-card">
        <div class="glass-card-inner" style="display:flex;align-items:center;gap:12px;padding:var(--spacing-md);">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#000;font-family:var(--sans);flex-shrink:0;">
            ${p.nickname.charAt(0).toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-1);">${escHtml(p.nickname)}</div>
            <div style="font-size:12px;color:var(--label-3);">封禁 ${p.banCount} 次 · 最高 ${p.highestLevel || '—'}</div>
          </div>
        </div>
      </div>
    </a>`)}`
  } else {
    playerSection = html``
  }

  return html`
    <div style="font-size:14px;color:var(--label-3);margin-bottom:16px;">
      搜索 "<strong style="color:var(--cyan);">${escHtml(props.query)}</strong>"
      ${hasBans ? html` — 找到 <strong style="color:var(--cyan);">${props.total}</strong> 条封禁记录` : ''}
      ${hasAdmins ? html` — <strong style="color:var(--magenta);">${props.admins.length}</strong> 位管理员` : ''}
      ${hasPlayers ? html` — <strong style="color:var(--cyan);">${props.players.length}</strong> 位玩家` : ''}
    </div>

    <!-- Left: Bans Table / Right: Admin + Player Cards -->
    <div style="display:grid;grid-template-columns:1fr 320px;gap:var(--spacing-md);" class="search-grid">
      <div>
        ${bansSection}
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--spacing-sm);">
        ${adminSection}
        ${playerSection}
      </div>
    </div>

    <style>
      @media (max-width: 768px) {
        .search-grid { grid-template-columns: 1fr !important; }
        .search-grid > div:first-child { order: 2; }
        .search-grid > div:last-child { order: 1; }
      }
    </style>`
}

export function SearchPage(props: SearchPageProps) {
  return html`
<section style="min-height:100dvh;padding-top:100px;">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;">
    <!-- Search Bar -->
    <form action="/search" method="get" class="hero-search" style="margin-bottom:32px;max-width:100%;">
      <input type="search" name="q" placeholder="搜索玩家昵称 / Steam ID / 管理员名称…" autocomplete="off"
             value="${escAttr(props.query)}" />
      <button type="submit">搜索</button>
    </form>
    ${MainContent(props)}
  </div>
</section>`
}
