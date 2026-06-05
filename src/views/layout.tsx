import { html } from 'hono/html'

type LayoutProps = {
  title: string;
  currentPath: string;
  children: any;
  admin?: { game_name: string; permission_group: string } | null;
}

export function Layout({ title, currentPath, children, admin }: LayoutProps) {
  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — 鸡蛋肠粉封禁查询</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    *, *::before, *::after {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Inter, system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: #0a0a0f;
      color: #e8e8f0;
      min-height: 100vh;
      line-height: 1.6;
    }
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
    }
    nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    nav .logo {
      font-weight: 700;
      font-size: 1.1rem;
      color: #4a9eff;
    }
    nav a {
      color: #8888a0;
      text-decoration: none;
      margin-left: 1.5rem;
      font-size: 0.9rem;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #e8e8f0; }
    nav a.active {
      border-bottom: 2px solid #4a9eff;
      padding-bottom: 2px;
    }
    main {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    .card {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 1.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th, td {
      text-align: left;
      padding: 0.75rem 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }
    th {
      color: #8888a0;
      font-weight: 500;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-warning { background: rgba(255, 193, 7, 0.15); color: #ffc107; }
    .badge-level3  { background: rgba(255, 152, 0, 0.15); color: #ff9800; }
    .badge-level2  { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .badge-level1  { background: rgba(233, 30, 99, 0.15); color: #e91e63; }
    .badge-level4  { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
    .badge-ok   { background: rgba(0, 212, 170, 0.15); color: #00d4aa; }
    .badge-ban  { background: rgba(244, 67, 54, 0.15); color: #f44336; }
    .badge-perm { background: rgba(0, 0, 0, 0.3); color: #666; }
    .badge-muted { background: rgba(33, 150, 243, 0.15); color: #2196f3; }
    .search-box {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .search-box input {
      flex: 1;
      padding: 0.6rem 1rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #e8e8f0;
      font-size: 0.9rem;
    }
    .search-box input::placeholder { color: #555; }
    .search-box select {
      padding: 0.6rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: #e8e8f0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-danger  { background: #f44336; color: #fff; }
    .btn-ghost   { background: rgba(255,255,255,0.06); color: #e8e8f0; }
    .pagination {
      display: flex;
      gap: 0.3rem;
      justify-content: center;
      margin-top: 1rem;
    }
    .pagination a, .pagination span {
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #8888a0;
      text-decoration: none;
    }
    .pagination a:hover { background: rgba(255,255,255,0.06); color: #e8e8f0; }
    .pagination .current { background: #4a9eff; color: #fff; }
    @media (max-width: 768px) {
      nav { flex-wrap: wrap; gap: 0.5rem; }
      nav .nav-links { width: 100%; display: flex; flex-wrap: wrap; gap: 0.5rem; }
      nav a { margin-left: 0; }
      table { font-size: 0.78rem; }
      th, td { padding: 0.5rem 0.3rem; }
      .search-box { flex-direction: column; }
    }
    .form-group { margin-bottom: 1rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      color: #8888a0;
      font-size: 0.82rem;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.5rem 0.8rem;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      color: #e8e8f0;
      font-size: 0.9rem;
    }
    .form-group textarea { resize: vertical; min-height: 60px; }
    footer {
      text-align: center;
      padding: 2rem;
      color: #555;
      font-size: 0.8rem;
    }
  </style>
</head>
<body>
  <nav>
    <div class="logo">🔍 鸡蛋肠粉封禁查询</div>
    <div class="nav-links">
      <a href="/" data-current="${currentPath === '/' ? 'active' : ''}">封禁列表</a>
      <a href="/team" data-current="${currentPath === '/team' ? 'active' : ''}">管理组</a>
      ${admin ? html`
        <a href="/admin/bans" data-current="${currentPath.startsWith('/admin/bans') ? 'active' : ''}">封禁管理</a>
        <a href="/admin/team" data-current="${currentPath.startsWith('/admin/team') ? 'active' : ''}">管理组管理</a>
        <a href="/admin/blacklist" data-current="${currentPath.startsWith('/admin/blacklist') ? 'active' : ''}">黑名单</a>
        <a href="/admin/archive" data-current="${currentPath.startsWith('/admin/archive') ? 'active' : ''}">归档</a>
        <a href="/admin/logout">退出</a>
      ` : html`<a href="/login">登录</a>`}
    </div>
  </nav>
  <main>
    ${children}
  </main>
  <footer>
    CN 鸡蛋肠粉服务器 &copy; ${new Date().getFullYear()} &mdash; SCP: Secret Laboratory
  </footer>
  <script>
    document.querySelectorAll('nav a').forEach(a => {
      if (a.dataset.current === 'active') a.classList.add('active');
    });
  </script>
</body>
</html>`
}
