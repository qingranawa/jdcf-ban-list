import { html, raw } from 'hono/html'
import { Styles } from './styles'
import { icon } from './icons'
import { getRandomBg, BG_IMAGES } from '../config/bg-images'
import { GROUP_RANK } from '../middleware/auth'


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

  const allNavItems = [
    { path: '/admin/bans', label: '封禁管理', icon: 'list', minRank: 6 },
    { path: '/admin/process', label: '批量处理', icon: 'bolt', minRank: 2 },
    { path: '/admin/announcements', label: '公告管理', icon: 'file-text', minRank: 6 },
    { path: '/admin/watchlist', label: '观察名单', icon: 'bell', minRank: 4 },
    { path: '/admin/team', label: '管理组', icon: 'users', minRank: 2 },
    { path: '/admin/archive', label: '归档日志', icon: 'info', minRank: 3 },
  ]
  const userRank = GROUP_RANK[adminGroup] ?? 99
  const navItems = allNavItems.filter(n => userRank <= n.minRank)

  const bgPath = getRandomBg()
  const bgPaths = BG_IMAGES.map(f => `/images/bg/${f}`)

  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${props.title} — 鸡蛋肠粉后台</title>
<meta name="theme-color" content="#000000">
<meta name="mobile-web-app-capable" content="yes">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='14' fill='%23000' stroke='%2300ffff' stroke-width='2'/%3E%3Ctext x='16' y='22' font-size='18' text-anchor='middle' fill='%2300ffff' font-family='monospace' font-weight='bold'%3EJ%3C/text%3E%3C/svg%3E"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="preload" as="image" href="${bgPath}" fetchpriority="high">
<script src="https://unpkg.com/htmx.org@2.0.4" integrity="sha384-HGfztofotfshcF7+8n44JQL2oJmowVChPTg48S+jvZoztPfvwD79OC/LTtG6dMp+" crossorigin="anonymous">

</script>
${Styles()}
</head>
<body style="display:flex;">
<div class="bg-image" style="background-image:url('${bgPath}'),url('/images/bg/3.jpg')"></div>
<div class="mesh-bg">
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
  <div class="mesh-sphere"></div>
</div>

<button id="menuToggle" aria-label="切换导航菜单" onclick="document.getElementById('sidebar').classList.toggle('open')" style="position:fixed;top:12px;left:12px;z-index:300;background:var(--bg-elevated);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px;color:var(--label-1);display:none;cursor:pointer;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
</button>

<aside class="cyber-sidebar" id="sidebar">
  <div class="sidebar-brand">
    <a href="/" style="color:inherit;text-decoration:none;display:flex;align-items:center;gap:8px;">鸡蛋肠粉<span style="color:var(--magenta);font-size:14px;font-weight:600;">后台</span></a>
    <button class="sidebar-collapse-btn" onclick="toggleSidebar()" aria-label="折叠侧边栏">◀</button>
  </div>
      <a href="/" class="sidebar-link" style="margin:4px 10px 8px;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,0.03);color:var(--label-3);font-size:13px;text-decoration:none;display:flex;align-items:center;gap:6px;transition:all 0.2s;">
      ← 返回首页
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
        <div style="font-size:11px;color:rgba(255,255,255,.3);">${adminGroup}</div>
      </div>
    </a>
  </div>
</aside>

<main style="flex:1;min-width:0;padding:32px;position:relative;">
  ${props.children}
</main>

<script>
(function() {
  var allPaths = ${raw(JSON.stringify(bgPaths).replace(/<\//g, '<\\/'))};
  window.addEventListener('load', function() {
    allPaths.forEach(function(url) {
      var img = new Image();
      img.src = url;
    });
  });

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

  // Background parallax
  var bgImg = document.querySelector('.bg-image');
  if (bgImg) {
    window.addEventListener('scroll', function() {
      var y = window.scrollY;
      var offset = Math.min(y * 0.1, window.innerHeight * 0.05);
      bgImg.style.transform = 'translateY(-' + offset + 'px)';
    }, {passive:true});
  }

  // Scroll reveal — make visible on load
  requestAnimationFrame(function() {
    document.querySelectorAll('.reveal, .reveal-blur, .reveal-scale').forEach(function(el) {
      el.classList.add('visible');
    });
  });


  // Sidebar collapse
  var sidebar = document.getElementById('sidebar');
  var savedState = localStorage.getItem('sidebarCollapsed') === 'true';
  if (savedState) sidebar.classList.add('collapsed');
  window.toggleSidebar = function() {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
  </script>

</body>
</html>`
}
