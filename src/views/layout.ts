import { html } from 'hono/html'
import { Styles } from './styles'
import { icon } from './icons'
import { getRandomBg } from '../config/bg-images'

type LayoutProps = {
  title: string
  currentPath: string
  children: string | ReturnType<typeof html>
}

export function Layout(props: LayoutProps) {
  const isActive = (p: string) => props.currentPath === p || props.currentPath.startsWith(p + '/')
  const bgPath = getRandomBg()
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
<div class="bg-image" style="background-image:url('${bgPath}')"></div>
<div class="mesh-bg">
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
</div>

<main class="cyber-main cyber-main-public">
  ${props.children}
</main>

<a href="/admin/bans" id="quickAddFab" style="display:none;position:fixed;bottom:84px;right:16px;z-index:200;width:56px;height:56px;border-radius:50%;border:none;background:linear-gradient(135deg,var(--magenta),#ff0088);color:#fff;cursor:pointer;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(255,0,136,.5);transition:transform .2s,box-shadow .2s;text-decoration:none;">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
</a>

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
    <a href="/admin/bans" id="addBanTab" style="display:none;">
      ${icon('bolt', 20)}<span>添加封禁</span>
    </a>
    <a href="/login" id="loginTab">
      ${icon('shield', 20)}<span>登录</span>
    </a>
  </div>
</nav>

<script>
(function() {
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
  var quickAddFab = document.getElementById('quickAddFab');
  if (jwt) {
    try {
      var payload = JSON.parse(atob(jwt.split('.')[1]));
      accountTab.style.display = '';
      loginTab.style.display = 'none';
      if (payload.permissionGroup) {
        addBanTab.style.display = '';
        if (quickAddFab) quickAddFab.style.display = 'flex';
      }
    } catch(e) {}
  }
})();
</script>
</body>
</html>`
}
