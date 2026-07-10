// > Search results page — displays ban search results with hero-style search bar
import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'

type SearchResult = {
  id: number; nickname: string; steam_id: string; reason: string;
  ban_duration: string; ban_time: string; violation_level: string;
  status: string; handled_by_name: string | null;
}

type SearchPageProps = {
  query: string; results: SearchResult[]; total: number;
  page: number; totalPages: number; perPage: number;
}

function levelBadge(lv: string): string {
  const m: Record<string,string> = { warning:'badge-amber', level3:'badge-cyan', level2:'badge-magenta', level1:'badge-red' }
  return m[lv] || 'badge-neutral'
}
function levelLabel(lv: string): string {
  const m: Record<string,string> = { warning:'警告', level3:'3级违规', level2:'2级违规', level1:'1级' }
  return m[lv] || lv
}
function statusBadge(s: string): string {
  const m: Record<string,string> = { banned:'badge-magenta', unbanned:'badge-green', permanent:'badge-red', muted:'badge-amber', warning:'badge-amber' }
  return m[s] || 'badge-magenta'
}
function statusLabel(s: string): string {
  const m: Record<string,string> = { banned:'封禁中', unbanned:'已解封', permanent:'永久', muted:'禁言中', warning:'警告' }
  return m[s] || s
}
function fmtDuration(d: string): string {
  if (!d) return '—'
  const m: Record<string,string> = { m:'分钟', h:'小时', d:'天', y:'年', permanent:'永久', warning:'警告', cfba:'CFBA', mute:'禁言' }
  if (m[d]) return m[d]
  if (d.startsWith('mute-')) return '禁言' + d.replace('mute-', '')
  const parts = d.match(/^([a-z]+)-(\d+)([mhdy])$/)
  if (parts) return parts[2] + (m[parts[3]] || '')
  return d
}
function fmtTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function enc(s: string): string { return encodeURIComponent(s) }

export function SearchPage(props: SearchPageProps) {
  return html`
<section style="min-height:100dvh;padding-top:100px;">
  <div style="max-width:800px;margin:0 auto;padding:0 24px;">
    <form action="/search" method="get" class="hero-search" style="margin-bottom:32px;max-width:100%;">
      <input type="search" name="q" placeholder="搜索玩家昵称或 Steam ID…" autocomplete="off"
             value="${escAttr(props.query)}" />
      <button type="submit">搜索</button>
    </form>

    ${props.total > 0 ? html`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <span style="font-size:14px;color:rgba(255,255,255,0.4);">
        搜索 "<strong style="color:var(--cyan);">${escHtml(props.query)}</strong>" 找到 <strong style="color:var(--cyan);">${props.total}</strong> 条结果
      </span>
      <select onchange="window.location.href='/search?q=${enc(props.query)}&per_page='+this.value"
              style="background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:6px 12px;font-size:13px;color:rgba(255,255,255,0.5);font-family:inherit;">
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
          <tbody>
          ${props.results.map(r => html`
            <tr>
              <td data-label="昵称"><a href="/player/${r.id}" style="color:var(--label-1);text-decoration:none;font-family:var(--sans);font-weight:600;">${escHtml(r.nickname)}</a></td>
              <td data-label="Steam ID"><code style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(r.steam_id)}</code></td>
              <td data-label="原因" style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:14px;color:var(--label-2);">${escHtml(r.reason)}</td>
              <td data-label="等级"><span class="badge ${levelBadge(r.violation_level)}">${levelLabel(r.violation_level)}</span></td>
              <td data-label="状态"><span class="badge ${statusBadge(r.status)}">${statusLabel(r.status)}</span></td>
              <td data-label="操作员" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${r.handled_by_name || '系统'}</td>
              <td data-label="时长" style="font-size:13px;color:var(--label-2);font-family:var(--mono);">${fmtDuration(r.ban_duration)}</td>
              <td data-label="时间" style="white-space:nowrap;font-size:13px;color:var(--label-3);font-family:var(--mono);">${fmtTime(r.ban_time)}</td>
            </tr>`)}
          </tbody>
        </table>
      </div>
    </div>
    ` : html`
    <div style="text-align:center;padding:80px 24px;">
      <div style="font-size:48px;margin-bottom:16px;opacity:0.2;">🔍</div>
      <h2 style="font-size:20px;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:8px;">未找到匹配的记录</h2>
      <p style="font-size:14px;color:rgba(255,255,255,0.25);">
        ${props.query ? html`没有与 "<strong style="color:var(--label-2);">${escHtml(props.query)}</strong>" 相关的封禁记录` : '请输入关键词搜索'}
      </p>
    </div>
    `}

    ${props.totalPages > 1 ? html`
    <div class="glass-pagination">
      <span class="info">共 ${props.total} 条，第 ${props.page}/${props.totalPages} 页</span>
      <div class="glass-pages">
        ${props.page > 1 ? html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${props.page-1}&per_page=${props.perPage}'">←</button>` : ''}
        ${Array.from({length:Math.min(props.totalPages,7)},(_,i)=>i+1).map(p => html`
          ${p === props.page
            ? html`<span class="glass-page-btn current">${p}</span>`
            : html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${p}&per_page=${props.perPage}'">${p}</button>`}
        `)}
        ${props.page < props.totalPages ? html`<button class="glass-page-btn" onclick="location.href='/search?q=${enc(props.query)}&page=${props.page+1}&per_page=${props.perPage}'">→</button>` : ''}
      </div>
    </div>` : ''}
  </div>
</section>`
}
