import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { fmtDate, lvBadge } from '../helpers/format'

export type PlayerProfileData = {
  nickname: string
  steam_id: string
  totalBans: number
  currentStatus: string
  currentStatusLabel: string
  currentStatusColor: string
  highestLevel: string
  highestLevelColor: string
  onWatchlist: boolean
  watchlistReason: string | null
  firstBanDate: string
  lastBanDate: string
  maskedIp: string | null
  bans: Array<{
    ban_time: string
    reason: string
    ban_duration: string
    violation_level: string
    status: string
    handled_by_name: string | null
  }>
}

// ── Helpers matching home.ts public ban table style ──
function levelLabel(lv: string): string {
  const m: Record<string, string> = { warning: '警告', severe_warning: '严重警告', level3: '3级违规', level2: '2级违规', level1: '1级', level4: '4级(逃逸)', mute: '禁言', cfba_ban: 'CFBA' }
  return m[lv] || lv
}
function stLabel(s: string): string {
  const m: Record<string, string> = { banned: '封禁中', unbanned: '已解封', permanent: '永久', muted: '禁言中', warning: '警告', cfba: 'CFBA' }
  return m[s] || s
}
function stBadge(s: string): string {
  const m: Record<string, string> = { banned: 'cyber-badge-magenta', unbanned: 'cyber-badge-green', permanent: 'cyber-badge-red', muted: 'cyber-badge-amber', warning: 'cyber-badge-amber', cfba: 'cyber-badge-red' }
  return m[s] || 'cyber-badge-magenta'
}

export function PlayerProfilePage(data: PlayerProfileData) {
  const initial = data.nickname.charAt(0).toUpperCase()

  return html`
<div style="max-width:800px;margin:0 auto;padding:var(--spacing-lg) 0;">

  <div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;color:var(--label-3);">
    <a href="/" style="color:var(--cyan);">封禁列表</a>
    <span style="color:var(--label-3);">/</span>
    <span style="color:var(--label-1);">玩家档案</span>
  </div>

  <div class="cyber-card" style="margin-bottom:16px;padding:20px;">
    <div style="display:flex;align-items:center;gap:16px;">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#000;font-family:var(--sans);box-shadow:var(--glow-cyan);">${escHtml(initial)}</div>
      <div style="flex:1;">
        <div style="font-family:var(--sans);font-size:20px;font-weight:600;">${escHtml(data.nickname)}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap;">
          <code style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${escHtml(data.steam_id)}</code>
          <span class="cyber-badge ${data.currentStatusColor}">${escHtml(data.currentStatusLabel)}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="cyber-stats" style="margin-bottom:16px;">
    <div class="cyber-stat-card" style="text-align:left;border-top:2px solid var(--cyan);padding-top:14px;">
      <div style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--cyan);line-height:1;">${data.totalBans}</div>
      <div class="cyber-stat-label" style="margin-top:6px;">总封禁</div>
    </div>
    <div class="cyber-stat-card" style="text-align:left;border-top:2px solid var(--label-3);padding-top:14px;">
      <div style="margin-bottom:6px;">
        ${data.currentStatus
          ? html`<span class="cyber-badge ${stBadge(data.currentStatus)}">${escHtml(stLabel(data.currentStatus))}</span>`
          : html`<span style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-3);">${escHtml(data.currentStatusLabel)}</span>`}
      </div>
      <div class="cyber-stat-label">当前状态</div>
    </div>
    <div class="cyber-stat-card" style="text-align:left;border-top:2px solid var(--label-3);padding-top:14px;">
      <div style="margin-bottom:6px;">
        ${data.highestLevel === '—'
          ? html`<span style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-3);">—</span>`
          : html`<span class="cyber-badge ${lvBadge(data.highestLevel)}">${escHtml(levelLabel(data.highestLevel))}</span>`}
      </div>
      <div class="cyber-stat-label">最高违规</div>
    </div>
    <div class="cyber-stat-card" style="text-align:left;border-top:2px solid var(--amber);padding-top:14px;">
      <div style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--amber);line-height:1;">${data.onWatchlist ? '是' : '否'}</div>
      <div class="cyber-stat-label" style="margin-top:6px;">观察名单</div>
    </div>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:16px;font-size:13px;color:var(--label-3);">
    <span>首次封禁: <strong style="color:var(--label-2);font-family:var(--mono);">${escHtml(data.firstBanDate)}</strong></span>
    <span>最近封禁: <strong style="color:var(--label-2);font-family:var(--mono);">${escHtml(data.lastBanDate)}</strong></span>
    ${data.maskedIp ? html`<span>IP: <strong style="color:var(--label-2);font-family:var(--mono);">${escHtml(data.maskedIp)}</strong></span>` : ''}
  </div>

  <div class="cyber-table-wrap">
    <table class="cyber-table">
      <thead>
        <tr><th style="padding:12px 14px;">时间</th><th style="padding:12px 14px;">原因</th><th style="padding:12px 14px;">时长</th><th style="padding:12px 14px;">等级</th><th style="padding:12px 14px;">状态</th><th style="padding:12px 14px;">操作员</th></tr>
      </thead>
      <tbody>
        ${data.bans.length === 0
          ? html`<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">没有找到该玩家的封禁记录</td></tr>`
          : data.bans.map(ban => html`
        <tr>
          <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);padding:12px 14px;">${fmtDate(ban.ban_time)}</td>
          <td style="color:var(--label-1);padding:12px 14px;">${escHtml(ban.reason)}</td>
          <td style="font-family:var(--mono);font-size:13px;padding:12px 14px;">${escHtml(ban.ban_duration)}</td>
          <td style="padding:12px 14px;"><span class="cyber-badge ${lvBadge(ban.violation_level)}">${escHtml(levelLabel(ban.violation_level))}</span></td>
          <td style="padding:12px 14px;"><span class="cyber-badge ${stBadge(ban.status)}">${escHtml(stLabel(ban.status))}</span></td>
          <td style="color:var(--label-2);padding:12px 14px;">${ban.handled_by_name ? escHtml(ban.handled_by_name) : '系统'}</td>
        </tr>`)}
      </tbody>
    </table>
  </div>

  ${data.onWatchlist && data.watchlistReason ? html`
  <div style="margin-top:16px;border:1px solid var(--glass-border);border-radius:var(--radius-md);padding:12px 16px;display:flex;align-items:center;gap:10px;font-size:14px;color:var(--label-2);">
    <span>👁️</span>
    <span>该玩家在 <strong style="color:var(--amber);font-family:var(--sans);">重点观察名单</strong> 中 — ${escHtml(data.watchlistReason)}</span>
  </div>` : ''}
</div>`
}
