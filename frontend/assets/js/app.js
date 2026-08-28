/* ============================================================
   JLOODNA | GLOBAL TRADING — Main App JS
   ============================================================ */

'use strict';

// ─── CONFIG ─────────────────────────────────────────────────
const JL = {
  currency: { default: 'HTG', symbol: 'G', dop_rate: 0.37 },
  paypal: { clientId: 'AdI4wGqusD1U_r2ng3TxPlIUpNdHFN0CkoVc1bTtUuGumlKeItEm7kgy74gym9w-rPs4-D0lANzmZq5j' },
  natcash: { phone: '+50940894038' },
  api: { base: '/api' },
  admin: { emails: ['jloodna@gmail.com', 'odthanempire@gmail.com'] }
};

// ─── STATE ──────────────────────────────────────────────────
const State = {
  cart: JSON.parse(localStorage.getItem('jl_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('jl_wishlist') || '[]'),
  user: JSON.parse(sessionStorage.getItem('jl_user') || 'null'),
  currency: localStorage.getItem('jl_currency') || 'HTG',
  notifications: JSON.parse(localStorage.getItem('jl_notifs') || '[]'),

  saveCart() { localStorage.setItem('jl_cart', JSON.stringify(this.cart)); },
  saveWishlist() { localStorage.setItem('jl_wishlist', JSON.stringify(this.wishlist)); },
  saveCurrency() { localStorage.setItem('jl_currency', this.currency); }
};

// ─── CURRENCY ────────────────────────────────────────────────
const Currency = {
  format(amountHTG, currency = State.currency) {
    if (currency === 'DOP') {
      const dop = amountHTG * JL.currency.dop_rate;
      return `RD$ ${dop.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `G ${Number(amountHTG).toLocaleString('fr-HT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },
  toggle() {
    State.currency = State.currency === 'HTG' ? 'DOP' : 'HTG';
    State.saveCurrency();
    Currency.refresh();
  },
  refresh() {
    document.querySelectorAll('[data-price]').forEach(el => {
      const raw = parseFloat(el.dataset.price);
      if (!isNaN(raw)) el.textContent = Currency.format(raw);
    });
    const btn = document.getElementById('currencyToggle');
    if (btn) btn.textContent = State.currency === 'HTG' ? 'HTG → DOP' : 'DOP → HTG';
  }
};

// ─── CART ────────────────────────────────────────────────────
const Cart = {
  add(product) {
    const idx = State.cart.findIndex(i => i.id === product.id && i.variant === product.variant);
    if (idx > -1) {
      State.cart[idx].qty = Math.min(State.cart[idx].qty + (product.qty || 1), 99);
    } else {
      State.cart.push({ ...product, qty: product.qty || 1 });
    }
    State.saveCart();
    Cart.updateUI();
    Toast.show('success', '🛒 Produit ajouté', `${product.title} ajouté au panier`);
    Cart.openSidebar();
  },
  remove(id, variant) {
    State.cart = State.cart.filter(i => !(i.id === id && i.variant === variant));
    State.saveCart();
    Cart.updateUI();
    Cart.renderSidebar();
  },
  updateQty(id, variant, qty) {
    const item = State.cart.find(i => i.id === id && i.variant === variant);
    if (item) {
      if (qty < 1) { Cart.remove(id, variant); return; }
      item.qty = Math.min(qty, 99);
      State.saveCart();
      Cart.updateUI();
      Cart.renderSidebar();
    }
  },
  total() { return State.cart.reduce((s, i) => s + i.price * i.qty, 0); },
  count() { return State.cart.reduce((s, i) => s + i.qty, 0); },
  updateUI() {
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = Cart.count();
      el.style.display = Cart.count() > 0 ? 'flex' : 'none';
    });
  },
  openSidebar() {
    document.getElementById('cartSidebar')?.classList.add('open');
    document.getElementById('cartOverlay')?.classList.add('open');
    Cart.renderSidebar();
  },
  closeSidebar() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('cartOverlay')?.classList.remove('open');
  },
  renderSidebar() {
    const el = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    const subtotal = document.getElementById('cartSubtotal');
    if (!el) return;
    const root = typeof getRoot === 'function' ? getRoot() : '';
    const placeholder = `${root}frontend/assets/images/placeholder.png`;
    if (State.cart.length === 0) {
      el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🛒</div>
        <div class="empty-state-title">Panier vide</div>
        <div class="empty-state-msg">Ajoutez des produits pour continuer</div>
        <a href="shop.html" class="btn btn-primary">Continuer les achats</a></div>`;
    } else {
      el.innerHTML = State.cart.map(item => `
        <div class="cart-item">
          <img class="cart-item-img" src="${item.image || placeholder}" alt="${item.title}">
          <div class="cart-item-body">
            <div class="cart-item-title">${item.title}</div>
            ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
            <div class="cart-item-price">${Currency.format(item.price * item.qty)}</div>
            <div class="cart-qty-ctrl">
              <button class="qty-btn" onclick="Cart.updateQty('${item.id}','${item.variant||''}',${item.qty - 1})">−</button>
              <span class="qty-num">${item.qty}</span>
              <button class="qty-btn" onclick="Cart.updateQty('${item.id}','${item.variant||''}',${item.qty + 1})">+</button>
            </div>
            <span class="cart-remove" onclick="Cart.remove('${item.id}','${item.variant||''}')">🗑 Supprimer</span>
          </div>
        </div>`).join('');
    }
    if (subtotal) subtotal.textContent = Currency.format(Cart.total());
    if (total) total.textContent = Currency.format(Cart.total());
  }
};

// ─── WISHLIST ────────────────────────────────────────────────
const Wishlist = {
  toggle(product) {
    const idx = State.wishlist.findIndex(i => i.id === product.id);
    if (idx > -1) {
      State.wishlist.splice(idx, 1);
      Toast.show('info', '💔 Retiré', 'Produit retiré des favoris');
    } else {
      State.wishlist.push(product);
      Toast.show('success', '❤️ Favori', 'Produit ajouté aux favoris');
    }
    State.saveWishlist();
    Wishlist.updateUI();
  },
  has(id) { return State.wishlist.some(i => i.id === id); },
  updateUI() {
    document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
      const id = btn.dataset.wishlistBtn;
      btn.classList.toggle('active', Wishlist.has(id));
    });
    document.querySelectorAll('.wishlist-count').forEach(el => {
      el.textContent = State.wishlist.length;
    });
  }
};

// ─── TOAST ──────────────────────────────────────────────────
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toastContainer');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toastContainer';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(type = 'info', title, msg, duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span>
      <div class="toast-body"><div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}</div>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
    this.container.appendChild(t);
    setTimeout(() => t.remove(), duration);
  }
};

// ─── NOTIFICATIONS (Real-time simulation) ────────────────────
const Notifs = {
  list: JSON.parse(localStorage.getItem('jl_notifs') || '[]'),
  unread() { return this.list.filter(n => !n.read).length; },
  add(notif) {
    this.list.unshift({ ...notif, id: Date.now(), read: false, time: new Date().toISOString() });
    localStorage.setItem('jl_notifs', JSON.stringify(this.list.slice(0, 50)));
    this.updateBadge();
    Toast.show('info', '🔔 ' + notif.title, notif.message);
  },
  markAllRead() {
    this.list.forEach(n => n.read = true);
    localStorage.setItem('jl_notifs', JSON.stringify(this.list));
    this.updateBadge();
  },
  updateBadge() {
    const count = this.unread();
    document.querySelectorAll('.notif-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },
  render() {
    const list = document.getElementById('notifList');
    if (!list) return;
    list.innerHTML = this.list.length === 0
      ? `<div class="empty-state" style="padding:24px"><div class="empty-state-icon">🔔</div><div class="empty-state-title">Aucune notification</div></div>`
      : this.list.slice(0, 20).map(n => `
        <div class="notif-item ${n.read ? '' : 'unread'}" onclick="Notifs.markRead('${n.id}')">
          ${!n.read ? '<div class="notif-dot"></div>' : '<div style="width:8px"></div>'}
          <div><div class="notif-text">${n.title}: ${n.message}</div>
          <div class="notif-time">${timeAgo(n.time)}</div></div>
        </div>`).join('');
  },
  markRead(id) {
    const n = this.list.find(x => x.id == id);
    if (n) { n.read = true; localStorage.setItem('jl_notifs', JSON.stringify(this.list)); this.updateBadge(); this.render(); }
  }
};

// ─── SEARCH ─────────────────────────────────────────────────
const Search = {
  query: '',
  results: [],
  async quick(q) {
    if (q.length < 2) { document.getElementById('searchDropdown')?.classList.remove('open'); return; }
    // Demo: filter from local product cache
    const all = JSON.parse(localStorage.getItem('jl_products') || '[]');
    const results = all.filter(p => p.title?.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
    this.showDropdown(results, q);
  },
  showDropdown(results, q) {
    let dd = document.getElementById('searchDropdown');
    if (!dd) {
      dd = document.createElement('div');
      dd.id = 'searchDropdown';
      dd.className = 'search-dropdown';
      document.querySelector('.search-bar')?.appendChild(dd);
    }
    if (results.length === 0) { dd.innerHTML = `<div class="search-dd-empty">Aucun résultat pour "${q}"</div>`; }
    else {
      dd.innerHTML = results.map(p => `
        <a href="${getRoot()}pages/product.html?id=${p.id}" class="search-dd-item">
          <img src="${p.image || `${getRoot()}frontend/assets/images/placeholder.png`}" alt="">
          <div><div class="search-dd-title">${p.title}</div>
          <div class="search-dd-price">${Currency.format(p.price)}</div></div>
        </a>`).join('') + `<a href="search.html?q=${encodeURIComponent(q)}" class="search-dd-all">Voir tous les résultats →</a>`;
    }
    dd.classList.add('open');
  }
};

// ─── AUTH ────────────────────────────────────────────────────
const Auth = {
  isLoggedIn() { return !!State.user; },
  requireLogin(redirect = 'login.html') {
    if (!this.isLoggedIn()) { window.location.href = redirect; return false; }
    return true;
  },
  logout() {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    sessionStorage.removeItem('jl_user');
    sessionStorage.removeItem('jl_token');
    State.user = null;
    Toast.show('info', 'Déconnexion', 'Vous avez été déconnecté');
    setTimeout(() => window.location.href = 'index.html', 1000);
  }
};

// ─── DEALS COUNTDOWN ─────────────────────────────────────────
const Countdown = {
  start(endTime, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const tick = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { el.innerHTML = '<span>Offre expirée</span>'; return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.querySelector('[data-h]').textContent = String(h).padStart(2, '0');
      el.querySelector('[data-m]').textContent = String(m).padStart(2, '0');
      el.querySelector('[data-s]').textContent = String(s).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  }
};

// ─── HERO SLIDER ─────────────────────────────────────────────
const Slider = {
  current: 0,
  autoplay: null,
  init(containerId) {
    const slides = document.querySelectorAll(`#${containerId} .hero-slide`);
    const dots = document.querySelectorAll(`#${containerId} .hero-dot`);
    if (!slides.length) return;
    const go = (i) => {
      slides[this.current].classList.remove('active');
      dots[this.current]?.classList.remove('active');
      this.current = (i + slides.length) % slides.length;
      slides[this.current].classList.add('active');
      dots[this.current]?.classList.add('active');
    };
    document.querySelectorAll(`#${containerId} .hero-dot`).forEach((d, i) => d.addEventListener('click', () => { go(i); this.resetAuto(slides, go); }));
    document.getElementById('heroPrev')?.addEventListener('click', () => { go(this.current - 1); this.resetAuto(slides, go); });
    document.getElementById('heroNext')?.addEventListener('click', () => { go(this.current + 1); this.resetAuto(slides, go); });
    this.autoplay = setInterval(() => go(this.current + 1), 5000);
  },
  resetAuto(slides, go) {
    clearInterval(this.autoplay);
    this.autoplay = setInterval(() => go(this.current + 1), 5000);
  }
};

// ─── UTILS ──────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso);
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function sanitize(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Cart.updateUI();
  Wishlist.updateUI();
  Notifs.updateBadge();
  Currency.refresh();

  // Cart sidebar toggle
  document.getElementById('cartBtn')?.addEventListener('click', Cart.openSidebar);
  document.getElementById('cartOverlay')?.addEventListener('click', Cart.closeSidebar);
  document.getElementById('cartClose')?.addEventListener('click', Cart.closeSidebar);

  // Currency toggle
  document.getElementById('currencyToggle')?.addEventListener('click', Currency.toggle);

  // Search with debounce
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(e => Search.quick(e.target.value), 250));
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        window.location.href = `search.html?q=${encodeURIComponent(e.target.value)}`;
      }
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-bar')) document.getElementById('searchDropdown')?.classList.remove('open');
    });
  }

  // Search category select
  const searchForm = document.getElementById('searchForm');
  searchForm?.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('searchInput').value;
    const cat = document.getElementById('searchCat').value;
    window.location.href = `search.html?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(cat)}`;
  });

  // Notification panel
  const notifBtn = document.getElementById('notifBtn');
  const notifPanel = document.getElementById('notifPanel');
  notifBtn?.addEventListener('click', e => {
    e.stopPropagation();
    notifPanel?.classList.toggle('open');
    Notifs.render();
    if (notifPanel?.classList.contains('open')) Notifs.markAllRead();
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#notifBtn') && !e.target.closest('#notifPanel')) notifPanel?.classList.remove('open');
  });

  // Mobile menu
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('open');
  });

  // Slider init
  if (document.getElementById('heroSlider')) Slider.init('heroSlider');

  // Sticky ATC on product page
  const stickyAtc = document.getElementById('stickyAtc');
  if (stickyAtc) {
    const trigger = document.getElementById('mainAtcBtn');
    if (trigger) {
      const obs = new IntersectionObserver(entries => {
        stickyAtc.classList.toggle('visible', !entries[0].isIntersecting);
      });
      obs.observe(trigger);
    }
  }

  // Mark active nav
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.header-nav a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });

  // Real-time notif simulation (demo)
  if (Math.random() < 0.3) {
    setTimeout(() => {
      Notifs.add({ title: '🔥 Offre limitée', message: 'Réduction de 30% sur les électroniques!' });
    }, 8000);
  }
});

// ─── SEARCH DROPDOWN STYLES (injected) ───────────────────────
(function injectSearchStyles() {
  const s = document.createElement('style');
  s.textContent = `
    .search-dropdown { position:absolute; top:100%; left:0; right:0; background:#fff;
      border-radius:0 0 10px 10px; box-shadow:0 8px 32px rgba(0,0,0,0.15);
      z-index:200; border:1px solid #e2e8f0; border-top:none; display:none; }
    .search-dropdown.open { display:block; }
    .search-dd-item { display:flex; gap:10px; align-items:center; padding:10px 14px;
      border-bottom:1px solid #f0f0e8; transition:background 0.15s; color:#1a1a2e; }
    .search-dd-item:hover { background:#f5f5f0; }
    .search-dd-item img { width:40px; height:40px; object-fit:cover; border-radius:6px; background:#f0f0e8; }
    .search-dd-title { font-size:13px; font-weight:600; }
    .search-dd-price { font-size:12px; color:#ff6f00; font-weight:700; }
    .search-dd-empty { padding:16px; text-align:center; color:#9aa3b2; font-size:13px; }
    .search-dd-all { display:block; padding:10px 14px; text-align:center;
      font-size:13px; font-weight:600; color:#1565c0; background:#f5f5f0; }
    .search-dd-all:hover { background:#e8f0ff; }
  `;
  document.head.appendChild(s);
})();
