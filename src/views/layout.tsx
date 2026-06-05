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
    /* ══════════════════════════════════════════════
       鸡蛋肠粉封禁查询 — 瑞士平面设计 + 玻璃态
       ══════════════════════════════════════════════ */

    /* ── Reset ── */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    /* ── 字体系统（瑞士 typography 核心） ── */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    :root {
      --sans: 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif;
      --mono: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
      --fs-xs: 0.72rem;
      --fs-sm: 0.82rem;
      --fs-base: 0.92rem;
      --fs-lg: 1.05rem;
      --fs-xl: 1.35rem;
      --fs-2xl: 1.75rem;
      --lh-tight: 1.3;
      --lh-base: 1.6;
      --radius: 10px;
      --radius-sm: 6px;
      /* Glass 参数 */
      --glass-bg: rgba(255, 255, 255, 0.04);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-blur: 24px;
      /* 色彩 */
      --bg: #0b0b12;
      --bg-alt: #10101a;
      --text: #eaeaef;
      --text-secondary: #7a7a90;
      --text-tertiary: #555568;
      --accent: #5b8def;
      --accent-hover: #7aa3ff;
      --green: #34d399;
      --red: #f87171;
      --orange: #fb923c;
      --purple: #a78bfa;
      --pink: #f472b6;
      --amber: #fbbf24;
      --blue: #60a5fa;
    }
    html { font-size: 16px; -webkit-font-smoothing: antialiased; }
    body {
      font-family: var(--sans);
      font-size: var(--fs-base);
      line-height: var(--lh-base);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }

    /* ── 玻璃态 mixin ── */
    .glass {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
    }

    /* ── 导航（瑞士设计：清晰层级，极简） ── */
    nav {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      padding: 0 2rem;
      height: 56px;
      background: rgba(11, 11, 18, 0.82);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-bottom: 1px solid var(--glass-border);
    }
    nav .logo {
      font-weight: 700; font-size: var(--fs-lg);
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #5b8def, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    nav .nav-links { display: flex; align-items: center; gap: 0.25rem; }
    nav a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--fs-sm);
      font-weight: 500;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }
    nav a:hover { color: var(--text); background: rgba(255,255,255,0.06); }
    nav a.active {
      color: var(--text);
      background: rgba(91, 141, 239, 0.15);
    }

    /* ── 主容器（瑞士网格） ── */
    main {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    /* ── 卡片 ── */
    .card {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
      padding: 1.75rem;
      transition: border-color 0.3s ease;
    }
    .card:hover { border-color: rgba(255,255,255,0.12); }

    /* ── 表格（瑞士：克制分隔线，清晰对齐） ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--fs-sm);
    }
    th {
      text-align: left;
      padding: 0.7rem 0.6rem;
      color: var(--text-tertiary);
      font-weight: 600;
      font-size: var(--fs-xs);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    td {
      padding: 0.7rem 0.6rem;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      vertical-align: middle;
    }
    tbody tr {
      transition: background 0.15s ease;
    }
    tbody tr:hover { background: rgba(255,255,255,0.03); }
    tbody tr:last-child td { border-bottom: none; }

    /* ── 徽章（违规等级） ── */
    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .badge-warning { background: rgba(251, 191, 36, 0.12); color: var(--amber); }
    .badge-level3  { background: rgba(251, 146, 60, 0.12); color: var(--orange); }
    .badge-level2  { background: rgba(248, 113, 113, 0.12); color: var(--red); }
    .badge-level1  { background: rgba(244, 114, 182, 0.12); color: var(--pink); }
    .badge-level4  { background: rgba(167, 139, 250, 0.12); color: var(--purple); }
    .badge-ok      { background: rgba(52, 211, 153, 0.12); color: var(--green); }
    .badge-ban     { background: rgba(248, 113, 113, 0.15); color: var(--red); }
    .badge-perm    { background: rgba(85, 85, 104, 0.2); color: var(--text-tertiary); }
    .badge-muted   { background: rgba(96, 165, 250, 0.12); color: var(--blue); }

    /* ── 搜索/筛选栏 ── */
    .search-box {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .search-box input {
      flex: 1;
      padding: 0.55rem 1rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      font-size: var(--fs-sm);
      font-family: var(--sans);
      outline: none;
      transition: border-color 0.2s ease;
    }
    .search-box input:focus { border-color: var(--accent); }
    .search-box input::placeholder { color: var(--text-tertiary); }
    .search-box select {
      padding: 0.55rem 0.7rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.05);
      color: var(--text-secondary);
      font-size: var(--fs-sm);
      font-family: var(--sans);
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s ease;
    }
    .search-box select:focus { border-color: var(--accent); }

    /* ── 按钮 ── */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-sm);
      font-size: var(--fs-sm);
      font-family: var(--sans);
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
      line-height: 1;
    }
    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: var(--accent); color: #fff; }
    .btn-primary:hover { background: var(--accent-hover); }
    .btn-danger  { background: rgba(248, 113, 113, 0.85); color: #fff; }
    .btn-ghost   { background: rgba(255,255,255,0.06); color: var(--text-secondary); }
    .btn-ghost:hover { background: rgba(255,255,255,0.1); color: var(--text); }

    /* ── 分页 ── */
    .pagination {
      display: flex;
      gap: 0.2rem;
      justify-content: center;
      margin-top: 1.25rem;
    }
    .pagination a, .pagination span {
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: var(--fs-sm);
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .pagination a:hover { background: rgba(255,255,255,0.06); color: var(--text); }
    .pagination .current { background: var(--accent); color: #fff; }

    /* ── 表单 ── */
    .form-group { margin-bottom: 1.1rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.3rem;
      color: var(--text-secondary);
      font-size: var(--fs-sm);
      font-weight: 500;
    }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 0.55rem 0.8rem;
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-sm);
      background: rgba(255,255,255,0.05);
      color: var(--text);
      font-size: var(--fs-sm);
      font-family: var(--sans);
      outline: none;
      transition: border-color 0.2s ease;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      border-color: var(--accent);
    }
    .form-group textarea { resize: vertical; min-height: 70px; }

    /* ── 单调背景纹理 ── */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      z-index: -1;
      background:
        radial-gradient(ellipse at 20% 50%, rgba(91, 141, 239, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(52, 211, 153, 0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(167, 139, 250, 0.04) 0%, transparent 50%);
      pointer-events: none;
    }

    /* ── 页脚 ── */
    footer {
      text-align: center;
      padding: 2.5rem 1rem;
      color: var(--text-tertiary);
      font-size: var(--fs-xs);
      border-top: 1px solid rgba(255,255,255,0.04);
      margin-top: 3rem;
    }

    /* ── 统计数字（用于黑名单页等） ── */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      text-align: center;
      padding: 1.2rem 0.8rem;
    }
    .stat-card .value {
      font-size: var(--fs-2xl);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .stat-card .label {
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
      margin-top: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ── 响应式 ── */
    @media (max-width: 768px) {
      nav { padding: 0 1rem; flex-wrap: wrap; height: auto; min-height: 48px; gap: 0; }
      nav .nav-links {
        width: 100%;
        overflow-x: auto;
        padding: 0.3rem 0;
        gap: 0;
        -webkit-overflow-scrolling: touch;
      }
      nav a { white-space: nowrap; font-size: 0.78rem; padding: 0.3rem 0.6rem; }
      nav .logo { font-size: var(--fs-base); padding: 0.5rem 0; }
      main { padding: 1rem; }
      .card { padding: 1rem; }
      table { font-size: 0.75rem; }
      th, td { padding: 0.5rem 0.3rem; }
      .search-box { flex-direction: column; }
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
