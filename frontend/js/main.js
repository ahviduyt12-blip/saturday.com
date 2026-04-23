// ===== SATURDAY PLATFORM — MAIN.JS (FIXED) =====
'use strict';

const API_BASE = '/api';

/* ─── Storage ─────────────────────────────────────────────── */
const Storage = {
  get:    (k)    => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set:    (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  remove: (k)    => localStorage.removeItem(k),
};

/* ─── API helper — never throws on network error ──────────── */
const API = {
  token: () => Storage.get('sat_token'),

  headers: () => ({
    'Content-Type': 'application/json',
    ...(API.token() ? { Authorization: `Bearer ${API.token()}` } : {}),
  }),

  async req(method, path, body) {
    try {
      const res = await fetch(API_BASE + path, {
        method,
        headers: API.headers(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });

      // Handle non-JSON responses gracefully
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text || 'Server error' }; }

      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      // Re-throw so callers can handle
      throw err;
    }
  },

  get:    (path)        => API.req('GET',    path),
  post:   (path, body)  => API.req('POST',   path, body),
  put:    (path, body)  => API.req('PUT',    path, body),
  delete: (path)        => API.req('DELETE', path),
};

/* ─── Auth ────────────────────────────────────────────────── */
const Auth = {
  isLoggedIn: () => !!Storage.get('sat_token'),
  getUser:    () => Storage.get('sat_user') || {},

  setSession(token, user) {
    Storage.set('sat_token', token);
    Storage.set('sat_user', user);
  },

  logout() {
    Storage.remove('sat_token');
    Storage.remove('sat_user');
    // Go back to root index
    const depth = window.location.pathname.includes('/pages/') ? '../' : '';
    window.location.href = depth + 'index.html';
  },

  // Returns true if OK, false if should redirect
  requireAuth() {
    if (!Auth.isLoggedIn()) {
      const depth = window.location.pathname.includes('/pages/') ? '../' : '';
      window.location.replace(depth + 'index.html');
      return false;
    }
    return true;
  },
};

/* ─── Toast ───────────────────────────────────────────────── */
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.querySelector('.toast-container');
      if (!this._container) {
        this._container = document.createElement('div');
        this._container.className = 'toast-container';
        document.body.appendChild(this._container);
      }
    }
    return this._container;
  },

  show(msg, type = 'info', ms = 3500) {
    const icons = { success: '✅', error: '❌', info: '💡' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || '💡'}</span><span>${msg}</span>`;
    this._getContainer().appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 320);
    }, ms);
  },

  success: (m) => Toast.show(m, 'success'),
  error:   (m) => Toast.show(m, 'error'),
  info:    (m) => Toast.show(m, 'info'),
};

/* ─── Helpers ─────────────────────────────────────────────── */
function formatAmount(val) {
  return '৳' + parseFloat(val || 0).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-BD', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => Toast.success('Copied!')).catch(() => _fallbackCopy(text));
  } else {
    _fallbackCopy(text);
  }
}
function _fallbackCopy(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  el.remove();
  Toast.success('Copied!');
}

/* ─── Page guard — run on every protected page ────────────── */
// Call this at the top of any page script that needs login
function requireLogin() {
  return Auth.requireAuth();
}

/* ─── Auto-init on DOMContentLoaded ──────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Pages that do NOT need auth
  const PUBLIC = ['index.html', ''];
  const pageName = window.location.pathname.split('/').pop();
  const isPublic = PUBLIC.includes(pageName);

  if (!isPublic) {
    // Silently redirect to login if not logged in
    if (!Auth.isLoggedIn()) {
      Auth.requireAuth();
      return;
    }
  }
});

/* ─── Expose globals needed by inline scripts ─────────────── */
window.API          = API;
window.Auth         = Auth;
window.Storage      = Storage;
window.Toast        = Toast;
window.formatAmount = formatAmount;
window.formatDate   = formatDate;
window.formatTime   = formatTime;
window.copyToClipboard = copyToClipboard;
window.requireLogin    = requireLogin;
