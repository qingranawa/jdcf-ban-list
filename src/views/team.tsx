import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'

type Member = {
  game_name: string;
  qq_name: string;
  permission_group: string;
  position: string;
  supervisor: string;
}

function groupBadge(g: string): string {
  const m: Record<string,string> = { OWNER:'badge-level1', T6:'badge-level2', T5:'badge-level3', T4:'badge-level3', T3:'badge-warning', T2:'badge-warning', T1:'badge-warning' }
  return m[g] || 'badge-warning'
}

export function TeamPage({ members }: { members: Member[] }) {
  const header = html`
<div style="margin-bottom:2rem;">
  <h1 style="font-size:var(--fs-xl);font-weight:600;letter-spacing:-0.02em;">管理组</h1>
  <p style="color:var(--text-tertiary);font-size:var(--fs-sm);margin-top:0.3rem;">
    CN 鸡蛋肠粉服务器 · 共 ${members.length} 名成员
  </p>
</div>`

  const emptyState = html`
<div class="card" style="text-align:center;padding:3rem;">
  <div style="font-size:2rem;margin-bottom:0.5rem;">👥</div>
  <p style="color:var(--text-tertiary);">暂无管理组成员</p>
</div>`

  const cardList = html`
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;">
  ${members.map(m => html`
  <div class="card" style="padding:1.5rem;">
    <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:1rem;">
      <div>
        <div style="font-weight:600;font-size:var(--fs-lg);">${escHtml(m.game_name)}</div>
        ${m.qq_name ? html`<div style="font-size:var(--fs-sm);color:var(--text-tertiary);margin-top:0.15rem;">QQ: ${escHtml(m.qq_name)}</div>` : ''}
      </div>
      <span class="badge ${groupBadge(m.permission_group)}">${m.permission_group}</span>
    </div>
    <div style="display:flex;gap:1rem;font-size:var(--fs-sm);color:var(--text-secondary);">
      ${m.position ? html`<div><span style="color:var(--text-tertiary);">任职</span><br/>${escHtml(m.position)}</div>` : ''}
      ${m.supervisor ? html`<div><span style="color:var(--text-tertiary);">主管</span><br/>${escHtml(m.supervisor)}</div>` : ''}
    </div>
  </div>`)}
</div>`

  return html`${header}${members.length === 0 ? emptyState : cardList}`
}
