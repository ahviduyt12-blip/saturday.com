// ===== SATURDAY PLATFORM — SHARED LAYOUT =====
// Injects header, dropdown sidebar, and bottom nav into every page.
// Automatically detects if the page is in /pages/ subfolder and adjusts all paths.

(function () {
  'use strict';

  /* ── Path helper ─────────────────────────────────────────── */
  // Detect whether we are inside the /pages/ subdirectory
  const inPages = window.location.pathname.includes('/pages/');
  const base    = inPages ? '../' : '';          // prefix for assets
  const pagesBase = inPages ? '' : 'pages/';     // prefix for page links

  function pageHref(file) { return pagesBase + file; }
  function rootHref(file) { return base + file; }

  /* ── Determine active bottom-tab ─────────────────────────── */
  function getActivePage() {
    const name = window.location.pathname.split('/').pop().replace('.html', '') || 'home';
    if (name === 'home' || name === '')   return 'home';
    if (name === 'tax')                   return 'tax';
    if (name === 'vip')                   return 'vip';
    if (name === 'withdraw')              return 'withdraw';
    if (name === 'help')                  return 'help';
    return 'home'; // inner pages (profile, history, etc.) highlight Home
  }

  /* ── Sidebar nav items ───────────────────────────────────── */
  const navItems = [
    {
      icon: '👤',
      label: 'Profile',
      href: pageHref('profile.html'),
      badge: null
    },
    {
      icon: '✅',
      label: 'Account Active',
      href: pageHref('activate.html'),
      badge: null
    },
    {
      icon: '📋',
      label: 'History',
      href: pageHref('history.html'),
      badge: null
    },
    {
      icon: '👥',
      label: 'Team',
      href: pageHref('team.html'),
      badge: null
    },
    {
      icon: '🔗',
      label: 'Refer Link',
      href: pageHref('team.html'),
      badge: null
    },
    {
      icon: '✈️',
      label: 'Telegram',
      href: null,
      external: 'https://t.me/saturdayplatform'
    },
    {
      icon: '▶️',
      label: 'YouTube',
      href: null,
      external: 'https://youtube.com/@saturdayplatform'
    },
    {
      icon: 'ℹ️',
      label: 'About',
      href: pageHref('about.html'),
      badge: null
    }
  ];

  /* ── Bottom nav tabs ─────────────────────────────────────── */
  const tabs = [
    { id: 'home',     icon: '🏠', label: 'Home',     href: rootHref('home.html') },
    { id: 'tax',      icon: '📝', label: 'Tax',      href: pageHref('tax.html') },
    { id: 'vip',      icon: '👑', label: 'VIP',      href: pageHref('vip.html') },
    { id: 'withdraw', icon: '💸', label: 'Withdraw', href: pageHref('withdraw.html') },
    { id: 'help',     icon: '💬', label: 'Help',     href: pageHref('help.html') }
  ];

  /* ── HTML builders ───────────────────────────────────────── */
  function buildHeader() {
    return `
    <header class="sat-header" id="satHeader">
      <button class="sat-menu-btn" id="satMenuBtn" aria-label="Open menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <a class="sat-logo" href="${rootHref('home.html')}">
        <div class="sat-logo-icon">💰</div>
        <div class="sat-logo-text">
          <span class="sat-logo-name">Saturday</span>
          <span class="sat-logo-tag">Halal Platform</span>
        </div>
      </a>

      <div class="sat-header-right">
        <div class="sat-balance-pill">
          <span class="sat-balance-icon">💰</span>
          <span class="sat-balance-val">৳0.00</span>
        </div>
      </div>
    </header>`;
  }

  function buildSidebar() {
    const itemsHTML = navItems.map((item, i) => {
      const onclick = item.external
        ? `window.open('${item.external}','_blank')`
        : `window.location.href='${item.href}'`;

      const isActive = item.href && window.location.pathname.endsWith(item.href.replace(/^(\.\.\/|pages\/)/, ''));

      return `
      <div class="sat-nav-item ${isActive ? 'sat-nav-item--active' : ''}"
           onclick="${onclick}"
           style="animation-delay:${0.05 + i * 0.04}s">
        <span class="sat-nav-icon">${item.icon}</span>
        <span class="sat-nav-label">${item.label}</span>
        ${item.badge ? `<span class="sat-nav-badge">${item.badge}</span>` : ''}
        <span class="sat-nav-arrow">›</span>
      </div>`;
    }).join('');

    return `
    <div class="sat-overlay" id="satOverlay"></div>
    <aside class="sat-sidebar" id="satSidebar" aria-hidden="true">

      <!-- Sidebar header / user card -->
      <div class="sat-sidebar-top">
        <div class="sat-sidebar-brand">
          <div class="sat-sidebar-logo-icon">💰</div>
          <div>
            <div class="sat-sidebar-brand-name">Saturday</div>
            <div class="sat-sidebar-brand-tag">Halal Earn Platform</div>
          </div>
          <button class="sat-close-btn" id="satCloseBtn" aria-label="Close menu">✕</button>
        </div>

        <div class="sat-user-card" onclick="window.location.href='${pageHref('profile.html')}'">
          <div class="sat-user-avatar" id="satAvatar">
            <span class="sat-avatar-initial" id="satAvatarInitial">S</span>
            <img class="sat-avatar-img" id="satAvatarImg" src="" alt="Avatar" style="display:none;">
            <div class="sat-avatar-edit">📷</div>
          </div>
          <div class="sat-user-info">
            <div class="sat-user-name"  id="satUserName">Loading…</div>
            <div class="sat-user-phone" id="satUserPhone">—</div>
            <div class="sat-user-bal"   id="satUserBal">৳0.00</div>
          </div>
          <span class="sat-user-arrow">›</span>
        </div>
      </div>

      <!-- Nav items -->
      <nav class="sat-sidebar-nav" id="satNav">
        <div class="sat-nav-section-label">Menu</div>
        ${itemsHTML}
      </nav>

      <!-- Footer -->
      <div class="sat-sidebar-footer">
        <button class="sat-logout-btn" id="satLogoutBtn">
          <span>🚪</span> Logout
        </button>
      </div>

    </aside>`;
  }

  function buildBottomNav() {
    const active = getActivePage();
    return `
    <nav class="sat-bottom-nav" id="satBottomNav">
      ${tabs.map(t => `
      <a class="sat-tab ${t.id === active ? 'sat-tab--active' : ''}"
         href="${t.href}"
         data-tab="${t.id}">
        <span class="sat-tab-icon">${t.icon}</span>
        <span class="sat-tab-label">${t.label}</span>
        ${t.id === active ? '<span class="sat-tab-dot"></span>' : ''}
      </a>`).join('')}
    </nav>`;
  }

  function buildStyles() {
    return `<style>
/* ══════════════════════════════════════════════════════════
   SATURDAY LAYOUT STYLES  — all prefixed with .sat-
══════════════════════════════════════════════════════════ */

/* ── Variables ── */
:root {
  --sat-gold:     #ffb800;
  --sat-gold-lt:  #ffd060;
  --sat-gold-dk:  #cc9200;
  --sat-green:    #00e676;
  --sat-red:      #ff4757;
  --sat-bg:       #0a0a0f;
  --sat-bg2:      #10101a;
  --sat-card:     #141420;
  --sat-border:   rgba(255,255,255,0.08);
  --sat-border-g: rgba(255,184,0,0.25);
  --sat-text:     #f0f0f8;
  --sat-muted:    #8888aa;
  --sat-dim:      #444460;
  --sat-h:        60px;   /* header height */
  --sat-nb:       66px;   /* bottom nav height */
  --sat-sw:       300px;  /* sidebar width */
  --sat-r:        14px;   /* radius */
  --sat-r-sm:     10px;
}

/* ── Header ── */
.sat-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--sat-h);
  background: rgba(10,10,15,0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--sat-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 900;
  gap: 12px;
}

.sat-menu-btn {
  width: 42px; height: 42px;
  background: var(--sat-card);
  border: 1px solid var(--sat-border);
  border-radius: var(--sat-r-sm);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;
  padding: 0;
}
.sat-menu-btn span {
  display: block;
  width: 18px; height: 2px;
  background: var(--sat-text);
  border-radius: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform-origin: center;
}
.sat-menu-btn:hover { border-color: var(--sat-gold); background: rgba(255,184,0,0.06); }
/* Hamburger → X */
.sat-menu-btn.is-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.sat-menu-btn.is-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.sat-menu-btn.is-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.sat-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex: 1;
}
.sat-logo-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--sat-gold), var(--sat-gold-dk));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  box-shadow: 0 0 18px rgba(255,184,0,0.35);
  flex-shrink: 0;
}
.sat-logo-text { display: flex; flex-direction: column; line-height: 1; }
.sat-logo-name {
  font-family: 'Syne', sans-serif;
  font-size: 20px; font-weight: 800;
  background: linear-gradient(135deg, var(--sat-gold-lt), var(--sat-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.3px;
}
.sat-logo-tag { font-size: 9px; color: var(--sat-dim); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 2px; }

.sat-header-right { display: flex; align-items: center; flex-shrink: 0; }
.sat-balance-pill {
  display: flex; align-items: center; gap: 5px;
  background: var(--sat-card);
  border: 1px solid var(--sat-border-g);
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px; font-weight: 700;
  color: var(--sat-gold);
  white-space: nowrap;
}
.sat-balance-icon { font-size: 14px; }

/* ── Overlay ── */
.sat-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.sat-overlay.is-open { opacity: 1; pointer-events: all; }

/* ── Sidebar ── */
.sat-sidebar {
  position: fixed;
  top: 0; left: 0; bottom: 0;
  width: var(--sat-sw);
  max-width: 85vw;
  background: var(--sat-bg2);
  border-right: 1px solid var(--sat-border);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: translateX(-100%);
  transition: transform 0.38s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}
.sat-sidebar.is-open { transform: translateX(0); }

/* Top block */
.sat-sidebar-top {
  flex-shrink: 0;
  background: linear-gradient(160deg, rgba(255,184,0,0.1), rgba(255,184,0,0.02));
  border-bottom: 1px solid var(--sat-border);
  padding-bottom: 4px;
}

/* Brand row inside sidebar */
.sat-sidebar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 12px;
}
.sat-sidebar-logo-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--sat-gold), var(--sat-gold-dk));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  box-shadow: 0 0 16px rgba(255,184,0,0.3);
  flex-shrink: 0;
}
.sat-sidebar-brand-name {
  font-family: 'Syne', sans-serif;
  font-size: 18px; font-weight: 800;
  background: linear-gradient(135deg, var(--sat-gold-lt), var(--sat-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sat-sidebar-brand-tag { font-size: 10px; color: var(--sat-dim); letter-spacing: 1px; text-transform: uppercase; }
.sat-close-btn {
  margin-left: auto;
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--sat-border);
  border-radius: 8px;
  color: var(--sat-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}
.sat-close-btn:hover { background: rgba(255,71,87,0.12); border-color: var(--sat-red); color: var(--sat-red); }

/* User card */
.sat-user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 12px 14px;
  padding: 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--sat-border);
  border-radius: var(--sat-r);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.sat-user-card:hover { border-color: var(--sat-border-g); background: rgba(255,184,0,0.05); }

.sat-user-avatar {
  position: relative;
  width: 50px; height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sat-gold), var(--sat-gold-dk));
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700; color: #000;
  border: 2px solid rgba(255,184,0,0.4);
  overflow: hidden;
  flex-shrink: 0;
}
.sat-avatar-img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
.sat-avatar-edit {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
}
.sat-user-card:hover .sat-avatar-edit { opacity: 1; }

.sat-user-info { flex: 1; min-width: 0; }
.sat-user-name  { font-size: 15px; font-weight: 700; color: var(--sat-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sat-user-phone { font-size: 12px; color: var(--sat-muted); margin-top: 2px; }
.sat-user-bal   { font-size: 13px; font-weight: 700; color: var(--sat-gold); margin-top: 4px; }
.sat-user-arrow { color: var(--sat-dim); font-size: 20px; flex-shrink: 0; }

/* Nav section */
.sat-sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0 12px;
  scrollbar-width: thin;
  scrollbar-color: var(--sat-gold-dk) transparent;
}
.sat-nav-section-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--sat-dim);
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 8px 20px 6px;
}

.sat-nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px 20px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.18s, border-color 0.18s, color 0.18s;
  color: var(--sat-muted);
  font-size: 14px; font-weight: 500;
  position: relative;
  /* entrance animation */
  opacity: 0;
  transform: translateX(-12px);
  animation: satNavIn 0.35s ease forwards;
}
@keyframes satNavIn {
  to { opacity: 1; transform: translateX(0); }
}
.sat-nav-item:hover {
  background: rgba(255,255,255,0.04);
  color: var(--sat-text);
  border-left-color: rgba(255,184,0,0.4);
}
.sat-nav-item--active {
  background: rgba(255,184,0,0.08);
  color: var(--sat-gold);
  border-left-color: var(--sat-gold);
}
.sat-nav-icon {
  width: 36px; height: 36px;
  background: var(--sat-card);
  border-radius: var(--sat-r-sm);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  flex-shrink: 0;
  transition: background 0.18s;
}
.sat-nav-item:hover .sat-nav-icon,
.sat-nav-item--active .sat-nav-icon {
  background: rgba(255,184,0,0.1);
}
.sat-nav-label { flex: 1; }
.sat-nav-badge {
  background: var(--sat-red);
  color: #fff;
  font-size: 10px; font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px; text-align: center;
}
.sat-nav-arrow { color: var(--sat-dim); font-size: 18px; transition: transform 0.2s; }
.sat-nav-item:hover .sat-nav-arrow { transform: translateX(3px); color: var(--sat-muted); }

/* Sidebar footer */
.sat-sidebar-footer {
  flex-shrink: 0;
  padding: 14px 16px;
  border-top: 1px solid var(--sat-border);
}
.sat-logout-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px;
  background: rgba(255,71,87,0.08);
  border: 1px solid rgba(255,71,87,0.25);
  border-radius: var(--sat-r-sm);
  color: var(--sat-red);
  font-size: 14px; font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.sat-logout-btn:hover { background: rgba(255,71,87,0.18); border-color: rgba(255,71,87,0.5); }

/* ── Bottom nav ── */
.sat-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: var(--sat-nb);
  background: rgba(16,16,26,0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid var(--sat-border);
  display: flex;
  align-items: stretch;
  z-index: 800;
}

.sat-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  color: var(--sat-dim);
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  position: relative;
  transition: color 0.2s;
  padding: 8px 4px 10px;
  -webkit-tap-highlight-color: transparent;
}
.sat-tab:hover { color: var(--sat-muted); }
.sat-tab--active { color: var(--sat-gold); }

.sat-tab-icon { font-size: 22px; transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.sat-tab--active .sat-tab-icon { transform: translateY(-3px); }
.sat-tab-label { line-height: 1; }

/* Active indicator dot */
.sat-tab-dot {
  position: absolute;
  bottom: 6px;
  left: 50%; transform: translateX(-50%);
  width: 4px; height: 4px;
  border-radius: 50%;
  background: var(--sat-gold);
  box-shadow: 0 0 6px var(--sat-gold);
}

/* Active tab top line */
.sat-tab--active::before {
  content: '';
  position: absolute;
  top: 0; left: 20%; right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--sat-gold), transparent);
  border-radius: 0 0 2px 2px;
}

/* ── Page body padding ── */
body {
  padding-top: var(--sat-h) !important;
  padding-bottom: var(--sat-nb) !important;
}

/* ── Responsive ── */
@media (min-width: 640px) {
  .sat-header { padding: 0 24px; }
  .sat-bottom-nav { max-width: 640px; left: 50%; right: auto; transform: translateX(-50%); border-radius: 16px 16px 0 0; }
}
@media (min-width: 1024px) {
  :root { --sat-h: 66px; }
  .sat-logo-name { font-size: 22px; }
}
</style>`;
  }

  /* ── Mount everything ────────────────────────────────────── */
  function mount() {
    // Inject CSS first (into <head>)
    document.head.insertAdjacentHTML('beforeend', buildStyles());

    // Inject header + sidebar into top of <body>
    document.body.insertAdjacentHTML('afterbegin', buildHeader() + buildSidebar());

    // Inject bottom nav + toast container at bottom of <body>
    document.body.insertAdjacentHTML('beforeend', buildBottomNav() + '<div class="toast-container"></div>');

    // Wire up interactions after DOM is ready
    wireEvents();

    // Populate user info from localStorage
    populateUser();
  }

  /* ── Events ──────────────────────────────────────────────── */
  function wireEvents() {
    const menuBtn  = document.getElementById('satMenuBtn');
    const closeBtn = document.getElementById('satCloseBtn');
    const overlay  = document.getElementById('satOverlay');
    const sidebar  = document.getElementById('satSidebar');
    const logout   = document.getElementById('satLogoutBtn');

    function openSidebar() {
      sidebar.classList.add('is-open');
      overlay.classList.add('is-open');
      menuBtn.classList.add('is-open');
      menuBtn.setAttribute('aria-expanded', 'true');
      sidebar.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('is-open');
      overlay.classList.remove('is-open');
      menuBtn.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      sidebar.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', () => {
      sidebar.classList.contains('is-open') ? closeSidebar() : openSidebar();
    });

    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSidebar();
    });

    // Swipe-left to close on mobile
    let touchStartX = 0;
    sidebar.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    sidebar.addEventListener('touchend', (e) => {
      if (touchStartX - e.changedTouches[0].clientX > 60) closeSidebar();
    }, { passive: true });

    // Logout
    logout.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('sat_token');
        localStorage.removeItem('sat_user');
        window.location.href = rootHref('index.html');
      }
    });
  }

  /* ── Populate user data ──────────────────────────────────── */
  function populateUser() {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('sat_user') || '{}'); } catch {}

    // Sidebar user card
    const nameEl   = document.getElementById('satUserName');
    const phoneEl  = document.getElementById('satUserPhone');
    const balEl    = document.getElementById('satUserBal');
    const initEl   = document.getElementById('satAvatarInitial');
    const imgEl    = document.getElementById('satAvatarImg');

    if (nameEl)  nameEl.textContent  = user.name  || 'User';
    if (phoneEl) phoneEl.textContent = user.phone || '—';
    if (balEl && user.balance !== undefined) balEl.textContent = '৳' + parseFloat(user.balance || 0).toFixed(2);
    if (initEl && user.name) initEl.textContent = user.name.charAt(0).toUpperCase();
    if (imgEl && user.avatar) {
      imgEl.src = user.avatar;
      imgEl.style.display = 'block';
      if (initEl) initEl.style.display = 'none';
    }

    // Fetch live balance from API and update header + sidebar
    const token = localStorage.getItem('sat_token');
    if (token) {
      fetch('/api/user/balance', {
        headers: { 'Authorization': 'Bearer ' + token }
      })
      .then(r => r.json())
      .then(data => {
        const amount = '৳' + parseFloat(data.balance || 0).toFixed(2);
        const headerBal = document.querySelector('.sat-balance-val');
        if (headerBal) headerBal.textContent = amount;
        if (balEl) balEl.textContent = amount;
      })
      .catch(() => {});
    }
  }

  /* ── Run ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  /* ── Global helper for pages that call loadUserAvatar() ──── */
  window.loadUserAvatar = populateUser;

})();
