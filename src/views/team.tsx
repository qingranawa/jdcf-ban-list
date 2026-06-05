import { html } from 'hono/html'

type Member = {
  game_name: string;
  qq_name: string;
  permission_group: string;
  position: string;
  supervisor: string;
}

export function TeamPage({ members }: { members: Member[] }) {
  return html`
<div class="card">
  <h2 style="margin-bottom:1rem;font-weight:500;">管理组公示</h2>
  <table>
    <thead>
      <tr>
        <th>游戏内名称</th>
        <th>QQ群名称</th>
        <th>权限组</th>
        <th>任职</th>
        <th>主管事务</th>
      </tr>
    </thead>
    <tbody>
      ${members.length === 0
        ? html`<tr><td colspan="5" style="text-align:center;color:#8888a0;padding:2rem;">暂无管理组成员</td></tr>`
        : members.map(m => html`
      <tr>
        <td><strong>${escHtml(m.game_name)}</strong></td>
        <td>${escHtml(m.qq_name)}</td>
        <td><span class="badge badge-level3">${m.permission_group}</span></td>
        <td>${escHtml(m.position)}</td>
        <td>${escHtml(m.supervisor)}</td>
      </tr>`)}
    </tbody>
  </table>
</div>`
}

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
