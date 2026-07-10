import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { fmtDate, lvBadge, lvLabel, stBadge } from '../helpers/format'

export type AdminProfileData = {
  id: number
  steam_id: string
  username: string
  game_name: string
  permission_group: string
  qq_name: string
  position: string
  supervisor: string
  is_active: number
  // 统计
  banCount: number
  disciplineCount: number
  highestLevel: string
  auditLogCount: number
  // 表格数据
  bans: Array<{
    id: number; nickname: string; reason: string; ban_time: string;
    ban_duration: string; violation_level: string; status: string;
  }>
  disciplines: Array<{
    id: number; ban_duration: string; reason: string; ban_time: string;
    handled_by_name: string | null; co_handlers: string; notes: string;
  }>
  auditLogs: Array<{
    id: number; action: string; target_type: string; target_id: number | null;
    detail: string | null; created_at: string;
  }>
}

function levelLabel(lv: string): string {
  const m: Record<string, string> = { warning: '警告', level3: '3级违规', level2: '2级违规', level1: '1级', level4: '4级(逃逸)', admin_discipline: '违纪处罚' }
  return m[lv] || lv
}
function stLabel(s: string): string {
  const m: Record<string, string> = { banned: '封禁中', unbanned: '已解封', permanent: '永久', muted: '禁言中', warning: '警告', cfba: 'CFBA', admin_discipline: '违纪' }
  return m[s] || s
}

export function AdminProfilePage(data: AdminProfileData) {
  const initial = (data.game_name || data.username).charAt(0).toUpperCase()

  return html`
<div style="max-width:800px;margin:0 auto;padding:var(--spacing-lg) var(--spacing-md);">

  <!-- Breadcrumb -->
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--spacing-lg);font-size:13px;color:var(--label-3);">
    <a href="/" style="color:var(--cyan);">封禁列表</a>
    <span style="color:var(--label-3);">/</span>
    <a href="/team" style="color:var(--cyan);">管理组</a>
    <span style="color:var(--label-3);">/</span>
    <span style="color:var(--label-1);">${escHtml(data.game_name || data.username)}</span>
  </div>

  <!-- Profile Header -->
  <div class="glass-card" style="margin-bottom:var(--spacing-md);">
    <div class="glass-card-inner" style="display:flex;align-items:center;gap:16px;">
      <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#000;font-family:var(--sans);flex-shrink:0;">${escHtml(initial)}</div>
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="font-family:var(--sans);font-size:20px;font-weight:600;">${escHtml(data.game_name || data.username)}</div>
          <span class="badge ${data.permission_group === 'OWNER' ? 'badge-magenta' : 'badge-cyan'}">${data.permission_group}</span>
          ${data.disciplineCount > 0 ? html`<span class="badge badge-amber">违纪处罚中</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap;">
          <code style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${escHtml(data.steam_id)}</code>
          <span style="font-size:13px;color:var(--label-3);">${escHtml(data.username)}</span>
        </div>
        <div style="font-size:13px;color:var(--label-3);margin-top:2px;">
          ${data.qq_name ? html`QQ: ${escHtml(data.qq_name)} &nbsp;·&nbsp; ` : ''}
          ${data.position ? html`任职: ${escHtml(data.position)}` : ''}
          ${data.supervisor ? html`主管: ${escHtml(data.supervisor)}` : ''}
        </div>
      </div>
    </div>
  </div>

  <!-- Stats Cards Row -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--spacing-sm);margin-bottom:var(--spacing-md);">
    <div class="glass-card"><div class="glass-card-inner" style="text-align:center;">
      <div style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--cyan);line-height:1;">${data.banCount}</div>
      <div style="font-size:12px;color:var(--label-3);margin-top:6px;">封禁处理</div>
    </div></div>
    <div class="glass-card"><div class="glass-card-inner" style="text-align:center;">
      <div style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--amber);line-height:1;">${data.disciplineCount}</div>
      <div style="font-size:12px;color:var(--label-3);margin-top:6px;">违纪处罚</div>
    </div></div>
    <div class="glass-card"><div class="glass-card-inner" style="text-align:center;">
      <div style="margin-bottom:4px;">${data.highestLevel
        ? html`<span class="badge ${lvBadge(data.highestLevel).replace('cyber-badge-','badge-')}">${escHtml(levelLabel(data.highestLevel))}</span>`
        : html`<span style="font-family:var(--sans);font-size:15px;font-weight:600;color:var(--label-3);">—</span>`}
      </div>
      <div style="font-size:12px;color:var(--label-3);">最高违规</div>
    </div></div>
    <div class="glass-card"><div class="glass-card-inner" style="text-align:center;">
      <div style="font-family:var(--sans);font-size:28px;font-weight:700;color:var(--magenta);line-height:1;">${data.auditLogCount}</div>
      <div style="font-size:12px;color:var(--label-3);margin-top:6px;">总操作数</div>
    </div></div>
  </div>

  <!-- Ban History (bans he issued) -->
  <div style="margin-bottom:var(--spacing-md);">
    <h3 style="font-family:var(--sans);font-size:16px;font-weight:600;margin-bottom:var(--spacing-sm);color:var(--label-1);">经手封禁记录</h3>
    <div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
      <thead><tr>
        <th>时间</th><th>玩家</th><th>原因</th><th>等级</th><th>状态</th><th>时长</th>
      </tr></thead>
      <tbody>
        ${data.bans.length === 0
          ? html`<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--label-3);font-size:14px;">暂无封禁记录</td></tr>`
          : data.bans.map(b => html`<tr>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${fmtDate(b.ban_time)}</td>
            <td style="color:var(--label-1);">${escHtml(b.nickname)}</td>
            <td style="color:var(--label-2);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(b.reason)}</td>
            <td><span class="badge ${lvBadge(b.violation_level).replace('cyber-badge-','badge-')}">${escHtml(levelLabel(b.violation_level))}</span></td>
            <td><span class="badge ${stBadge(b.status).replace('cyber-badge-','badge-')}">${escHtml(stLabel(b.status))}</span></td>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-2);">${escHtml(b.ban_duration)}</td>
          </tr>`)}
      </tbody>
    </table></div></div>
  </div>

  <!-- Discipline Records (admin was disciplined) -->
  <div style="margin-bottom:var(--spacing-md);">
    <h3 style="font-family:var(--sans);font-size:16px;font-weight:600;margin-bottom:var(--spacing-sm);color:var(--label-1);">违纪处罚记录</h3>
    <div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
      <thead><tr>
        <th>时间</th><th>处罚类型</th><th>执行人</th><th>联合判定</th><th>备注</th>
      </tr></thead>
      <tbody>
        ${data.disciplines.length === 0
          ? html`<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--label-3);font-size:14px;">暂无违纪处罚记录</td></tr>`
          : data.disciplines.map(d => html`<tr>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${fmtDate(d.ban_time)}</td>
            <td><span class="badge badge-amber">${escHtml(d.ban_duration)}</span></td>
            <td style="color:var(--label-2);font-size:14px;">${d.handled_by_name ? escHtml(d.handled_by_name) : '系统'}</td>
            <td style="font-size:13px;color:var(--label-3);">${d.co_handlers ? escHtml(d.co_handlers) : '—'}</td>
            <td style="font-size:13px;color:var(--label-3);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.notes ? escHtml(d.notes) : '—'}</td>
          </tr>`)}
      </tbody>
    </table></div></div>
  </div>

  <!-- Audit Log -->
  <div>
    <h3 style="font-family:var(--sans);font-size:16px;font-weight:600;margin-bottom:var(--spacing-sm);color:var(--label-1);">审计日志</h3>
    <div class="glass-table-wrap"><div class="glass-table-inner"><table class="glass-table">
      <thead><tr>
        <th>时间</th><th>操作</th><th>目标类型</th><th>目标</th><th>详情</th>
      </tr></thead>
      <tbody>
        ${data.auditLogs.length === 0
          ? html`<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--label-3);font-size:14px;">暂无操作记录</td></tr>`
          : data.auditLogs.map(log => html`<tr>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${fmtDate(log.created_at)}</td>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-1);">${escHtml(log.action)}</td>
            <td style="font-size:13px;color:var(--label-2);">${escHtml(log.target_type)}</td>
            <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);">${log.target_id ?? '—'}</td>
            <td style="font-size:13px;color:var(--label-3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${log.detail ? escHtml(log.detail) : '—'}</td>
          </tr>`)}
      </tbody>
    </table></div></div>
  </div>

</div>`
}
