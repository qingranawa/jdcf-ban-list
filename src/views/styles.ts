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
.mesh-sphere:nth-child(2) { width:250px;height:250px;bottom:-5%;right:-2%;background:var(--magenta);opacity:.10;animation-delay:-13s; }
.mesh-sphere:nth-child(3) { width:180px;height:180px;top:45%;left:50%;background:var(--amber);opacity:.06;animation-delay:-26s; }

@keyframes meshDrift {
  0%,100% { transform: translate(0,0) scale(1); }
  33% { transform: translate(30px,-20px) scale(1.05); }
  66% { transform: translate(-15px,25px) scale(.95); }
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
  background: linear-gradient(135deg,var(--cyan),var(--magenta));
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
  outline: 2px solid var(--magenta);
  outline-offset: 2px;
}
.cyber-btn:focus-visible:not(:active),
.cyber-segmented button:focus-visible:not(:active),
.sidebar-link:focus-visible:not(:active),
.sheet-close:focus-visible:not(:active),
.cyber-pagination a:focus-visible:not(:active),
.cyber-pagination button:focus-visible:not(:active) {
  outline: 2px solid var(--magenta);
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
.cyber-search:focus-within { border-color: var(--magenta); box-shadow: 0 0 0 3px rgba(255,0,170,.12); }
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
  background: var(--magenta); color: #000; font-weight: 600;
}

/* ─── Centered Modal ─── */
.cyber-sheet-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.6);
  opacity: 0; pointer-events: none; transition: opacity .3s;
  display: flex; align-items: center; justify-content: center;
}
.cyber-sheet-overlay.open { opacity: 1; pointer-events: auto; }
.cyber-sheet {
  width: 100%; max-width: 520px;
  background: rgba(0,0,0,.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-lg);
  transform: scale(.95); transition: transform .3s cubic-bezier(.32,.72,0,1);
  max-height: 90vh; overflow-y: auto;
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
  background: linear-gradient(135deg,var(--cyan),var(--magenta));
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
.cyber-pagination button:hover, .cyber-pagination a:hover { border-color: var(--magenta); color: var(--label-1); }
.cyber-pagination button.active, .cyber-pagination a.active { background: var(--magenta); color: #000; border-color: var(--magenta); font-weight: 600; backdrop-filter: none; }
.cyber-pagination .current {
  padding: 6px 14px; border: 1px solid var(--magenta); border-radius: var(--radius-sm);
  background: var(--magenta); color: #000;
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
  width: min(240px, 70vw); min-height: 100vh;
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
  height: 2px; background: linear-gradient(90deg,var(--cyan),var(--magenta));
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
  background: transparent;
  bottom: 0; top: auto;
  height: 60px; padding: 0 var(--spacing-md);
}
.cyber-nav::before {
  content: ''; position: absolute; left: 0; right: 0; top: -1px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, var(--cyan) 20%, var(--magenta) 50%, var(--cyan) 80%, transparent 100%);
  background-size: 200% 100%;
  animation: navBorderGlow 6s ease-in-out infinite;
  box-shadow: 0 0 18px rgba(0,240,255,.3), 0 0 40px rgba(255,0,170,.1);
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
    background: transparent;
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
.cyber-input:focus { border-color: var(--magenta); box-shadow: 0 0 0 3px rgba(255,0,170,.12); }
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

/* ─── Statistics Charts ─── */
.charts-row {
  display: flex; gap: var(--spacing-md);
}
.chart-container {
  flex: 1; min-width: 0;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  background: transparent;
}
.chart-container canvas {
  width: 100% !important;
}
.stats-cards-row {
  display: flex; gap: var(--spacing-md);
}
.stats-cards-row .cyber-stat-card {
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
/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
  .mesh-sphere { animation: none !important; opacity: .25; }
  body::after { opacity: .03; }
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .cyber-stats { grid-template-columns: repeat(2,1fr); }
  .cyber-table-wrap { border-radius: 0; border-left: none; border-right: none; }
  .cyber-sidebar { position:fixed;top:0;left:-105%;height:100vh;z-index:200;transition:left .3s;display:flex; }
  .cyber-sidebar.open { left:0; }
}
</style>`
