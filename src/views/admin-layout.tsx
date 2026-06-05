import { html } from 'hono/html'
import { escHtml, escAttr } from '../helpers/escape'

type AdminLayoutProps = {
  title: string;
  currentPath: string;
  children: any;
  admin: { game_name: string; permission_group: string };
}

function isActive(currentPath: string, pattern: string): boolean {
  switch (pattern) {
    case '/admin/bans':
      return currentPath.startsWith('/admin/bans') && !currentPath.includes('/process') && !currentPath.includes('/watch')
    case '/admin/process':
      return currentPath.startsWith('/admin/process')
    case '/admin/watchlist':
      return currentPath.startsWith('/admin/watchlist')
    case '/admin/archive':
      return currentPath.startsWith('/admin/archive')
    case '/account':
      return currentPath === '/account'
    default:
      return false
  }
}

export function AdminLayout({ title, currentPath, children, admin }: AdminLayoutProps) {
  const sidebarItems = [
    { label: '封禁管理', icon: '📋', href: '/admin/bans', pattern: '/admin/bans' },
    { label: '处理', icon: '⚙️', href: '/admin/process', pattern: '/admin/process' },
    { label: '重点观察', icon: '👁', href: '/admin/watchlist', pattern: '/admin/watchlist' },
    { label: '归档日志', icon: '📦', href: '/admin/archive', pattern: '/admin/archive' },
    { label: '账户', icon: '👤', href: '/account', pattern: '/account' },
    { label: '退出', icon: '🚪', href: '/logout', pattern: '/logout' },
  ]

  return html`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(title)} — 鸡蛋肠粉封禁查询</title>
  <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  <style>
    /* ══════════════════════════════════════════════
       管理后台 — 侧边栏布局
       ══════════════════════════════════════════════ */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
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
      --glass-bg: rgba(255, 255, 255, 0.04);
      --glass-border: rgba(255, 255, 255, 0.08);
      --glass-blur: 24px;
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
      --sidebar-width: 200px;
    }
    html { font-size: 16px; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    body {
      font-family: var(--sans);
      font-size: var(--fs-base);
      line-height: var(--lh-base);
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
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

    /* ── 玻璃态 ── */
    .glass {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
    }

    /* ── 顶部窄栏 ── */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 1.25rem;
      background: rgba(11, 11, 18, 0.85);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-bottom: 1px solid var(--glass-border);
      position: sticky;
      top: 0;
      z-index: 60;
    }
    .topbar .logo {
      font-weight: 700;
      font-size: var(--fs-base);
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #5b8def, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
    }
    .topbar .back-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--fs-sm);
      font-weight: 500;
      padding: 0.3rem 0.7rem;
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;
    }
    .topbar .back-link:hover {
      color: var(--text);
      background: rgba(255,255,255,0.06);
    }

    /* ── 主体布局 ── */
    .admin-body {
      display: flex;
      min-height: calc(100vh - 48px);
    }

    /* ── 侧边栏 ── */
    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      background: rgba(16, 16, 26, 0.6);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-right: 1px solid var(--glass-border);
      padding: 1rem 0;
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 48px;
      height: calc(100vh - 48px);
      overflow-y: auto;
    }
    .sidebar-nav {
      list-style: none;
      padding: 0;
      margin: 0;
      flex: 1;
    }
    .sidebar-nav li { margin: 0; }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.6rem 1.25rem;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: var(--fs-sm);
      font-weight: 500;
      transition: all 0.15s ease;
      border-left: 3px solid transparent;
    }
    .sidebar-nav a:hover {
      color: var(--text);
      background: rgba(255,255,255,0.04);
    }
    .sidebar-nav a.active {
      color: var(--text);
      background: rgba(91, 141, 239, 0.1);
      border-left-color: var(--accent);
    }
    .sidebar-nav a .icon {
      font-size: 1rem;
      width: 1.2rem;
      text-align: center;
      flex-shrink: 0;
    }

    /* ── 侧边栏底部（管理员信息） ── */
    .sidebar-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--glass-border);
      font-size: var(--fs-xs);
      color: var(--text-tertiary);
    }
    .sidebar-footer .game-name {
      color: var(--text-secondary);
      font-weight: 500;
    }
    .sidebar-footer .perm-group {
      display: inline-block;
      margin-top: 0.2rem;
      padding: 0.1rem 0.4rem;
      border-radius: 3px;
      background: rgba(91, 141, 239, 0.1);
      color: var(--blue);
      font-size: 0.65rem;
      font-weight: 600;
    }

    /* ── 内容区 ── */
    .content {
      flex: 1;
      padding: 1.5rem 2rem;
      overflow-x: hidden;
      max-width: calc(100vw - var(--sidebar-width));
    }
    .content h1 {
      font-size: var(--fs-xl);
      font-weight: 600;
      letter-spacing: -0.02em;
      margin-bottom: 1.25rem;
    }

    /* ── 卡片 ── */
    .card {
      background: var(--glass-bg);
      backdrop-filter: blur(var(--glass-blur));
      -webkit-backdrop-filter: blur(var(--glass-blur));
      border: 1px solid var(--glass-border);
      border-radius: var(--radius);
      padding: 1.75rem;
      overflow-x: auto;
      transition: border-color 0.3s ease;
    }
    .card:hover { border-color: rgba(255,255,255,0.12); }

    /* ── 表格 ── */
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
    tbody tr { transition: background 0.15s ease; }
    tbody tr:hover { background: rgba(255,255,255,0.03); }
    tbody tr:last-child td { border-bottom: none; }

    /* ── 徽章 ── */
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

    /* ── 模态框 ── */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 100;
      align-items: center;
      justify-content: center;
    }
    .modal-overlay.open { display: flex; }
    .modal-content {
      max-width: 500px;
      width: 90%;
    }

    /* ── 消息提示 ── */
    .message {
      padding: 0.6rem 1rem;
      border-radius: var(--radius-sm);
      font-size: var(--fs-sm);
      margin-bottom: 1rem;
      display: none;
    }
    .message.success {
      display: block;
      background: rgba(52, 211, 153, 0.1);
      color: var(--green);
      border: 1px solid rgba(52, 211, 153, 0.2);
    }
    .message.error {
      display: block;
      background: rgba(248, 113, 113, 0.1);
      color: var(--red);
      border: 1px solid rgba(248, 113, 113, 0.2);
    }

    /* ── 响应式 ── */
    @media (max-width: 768px) {
      .sidebar { width: 56px; }
      .sidebar-nav a span { display: none; }
      .sidebar-nav a { justify-content: center; padding: 0.6rem; }
      .sidebar-footer { display: none; }
      .content { padding: 1rem; max-width: calc(100vw - 56px); }
    }
  </style>
</head>
<body>
  <!-- 顶部窄栏 -->
  <div class="topbar">
    <a href="/" class="logo">🔍 鸡蛋肠粉封禁查询</a>
    <a href="/" class="back-link">← 返回首页</a>
  </div>

  <!-- 主体 -->
  <div class="admin-body">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <ul class="sidebar-nav">
        ${sidebarItems.map(item => html`
          <li>
            <a href="${escAttr(item.href)}"
               class="${isActive(currentPath, item.pattern) ? 'active' : ''}"
               data-pattern="${escAttr(item.pattern)}">
              <span class="icon">${item.icon}</span>
              <span>${escHtml(item.label)}</span>
            </a>
          </li>
        `)}
      </ul>
      <div class="sidebar-footer">
        <div class="game-name">${escHtml(admin.game_name || '未设置')}</div>
        <span class="perm-group">${escHtml(admin.permission_group)}</span>
      </div>
    </aside>

    <!-- 内容区 -->
    <main class="content">
      ${children}
    </main>
  </div>

  <script>
    (function() {
      // 侧边栏高亮
      var links = document.querySelectorAll('.sidebar-nav a');
      links.forEach(function(a) {
        if (a.classList.contains('active')) return;
        var pattern = a.dataset.pattern;
        var cp = window.location.pathname;
        if (pattern === '/admin/bans' && cp.startsWith('/admin/bans') && !cp.includes('/process') && !cp.includes('/watch')) {
          a.classList.add('active');
        } else if (pattern === '/admin/process' && cp.startsWith('/admin/process')) {
          a.classList.add('active');
        } else if (pattern === '/admin/watchlist' && cp.startsWith('/admin/watchlist')) {
          a.classList.add('active');
        } else if (pattern === '/admin/archive' && cp.startsWith('/admin/archive')) {
          a.classList.add('active');
        } else if (pattern === '/account' && cp === '/account') {
          a.classList.add('active');
        }
      });
    })();
  </script>
</body>
</html>`
}
