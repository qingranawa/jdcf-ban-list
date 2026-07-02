import { html } from 'hono/html'
import { escHtml } from '../helpers/escape'
import { announcementTypeLabel, announcementTypeIcon, fmtDate } from '../helpers/format'
import { icon } from './icons'

export type AnnouncementItem = {
  id: number
  title: string
  subtitle: string | null
  body: string
  citation: string | null
  type: string
  is_pinned: number
  is_published: number
  publish_at: string | null
  created_by_name: string
  created_at: string
}

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

const btnStyle = 'padding:6px 16px;border:none;background:transparent;font-family:var(--sans);font-size:13px;font-weight:500;color:var(--label-3);cursor:pointer;transition:all .2s;text-decoration:none;'
const btnActiveStyle = 'background:var(--magenta);color:#000;font-weight:600;'

export function AnnouncementsPage(props: {
  announcements: AnnouncementItem[]
  currentType: string
  page: number
  totalPages: number
  adminGroup: string | null
}) {
  const types = ['server', 'penalty', 'event', 'urgent', 'changelog']
  const showInternal = props.adminGroup && ['OWNER', 'T6', 'T5', 'T4', 'T3'].includes(props.adminGroup)
  if (showInternal) types.push('internal')

  const genPages = (current: number, total: number): (number | string)[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | string)[] = [1]
    if (current > 3) pages.push('…')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i)
    if (current < total - 2) pages.push('…')
    if (total > 1) pages.push(total)
    return pages
  }

  const qs = (type: string, pg?: number) => {
    const p: string[] = []
    if (type) p.push('type=' + type)
    if (pg && pg > 1) p.push('page=' + pg)
    return p.length ? '?' + p.join('&') : ''
  }

  return html`
<div class="cyber-page" style="max-width:800px;margin:0 auto;padding:var(--spacing-lg) var(--spacing-md);">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--spacing-lg);">
    <h1 class="cyber-title" style="font-size:32px;">📢 公告</h1>
    ${props.adminGroup ? html`<button class="cyber-btn cyber-btn-primary" onclick="openAnnounceModal()">${icon('bolt', 16)} 添加公告</button>` : ''}
  </div>

  <div class="cyber-segmented" style="margin-bottom:var(--spacing-lg);flex-wrap:wrap;">
    <a href="/announcements" class="${!props.currentType ? 'active' : ''}" style="${btnStyle}${!props.currentType ? btnActiveStyle : ''}">全部</a>
    ${types.map(t => html`
    <a href="/announcements?type=${t}" class="${props.currentType === t ? 'active' : ''}" style="${btnStyle}${props.currentType === t ? btnActiveStyle : ''}">${announcementTypeLabel(t)}</a>
    `)}
  </div>

  ${props.announcements.length === 0 ? html`
  <p style="text-align:center;padding:3rem 1rem;color:var(--label-3);font-size:15px;">暂无公告</p>
  ` : props.announcements.map(a => html`
  <div class="cyber-card" style="margin-bottom:var(--spacing-md);">
    <div style="margin-bottom:6px;">
      ${a.is_pinned ? html`<span style="margin-right:6px;">📌</span>` : ''}
      <a href="/announcements/${a.id}" style="color:var(--label-1);text-decoration:none;font-weight:600;font-size:16px;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${escHtml(a.title)}</a>
    </div>
    ${a.subtitle ? html`<div style="font-size:13px;color:var(--label-3);margin-bottom:8px;">${escHtml(a.subtitle)}</div>` : ''}
    <div style="margin-bottom:10px;">
      <span class="cyber-badge ${typeBadge(a.type)}">${announcementTypeLabel(a.type)}</span>
    </div>
    ${a.citation ? html`<blockquote style="border-left:3px solid var(--cyan);padding:8px 12px;margin:8px 0;color:var(--label-2);font-style:italic;font-size:14px;">${escHtml(a.citation)}</blockquote>` : ''}
    <div style="font-size:12px;color:var(--label-3);display:flex;gap:var(--spacing-sm);">
      <span>${fmtDate(a.created_at)}</span>
      <span>${escHtml(a.created_by_name)}</span>
    </div>
  </div>
  `)}

  ${props.totalPages > 1 ? html`
  <div class="cyber-pagination" style="margin-top:var(--spacing-lg);">
    ${props.page > 1 ? html`<a href="${qs(props.currentType, props.page - 1)}">←</a>` : ''}
    ${genPages(props.page, props.totalPages).map(p => typeof p === 'number' ? html`
      ${p === props.page ? html`<span class="current" aria-current="page">${p}</span>` : html`<a href="${qs(props.currentType, p)}">${p}</a>`}`
    : html`<span>…</span>`)}
    ${props.page < props.totalPages ? html`<a href="${qs(props.currentType, props.page + 1)}">→</a>` : ''}
  </div>` : ''}

  ${props.adminGroup ? html`${NewAnnouncementModal()}
<script>
var jwt = localStorage.getItem('jwt');
function openAnnounceModal() { var f=document.getElementById('announceForm');if(f)f.reset();document.getElementById('announceModal').classList.add('open'); }
function closeAnnounceModal() { document.getElementById('announceModal').classList.remove('open'); }
function showToast(t,type){var el=document.getElementById('cyberToast')||(function(){var d=document.createElement('div');d.id='cyberToast';d.className='cyber-toast';d.setAttribute('role','status');d.setAttribute('aria-live','polite');document.body.appendChild(d);return d;})();el.textContent=t;el.className='cyber-toast '+type;el.classList.add('show');setTimeout(function(){el.classList.remove('show');},2500);}
function saveDraft(){var f=document.getElementById('announceForm');var data=Object.fromEntries(new FormData(f));data.is_published='0';fetch('/api/admin/announcements',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+jwt},body:JSON.stringify(data)}).then(function(r){if(r.ok){showToast('草稿已保存','success');closeAnnounceModal();setTimeout(function(){location.reload();},800);}else{r.json().then(function(d){showToast(d.error||'保存失败','error');});}}).catch(function(){showToast('请求失败','error');});}
document.getElementById('announceForm')?.addEventListener('submit',async function(e){e.preventDefault();var data=Object.fromEntries(new FormData(this));data.is_published='1';try{var resp=await fetch('/api/admin/announcements',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+jwt},body:JSON.stringify(data)});if(resp.ok){showToast('公告已发布','success');closeAnnounceModal();setTimeout(function(){location.reload();},800);}else{var r=await resp.json();showToast(r.error||'发布失败','error');}}catch(e){showToast('请求失败','error');}});
</script>` : ''}
</div>`
}

export function AnnouncementDetailPage(props: {
  announcement: AnnouncementItem
  adminGroup: string | null
}) {
  const a = props.announcement
  return html`
<div class="cyber-page" style="max-width:800px;margin:0 auto;padding:var(--spacing-lg) var(--spacing-md);">

  <a href="/announcements" style="color:var(--cyan);text-decoration:none;font-size:14px;display:inline-block;margin-bottom:var(--spacing-md);">← 返回公告列表</a>

  <div style="margin-bottom:var(--spacing-md);">
    ${a.is_pinned ? html`<span style="margin-right:8px;">📌</span>` : ''}
    <h1 style="display:inline;font-size:24px;color:#fff;font-weight:700;">${escHtml(a.title)}</h1>
  </div>

  ${a.subtitle ? html`<div style="font-size:14px;color:var(--label-3);margin-bottom:var(--spacing-sm);">${escHtml(a.subtitle)}</div>` : ''}

  <div style="margin-bottom:var(--spacing-sm);">
    <span class="cyber-badge ${typeBadge(a.type)}">${announcementTypeLabel(a.type)}</span>
  </div>

  ${a.citation ? html`<blockquote style="border-left:3px solid var(--cyan);padding:8px 12px;margin:12px 0;color:var(--label-2);font-style:italic;font-size:14px;">${escHtml(a.citation)}</blockquote>` : ''}

  <div id="announceBody" style="line-height:1.7;color:var(--label-2);font-size:15px;margin:var(--spacing-lg) 0;">${escHtml(a.body)}</div>

  <div style="font-size:12px;color:var(--label-3);display:flex;gap:var(--spacing-sm);border-top:1px solid var(--separator);padding-top:var(--spacing-md);">
    <span>${escHtml(a.created_by_name)}</span>
    <span>${fmtDate(a.created_at)}</span>
    ${a.publish_at ? html`<span>发布于 ${fmtDate(a.publish_at)}</span>` : ''}
  </div>

  <style>
  #announceBody h1, #announceBody h2, #announceBody h3 { margin:16px 0 8px; color:#fff; }
  #announceBody p { margin:8px 0; line-height:1.7; color:var(--label-2); }
  #announceBody ul, #announceBody ol { padding-left:20px; margin:8px 0; color:var(--label-2); }
  #announceBody li { margin:4px 0; }
  #announceBody blockquote { border-left:3px solid var(--cyan); padding:8px 12px; margin:12px 0; background:rgba(0,255,255,0.05); color:var(--label-2); }
  #announceBody code { background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; font-family:var(--mono); font-size:13px; }
  #announceBody pre code { display:block; padding:12px; overflow-x:auto; }
  #announceBody a { color:var(--cyan); }
  </style>

  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
  try { document.getElementById('announceBody').innerHTML = marked.parse(document.getElementById('announceBody').textContent); } catch(e) {}
  </script>
</div>`
}

export function NewAnnouncementModal() {
  return html`
<div id="announceModal" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="新建公告" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeAnnounceModal()">
  <div class="cyber-sheet">
    <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
      <span class="sheet-title">新建公告</span>
      <button type="button" class="sheet-close" onclick="closeAnnounceModal()">✕</button>
    </div>
    <div class="sheet-body">
      <form id="announceForm">
        <input type="hidden" name="id" value="" />
        <div class="cyber-form-group"><label>标题 *</label><input type="text" name="title" required class="cyber-input" /></div>
        <div class="cyber-form-group"><label>副标题</label><input type="text" name="subtitle" class="cyber-input" /></div>
        <div class="cyber-form-group">
          <label>类型</label>
          <select name="type" class="cyber-input">
            <option value="server">服务器公告</option>
            <option value="penalty" selected>处罚公告</option>
            <option value="event">活动通知</option>
            <option value="urgent">紧急通知</option>
            <option value="changelog">更新日志</option>
            <option value="internal">内部通知</option>
          </select>
        </div>
        <div class="cyber-form-group"><label>引用</label><input type="text" name="citation" placeholder="引用的原文链接或出处" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>正文 *</label><textarea name="body" rows="8" required placeholder="支持 Markdown 语法" class="cyber-input"></textarea></div>
        <div class="cyber-form-group"><label>定时发布</label><input type="datetime-local" name="publish_at" id="publishAt" class="cyber-input" /></div>
        <div class="cyber-form-group" style="flex-direction:row;align-items:center;gap:var(--spacing-sm);">
          <input type="checkbox" name="is_pinned" id="announcePinned" value="1" style="width:18px;height:18px;accent-color:var(--cyan);" />
          <label for="announcePinned" style="margin:0;">置顶公告</label>
        </div>
        <div style="display:flex;gap:var(--spacing-sm);margin-top:var(--spacing-md);">
          <button type="button" class="cyber-btn" style="flex:1;justify-content:center;" onclick="saveDraft()">保存草稿</button>
          <button type="submit" class="cyber-btn cyber-btn-primary" style="flex:1;justify-content:center;">发布公告</button>
        </div>
      </form>
    </div>
  </div>
</div>`
}
