// > Search results page — cross-entity search with tabbed layout
// ! All cards use .glass-card > .glass-card-inner double-bezel structure
import { html, raw } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'
import { lvBadge as lb, lvLabel as ll } from '../helpers/format'
import { fmtDuration as fd, fmtDate } from '../helpers/format'
import { announcementTypeLabel, typeBadge } from '../helpers/format'
import { icon } from './icons'

type BanResult = {
  id: number; nickname: string; steam_id: string; reason: string;
  ban_duration: string; ban_time: string; violation_level: string;
  status: string; handled_by: number | null; handled_by_name: string | null;
}
type AdminResult = {
  id: number; steam_id: string; username: string; permission_group: string;
  game_name: string; qq_name: string; position: string; supervisor: string;
}
type PlayerResult = {
  id: number; nickname: string; steam_id: string; banCount: number; highestLevel: string;
}
type AnnouncementResult = {
  id: number; title: string; subtitle: string | null; type: string;
  is_pinned: number; created_at: string; created_by_name: string | null;
}

type SearchPageProps = {
  query: string;
  bans: BanResult[]; total: number;
  admins: AdminResult[];
  players: PlayerResult[];
  announcements: AnnouncementResult[];
  page: number; totalPages: number; perPage: number;
  activeTab: 'bans' | 'entities' | 'announcements';
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

function tabButton(active: boolean, label: string, tabName: 'bans' | 'entities' | 'announcements', query: string): string {
  return `<button class="search-tab ${active ? 'active' : ''}" data-tab="${tabName}" onclick="switchTab('${tabName}')">${label}</button>`
}

function renderBansTab(props: SearchPageProps): string {
  if (props.bans.length === 0) {
    return `<div style="text-align:center;padding:40px 24px;color:var(--label-3);font-size:14px;">无匹配封禁记录</div>`
  }
  let html = `
  <div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
    <thead><tr>
      <th>昵称</th><th>Steam ID</th><th>原因</th><th>等级</th><th>状态</th><th>操作员</th><th>时长</th><th>时间</th>
    </tr></thead><tbody>`
  for (const r of props.bans) {
    const statusClass = r.status === 'banned' ? 'badge-magenta' : r.status === 'unbanned' ? 'badge-green' : r.status === 'permanent' ? 'badge-red' : 'badge-amber'
    const isDiscipline = r.violation_level === 'admin_discipline'
    html += `
    <tr>
      <td data-label="昵称">${isDiscipline && r.handled_by
        ? `<a href="/player/${r.steam_id}" style="color:var(--cyan);text-decoration:none;font-family:var(--sans);font-weight:600;">${escHtml(r.nickname)}</a>`
        : r.steam_id && r.steam_id.length >= 6 && r.steam_id !== 'N/A' && r.steam_id !== 'unknown' && r.steam_id !== '0'
        ? `<a href="/player/${r.steam_id}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;">${escHtml(r.nickname)}</a>`
        : `<span style="color:var(--label-1);font-family:var(--sans);font-weight:600;">${escHtml(r.nickname)}</span>`}</td>
      <td data-label="Steam ID"><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.steam_id)}</code></td>
      <td data-label="原因" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);">${escHtml(r.reason)}</td>
      <td data-label="等级"><span class="badge ${lb(r.violation_level).replace('cyber-badge-','badge-')}">${ll(r.violation_level)}</span></td>
      <td data-label="状态">${isDiscipline ? '<span style="color:var(--label-3);font-size:13px;">—</span>' : '<span class="badge ' + statusClass + '">' + stLabel(r.status) + '</span>'}</td>
      <td data-label="操作员" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${r.handled_by_name || '系统'}</td>
      <td data-label="时长" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fd(r.ban_duration)}</td>
      <td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);font-family:var(--mono);">${fmtTime(r.ban_time)}</td>
    </tr>`
  }
  html += `</tbody></table></div></div>`
  if (props.totalPages > 1) {
    html += `
    <div class="glass-pagination" style="margin-top:var(--spacing-md);">
      <span class="info">共 ${props.total} 条，第 ${props.page}/${props.totalPages} 页</span>
      <div class="glass-pages">
        ${props.page > 1 ? `<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&tab=bans&page=${props.page-1}&per_page=${props.perPage}'">←</button>` : ''}
        ${Array.from({length:Math.min(props.totalPages,7)},(_,i)=>i+1).map(p => `
          ${p === props.page ? `<span class="glass-page-btn current">${p}</span>` : `<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&tab=bans&page=${p}&per_page=${props.perPage}'">${p}</button>`}
        `).join('')}
        ${props.page < props.totalPages ? `<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&tab=bans&page=${props.page+1}&per_page=${props.perPage}'">→</button>` : ''}
      </div>
    </div>`
  }
  return html
}

function renderEntitiesTab(props: SearchPageProps): string {
  if (props.admins.length === 0 && props.players.length === 0) {
    return `<div style="text-align:center;padding:40px 24px;color:var(--label-3);font-size:14px;">未找到相关玩家或管理员</div>`
  }
  let html = ''
  if (props.admins.length > 0) {
    html += `<div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:4px;">管理员</div>`
    for (const a of props.admins) {
      html += `
      <a href="/admin-profile/${a.id}" style="text-decoration:none;">
        <div class="glass-card">
          <div class="glass-card-inner" style="display:flex;align-items:center;gap:12px;padding:var(--spacing-md);">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),#ffffff);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#000;font-family:var(--sans);flex-shrink:0;">
              ${(a.game_name || a.username).charAt(0)}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-1);">${escHtml(a.game_name || a.username)}</div>
              <div style="font-size:12px;color:var(--label-3);">${escHtml(a.steam_id)} · ${a.permission_group}</div>
            </div>
          </div>
        </div>
      </a>`
    }
  }
  if (props.players.length > 0) {
    html += `<div style="font-size:14px;font-weight:600;color:var(--label-2);margin-bottom:4px;margin-top:8px;">玩家</div>`
    for (const p of props.players) {
      html += `
      <a href="/player/${p.steam_id}" style="text-decoration:none;">
        <div class="glass-card">
          <div class="glass-card-inner" style="display:flex;align-items:center;gap:12px;padding:var(--spacing-md);">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),#ffffff);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#000;font-family:var(--sans);flex-shrink:0;">
              ${p.nickname.charAt(0).toUpperCase()}
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-1);">${escHtml(p.nickname)}</div>
              <div style="font-size:12px;color:var(--label-3);">封禁 ${p.banCount} 次 · 最高 ${p.highestLevel || '—'}</div>
            </div>
          </div>
        </div>
      </a>`
    }
  }
  return html
}

function renderAnnouncementsTab(props: SearchPageProps): string {
  if (props.announcements.length === 0) {
    return `<div style="text-align:center;padding:40px 24px;color:var(--label-3);font-size:14px;">无匹配公告</div>`
  }
  let html = ''
  for (const a of props.announcements) {
    html += `
    <a href="/announcements/${a.id}" style="text-decoration:none;">
      <div class="glass-card announce-card" style="margin-bottom:var(--spacing-md);">
        <div class="glass-card-inner">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:var(--spacing-sm);">
          <span class="badge ${typeBadge(a.type).replace('cyber-badge-', 'badge-')}" style="flex-shrink:0;">${announcementTypeLabel(a.type)}</span>
          <div style="display:flex;gap:var(--spacing-sm);font-size:12px;color:rgba(255,255,255,0.3);font-family:var(--mono);flex-shrink:0;">
            <span>${fmtDate(a.created_at)}</span>
          </div>
        </div>
        <div style="margin-bottom:8px;">
          ${a.is_pinned ? `<span style="margin-right:6px;">📌</span>` : ''}
          <span style="color:var(--label-1);text-decoration:none;font-weight:600;font-size:17px;letter-spacing:-0.3px;">${escHtml(a.title)}</span>
        </div>
        ${a.subtitle ? `<div style="font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:10px;line-height:1.5;">${escHtml(a.subtitle || '')}</div>` : ''}
        <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-sm);padding-top:var(--spacing-sm);border-top:1px solid rgba(255,255,255,0.04);font-size:12px;color:rgba(255,255,255,0.25);">
          <span>${escHtml(a.created_by_name || '')}</span>
        </div>
        </div>
      </div>
    </a>`
  }
  return html
}

export function SearchPage(props: SearchPageProps) {
  const activeTab = props.activeTab || 'bans'
  return html`
<section style="min-height:100dvh;padding-top:100px;">
  <div style="max-width:1100px;margin:0 auto;padding:0 24px;">
    <!-- Search Bar -->
    <form action="/search" method="get" class="hero-search" style="margin-bottom:32px;max-width:100%;">
      <input type="search" name="q" placeholder="搜索玩家昵称 / Steam ID / 管理员名称 / 公告标题…" autocomplete="off"
             value="${escAttr(props.query)}" />
      <input type="hidden" name="tab" value="${activeTab}" />
      <button type="submit">搜索</button>
    </form>

    ${props.query && (props.bans.length > 0 || props.admins.length > 0 || props.players.length > 0 || props.announcements.length > 0) ? html`
    <div style="font-size:14px;color:var(--label-3);margin-bottom:16px;">
      搜索 "<strong style="color:var(--cyan);">${escHtml(props.query)}</strong>"
      ${props.bans.length > 0 ? html` — 找到 <strong style="color:var(--cyan);">${props.total}</strong> 条封禁记录` : ''}
      ${props.admins.length > 0 ? html` — <strong style="color:var(--magenta);">${props.admins.length}</strong> 位管理员` : ''}
      ${props.players.length > 0 ? html` — <strong style="color:var(--cyan);">${props.players.length}</strong> 位玩家` : ''}
      ${props.announcements.length > 0 ? html` — <strong style="color:var(--cyan);">${props.announcements.length}</strong> 条公告` : ''}
    </div>

    <!-- Tab Selector -->
    <div class="search-tabs" style="display:flex;gap:8px;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:8px;">
      ${raw(tabButton(activeTab === 'bans', '封禁条目', 'bans', props.query))}
      ${raw(tabButton(activeTab === 'entities', '玩家/管理员', 'entities', props.query))}
      ${raw(tabButton(activeTab === 'announcements', '公告', 'announcements', props.query))}
    </div>

    <!-- Tab Content -->
    <div id="tab-bans" class="search-tab-content" style="${activeTab !== 'bans' ? 'display:none;' : ''}">
      ${raw(renderBansTab(props))}
    </div>
    <div id="tab-entities" class="search-tab-content" style="${activeTab !== 'entities' ? 'display:none;' : ''}">
      ${raw(renderEntitiesTab(props))}
    </div>
    <div id="tab-announcements" class="search-tab-content" style="${activeTab !== 'announcements' ? 'display:none;' : ''}">
      ${raw(renderAnnouncementsTab(props))}
    </div>
    ` : html`
    <div style="text-align:center;padding:80px 24px;">
      <div style="font-size:48px;margin-bottom:16px;opacity:0.2;">🔍</div>
      <h2 style="font-size:20px;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:8px;">搜索封禁记录、玩家、管理员、公告</h2>
      <p style="font-size:14px;color:rgba(255,255,255,0.25);">输入关键词搜索</p>
    </div>
    `}

    <style>
      .search-tabs { display:flex; gap:8px; margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px; }
      .search-tab { background:none; border:none; color:rgba(255,255,255,0.5); font-size:14px; font-family:var(--sans); padding:8px 16px; border-radius:var(--radius-sm); cursor:pointer; transition:all .2s; }
      .search-tab:hover { color:var(--label-1); background:rgba(255,255,255,0.04); }
      .search-tab.active { color:var(--cyan); background:rgba(0,255,255,0.08); font-weight:600; }
      .search-tab-content { animation:fadeIn .2s ease; }
      @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
      @media (max-width: 768px) {
        .search-tabs { flex-wrap:wrap; }
        .search-tab { flex:1; text-align:center; }
      }
    </style>
    <script>
      function switchTab(tabName) {
        document.querySelectorAll('.search-tab').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === tabName)
        })
        document.querySelectorAll('.search-tab-content').forEach(content => {
          content.style.display = content.id === 'tab-' + tabName ? '' : 'none'
        })
        // Update hidden input and URL
        const form = document.querySelector('.hero-search')
        const hiddenInput = form.querySelector('input[name="tab"]')
        if (hiddenInput) hiddenInput.value = tabName
        // Update URL without reload
        const url = new URL(window.location)
        url.searchParams.set('tab', tabName)
        window.history.replaceState({}, '', url)
      }
      // Initialize from URL on load
      document.addEventListener('DOMContentLoaded', () => {
        const url = new URL(window.location)
        const tab = url.searchParams.get('tab') || 'bans'
        switchTab(tab)
      })
    </script>`
}