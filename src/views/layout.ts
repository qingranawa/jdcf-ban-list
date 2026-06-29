// > Public layout — full HTML shell with nav, global modal, scroll effects
// ! 全局新增封禁 Modal (globalBanSheet) 在此定义，确保所有页面可用
import { html, raw } from 'hono/html'
import { Styles } from './styles'
import { icon } from './icons'
import { BG_IMAGES } from '../config/bg-images'

type LayoutProps = {
  title: string
  currentPath: string
  children: string | ReturnType<typeof html>
}

export function Layout(props: LayoutProps) {
  const isActive = (p: string) => props.currentPath === p || props.currentPath.startsWith(p + '/')
  // * 所有背景路径（用于首次访问后的静默预加载）
  const allPaths = BG_IMAGES.map(f => `/images/bg/${f}`)
  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${props.title} — JDCF 封禁查询</title>
<meta name="theme-color" content="#000000">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23000' stroke='%2300ffff' stroke-width='2'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%2300ffff' font-family='monospace' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script src="https://unpkg.com/htmx.org@2.0.4" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous"></script>
${Styles()}
</head>
<body>
<div id="scroll-progress" role="progressbar" aria-label="页面进度"></div>
<div class="bg-image"></div>
<div class="mesh-bg">
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
</div>

<main class="cyber-main cyber-main-public">
  ${props.children}
</main>

<nav class="cyber-nav" aria-label="主导航">
  <div class="nav-brand">
    <span class="nav-brand-text">鸡蛋肠粉服务器</span>
    <span class="nav-brand-emoji">⌁</span>
    <span class="nav-brand-sub">封禁查询</span>
  </div>
  <div class="nav-links">
    <a href="/" class="${isActive('/') && !isActive('/team') ? 'active' : ''}" ${isActive('/') && !isActive('/team') ? 'aria-current="page"' : ''}>
      ${icon('house-fill', 20)}<span>首页</span>
    </a>
    <a href="/team" class="${isActive('/team') ? 'active' : ''}" ${isActive('/team') ? 'aria-current="page"' : ''}>
      ${icon('users', 20)}<span>管理组</span>
    </a>
    <a href="/stats" class="${isActive('/stats') ? 'active' : ''}" ${isActive('/stats') ? 'aria-current="page"' : ''}>
      ${icon('chart.bar', 20)}<span>统计信息</span>
    </a>
    <a href="/account" id="accountTab" style="display:none;">
      ${icon('gear', 20)}<span>账户</span>
    </a>
    <a href="#" id="addBanTab" style="display:none;" onclick="openGlobalBanSheet();return false;">
      ${icon('bolt', 20)}<span>添加封禁</span>
    </a>
    <a href="/login" id="loginTab">
      ${icon('shield', 20)}<span>登录</span>
    </a>
  </div>
</nav>

<!-- Global Add Ban Modal -->
<div id="globalBanSheet" class="cyber-sheet-overlay" role="dialog" aria-modal="true" aria-label="新增封禁" onpointerdown="this.dataset.pd=event.target===this" onclick="if(this.dataset.pd==='true')closeGlobalBanSheet()">
  <div class="cyber-sheet">
    <div class="sheet-header" style="margin-bottom:var(--spacing-md);">
      <span class="sheet-title">新增封禁</span>
      <button type="button" class="sheet-close" onclick="closeGlobalBanSheet()">✕</button>
    </div>
    <div class="sheet-body">
      <form id="globalBanForm">
        <div class="cyber-form-group"><label>昵称 *</label><input type="text" name="nickname" required class="cyber-input" /></div>
        <div class="cyber-form-group"><label>Steam ID *</label><input type="text" name="steam_id" required placeholder="76561199…" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>IP（选填）</label><input type="text" name="ip_address" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>原因</label><input type="text" name="reason" class="cyber-input" /></div>
        <div class="cyber-form-group"><label>封禁时长</label><input type="text" name="ban_duration" placeholder="7d / 30m / 1h / permanent" class="cyber-input" /></div>
        <div class="cyber-form-group">
          <label>违规等级</label>
          <select name="violation_level" class="cyber-input">
            <option value="level3" selected>3级违规</option><option value="level2">2级违规</option>
            <option value="level1">1级违规</option><option value="warning">警告</option>
          </select>
        </div>
        <div class="cyber-form-group"><label>备注</label><textarea name="notes" rows="3" class="cyber-input"></textarea></div>
        <div class="cyber-form-group"><label>联合封禁管理员（选填）</label><input type="text" name="co_handlers" placeholder="用逗号分隔多个管理员" class="cyber-input" /></div>
        <button type="submit" class="cyber-btn cyber-btn-primary" style="width:100%;justify-content:center;">提交封禁</button>
      </form>
    </div>
  </div>
</div>

<script>
(function() {
  // * Preload remaining background images for instant switching
  var preloadPaths = ${raw(JSON.stringify(allPaths).replace(/<\//g, '<\\/'))};
  window.addEventListener('load', function() {
    preloadPaths.forEach(function(url) {
      var img = new Image();
      img.src = url;
    });
  });

  // HTMX global error handler
  document.body.addEventListener('htmx:sendError', function() {
    var t = document.getElementById('toast-global');
    if (!t) {
      t = document.createElement('div'); t.id = 'toast-global';
      t.className = 'cyber-toast error'; t.setAttribute('role','status'); t.setAttribute('aria-live','polite');
      document.body.appendChild(t);
    }
    t.textContent = '请求失败，请检查网络连接'; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  });
  document.body.addEventListener('htmx:responseError', function() {
    var t = document.getElementById('toast-global');
    if (!t) {
      t = document.createElement('div'); t.id = 'toast-global';
      t.className = 'cyber-toast error'; t.setAttribute('role','status'); t.setAttribute('aria-live','polite');
      document.body.appendChild(t);
    }
    t.textContent = '服务器错误，请稍后重试'; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
  });

  // Scroll-based effects
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    var progressBar = document.getElementById('scroll-progress');
    var meshBg = document.querySelector('.mesh-bg');
    var bgImage = document.querySelector('.bg-image');
    var ticking = false;
    function onScroll() {
      var scrollY = window.scrollY;
      var maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      var p = Math.min(scrollY / maxScroll, 1);
      progressBar.style.transform = 'scaleX(' + p + ')';
      meshBg.style.transform = 'translateY(' + (p * -15) + 'px)';
      bgImage.style.transform = 'translateY(' + (p * -8) + 'px)';
    }
    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(function() { onScroll(); ticking = false; });
        ticking = true;
      }
    });
  }

  var jwt = localStorage.getItem('jwt');
  var accountTab = document.getElementById('accountTab');
  var addBanTab = document.getElementById('addBanTab');
  var loginTab = document.getElementById('loginTab');
  if (jwt) {
    try {
      var payload = JSON.parse(atob(jwt.split('.')[1]));
      accountTab.style.display = '';
      loginTab.style.display = 'none';
      if (payload.permissionGroup) addBanTab.style.display = '';
    } catch(e) {}
  }
})();

// ─── Global Add Ban Modal ───
function openGlobalBanSheet() {
  var f = document.getElementById('globalBanForm');
  if (f) f.reset();
  var el = document.getElementById('globalBanSheet');
  if (el) el.classList.add('open');
}
function closeGlobalBanSheet() {
  var el = document.getElementById('globalBanSheet');
  if (el) el.classList.remove('open');
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
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('globalBanForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var jwt = localStorage.getItem('jwt');
    if (!jwt) { showToast('请先登录', 'error'); return; }
    var data = Object.fromEntries(new FormData(this));
    var resp = await fetch('/api/admin/bans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jwt },
      body: JSON.stringify(data),
    });
    if (resp.ok) {
      closeGlobalBanSheet();
      showToast('封禁已添加', 'success');
      setTimeout(function(){ location.reload(); }, 800);
    } else {
      var r = await resp.json(); showToast(r.error || '添加失败', 'error');
    }
  });
});
})();
</script>
</body>
</html>`
}
