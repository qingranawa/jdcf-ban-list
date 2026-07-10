import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { icon } from './icons'

type Admin = { steam_id: string; username: string; permission_group: string; game_name: string; qq_name: string; position: string; supervisor: string }

export function TeamPage(props: { admins: Admin[] }) {
  return html`
<div style="max-width:800px;margin:0 auto;padding:var(--spacing-xl) var(--spacing-md) var(--spacing-lg);">
  <h1 class="page-title" style="font-size:34px;">管理组</h1>
  <p style="font-size:15px;color:var(--label-2);margin-top:var(--spacing-xs);">CN 鸡蛋肠粉服务器 · 管理员信息</p>

  <div style="margin-top:var(--spacing-lg);display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md);">
    ${props.admins.length === 0 ? html`<div style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;grid-column:1/-1;">暂无管理员信息</div>` : props.admins.map(a => html`
    <div class="glass-card" style="aspect-ratio:4/3;">
      <div class="glass-card-inner" style="display:flex;flex-direction:column;gap:var(--spacing-sm);background:transparent;box-shadow:none;">
      <div style="display:flex;align-items:center;gap:var(--spacing-sm);">
        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#000;flex-shrink:0;font-family:var(--sans);">
          ${(a.game_name || a.username).charAt(0)}
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-family:var(--sans);font-size:17px;font-weight:600;">${escHtml(a.game_name) || '未知'}</div>
          <div style="font-size:12px;color:var(--label-3);">${escHtml(a.username)}</div>
        </div>
        <span class="cyber-badge ${a.permission_group === 'OWNER' ? 'cyber-badge-magenta' : 'cyber-badge-cyan'}">${a.permission_group}</span>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:var(--spacing-xs);justify-content:center;">
        <div style="font-size:13px;color:var(--label-2);"><span style="color:var(--label-3);">Steam64:</span> ${escHtml(a.steam_id)}</div>
        ${a.qq_name ? html`<div style="font-size:13px;color:var(--label-2);"><span style="color:var(--label-3);">QQ:</span> ${escHtml(a.qq_name)}</div>` : ''}
        ${a.position ? html`<div style="font-size:13px;color:var(--label-2);"><span style="color:var(--label-3);">任职:</span> ${escHtml(a.position)}</div>` : ''}
        ${a.supervisor ? html`<div style="font-size:13px;color:var(--label-2);"><span style="color:var(--label-3);">主管事务:</span> ${escHtml(a.supervisor)}</div>` : ''}
      </div>
      </div>
    </div>`)}
  </div>
</div>`
}
