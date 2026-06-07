import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { html } from 'hono/html'
import type { Env, AdminRow } from '../db'
import { authMiddleware, requirePermission } from '../middleware/auth'
import { AdminLayout } from '../views/admin-layout'
import { escHtml, escAttr } from '../helpers/escape'

export const adminTeamRoutes = new Hono<{ Bindings: Env }>()
adminTeamRoutes.use('/admin/*', authMiddleware)
adminTeamRoutes.use('/api/admin/*', authMiddleware)

// 管理组列表
adminTeamRoutes.get('/admin/team', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare(
    'SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active, created_at FROM admins ORDER BY id'
  ).all<AdminRow>()

  return c.html(AdminLayout({
    title: '管理组管理',
    currentPath: '/admin/team',
    admin: { game_name: c.get('gameName') || '', permission_group: c.get('permissionGroup') },
    children: html`
<div class="card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
    <h2 style="font-weight:500;">管理组管理</h2>
    <button class="btn btn-primary" onclick="showAddForm()">+ 新增管理员</button>
  </div>
  <table>
    <thead><tr>
      <th>ID</th><th>Steam ID</th><th>用户名</th><th>权限组</th><th>游戏名</th><th>QQ名</th><th>任职</th><th>状态</th><th>操作</th>
    </tr></thead>
    <tbody>
      ${rows.results.length === 0 ? html`<tr><td colspan="9" style="text-align:center;padding:2rem;color:#8888a0;">暂无管理员</td></tr>`
      : rows.results.map(a => html`<tr>
        <td>${a.id}</td>
        <td style="font-family:monospace;font-size:0.82rem;">${escHtml(a.steam_id)}</td>
        <td>${escHtml(a.username)}</td>
        <td><span class="badge ${a.permission_group === 'OWNER' ? 'badge-level1' : 'badge-level3'}">${a.permission_group}</span></td>
        <td>${escHtml(a.game_name)}</td>
        <td>${escHtml(a.qq_name)}</td>
        <td>${escHtml(a.position)}</td>
        <td>${a.is_active ? '✅' : '❌'}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-ghost" style="padding:0.2rem 0.5rem;font-size:0.78rem;" onclick="editAdmin(${a.id})">编辑</button>
          <button class="btn btn-danger" style="padding:0.2rem 0.5rem;font-size:0.78rem;margin-left:0.25rem;" data-username="${escAttr(a.username)}" onclick="delAdmin(${a.id},this.dataset.username)">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
</div>

<div id="adminModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;align-items:center;justify-content:center;padding:1rem;">
<div class="card" style="max-width:500px;width:100%;max-height:85vh;overflow-y:auto;padding:1.25rem;">
  <h3 id="modalTitle" style="margin-bottom:1rem;">新增管理员</h3>
  <form id="adminForm">
    <input type="hidden" name="id" />
    <div class="form-group"><label>Steam ID</label><input type="text" name="steam_id" required /></div>
    <div class="form-group"><label>用户名</label><input type="text" name="username" required /></div>
    <div class="form-group"><label>密码 (留空不修改)</label><input type="password" name="password" /></div>
    <div class="form-group">
      <label>权限组</label>
      <select name="permission_group">
        <option value="T1">T1</option><option value="T2">T2</option><option value="T3">T3</option>
        <option value="T4">T4</option><option value="T5">T5</option><option value="T6">T6</option>
        <option value="OWNER">OWNER</option>
      </select>
    </div>
    <div class="form-group"><label>游戏名称</label><input type="text" name="game_name" /></div>
    <div class="form-group"><label>QQ名称</label><input type="text" name="qq_name" /></div>
    <div class="form-group"><label>任职</label><input type="text" name="position" /></div>
    <div class="form-group"><label>主管事务</label><input type="text" name="supervisor" /></div>
    <button type="submit" class="btn btn-primary">保存</button>
    <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
  </form>
</div></div>

<script>
const jwt = localStorage.getItem('jwt');
function showAddForm() {
  document.getElementById('adminForm').reset();
  document.getElementById('adminForm').querySelector('[name=id]').value = '';
  document.getElementById('modalTitle').textContent = '新增管理员';
  document.getElementById('adminModal').style.display = 'flex';
}
async function editAdmin(id) {
  const resp = await fetch('/api/admin/profiles/' + id, { headers: { 'Authorization': 'Bearer ' + jwt } });
  const data = await resp.json();
  const form = document.getElementById('adminForm');
  form.querySelector('[name=id]').value = data.id;
  form.querySelector('[name=steam_id]').value = data.steam_id;
  form.querySelector('[name=username]').value = data.username;
  form.querySelector('[name=password]').value = '';
  form.querySelector('[name=permission_group]').value = data.permission_group;
  form.querySelector('[name=game_name]').value = data.game_name;
  form.querySelector('[name=qq_name]').value = data.qq_name;
  form.querySelector('[name=position]').value = data.position;
  form.querySelector('[name=supervisor]').value = data.supervisor;
  document.getElementById('modalTitle').textContent = '编辑管理员';
  document.getElementById('adminModal').style.display = 'flex';
}
function closeModal() { document.getElementById('adminModal').style.display = 'none'; }
async function delAdmin(id, name) {
  if (!confirm('确认删除管理员「' + name + '」(ID: ' + id + ')？')) return;
  const resp = await fetch('/api/admin/profiles/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + jwt } });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); alert(r.error || '删除失败'); }
}
document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  const id = data.id;
  delete data.id;
  if (!data.password) delete data.password;
  const method = id ? 'PUT' : 'POST';
  const url = id ? '/api/admin/profiles/' + id : '/api/admin/profiles';
  const resp = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  });
  if (resp.ok) { location.reload(); }
  else { const r = await resp.json(); alert(r.error || '操作失败'); }
});
</script>`
  }))
})

// 全量管理员列表
adminTeamRoutes.get('/api/admin/profiles', requirePermission('T5'), async (c) => {
  const rows = await c.env.DB.prepare('SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active FROM admins ORDER BY id').all()
  return c.json({ data: rows.results })
})

// 单条管理员详情
adminTeamRoutes.get('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const admin = await c.env.DB.prepare('SELECT id, steam_id, username, permission_group, game_name, qq_name, position, supervisor, is_active FROM admins WHERE id = ?').bind(c.req.param('id')).first()
  if (!admin) return c.json({ error: '管理员不存在' }, 404)
  return c.json(admin)
})

// 新建管理员
adminTeamRoutes.post('/api/admin/profiles', requirePermission('T5'), async (c) => {
  const body = await c.req.json()
  if (!body.steam_id || !body.username) return c.json({ error: 'Steam ID 和用户名为必填' }, 400)
  const password = body.password || 'change_me_123'
  const hash = await bcrypt.hash(password, 10)
  try {
    await c.env.DB.prepare(
      `INSERT INTO admins (steam_id, username, password_hash, permission_group, game_name, qq_name, position, supervisor)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(body.steam_id, body.username, hash, body.permission_group || 'T1',
           body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'').run()
    return c.json({ success: true })
  } catch { return c.json({ error: 'Steam ID 或用户名已存在' }, 409) }
})

// 改管理员信息
adminTeamRoutes.put('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  let sql = `UPDATE admins SET steam_id=?, username=?, permission_group=?, game_name=?, qq_name=?, position=?, supervisor=?, updated_at=datetime('now')`
  const params = [body.steam_id, body.username, body.permission_group||'T1', body.game_name||'', body.qq_name||'', body.position||'', body.supervisor||'']
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 10)
    sql += `, password_hash=?`
    params.push(hash)
  }
  sql += ` WHERE id=?`
  params.push(id)
  await c.env.DB.prepare(sql).bind(...params).run()
  return c.json({ success: true })
})

// 删掉管理员
adminTeamRoutes.delete('/api/admin/profiles/:id', requirePermission('T5'), async (c) => {
  const id = Number(c.req.param('id'))
  if (id === c.get('adminId')) return c.json({ error: '不能删除自己' }, 400)
  await c.env.DB.prepare('DELETE FROM admins WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})
