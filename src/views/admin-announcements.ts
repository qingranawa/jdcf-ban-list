import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { announcementTypeLabel, fmtDate } from '../helpers/format'
import { icon } from './icons'
import type { AnnouncementItem } from './announcements'
import { NewAnnouncementModal } from './announcements'

const typeBadgeClass: Record<string, string> = {
  server: 'cyber-badge-cyan',
  penalty: 'cyber-badge-magenta',
  event: 'cyber-badge-green',
  urgent: 'cyber-badge-red',
  changelog: 'cyber-badge-amber',
  internal: 'cyber-badge-neutral',
}

function typeBadge(t: string): string {
  return typeBadgeClass[t] || 'cyber-badge-cyan'
}

function genPages(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | string)[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
  if (current < total - 2) pages.push('…')
  if (total > 1) pages.push(total)
  return pages
}

export function AdminAnnouncementsPage(props: {
  announcements: (AnnouncementItem & { read_count: number; is_read: number })[]
  page: number
  totalPages: number
  total: number
}) {
  const page = props.page
  const totalPages = props.totalPages
  const pageUrl = (p: number) => '/admin/announcements?page=' + p

  return html`
<div class="cyber-admin-content">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h2 class="page-title">公告管理</h2>
    <button class="cyber-btn cyber-btn-primary" onclick="openAnnounceModal()">${icon('bolt', 16)} 新建公告</button>
  </div>

  <div class="glass-table-wrap"><div class="glass-table-inner">
  <table class="glass-table">
    <thead><tr>
      <th>ID</th><th>标题</th><th>类型</th><th>状态</th><th>定时发布</th><th>阅读</th><th style="text-align:right;padding-right:var(--spacing-md);">操作</th>
    </tr></thead>
    <tbody>
      ${props.announcements.length === 0 ? html`
      <tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--label-3);font-size:15px;">暂无公告</td></tr>`
      : props.announcements.map(a => html`
      <tr id="announceRow${a.id}">
        <td style="color:var(--label-3);font-family:var(--mono);font-size:13px;">${a.id}</td>
        <td>
          ${a.is_pinned ? html`<span style="margin-right:4px;">📌</span>` : ''}
          <a href="/announcements/${a.id}" target="_blank" style="color:var(--label-1);text-decoration:none;font-weight:600;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(a.title)}</a>
        </td>
        <td><span class="cyber-badge ${typeBadge(a.type)}">${announcementTypeLabel(a.type)}</span></td>
        <td><span class="cyber-badge ${a.is_published ? 'cyber-badge-green' : 'cyber-badge-amber'}">${a.is_published ? '已发布' : '草稿'}</span></td>
        <td style="font-family:var(--mono);font-size:13px;color:var(--label-3);white-space:nowrap;">${a.publish_at ? fmtDate(a.publish_at) : '—'}</td>
        <td style="font-size:13px;color:var(--label-2);">${a.read_count} 次</td>
        <td style="text-align:right;white-space:nowrap;padding-right:var(--spacing-md);">
          <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="editAnnounce(${a.id})">编辑</button>
          <button class="cyber-btn cyber-btn-ghost cyber-btn-small" onclick="togglePin(${a.id})">${a.is_pinned ? '取消置顶' : '置顶'}</button>
          <button class="cyber-btn cyber-btn-danger cyber-btn-small" onclick="deleteAnnounce(${a.id})">删除</button>
        </td>
      </tr>`)}
    </tbody>
  </table>
  </div></div>

  ${totalPages > 1 ? html`
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--spacing-lg);">
    <span style="font-size:13px;color:var(--label-3);">共 ${props.total} 条，第 ${page}/${totalPages} 页</span>
    <div class="glass-pagination" style="margin-top:0;">
      ${page > 1 ? html`<a href="${pageUrl(page - 1)}">←</a>` : ''}
      ${genPages(page, totalPages).map(p => typeof p === 'number' ? html`
        ${p === page ? html`<span class="current" aria-current="page">${p}</span>` : html`<a href="${pageUrl(p)}">${p}</a>`}
      ` : html`<span>...</span>`)}
      ${page < totalPages ? html`<a href="${pageUrl(page + 1)}">→</a>` : ''}
    </div>
  </div>` : ''}

  ${NewAnnouncementModal()}
</div>

<script>
var jwt = localStorage.getItem('jwt');

function openAnnounceModal() {
  var f = document.getElementById('announceForm');
  if (f) { f.reset(); f.querySelector('[name=id]').value = ''; }
  document.querySelector('#announceModal .sheet-title').textContent = '新建公告';
  document.getElementById('announceModal').classList.add('open');
}
function closeAnnounceModal() {
  document.getElementById('announceModal').classList.remove('open');
}
function showToast(t, type) {
  var el = document.getElementById('cyberToast') || (function(){
    var d = document.createElement('div'); d.id = 'cyberToast'; d.className = 'cyber-toast';
    d.setAttribute('role','status'); d.setAttribute('aria-live','polite');
    document.body.appendChild(d); return d;
  })();
  el.textContent = t; el.className = 'cyber-toast ' + type;
  el.classList.add('show');
  setTimeout(function(){ el.classList.remove('show'); }, 2500);
}
function saveDraft() {
  var f = document.getElementById('announceForm');
  var data = Object.fromEntries(new FormData(f));
  var id = data.id;
  var isEdit = !!id;
  delete data.id;
  data.is_published = '0';
  var url = isEdit ? '/api/admin/announcements/' + id : '/api/admin/announcements';
  fetch(url, {
    method: isEdit ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
    body: JSON.stringify(data),
  }).then(function(r) {
    if (r.ok) { showToast('草稿已保存', 'success'); closeAnnounceModal(); setTimeout(function(){ location.reload(); }, 800); }
    else { r.json().then(function(d) { showToast(d.error || '保存失败', 'error'); }); }
  }).catch(function() { showToast('请求失败', 'error'); });
}
document.getElementById('announceForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  var data = Object.fromEntries(new FormData(this));
  var id = data.id;
  var isEdit = !!id;
  delete data.id;
  data.is_published = '1';
  try {
    var url = isEdit ? '/api/admin/announcements/' + id : '/api/admin/announcements';
    var resp = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(data),
    });
    if (resp.ok) { showToast(isEdit ? '公告已更新' : '公告已发布', 'success'); closeAnnounceModal(); setTimeout(function(){ location.reload(); }, 800); }
    else { var r = await resp.json(); showToast(r.error || '操作失败', 'error'); }
  } catch(e) { showToast('请求失败', 'error'); }
});
function editAnnounce(id) {
  fetch('/api/admin/announcements/' + id, {
    headers: { 'Authorization': 'Bearer ' + jwt },
  }).then(function(r) { return r.json(); }).then(function(d) {
    var f = document.getElementById('announceForm');
    f.querySelector('[name=id]').value = d.id;
    f.querySelector('[name=title]').value = d.title;
    f.querySelector('[name=subtitle]').value = d.subtitle || '';
    f.querySelector('[name=type]').value = d.type;
    f.querySelector('[name=citation]').value = d.citation || '';
    f.querySelector('[name=body]').value = d.body;
    f.querySelector('[name=publish_at]').value = d.publish_at ? d.publish_at.slice(0,16) : '';
    f.querySelector('[name=is_pinned]').checked = d.is_pinned === 1;
    document.querySelector('#announceModal .sheet-title').textContent = '编辑公告';
    document.getElementById('announceModal').classList.add('open');
  }).catch(function() { showToast('获取公告失败', 'error'); });
}
async function deleteAnnounce(id) {
  if (!confirm('确认删除公告 #' + id + '？')) return;
  try {
    var resp = await fetch('/api/admin/announcements/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + jwt },
    });
    if (resp.ok) {
      document.getElementById('announceRow' + id)?.remove();
      showToast('已删除', 'success');
    } else { var r = await resp.json(); showToast(r.error || '删除失败', 'error'); }
  } catch(e) { showToast('请求失败', 'error'); }
}
async function togglePin(id) {
  try {
    var resp = await fetch('/api/admin/announcements/' + id + '/toggle-pin', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + jwt },
    });
    if (resp.ok) { showToast('已切换置顶状态', 'success'); setTimeout(function(){ location.reload(); }, 500); }
    else { var r = await resp.json(); showToast(r.error || '操作失败', 'error'); }
  } catch(e) { showToast('请求失败', 'error'); }
}

</script>`
}
