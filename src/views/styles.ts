import { html } from 'hono/html'

export const Styles = () => html`
<style id="cyber-styles">
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@600;700;800&display=swap');

*, *::before, *::after { margin:0;padding:0;box-sizing:border-box; }

:root {
  --sans: 'Space Grotesk', sans-serif;
  --body: 'DM Sans', sans-serif;
  --mono: 'JetBrains Mono', monospace;
  --display: 'Orbitron', sans-serif;

  --bg-primary: #000000;
  --bg-secondary: #0a0a0a;
  --bg-tertiary: #111111;
  --bg-elevated: #1a1a1a;

  --cyan: #00f0ff;
  --magenta: #ff00aa;
  --amber: #ffb000;
  --green: #00ff88;
  --red: #ff3355;

  --cyan-dim: rgba(0,240,255,.12);
  --blue: #0088ff;
  --blue-dim: rgba(0,136,255,.12);
  --magenta-dim: rgba(255,0,170,.10);
  --amber-dim: rgba(255,176,0,.10);

  --label-1: #f0f0f0;
  --label-2: #c0c0c0;
  --label-3: #aaaaaa;
  --separator: rgba(255,255,255,.10);

  --glow-cyan: 0 0 20px rgba(0,240,255,.3);
  --glow-magenta: 0 0 20px rgba(255,0,170,.3);
  --glow-amber: 0 0 20px rgba(255,176,0,.2);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --glass-bg: transparent;
  --glass-bg-hover: rgba(255,255,255,.06);
  --glass-border: rgba(255,255,255,.2);
  --glass-border-hover: rgba(255,255,255,.35);

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

html { background: var(--bg-primary); color: var(--label-1); font-family: var(--body); font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; overflow-x: hidden; color-scheme: dark; }
body { min-height: 100vh; position: relative; }
a { color: var(--cyan); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Background photo layer — 3.jpg is the default; preload fills cache silently */
.bg-image {
  position: fixed; inset: 0; z-index: -3;
  background-image: url('/images/bg/3.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  will-change: transform;
}
.bg-image::after {
  content: ''; position: absolute; inset: 0;
  background: rgba(0,0,0,.45);
}
body::before {
  content: ''; position: fixed; inset: 0; z-index: -4;
  background: #000;
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 1px,
    rgba(255,255,255,.008) 1px,
    rgba(255,255,255,.008) 2px
  );
}

/* Mesh gradient background */
.mesh-bg {
  position: fixed; inset: 0; z-index: -2; overflow: hidden; pointer-events: none;
  will-change: transform;
}
.mesh-sphere {
  position: absolute; border-radius: 50%; filter: blur(40px); opacity: .35;
  animation: meshDrift 40s ease-in-out infinite;
}
.mesh-sphere:nth-child(1) { width:300px;height:300px;top:-5%;left:-3%;background:var(--cyan);opacity:.12;animation-delay:0s; }
.mesh-sphere:nth-child(2) { width:250px;height:250px;bottom:-5%;right:-2%;background:#0066ff;opacity:.10;animation-delay:-13s; }
.mesh-sphere:nth-child(3) { width:180px;height:180px;top:45%;left:50%;background:var(--amber);opacity:.06;animation-delay:-26s; }

@keyframes meshDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(30px,-20px) scale(1.05); }
  66% { transform: translate(-15px,25px) scale(.95); }
}

/* Announcements title glow animation */
@keyframes announceGlow {
  0%,100% { filter: brightness(1) saturate(1); }
  50% { filter: brightness(1.3) saturate(1.2); }
}

/* Grain texture overlay */
body::after {
  content: ''; position: fixed; inset: 0; z-index: -1;
  opacity: .03;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQoU2NkYPj/n4EBCxgVqBQwAABbMAn/5e9KKQAAAABJRU5ErkJggg==");
  background-size: 10px 10px;
  pointer-events: none;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--separator); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--label-3); }

/* ─── Glass (transparent + white border, no blur) ─── */
.cyber-glass, .cyber-glass-sm, .cyber-card, .cyber-stat-card,
.cyber-table-wrap, .cyber-btn, .cyber-search, .cyber-input,
.cyber-pagination button, .cyber-pagination a,
.cyber-grouped {
  background: transparent;
  border: 1px solid var(--glass-border);
}

/* ─── Buttons ─── */
.cyber-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: var(--radius-sm);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all .2s;
  color: var(--label-1);
}
.cyber-btn:hover { background: var(--glass-bg-hover); }
.cyber-btn:active { transform: scale(.97); }
.cyber-btn-primary {
  background: linear-gradient(135deg,var(--cyan),#0088ff);
  border: none;
  color: #000; font-weight: 600; box-shadow: var(--glow-cyan);
}
.cyber-btn-primary:hover { box-shadow: 0 0 30px rgba(0,240,255,.5); transform: translateY(-1px); }
.cyber-btn-primary:active { transform: scale(.97); }
.cyber-btn-ghost { background: transparent; color: var(--label-2); padding: 6px 12px; font-size: 13px; border: none; }
.cyber-btn-ghost:hover { background: rgba(255,255,255,.06); color: var(--label-1); }
.cyber-btn-danger { background: transparent; color: var(--red); padding: 6px 12px; font-size: 13px; border: none; }
.cyber-btn-danger:hover { background: rgba(255,51,85,.12); }
.cyber-btn-small { padding: 4px 10px; font-size: 12px; }

:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
.cyber-btn:focus-visible:not(:active),
.cyber-segmented button:focus-visible:not(:active),
.sidebar-link:focus-visible:not(:active),
.sheet-close:focus-visible:not(:active),
.cyber-pagination a:focus-visible:not(:active),
.cyber-pagination button:focus-visible:not(:active) {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}

/* ─── Cards ─── */
.cyber-card {
  position: relative;
  border-radius: var(--radius-md); padding: var(--spacing-lg);
  transition: border-color .25s, transform .25s, box-shadow .25s;
}
.cyber-card::before {
  content: ''; position: absolute; z-index: 0; inset: -1px;
  pointer-events: none; opacity: 0; transition: opacity .35s;
  border-radius: inherit;
  background:
    linear-gradient(to right, var(--cyan) 2px, transparent 2px) 0 0 / 16px 2px no-repeat,
    linear-gradient(to bottom, var(--cyan) 2px, transparent 2px) 0 0 / 2px 16px no-repeat,
    linear-gradient(to left, var(--magenta) 2px, transparent 2px) 100% 0 / 16px 2px no-repeat,
    linear-gradient(to bottom, var(--magenta) 2px, transparent 2px) 100% 0 / 2px 16px no-repeat,
    linear-gradient(to right, var(--cyan) 2px, transparent 2px) 0 100% / 16px 2px no-repeat,
    linear-gradient(to top, var(--cyan) 2px, transparent 2px) 0 100% / 2px 16px no-repeat,
    linear-gradient(to left, var(--magenta) 2px, transparent 2px) 100% 100% / 16px 2px no-repeat,
    linear-gradient(to top, var(--magenta) 2px, transparent 2px) 100% 100% / 2px 16px no-repeat;
}
.cyber-card:hover::before { opacity: 1; }
.cyber-card > * { position: relative; z-index: 1; }
.cyber-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
}

/* ─── Table ─── */
.cyber-table-wrap {
  overflow-x: auto;
  border-radius: var(--radius-md);
}
.cyber-table {
  width: 100%; border-collapse: collapse;
  font-family: var(--body); font-size: 14px;
}
.cyber-table thead { background: rgba(255,255,255,.05); }
.cyber-table th {
  padding: 12px var(--spacing-sm); text-align: left;
  font-family: var(--sans); font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px;
  color: var(--label-3); border-bottom: 1px solid var(--separator); white-space: nowrap;
}
.cyber-table td { padding: 12px var(--spacing-sm); border-bottom: 1px solid rgba(255,255,255,.04); }
.cyber-table tr:last-child td { border-bottom: none; }
.cyber-table tr:hover td { background: rgba(255,255,255,.04); }

/* ─── HTMX loading state ─── */
#list-wrap.htmx-request .cyber-table-wrap { position: relative; }
#list-wrap.htmx-request .cyber-table-wrap::after {
  content: ''; position: absolute; inset: 0; z-index: 5;
  background: rgba(0,0,0,.4);
}
#list-wrap.htmx-request .cyber-table-wrap::before {
  content: ''; position: absolute; top: 50%; left: 50%; z-index: 6;
  width: 28px; height: 28px; margin: -14px 0 0 -14px;
  border: 3px solid var(--glass-border);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: htmx-spin .7s linear infinite;
}
#list-wrap.htmx-request .glass-table-wrap { position: relative; }
#list-wrap.htmx-request .glass-table-wrap::after {
  content: ''; position: absolute; inset: 0; z-index: 5;
  background: rgba(0,0,0,.4);
  border-radius: 18px;
}
#list-wrap.htmx-request .glass-table-wrap::before {
  content: ''; position: absolute; top: 50%; left: 50%; z-index: 6;
  width: 28px; height: 28px; margin: -14px 0 0 -14px;
  border: 3px solid rgba(255,255,255,0.1);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: htmx-spin .7s linear infinite;
}
@keyframes htmx-spin { to { transform: rotate(360deg); } }

/* ─── Badges ─── */
.cyber-badge {
  display: inline-block; padding: 2px 10px; border-radius: 100px;
  font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: .3px;
  text-transform: uppercase;
}
.cyber-badge-cyan { background: var(--cyan-dim); color: var(--cyan); }
.cyber-badge-magenta { background: var(--magenta-dim); color: var(--magenta); }
.cyber-badge-amber { background: var(--amber-dim); color: var(--amber); }
.cyber-badge-green { background: rgba(0,255,136,.12); color: var(--green); }
.cyber-badge-red { background: rgba(255,51,85,.15); color: #ff4466; border: 1px solid rgba(255,51,85,.25); }
.cyber-badge-neutral { background: var(--glass-bg); color: var(--label-2); border: 1px solid var(--glass-border); }

/* ─── Search ─── */
.cyber-search {
  display: flex; align-items: center; gap: 8px;
  border-radius: var(--radius-sm); padding: 0 12px;
  transition: border-color .2s;
}
.cyber-search:focus-within { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(0,240,255,.12); }
.cyber-search input {
  flex: 1; background: none; border: none; outline: none;
  font-family: var(--body); font-size: 14px; color: var(--label-1);
  padding: 10px 0;
}
.cyber-search input::placeholder { color: var(--label-3); }

/* ─── Segmented Control ─── */
.cyber-segmented {
  display: inline-flex;
  border: 1px solid var(--glass-border); border-radius: var(--radius-sm);
  overflow: hidden;
}
.cyber-segmented button {
  padding: 6px 16px; border: none; background: transparent;
  font-family: var(--sans); font-size: 13px; font-weight: 500;
  color: var(--label-3); cursor: pointer; transition: all .2s;
}
.cyber-segmented button.active {
  background: var(--cyan); color: #000; font-weight: 600;
}

/* ─── Centered Modal ─── */
.cyber-sheet-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0,0,0,.6);
  opacity: 0; pointer-events: none; transition: opacity .3s;
  display: flex; align-items: flex-start; justify-content: center;
  padding: 64px 0;
  overflow-y: auto;
}
.cyber-sheet-overlay.open { opacity: 1; pointer-events: auto; }
.cyber-sheet {
  width: 100%; max-width: 520px;
  background: rgba(0,0,0,.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-lg);
  transform: scale(.95); transition: transform .3s cubic-bezier(.32,.72,0,1);
  margin: auto;
}
.cyber-sheet-overlay.open .cyber-sheet { transform: scale(1); }
.sheet-header { display: flex; justify-content: space-between; align-items: center; }
.sheet-title { font-family: var(--sans); font-size: 18px; font-weight: 600; }
.sheet-close { background: none; border: none; color: var(--label-3); font-family: var(--body); font-size: 18px; cursor: pointer; width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center; }
.sheet-close:hover { background:rgba(255,255,255,.1); color: var(--label-1); }

/* ─── Toast ─── */
.cyber-toast {
  position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
  padding: 10px 24px; border-radius: var(--radius-sm);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  color: #000; z-index: 2000;
  opacity: 0; transition: opacity .3s;
  pointer-events: none;
}
.cyber-toast.show { opacity: 1; }
.cyber-toast.success { background: var(--green); }
.cyber-toast.error { background: var(--red); color: #fff; }

/* ─── Stats ─── */
.cyber-stats {
  display: grid; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); gap: var(--spacing-md);
}
.cyber-stat-card {
  border-radius: var(--radius-md); padding: var(--spacing-md);
  text-align: center; transition: border-color .25s, transform .25s, box-shadow .25s;
}
.cyber-stat-card:hover {
  border-color: var(--glass-border-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}
.cyber-stat-value {
  font-family: var(--sans); font-size: 28px; font-weight: 700;
  background: linear-gradient(135deg,var(--cyan),#0088ff);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cyber-stat-value.stat-cyan { background: linear-gradient(135deg,var(--cyan),#00b8cc); -webkit-background-clip: text; background-clip: text; }
.cyber-stat-value.stat-amber { background: linear-gradient(135deg,var(--amber),#cc8800); -webkit-background-clip: text; background-clip: text; }
.cyber-stat-value.stat-magenta { background: linear-gradient(135deg,var(--magenta),#cc0088); -webkit-background-clip: text; background-clip: text; }
.cyber-stat-value.stat-red { background: linear-gradient(135deg,var(--red),#cc2244); -webkit-background-clip: text; background-clip: text; }
.cyber-stat-label { font-size: 13px; color: var(--label-3); margin-top: 4px; }

/* ─── Pagination ─── */
.cyber-pagination {
  display: flex; align-items: center; justify-content: center; gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
}
.cyber-pagination button, .cyber-pagination a {
  padding: 6px 14px; border-radius: var(--radius-sm);
  color: var(--label-2);
  font-family: var(--sans); font-size: 13px; cursor: pointer; transition: all .2s;
  text-decoration: none; line-height: 1.4;
}
.cyber-pagination button:hover, .cyber-pagination a:hover { border-color: var(--cyan); color: var(--label-1); }
.cyber-pagination button.active, .cyber-pagination a.active { background: var(--cyan); color: #000; border-color: var(--cyan); font-weight: 600; backdrop-filter: none; }
.cyber-pagination .current {
  padding: 6px 14px; border: 1px solid var(--cyan); border-radius: var(--radius-sm);
  background: var(--cyan); color: #000;
  font-family: var(--sans); font-size: 13px; font-weight: 600; line-height: 1.4;
}
.cyber-pagination button:disabled, .cyber-pagination a:disabled { opacity: .3; cursor: default; }

/* ─── Grouped List ─── */
.cyber-grouped {
  border-radius: var(--radius-md); overflow: hidden;
}
.cyber-grouped-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px var(--spacing-md);
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.cyber-grouped-item:last-child { border-bottom: none; }
.cyber-grouped-label { font-size: 14px; color: var(--label-2); }
.cyber-grouped-value { font-family: var(--sans); font-size: 14px; font-weight: 500; color: var(--label-1); }

/* ─── Sidebar ─── */
.cyber-sidebar {
  width: min(200px, 60vw); min-height: 100vh;
  border-right: 1px solid var(--glass-border);
  display: flex; flex-direction: column; padding: var(--spacing-md) 0;
  position: sticky; top: 0;
}
.cyber-sidebar .sidebar-brand {
  padding: var(--spacing-md) var(--spacing-lg) var(--spacing-xl);
  font-family: var(--sans); font-size: 20px; font-weight: 700;
  background: linear-gradient(135deg,var(--cyan),var(--magenta));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cyber-sidebar .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; padding: 0 var(--spacing-sm); }
.cyber-sidebar .sidebar-link {
  display: flex; align-items: center; gap: 10px;
  padding: 10px var(--spacing-md); border-radius: var(--radius-sm);
  font-family: var(--sans); font-size: 14px; font-weight: 500;
  color: var(--label-2); text-decoration: none; transition: all .2s;
  position: relative;
}
.cyber-sidebar .sidebar-link:hover { background: rgba(255,255,255,.10); color: var(--label-1); text-decoration: none; }
.cyber-sidebar .sidebar-link.active { background: var(--cyan-dim); color: var(--cyan); }
.cyber-sidebar .sidebar-link.active::before {
  content: ''; position: absolute; left: 0; top: 50%;
  width: 3px; height: 18px; background: var(--cyan);
  border-radius: 0 2px 2px 0;
  transform: translateY(-50%);
  box-shadow: 0 0 8px rgba(0,240,255,.4);
}
.cyber-sidebar .sidebar-footer {
  padding: var(--spacing-sm); border-top: 1px solid var(--separator); margin-top: auto;
}
.cyber-sidebar .sidebar-footer .sidebar-link { padding: 8px var(--spacing-sm); border-radius: var(--radius-sm); }
.cyber-sidebar .sidebar-footer .sidebar-link:hover { background: rgba(255,255,255,.10); }
/* ─── Main content padding for fixed nav ─── */
.cyber-main { padding-bottom: 64px; min-height: calc(100vh - 64px); }

/* ─── Scroll Progress Bar ─── */
#scroll-progress {
  position: fixed; top: 0; left: 0; z-index: 999;
  height: 2px; background: linear-gradient(90deg,var(--cyan),#0088ff);
  transform-origin: left center; will-change: transform;
  box-shadow: 0 0 12px rgba(0,240,255,.4);
}
@media (max-width: 768px) {
  #scroll-progress { height: 3px; }
}

/* ─── Navigation ─── */
@keyframes navBorderGlow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
@keyframes navGlowPulse {
  0%, 100% { opacity: .5; }
  50% { opacity: 1; }
}

.cyber-nav {
  display: flex; align-items: center; justify-content: center;
  position: fixed; left: 0; right: 0; z-index: 100;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  bottom: 0; top: auto;
  height: 60px; padding: 0 var(--spacing-md);
}
.cyber-nav::before {
  content: ''; position: absolute; left: 0; right: 0; top: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--cyan) 20%, #0088ff 50%, var(--cyan) 80%, transparent 100%);
  background-size: 200% 100%;
  animation: navBorderGlow 6s ease-in-out infinite;
  box-shadow: 0 0 18px rgba(0,240,255,.3), 0 0 40px rgba(0,136,255,.1);
}

.nav-brand {
  display: flex; align-items: center;
  font-family: var(--sans); font-size: 16px; font-weight: 700;
  letter-spacing: -.3px;
  user-select: none;
  gap: 6px;
}
.nav-brand-text {
  background: linear-gradient(135deg, var(--cyan), var(--magenta));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 12px rgba(0,240,255,.4));
}
.nav-brand-sub {
  display: none;
}
.nav-brand-emoji {
  -webkit-text-fill-color: var(--label-3);
  font-weight: 400; font-size: 14px;
}

.nav-links {
  display: flex; gap: 1px;
  width: 100%; max-width: 380px;
  justify-content: center;
}

.cyber-nav a {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px;
  padding: 8px 6px 6px;
  font-family: var(--sans); font-size: 10px; font-weight: 500;
  color: var(--label-3); text-decoration: none;
  transition: color .25s, background .25s, transform .2s;
  position: relative;
  border-radius: var(--radius-sm);
  letter-spacing: .3px;
  text-transform: uppercase;
}
.cyber-nav a:hover {
  color: var(--label-1);
  background: rgba(255,255,255,.03);
  text-decoration: none;
}
.cyber-nav a.active {
  color: var(--cyan);
}
.cyber-nav a.active svg {
  filter: drop-shadow(0 0 8px rgba(0,240,255,.6));
  transition: filter .25s;
}
.cyber-nav a.active::after {
  content: ''; position: absolute; top: -3px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 3px;
  background: var(--cyan);
  border-radius: 0 0 3px 3px;
  box-shadow: 0 0 12px var(--cyan), 0 0 24px rgba(0,240,255,.3);
  animation: navGlowPulse 2.5s ease-in-out infinite;
}

@media (min-width: 769px) {
  .cyber-main { padding-bottom: 0; padding-top: 64px; min-height: 100vh; }
  .cyber-main-public { padding-bottom: 0; }

  .cyber-nav {
    justify-content: space-between;
    top: 0; bottom: auto;
    height: 56px;
    padding: 0 var(--spacing-xl);
  }
  .cyber-nav::before {
    top: auto; bottom: 0;
    height: 1.5px;
    box-shadow: 0 0 14px rgba(0,240,255,.25), 0 0 30px rgba(255,0,170,.08);
  }

  .nav-brand {
    font-size: 19px; gap: 10px;
  }
  .nav-brand-sub {
    display: inline;
    -webkit-text-fill-color: var(--label-3);
    font-weight: 400; font-size: 13px;
  }
  .nav-brand-emoji { display: none; }

  .nav-links {
    width: auto; max-width: none; gap: 2px;
  }

  .cyber-nav a {
    flex: none;
    flex-direction: row; gap: 8px;
    padding: 8px 18px;
    font-size: 13px; font-weight: 500;
    color: var(--label-2);
    text-transform: none;
    letter-spacing: 0;
  }
  .cyber-nav a:hover {
    background: rgba(255,255,255,.04);
  }
  .cyber-nav a.active {
    background: rgba(0,240,255,.07);
    color: var(--cyan);
  }
  .cyber-nav a.active::after {
    top: auto; bottom: -1px;
    width: 60%; height: 2px;
    border-radius: 2px 2px 0 0;
  }
  .cyber-nav a.active svg {
    filter: drop-shadow(0 0 10px rgba(0,240,255,.7));
  }

  .cyber-nav a:not(.active):hover {
    background: rgba(255,255,255,.04);
    color: var(--label-1);
  }
  .cyber-nav a:not(.active):hover svg {
    opacity: .8;
  }
}

/* ─── Form ─── */
.cyber-form-group { margin-bottom: var(--spacing-md); }
.cyber-form-group label {
  display: block; font-family: var(--sans); font-size: 12px; font-weight: 600;
  color: var(--label-3); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .5px;
}
.cyber-input {
  width: 100%; padding: 10px 12px; border-radius: var(--radius-sm);
  font-family: var(--body); font-size: 14px; color: var(--label-1);
  background: rgba(0,0,0,.45); outline: none; transition: border-color .2s;
}
.cyber-input:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(0,240,255,.12); }
.cyber-input::placeholder { color: var(--label-3); }
textarea.cyber-input { resize: vertical; min-height: 60px; }
select.cyber-input { appearance: none; cursor: pointer; background: rgba(0,0,0,.45); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
select.cyber-input option { background: rgba(0,0,0,.45); color: var(--label-1); }

/* ─── Admin Content ─── */
.cyber-admin-content {
  max-width: min(1200px, calc(100vw - 280px));
  margin: 0 auto;
}

/* ─── Sheet body form enhancements ─── */
.sheet-body {
  padding: var(--spacing-sm) 0;
}
.sheet-body .cyber-input {
  font-size: 15px;
  padding: 12px 14px;
}
.sheet-body .cyber-form-group {
  margin-bottom: var(--spacing-lg);
}
.sheet-body .cyber-form-group label {
  font-size: 13px;
  margin-bottom: 8px;
}

/* ─── Empty State ─── */
.cyber-empty {
  text-align: center; padding: 3rem var(--spacing-lg);
  color: var(--label-3); font-size: 15px;
}

/* ─── Skeleton ─── */
.cyber-skeleton {
  background: linear-gradient(90deg,var(--bg-elevated) 25%,var(--bg-tertiary) 50%,var(--bg-elevated) 75%);
  background-size: 200% 100%; animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }

/* ─── Load More ─── */
.cyber-loadmore {
  text-align: center; padding: var(--spacing-lg);
}
.cyber-loadmore button {
  padding: 8px 32px;
}

/* ─── Hero Diagonal ─── */
.hero-diagonal { position: relative; }
.hero-diagonal::before {
  content: ''; position: absolute; top: 0; left: -999px; right: -999px; z-index: -1;
  height: 300px;
  background: linear-gradient(135deg, rgba(0,240,255,.06) 0%, transparent 50%, rgba(255,0,170,.03) 100%);
  clip-path: polygon(0 0, 100% 0, 100% 55%, 0 100%);
  pointer-events: none;
}

/* ─── Page Titles (admin) ─── */
.page-title {
  font-family: var(--display); font-size: 22px; font-weight: 700;
  letter-spacing: -.02em;
  background: linear-gradient(135deg,var(--cyan),var(--magenta));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ─── Entrance animations ─── */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes slideInRight {
  from { opacity: 0; transform: translateX(24px); }
  to { opacity: 1; transform: translateX(0); }
}

.cyber-page { animation: fadeInUp .45s ease-out both; }
.cyber-title { font-family: var(--display); animation: fadeInUp .5s ease-out both; letter-spacing: -.02em; }
.cyber-count { animation: fadeIn .4s ease-out both; }

.cyber-stats .cyber-stat-card {
  animation: fadeInUp .4s ease-out both;
}
.cyber-stats .cyber-stat-card:nth-child(1) { animation-delay: .08s; }
.cyber-stats .cyber-stat-card:nth-child(2) { animation-delay: .16s; }
.cyber-stats .cyber-stat-card:nth-child(3) { animation-delay: .24s; }
.cyber-stats .cyber-stat-card:nth-child(4) { animation-delay: .32s; }

#list-wrap .cyber-table tbody tr {
  animation: slideInRight .35s ease-out both;
}
#list-wrap .cyber-table tbody tr:nth-child(1) { animation-delay: 0s; }
#list-wrap .cyber-table tbody tr:nth-child(2) { animation-delay: .03s; }
#list-wrap .cyber-table tbody tr:nth-child(3) { animation-delay: .06s; }
#list-wrap .cyber-table tbody tr:nth-child(4) { animation-delay: .09s; }
#list-wrap .cyber-table tbody tr:nth-child(5) { animation-delay: .12s; }
#list-wrap .cyber-table tbody tr:nth-child(6) { animation-delay: .15s; }
#list-wrap .cyber-table tbody tr:nth-child(7) { animation-delay: .18s; }
#list-wrap .cyber-table tbody tr:nth-child(8) { animation-delay: .21s; }
#list-wrap .cyber-table tbody tr:nth-child(9) { animation-delay: .24s; }
#list-wrap .cyber-table tbody tr:nth-child(10) { animation-delay: .27s; }

/* Admin table row entrance */
.cyber-admin-content .cyber-table tbody tr {
  animation: slideInRight .35s ease-out both;
}
.cyber-admin-content .cyber-table tbody tr:nth-child(1) { animation-delay: 0s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(2) { animation-delay: .03s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(3) { animation-delay: .06s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(4) { animation-delay: .09s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(5) { animation-delay: .12s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(6) { animation-delay: .15s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(7) { animation-delay: .18s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(8) { animation-delay: .21s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(9) { animation-delay: .24s; }
.cyber-admin-content .cyber-table tbody tr:nth-child(10) { animation-delay: .27s; }

/* Glass table row entrance (admin) */
.cyber-admin-content .glass-table tbody tr {
  animation: slideInRight .35s ease-out both;
}
.cyber-admin-content .glass-table tbody tr:nth-child(1) { animation-delay: 0s; }
.cyber-admin-content .glass-table tbody tr:nth-child(2) { animation-delay: .03s; }
.cyber-admin-content .glass-table tbody tr:nth-child(3) { animation-delay: .06s; }
.cyber-admin-content .glass-table tbody tr:nth-child(4) { animation-delay: .09s; }
.cyber-admin-content .glass-table tbody tr:nth-child(5) { animation-delay: .12s; }
.cyber-admin-content .glass-table tbody tr:nth-child(6) { animation-delay: .15s; }
.cyber-admin-content .glass-table tbody tr:nth-child(7) { animation-delay: .18s; }
.cyber-admin-content .glass-table tbody tr:nth-child(8) { animation-delay: .21s; }
.cyber-admin-content .glass-table tbody tr:nth-child(9) { animation-delay: .24s; }
.cyber-admin-content .glass-table tbody tr:nth-child(10) { animation-delay: .27s; }

/* ─── Statistics Charts ─── */
.charts-row {
  display: flex; gap: var(--spacing-md);
}
.chart-container {
  flex: 1; min-width: 0;
}
.chart-container canvas {
  width: 100% !important;
}
.stats-cards-row {
  display: flex; gap: var(--spacing-md);
}
.stats-cards-row .cyber-stat-card,
.stats-cards-row .stat-card {
  flex: 1;
}
.chart-section-title {
  font-family: var(--sans); font-size: 16px; font-weight: 600;
  color: var(--label-1); margin-bottom: var(--spacing-md);
}
@media (max-width: 768px) {
  .charts-row { flex-direction: column; }
  .stats-cards-row { flex-direction: column; }
  .charts-row { flex-direction: column; align-items: center; }
  .stats-cards-row { flex-direction: column; }
}
/* ─── Visual Redesign v2 — Floating Island Nav ─── */
.nav-island{
  position:fixed;top:20px;left:50%;transform:translateX(-50%);
  z-index:100;
  display:flex;align-items:center;gap:4px;
  padding:6px 8px 6px 20px;
  background:rgba(255,255,255,0.04);
  backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;
  transition:all 0.6s cubic-bezier(0.32,0.72,0,1);
  box-shadow:0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
.nav-island.scrolled{top:12px;padding:4px 6px 4px 16px;background:rgba(0,0,0,0.3);backdrop-filter:blur(32px) saturate(1.6)}
.nav-logo{font-size:15px;font-weight:700;letter-spacing:-0.02em;background:linear-gradient(135deg,#fff 30%,rgba(0,255,255,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-right:12px;white-space:nowrap}
.nav-links{display:flex;align-items:center;gap:2px;list-style:none}
.nav-links a{padding:8px 16px;border-radius:100px;font-size:13px;font-weight:500;letter-spacing:0.01em;color:rgba(255,255,255,0.5);text-decoration:none;transition:all 0.4s cubic-bezier(0.32,0.72,0,1);white-space:nowrap}
.nav-links a:hover,.nav-links a.active{color:#fff;background:rgba(255,255,255,0.08)}
.nav-actions{display:flex;align-items:center;gap:6px;padding-left:12px;margin-left:8px;border-left:1px solid rgba(255,255,255,0.06)}
.nav-actions .btn-ghost{padding:8px 14px;border-radius:100px;border:none;background:transparent;color:rgba(255,255,255,0.5);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.4s;font-family:inherit;line-height:1.2;white-space:nowrap}
.nav-actions .btn-ghost:hover{color:#fff;background:rgba(255,255,255,0.08)}
.btn-primary-island{display:flex;align-items:center;gap:8px;padding:8px 16px 8px 20px;border-radius:100px;border:none;background:rgba(0,255,255,0.15);color:rgba(0,255,255,0.9);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.4s cubic-bezier(0.32,0.72,0,1);font-family:inherit;white-space:nowrap;line-height:1.2;text-decoration:none}
.btn-primary-island:hover{background:rgba(0,255,255,0.25);transform:scale(1.02);text-decoration:none}
.btn-primary-island:active{transform:scale(0.97)}
.btn-primary-island .icon-wrap{width:24px;height:24px;border-radius:50%;background:rgba(0,255,255,0.2);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.4s}
.btn-primary-island:hover .icon-wrap{transform:translateX(2px)scale(1.05);background:rgba(0,255,255,0.3)}

/* ─── Visual Redesign v2 — Hamburger ─── */
.hamburger{display:none;flex-direction:column;justify-content:center;align-items:center;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.05);cursor:pointer;position:relative;transition:all 0.4s}
.hamburger:hover{background:rgba(255,255,255,0.1)}
.hamburger span{display:block;width:16px;height:1.5px;border-radius:2px;background:rgba(255,255,255,0.5);position:absolute;transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.hamburger span:nth-child(1){transform:translateY(-5px)}
.hamburger span:nth-child(2){transform:translateY(5px)}
.hamburger.open span:nth-child(1){transform:rotate(45deg)}
.hamburger.open span:nth-child(2){transform:rotate(-45deg)}
.mobile-menu{position:fixed;inset:0;z-index:90;background:rgba(5,5,5,0.92);backdrop-filter:blur(48px) saturate(1.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;opacity:0;pointer-events:none;transition:all 0.6s cubic-bezier(0.32,0.72,0,1)}
.mobile-menu.open{opacity:1;pointer-events:all}
.mobile-menu a{font-size:24px;font-weight:600;color:rgba(255,255,255,0.4);text-decoration:none;padding:12px 0;opacity:0;transform:translateY(20px);transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.mobile-menu.open a{opacity:1;transform:translateY(0)}
.mobile-menu.open a:nth-child(1){transition-delay:0.1s}
.mobile-menu.open a:nth-child(2){transition-delay:0.15s}
.mobile-menu.open a:nth-child(3){transition-delay:0.2s}
.mobile-menu.open a:nth-child(4){transition-delay:0.25s}
.mobile-menu.open a:nth-child(5){transition-delay:0.3s}
.mobile-menu.open a:nth-child(6){transition-delay:0.35s}
.mobile-menu a:hover{color:#fff}
.mobile-menu .menu-close{position:absolute;top:28px;right:24px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;transition:all 0.3s;font-family:inherit}

/* ─── Visual Redesign v2 — Scroll Reveal ─── */
.reveal{opacity:0;transform:translateY(60px);transition:opacity 0.9s cubic-bezier(0.32,0.72,0,1),transform 0.9s cubic-bezier(0.32,0.72,0,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-60px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-right{opacity:0;transform:translateX(60px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-left.visible,.reveal-right.visible{opacity:1;transform:translateX(0)}
.reveal-scale{opacity:0;transform:scale(0.92);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-scale.visible{opacity:1;transform:scale(1)}
.reveal-blur{opacity:0;filter:blur(8px);transform:translateY(40px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),filter 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-blur.visible{opacity:1;filter:blur(0);transform:translateY(0)}
.stagger-children > *{opacity:0;transform:translateY(30px);transition:opacity 0.6s cubic-bezier(0.32,0.72,0,1),transform 0.6s cubic-bezier(0.32,0.72,0,1)}
.stagger-children.visible > *{opacity:1;transform:translateY(0)}
.stagger-children.visible > *:nth-child(1){transition-delay:0.05s}
.stagger-children.visible > *:nth-child(2){transition-delay:0.10s}
.stagger-children.visible > *:nth-child(3){transition-delay:0.15s}
.stagger-children.visible > *:nth-child(4){transition-delay:0.20s}
.stagger-children.visible > *:nth-child(5){transition-delay:0.25s}
.stagger-children.visible > *:nth-child(6){transition-delay:0.30s}
.stagger-children.visible > *:nth-child(7){transition-delay:0.35s}
.stagger-children.visible > *:nth-child(8){transition-delay:0.40s}

/* ─── Visual Redesign v2 — Hero ─── */
.hero-section{
  min-height:100dvh;display:flex;align-items:center;justify-content:center;
  position:relative;padding:40px 24px 80px;
}
.hero-content{text-align:center;max-width:720px}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 14px;border-radius:100px;
  background:rgba(0,255,255,0.06);border:1px solid rgba(0,255,255,0.08);
  font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;
  color:rgba(0,255,255,0.7);margin-bottom:24px;
}
.hero-eyebrow .dot{width:5px;height:5px;border-radius:50%;background:rgba(0,255,255,0.5);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
.hero-content h1{
  font-size:clamp(42px, 8vw, 88px);font-weight:800;line-height:1.02;letter-spacing:-0.03em;
  background:linear-gradient(180deg,#ffffff 15%,rgba(0,240,255,0.85) 85%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-bottom:20px;
}
.hero-content p{
  font-size:clamp(16px, 2vw, 20px);color:rgba(255,255,255,0.35);
  font-weight:400;max-width:520px;margin:0 auto 36px;line-height:1.7;
}
.scroll-indicator{
  position:absolute;bottom:40px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:8px;
  color:rgba(255,255,255,0.2);font-size:11px;letter-spacing:0.15em;
  animation:scrollHint 2.5s ease-in-out infinite;
}
@keyframes scrollHint{0%,100%{opacity:0.3;transform:translateX(-50%)translateY(0)}50%{opacity:0.8;transform:translateX(-50%)translateY(4px)}}
.scroll-indicator .mouse{width:20px;height:32px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.15);position:relative}
.scroll-indicator .mouse::after{content:'';position:absolute;top:5px;left:50%;transform:translateX(-50%);width:2px;height:6px;border-radius:2px;background:rgba(255,255,255,0.3);animation:scrollWheel 2s ease-in-out infinite}
@keyframes scrollWheel{0%,100%{opacity:0.3;transform:translateX(-50%)translateY(0)}50%{opacity:1;transform:translateX(-50%)translateY(6px)}}

/* ─── Visual Redesign v2 — Hero Search ─── */
.hero-search{
  display:inline-flex;align-items:center;gap:0;
  max-width:520px;width:100%;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;padding:4px;backdrop-filter:blur(12px);
  transition:all 0.4s cubic-bezier(0.32,0.72,0,1);
  margin:0 auto;
}
.hero-search:focus-within{border-color:rgba(0,255,255,0.2);box-shadow:0 0 0 4px rgba(0,255,255,0.05),0 8px 32px rgba(0,0,0,0.3)}
.hero-search input{flex:1;padding:14px 22px;border:none;background:transparent;font-family:inherit;font-size:15px;color:#fff;outline:none}
.hero-search input::placeholder{color:rgba(255,255,255,0.2)}
.hero-search button{padding:12px 28px;border-radius:100px;border:none;background:rgba(0,255,255,0.15);color:rgba(0,255,255,0.9);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.4s}
.hero-search button:hover{background:rgba(0,255,255,0.25)}
.hero-search button:active{transform:scale(0.97)}

/* ─── Visual Redesign v2 — Bento Stats ─── */
.bento-stats{
  display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:12px;
  padding:0 24px;max-width:1280px;margin:0 auto 80px;
}
.bento-card{
  border-radius:20px;padding:2px;
  background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));
  transition:all 0.5s cubic-bezier(0.32,0.72,0,1);
}
.bento-card:hover{background:linear-gradient(135deg,rgba(0,255,255,0.08),rgba(0,136,255,0.04));transform:translateY(-2px)}
.bento-card-inner{background:rgba(8,8,14,0.25);backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);border-radius:18px;padding:24px;height:100%;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}
.bento-card:first-child{grid-column:span 1}
.bento-card:first-child .bento-card-inner{display:flex;align-items:center;gap:20px}
.bento-card:first-child .bento-number{font-size:48px;font-weight:800;letter-spacing:-0.03em;line-height:1;background:linear-gradient(135deg,#fff,rgba(0,255,255,0.6));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bento-label{font-size:12px;font-weight:500;color:rgba(255,255,255,0.3);letter-spacing:0.05em;margin-bottom:8px;text-transform:uppercase}
.bento-number{font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1;color:#fff}
.bento-detail{font-size:12px;color:rgba(255,255,255,0.25);margin-top:6px}

/* ─── Visual Redesign v2 — Glass Table ─── */
.glass-table-wrap{
  border-radius:20px;padding:2px;
  background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));
  margin-bottom:24px;
  overflow-x:auto;
}
.glass-table-inner{background:rgba(10,10,20,0.25);backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);border-radius:18px;overflow-x:auto;overflow-y:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}
.glass-table{width:100%;border-collapse:collapse}
.glass-table thead th{padding:16px 20px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.25);border-bottom:1px solid rgba(255,255,255,0.04);white-space:nowrap}
.glass-table tbody tr{transition:all 0.4s}
.glass-table tbody tr:hover{background:rgba(0,255,255,0.02)}
.glass-table tbody tr:not(:last-child) td{border-bottom:1px solid rgba(255,255,255,0.02)}
.glass-table tbody td{padding:14px 20px;font-size:14px;color:rgba(255,255,255,0.7);white-space:nowrap}

/* ─── Visual Redesign v2 — Badge Variants ─── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.02em}
.badge-cyan{background:rgba(0,255,255,0.08);border:1px solid rgba(0,255,255,0.1);color:rgba(0,255,255,0.7)}
.badge-magenta{background:rgba(255,0,255,0.08);border:1px solid rgba(255,0,255,0.1);color:rgba(255,0,255,0.7)}
.badge-green{background:rgba(0,255,128,0.08);border:1px solid rgba(0,255,128,0.1);color:rgba(0,255,128,0.7)}
.badge-amber{background:rgba(255,200,0,0.08);border:1px solid rgba(255,200,0,0.1);color:rgba(255,200,0,0.7)}
.badge-red{background:rgba(255,51,85,0.12);border:1px solid rgba(255,51,85,0.15);color:rgba(255,51,85,0.7)}
.badge-neutral{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4)}
.badge-neutral{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4)}

/* ─── Visual Redesign v2 — Filter Pills ─── */
.filter-group{display:flex;gap:4px;flex-wrap:wrap}
.filter-pill{padding:7px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:rgba(255,255,255,0.4);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.filter-pill:hover{border-color:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7)}
.filter-pill.active{background:rgba(0,255,255,0.1);border-color:rgba(0,255,255,0.15);color:rgba(0,255,255,0.8)}

/* ─── Visual Redesign v2 — Section Header ─── */
.section-header{padding:0 24px;max-width:1280px;margin:0 auto 24px}
.section-header h2{font-size:clamp(22px, 3vw, 32px);font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:4px}
.section-header p{font-size:14px;color:rgba(255,255,255,0.3)}

/* ─── Visual Redesign v2 — Divider ─── */
.section-divider{display:flex;align-items:center;gap:16px;max-width:80px;margin:0 auto 48px;color:rgba(255,255,255,0.06)}
.section-divider::before,.section-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}

/* ─── Visual Redesign v2 — Pagination ─── */
.glass-pagination{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.04)}
.glass-pagination .info{font-size:12px;color:rgba(255,255,255,0.25)}
.glass-pages{display:flex;gap:4px}
.glass-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,0.3);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.3s;display:flex;align-items:center;justify-content:center}
.glass-page-btn:hover{border-color:rgba(0,255,255,0.1);color:rgba(0,255,255,0.5)}
.glass-page-btn.current{background:rgba(0,255,255,0.1);border-color:rgba(0,255,255,0.15);color:rgba(0,255,255,0.8);font-weight:600}

/* ─── Visual Redesign v2 — Footer ─── */
.footer{text-align:center;padding:40px 24px;border-top:1px solid rgba(255,255,255,0.03);font-size:12px;color:rgba(255,255,255,0.15);max-width:1280px;margin:0 auto}

/* ─── Sticky Search Bar (matches nav-island style) ─── */
.sticky-search-container {
  position: sticky; top: 80px; z-index: 10;
  padding: 6px 0;
  margin: 0 auto;
  transition: all 0.5s cubic-bezier(0.32,0.72,0,1);
}
.sticky-search-container.is-sticky {
  max-width: min(600px, calc(100% - 40px));
  padding: 8px 20px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 100px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
  left: 0; right: 0;
  transform: translateY(-4px) scale(1.02);
}
.sticky-search-container .hero-search {
  max-width: 100%;
  margin: 0;
}

/* ─── Sticky Search Bar (matches nav-island style) ─── */
.sticky-search-container {
  position: sticky; top: 80px; z-index: 10;
  padding: 6px 0;
  margin: 0 auto;
  transition: all 0.5s cubic-bezier(0.32,0.72,0,1);
}
.sticky-search-container.is-sticky {
  max-width: min(600px, calc(100% - 40px));
  padding: 8px 20px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 100px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
  left: 0; right: 0;
  transform: translateY(-4px) scale(1.02);
}
.sticky-search-container .hero-search {
  max-width: 100%;
  margin: 0;
}

/* ─── Visual Redesign v2 — Mobile Responsive ─── */
@media(max-width:1024px){
  .bento-stats{grid-template-columns:1fr 1fr}
  .bento-card:first-child{grid-column:span 2}
}
@media(max-width:768px){
  .nav-links,.nav-actions .btn-ghost{display:none}
  .hamburger{display:flex}
  .nav-island{padding:6px 6px 6px 16px;top:16px;max-width:calc(100% - 32px);width:100%}
  .nav-actions{border-left:none;padding-left:0;margin-left:auto}
  .hero-section{padding:40px 16px 60px;min-height:90dvh}
  .bento-stats{grid-template-columns:1fr;gap:10px;padding:0 16px;margin-bottom:60px}
  .bento-card:first-child{grid-column:span 1}
  .glass-table thead{display:none}
  .glass-table,.glass-table tbody,.glass-table tr,.glass-table td{display:block}
  .glass-table tbody tr{padding:16px;margin-bottom:10px;background:rgba(255,255,255,0.02);border-radius:14px;border:1px solid rgba(255,255,255,0.04)}
  .glass-table tbody td{padding:6px 0;border:none;white-space:normal;display:flex;justify-content:space-between;align-items:center;font-size:13px}
  .glass-table td::before{content:attr(data-label);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.2)}
  .glass-pagination{flex-direction:column;gap:12px;align-items:center}
  .hero-search{max-width:100%}
  .scroll-indicator{display:none}
  .section-header{padding:0 16px}
}

/* ─── Visual Redesign v2 — Floating Island Nav ─── */
.nav-island{
  position:fixed;top:20px;left:50%;transform:translateX(-50%);
  z-index:100;
  display:flex;align-items:center;gap:4px;
  padding:6px 8px 6px 20px;
  background:rgba(255,255,255,0.04);
  backdrop-filter:blur(24px) saturate(1.4);-webkit-backdrop-filter:blur(24px) saturate(1.4);
  border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;
  transition:all 0.6s cubic-bezier(0.32,0.72,0,1);
  box-shadow:0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}
.nav-island.scrolled{top:12px;padding:4px 6px 4px 16px;background:rgba(0,0,0,0.3);backdrop-filter:blur(32px) saturate(1.6)}
.nav-logo{font-size:15px;font-weight:700;letter-spacing:-0.02em;background:linear-gradient(135deg,#fff 30%,rgba(0,255,255,0.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-right:12px;white-space:nowrap}
.nav-links{display:flex;align-items:center;gap:2px;list-style:none}
.nav-links a{padding:8px 16px;border-radius:100px;font-size:13px;font-weight:500;letter-spacing:0.01em;color:rgba(255,255,255,0.5);text-decoration:none;transition:all 0.4s cubic-bezier(0.32,0.72,0,1);white-space:nowrap}
.nav-links a:hover,.nav-links a.active{color:#fff;background:rgba(255,255,255,0.08)}
.nav-actions{display:flex;align-items:center;gap:6px;padding-left:12px;margin-left:8px;border-left:1px solid rgba(255,255,255,0.06)}
.nav-actions .btn-ghost{padding:8px 14px;border-radius:100px;border:none;background:transparent;color:rgba(255,255,255,0.5);font-size:13px;font-weight:500;cursor:pointer;transition:all 0.4s;font-family:inherit;line-height:1.2;white-space:nowrap}
.nav-actions .btn-ghost:hover{color:#fff;background:rgba(255,255,255,0.08)}
.btn-primary-island{display:flex;align-items:center;gap:8px;padding:8px 16px 8px 20px;border-radius:100px;border:none;background:rgba(0,255,255,0.15);color:rgba(0,255,255,0.9);font-size:13px;font-weight:600;cursor:pointer;transition:all 0.4s cubic-bezier(0.32,0.72,0,1);font-family:inherit;white-space:nowrap;line-height:1.2;text-decoration:none}
.btn-primary-island:hover{background:rgba(0,255,255,0.25);transform:scale(1.02);text-decoration:none}
.btn-primary-island:active{transform:scale(0.97)}
.btn-primary-island .icon-wrap{width:24px;height:24px;border-radius:50%;background:rgba(0,255,255,0.2);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-size:12px;transition:all 0.4s}
.btn-primary-island:hover .icon-wrap{transform:translateX(2px)scale(1.05);background:rgba(0,255,255,0.3)}

/* ─── Visual Redesign v2 — Hamburger ─── */
.hamburger{display:none;flex-direction:column;justify-content:center;align-items:center;width:36px;height:36px;border-radius:50%;border:none;background:rgba(255,255,255,0.05);cursor:pointer;position:relative;transition:all 0.4s}
.hamburger:hover{background:rgba(255,255,255,0.1)}
.hamburger span{display:block;width:16px;height:1.5px;border-radius:2px;background:rgba(255,255,255,0.5);position:absolute;transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.hamburger span:nth-child(1){transform:translateY(-5px)}
.hamburger span:nth-child(2){transform:translateY(5px)}
.hamburger.open span:nth-child(1){transform:rotate(45deg)}
.hamburger.open span:nth-child(2){transform:rotate(-45deg)}
.mobile-menu{position:fixed;inset:0;z-index:90;background:rgba(5,5,5,0.92);backdrop-filter:blur(48px) saturate(1.5);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;opacity:0;pointer-events:none;transition:all 0.6s cubic-bezier(0.32,0.72,0,1)}
.mobile-menu.open{opacity:1;pointer-events:all}
.mobile-menu a{font-size:24px;font-weight:600;color:rgba(255,255,255,0.4);text-decoration:none;padding:12px 0;opacity:0;transform:translateY(20px);transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.mobile-menu.open a{opacity:1;transform:translateY(0)}
.mobile-menu.open a:nth-child(1){transition-delay:0.1s}
.mobile-menu.open a:nth-child(2){transition-delay:0.15s}
.mobile-menu.open a:nth-child(3){transition-delay:0.2s}
.mobile-menu.open a:nth-child(4){transition-delay:0.25s}
.mobile-menu.open a:nth-child(5){transition-delay:0.3s}
.mobile-menu.open a:nth-child(6){transition-delay:0.35s}
.mobile-menu a:hover{color:#fff}
.mobile-menu .menu-close{position:absolute;top:28px;right:24px;width:40px;height:40px;border-radius:50%;border:none;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;transition:all 0.3s;font-family:inherit}

/* ─── Visual Redesign v2 — Scroll Reveal ─── */
.reveal{opacity:0;transform:translateY(60px);transition:opacity 0.9s cubic-bezier(0.32,0.72,0,1),transform 0.9s cubic-bezier(0.32,0.72,0,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-60px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-right{opacity:0;transform:translateX(60px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-left.visible,.reveal-right.visible{opacity:1;transform:translateX(0)}
.reveal-scale{opacity:0;transform:scale(0.92);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-scale.visible{opacity:1;transform:scale(1)}
.reveal-blur{opacity:0;filter:blur(8px);transform:translateY(40px);transition:opacity 0.8s cubic-bezier(0.32,0.72,0,1),filter 0.8s cubic-bezier(0.32,0.72,0,1),transform 0.8s cubic-bezier(0.32,0.72,0,1)}
.reveal-blur.visible{opacity:1;filter:blur(0);transform:translateY(0)}
.stagger-children > *{opacity:0;transform:translateY(30px);transition:opacity 0.6s cubic-bezier(0.32,0.72,0,1),transform 0.6s cubic-bezier(0.32,0.72,0,1)}
.stagger-children.visible > *{opacity:1;transform:translateY(0)}
.stagger-children.visible > *:nth-child(1){transition-delay:0.05s}
.stagger-children.visible > *:nth-child(2){transition-delay:0.10s}
.stagger-children.visible > *:nth-child(3){transition-delay:0.15s}
.stagger-children.visible > *:nth-child(4){transition-delay:0.20s}
.stagger-children.visible > *:nth-child(5){transition-delay:0.25s}
.stagger-children.visible > *:nth-child(6){transition-delay:0.30s}
.stagger-children.visible > *:nth-child(7){transition-delay:0.35s}
.stagger-children.visible > *:nth-child(8){transition-delay:0.40s}

/* ─── Visual Redesign v2 — Hero ─── */
.hero-section{
  min-height:100dvh;display:flex;align-items:center;justify-content:center;
  position:relative;padding:40px 24px 80px;
}
.hero-content{text-align:center;max-width:720px}
.hero-eyebrow{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 14px;border-radius:100px;
  background:rgba(0,255,255,0.06);border:1px solid rgba(0,255,255,0.08);
  font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;
  color:rgba(0,255,255,0.7);margin-bottom:24px;
}
.hero-eyebrow .dot{width:5px;height:5px;border-radius:50%;background:rgba(0,255,255,0.5);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:0.5}50%{opacity:1}}
.hero-content h1{
  font-size:clamp(42px, 8vw, 88px);font-weight:800;line-height:1.02;letter-spacing:-0.03em;
  background:linear-gradient(180deg,#ffffff 15%,rgba(0,240,255,0.85) 85%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  margin-bottom:20px;
}
.hero-content p{
  font-size:clamp(16px, 2vw, 20px);color:rgba(255,255,255,0.35);
  font-weight:400;max-width:520px;margin:0 auto 36px;line-height:1.7;
}
.scroll-indicator{
  position:absolute;bottom:40px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:8px;
  color:rgba(255,255,255,0.2);font-size:11px;letter-spacing:0.15em;
  animation:scrollHint 2.5s ease-in-out infinite;
}
@keyframes scrollHint{0%,100%{opacity:0.3;transform:translateX(-50%)translateY(0)}50%{opacity:0.8;transform:translateX(-50%)translateY(4px)}}
.scroll-indicator .mouse{width:20px;height:32px;border-radius:10px;border:1.5px solid rgba(255,255,255,0.15);position:relative}
.scroll-indicator .mouse::after{content:'';position:absolute;top:5px;left:50%;transform:translateX(-50%);width:2px;height:6px;border-radius:2px;background:rgba(255,255,255,0.3);animation:scrollWheel 2s ease-in-out infinite}
@keyframes scrollWheel{0%,100%{opacity:0.3;transform:translateX(-50%)translateY(0)}50%{opacity:1;transform:translateX(-50%)translateY(6px)}}

/* ─── Visual Redesign v2 — Hero Search ─── */
.hero-search{
  display:inline-flex;align-items:center;gap:0;
  max-width:520px;width:100%;
  background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
  border-radius:100px;padding:4px;backdrop-filter:blur(12px);
  transition:all 0.4s cubic-bezier(0.32,0.72,0,1);
  margin:0 auto;
}
.hero-search:focus-within{border-color:rgba(0,255,255,0.2);box-shadow:0 0 0 4px rgba(0,255,255,0.05),0 8px 32px rgba(0,0,0,0.3)}
.hero-search input{flex:1;padding:14px 22px;border:none;background:transparent;font-family:inherit;font-size:15px;color:#fff;outline:none}
.hero-search input::placeholder{color:rgba(255,255,255,0.2)}
.hero-search button{padding:12px 28px;border-radius:100px;border:none;background:rgba(0,255,255,0.15);color:rgba(0,255,255,0.9);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.4s}
.hero-search button:hover{background:rgba(0,255,255,0.25)}
.hero-search button:active{transform:scale(0.97)}

/* ─── Visual Redesign v2 — Bento Stats ─── */
.bento-stats{
  display:grid;grid-template-columns:1.5fr 1fr 1fr 1fr;gap:12px;
  padding:0 24px;max-width:1280px;margin:0 auto 80px;
}
.bento-card{
  border-radius:20px;padding:2px;
  background:linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02));
  transition:all 0.5s cubic-bezier(0.32,0.72,0,1);
}
.bento-card:hover{background:linear-gradient(135deg,rgba(0,255,255,0.08),rgba(0,136,255,0.04));transform:translateY(-2px)}
.bento-card-inner{background:rgba(8,8,14,0.25);backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);border-radius:18px;padding:24px;height:100%;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}
.bento-card:first-child{grid-column:span 1}
.bento-card:first-child .bento-card-inner{display:flex;align-items:center;gap:20px}
.bento-card:first-child .bento-number{font-size:48px;font-weight:800;letter-spacing:-0.03em;line-height:1;background:linear-gradient(135deg,#fff,rgba(0,255,255,0.6));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.bento-label{font-size:12px;font-weight:500;color:rgba(255,255,255,0.3);letter-spacing:0.05em;margin-bottom:8px;text-transform:uppercase}
.bento-number{font-size:28px;font-weight:700;letter-spacing:-0.02em;line-height:1;color:#fff}
.bento-detail{font-size:12px;color:rgba(255,255,255,0.25);margin-top:6px}

/* ─── Visual Redesign v2 — Glass Table ─── */
.glass-table-wrap{
  border-radius:20px;padding:2px;
  background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01));
  margin-bottom:24px;
  overflow-x:auto;
}
.glass-table-inner{background:rgba(10,10,20,0.25);backdrop-filter:blur(28px) saturate(1.6);-webkit-backdrop-filter:blur(28px) saturate(1.6);border-radius:18px;overflow-x:auto;overflow-y:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.08)}
.glass-table{width:100%;border-collapse:collapse}
.glass-table thead th{padding:16px 20px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.25);border-bottom:1px solid rgba(255,255,255,0.04);white-space:nowrap}
.glass-table tbody tr{transition:all 0.4s}
.glass-table tbody tr:hover{background:rgba(0,255,255,0.02)}
.glass-table tbody tr:not(:last-child) td{border-bottom:1px solid rgba(255,255,255,0.02)}
.glass-table tbody td{padding:14px 20px;font-size:14px;color:rgba(255,255,255,0.7);white-space:nowrap}

/* ─── Visual Redesign v2 — Badge Variants ─── */
.badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:600;letter-spacing:0.02em}
.badge-cyan{background:rgba(0,255,255,0.08);border:1px solid rgba(0,255,255,0.1);color:rgba(0,255,255,0.7)}
.badge-magenta{background:rgba(255,0,255,0.08);border:1px solid rgba(255,0,255,0.1);color:rgba(255,0,255,0.7)}
.badge-green{background:rgba(0,255,128,0.08);border:1px solid rgba(0,255,128,0.1);color:rgba(0,255,128,0.7)}
.badge-amber{background:rgba(255,200,0,0.08);border:1px solid rgba(255,200,0,0.1);color:rgba(255,200,0,0.7)}
.badge-red{background:rgba(255,51,85,0.12);border:1px solid rgba(255,51,85,0.15);color:rgba(255,51,85,0.7)}

/* ─── Visual Redesign v2 — Filter Pills ─── */
.filter-group{display:flex;gap:4px;flex-wrap:wrap}
.filter-pill{padding:7px 16px;border-radius:100px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:rgba(255,255,255,0.4);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.4s cubic-bezier(0.32,0.72,0,1)}
.filter-pill:hover{border-color:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7)}
.filter-pill.active{background:rgba(0,255,255,0.1);border-color:rgba(0,255,255,0.15);color:rgba(0,255,255,0.8)}

/* ─── Visual Redesign v2 — Section Header ─── */
.section-header{padding:0 24px;max-width:1280px;margin:0 auto 24px}
.section-header h2{font-size:clamp(22px, 3vw, 32px);font-weight:700;color:#fff;letter-spacing:-0.02em;margin-bottom:4px}
.section-header p{font-size:14px;color:rgba(255,255,255,0.3)}

/* ─── Visual Redesign v2 — Divider ─── */
.section-divider{display:flex;align-items:center;gap:16px;max-width:80px;margin:0 auto 48px;color:rgba(255,255,255,0.06)}
.section-divider::before,.section-divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.06)}

/* ─── Visual Redesign v2 — Pagination ─── */
.glass-pagination{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-top:1px solid rgba(255,255,255,0.04)}
.glass-pagination .info{font-size:12px;color:rgba(255,255,255,0.25)}
.glass-pages{display:flex;gap:4px}
.glass-page-btn{width:32px;height:32px;border-radius:8px;border:1px solid transparent;background:transparent;color:rgba(255,255,255,0.3);font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;transition:all 0.3s;display:flex;align-items:center;justify-content:center}
.glass-page-btn:hover{border-color:rgba(0,255,255,0.1);color:rgba(0,255,255,0.5)}
.glass-page-btn.current{background:rgba(0,255,255,0.1);border-color:rgba(0,255,255,0.15);color:rgba(0,255,255,0.8);font-weight:600}

/* ─── Visual Redesign v2 — Footer ─── */
.footer{text-align:center;padding:40px 24px;border-top:1px solid rgba(255,255,255,0.03);font-size:12px;color:rgba(255,255,255,0.15);max-width:1280px;margin:0 auto}

/* ─── Visual Redesign v2 — Mobile Responsive ─── */
@media(max-width:1024px){
  .bento-stats{grid-template-columns:1fr 1fr}
  .bento-card:first-child{grid-column:span 2}
}
@media(max-width:768px){
  .nav-links,.nav-actions .btn-ghost{display:none}
  .hamburger{display:flex}
  .nav-island{padding:6px 6px 6px 16px;top:16px;max-width:calc(100% - 32px);width:100%}
  .nav-actions{border-left:none;padding-left:0;margin-left:auto}
  .hero-section{padding:40px 16px 60px;min-height:90dvh}
  .bento-stats{grid-template-columns:1fr;gap:10px;padding:0 16px;margin-bottom:60px}
  .bento-card:first-child{grid-column:span 1}
  .glass-table thead{display:none}
  .glass-table,.glass-table tbody,.glass-table tr,.glass-table td{display:block}
  .glass-table tbody tr{padding:16px;margin-bottom:10px;background:rgba(255,255,255,0.02);border-radius:14px;border:1px solid rgba(255,255,255,0.04)}
  .glass-table tbody td{padding:6px 0;border:none;white-space:normal;display:flex;justify-content:space-between;align-items:center;font-size:13px}
  .glass-table td::before{content:attr(data-label);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:rgba(255,255,255,0.2)}
  .glass-pagination{flex-direction:column;gap:12px;align-items:center}
  .hero-search{max-width:100%}
  .scroll-indicator{display:none}
  .section-header{padding:0 16px}
}

/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .mesh-sphere { animation: none !important; opacity: .25; }
  body::after { opacity: .03; }
  .reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-blur,.stagger-children,.stagger-children > *{opacity:1!important;transform:none!important;filter:none!important}
  .scroll-indicator,.scroll-indicator .mouse::after{animation:none!important;opacity:0.5}
  .hero-eyebrow .dot{animation:none!important;opacity:0.5}
  .nav-island{transition-duration:.01ms!important}
  .hero-search{transition-duration:.01ms!important}
  .bento-card{transition-duration:.01ms!important;transform:none!important}
  .glass-card,.team-card{transition-duration:.01ms!important;transform:none!important;box-shadow:none!important}
}

/* ─── Glass Card (enhanced card for announcements/stats/account/team) ─── */
.glass-card {
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  transition: all 0.4s cubic-bezier(0.32,0.72,0,1);
}
.glass-card:hover {
  background: linear-gradient(135deg, rgba(0,255,255,0.08), rgba(0,136,255,0.04));
  transform: translateY(-2px);
}
/* ─── Glass Card Inner (content area matching bento-card-inner) ─── */
.glass-card-inner {
  border-radius: 18px;
  padding: var(--spacing-lg);
  background: rgba(10,10,20,0.25);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  height: 100%;
}


/* ─── Settings / Account grouped list ─── */
.settings-group {
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(10,10,20,0.22);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  overflow: hidden;
}
.settings-group-item {
  padding: 16px var(--spacing-md);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.settings-group-item:last-child { border-bottom: none; }

/* ─── Back link (announcement detail) ─── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.3);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}
.back-link:hover { color: rgba(0,255,255,0.7); }

/* ─── Announcement meta ─── */
.announce-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}

/* ─── Team card ─── */
.team-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: rgba(10,10,20,0.22);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: all 0.4s cubic-bezier(0.32,0.72,0,1);
}
.team-card:hover {
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.25);
}

/* ─── Glass card responsive ─── */
@media (max-width: 768px) {
  .team-cards { grid-template-columns: 1fr !important; }
  .glass-card { border-radius: 0; border-left: none; border-right: none; }
  .glass-card-inner { border-radius: 0; }
  .settings-group { border-radius: 0; border-left: none; border-right: none; }
}

/* ─── Glass Card (enhanced card for announcements/stats/account/team) ─── */
.glass-card {
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  transition: all 0.4s cubic-bezier(0.32,0.72,0,1);
}
.glass-card:hover {
  background: linear-gradient(135deg, rgba(0,255,255,0.08), rgba(0,136,255,0.04));
  transform: translateY(-2px);
}

/* ─── Settings / Account grouped list ─── */
.settings-group {
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(10,10,20,0.22);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  overflow: hidden;
}
.settings-group-item {
  padding: 16px var(--spacing-md);
  border-bottom: 1px solid rgba(255,255,255,0.04);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}
.settings-group-item:last-child { border-bottom: none; }

/* ─── Back link (announcement detail) ─── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255,255,255,0.3);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}
.back-link:hover { color: rgba(0,255,255,0.7); }

/* ─── Announcement meta ─── */
.announce-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}

/* ─── Team card ─── */
.team-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  background: rgba(10,10,20,0.22);
  backdrop-filter: blur(28px) saturate(1.6);
  -webkit-backdrop-filter: blur(28px) saturate(1.6);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  transition: all 0.4s cubic-bezier(0.32,0.72,0,1);
}
.team-card:hover {
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-3px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.25);
}

/* ─── Glass card responsive ─── */
@media (max-width: 768px) {
  .team-cards { grid-template-columns: 1fr !important; }
  .glass-card { border-radius: 0; border-left: none; border-right: none; }
  .glass-card-inner { border-radius: 0; }
  .settings-group { border-radius: 0; border-left: none; border-right: none; }
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .cyber-stats { grid-template-columns: repeat(2,1fr); }
  .cyber-table-wrap { border-radius: 0; border-left: none; border-right: none; }
  .glass-table-wrap { border-radius: 0; border-left: none; border-right: none; }
  .glass-table-wrap { border-radius: 0; border-left: none; border-right: none; }
  .cyber-sidebar { position:fixed;top:0;left:-105%;height:100vh;z-index:200;transition:left .3s;display:flex; }
  .cyber-sidebar.open { left:0; }
}
</style>`
