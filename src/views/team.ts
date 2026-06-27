import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { icon } from './icons'

type Admin = { id: number; steam_id: string; username: string; permission_group: string; game_name: string; qq_name: string; position: string; supervisor: string }

export function TeamPage(props: { admins: Admin[] }) {
  return html`
<div style="max-width:800px;margin:0 auto;padding:var(--spacing-xl) var(--spacing-md) var(--spacing-lg);">
  <h1 class="cyber-title" style="font-size:34px;">管理组</h1>
  <p style="font-size:15px;color:var(--label-2);margin-top:var(--spacing-xs);">CN 鸡蛋肠粉服务器 · 管理员信息</p>

  <div style="margin-top:var(--spacing-lg);display:flex;flex-direction:column;gap:var(--spacing-md);">
    ${props.admins.length === 0 ? html`<div style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无管理员信息</div>` : props.admins.map(a => html`
    <div class="cyber-card" style="padding:var(--spacing-lg);display:flex;align-items:center;gap:var(--spacing-lg);">
      <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#000;flex-shrink:0;font-family:var(--sans);">
        ${(a.game_name || a.username).charAt(0)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-family:var(--sans);font-size:17px;font-weight:600;">${escHtml(a.game_name) || '未知'}</div>
        <div style="font-size:13px;color:var(--label-2);margin-top:2px;">
          ${escHtml(a.position) ? escHtml(a.position) + ' · ' : ''}${escHtml(a.qq_name) ? 'QQ: ' + escHtml(a.qq_name) : ''}
        </div>
        ${a.supervisor ? html`<div style="font-size:13px;color:var(--label-3);margin-top:2px;">主管：${escHtml(a.supervisor)}</div>` : ''}
      </div>
      <span class="cyber-badge ${a.permission_group === 'OWNER' ? 'cyber-badge-magenta' : 'cyber-badge-cyan'}">${a.permission_group}</span>
    </div>`)}
  </div>
</div>`
}
