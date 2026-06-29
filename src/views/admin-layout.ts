import { html, raw } from 'hono/html'
import { Styles } from './styles'
import { icon } from './icons'
import { getRandomBg, BG_IMAGES } from '../config/bg-images'


type AdminLayoutProps = {
  title: string
  currentPath: string
  admin: { game_name: string; permission_group: string }
  children: string | ReturnType<typeof html>
}

export function AdminLayout(props: AdminLayoutProps) {
  const isActive = (p: string) => props.currentPath === p
  const adminName = props.admin.game_name || '管理员'
  const adminGroup = props.admin.permission_group || ''

  const navItems = [
    { path: '/admin/bans', label: '封禁管理', icon: 'list' },
    { path: '/admin/process', label: '批量处理', icon: 'bolt' },
    { path: '/admin/watchlist', label: '观察名单', icon: 'bell' },
    { path: '/admin/team', label: '管理组', icon: 'users' },
    { path: '/admin/archive', label: '归档日志', icon: 'info' },
  ]

  const bgPath = getRandomBg()
  const bgPaths = BG_IMAGES.map(f => `/images/bg/${f}`)

  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${props.title} — JDCF 后台</title>
<meta name="theme-color" content="#000000">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23000' stroke='%2300ffff' stroke-width='2'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%2300ffff' font-family='monospace' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="preload" as="image" href="${bgPath}" fetchpriority="high">
<script src="https://unpkg.com/htmx.org@2.0.4" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous"></script>
${Styles()}
</head>
<body style="display:flex;">
<div class="bg-image" style="background-image:url('${bgPath}'),url('/images/bg/3.jpg')"></div>
<div class="mesh-bg">
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
</div>

<button id="menuToggle" aria-label="切换导航菜单" onclick="document.getElementById('sidebar').classList.toggle('open')" style="position:fixed;top:12px;left:12px;z-index:300;background:var(--bg-elevated);border:1px solid var(--separator);border-radius:var(--radius-sm);padding:8px;color:var(--label-1);display:none;cursor:pointer;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
</button>

<aside class="cyber-sidebar" id="sidebar">
  <div class="sidebar-brand">
    <a href="/" style="color:inherit;text-decoration:none;">JDCF<span style="color:var(--magenta);">/</span>ADMIN</a>
  </div>
  <a href="/" class="sidebar-link" aria-label="返回主页" style="margin-bottom:var(--spacing-xs);font-size:13px;gap:8px;">
    ${icon('house',14)} 返回主页
  </a>
  <nav class="sidebar-nav" aria-label="后台导航">
    ${navItems.map(n => html`
    <a href="${n.path}" class="sidebar-link ${isActive(n.path) ? 'active' : ''}" ${isActive(n.path) ? 'aria-current="page"' : ''}>
      ${icon(n.icon)} ${n.label}
    </a>`)}
  </nav>
  <div class="sidebar-footer">
    <a href="/account" class="sidebar-link">
      <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--cyan),var(--magenta));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#000;flex-shrink:0;font-family:var(--sans);">
        ${adminName.charAt(0)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${adminName}</div>
        <div style="font-size:11px;color:var(--label-3);">${adminGroup}</div>
      </div>
    </a>
  </div>
</aside>

<main class="cyber-page" style="flex:1;min-width:0;padding:var(--spacing-lg);">
  ${props.children}
</main>

<script>
(function() {
  // * CSS 多背景：随机图在上层，3.jpg 在下层兜底。随机图未加载时 3.jpg 可见
  var allPaths = ${raw(JSON.stringify(bgPaths).replace(/<\//g, '<\\/'))};
  // * 页面完全加载后静默缓存全部背景图
  window.addEventListener('load', function() {
    allPaths.forEach(function(url) {
      var img = new Image();
      img.src = url;
    });
  });

  var jwt = localStorage.getItem('jwt');
  var m = location.search.match(/[?&]token=([^&]+)/);
  if (m) {
    jwt = decodeURIComponent(m[1]);
    localStorage.setItem('jwt', jwt);
    var u = location.pathname + location.hash;
    history.replaceState(null, '', u);
  }
  // * 将 ?token= 追加到所有管理页面链接，确保点击后 middleware 能读到
  if (jwt) {
    var links = document.querySelectorAll('a[href^="/admin/"],a[href^="/account"]');
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href');
      if (h.indexOf('?') > -1) { links[i].setAttribute('href', h + '&token=' + encodeURIComponent(jwt)); }
      else { links[i].setAttribute('href', h + '?token=' + encodeURIComponent(jwt)); }
    }
  }
  if (!jwt) { window.location.href = '/login'; return; }

  var menuToggle = document.getElementById('menuToggle');
  if (window.innerWidth <= 768) {
    menuToggle.style.display = 'block';
  }
  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
      menuToggle.style.display = 'block';
    } else {
      menuToggle.style.display = 'none';
      document.getElementById('sidebar').classList.remove('open');
    }
  });
})();
</script>
</body>
</html>`
}
