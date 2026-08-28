/* ============================================================
   JLOODNA — Shared Header / Footer Injector
   ============================================================ */

const CATEGORIES = [
  { name: 'Électronique', slug: 'electronique', icon: '📱' },
  { name: 'Mode & Vêtements', slug: 'mode', icon: '👗' },
  { name: 'Maison & Jardin', slug: 'maison', icon: '🏠' },
  { name: 'Beauté & Santé', slug: 'beaute', icon: '💄' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Enfants & Jouets', slug: 'jouets', icon: '🧸' },
  { name: 'Alimentation', slug: 'alimentation', icon: '🛒' },
  { name: 'Automobile', slug: 'auto', icon: '🚗' },
  { name: 'Informatique', slug: 'informatique', icon: '💻' },
  { name: 'Livres & Médias', slug: 'livres', icon: '📚' },
  { name: 'Bijoux', slug: 'bijoux', icon: '💎' },
  { name: 'Dropshipping', slug: 'dropshipping', icon: '🌐' }
];

function getRoot() {
  const path = window.location.pathname;
  if (path.includes('/admin/pages/')) return '../../';
  if (path.includes('/admin/') || path.includes('/auth/')) return '../';
  if (path.includes('/pages/')) return '../';
  return '';
}

function buildHeader() {
  const root = getRoot();
  const user = JSON.parse(sessionStorage.getItem('jl_user') || 'null');
  const isAdmin = user && ['jloodna@gmail.com', 'odthanempire@gmail.com'].includes(user.email);

  return `
<header class="site-header" id="siteHeader">
  <div class="header-top">
    <div>📦 Livraison gratuite dès G 5 000 | 🇭🇹 Haiti &amp; 🇩🇴 RD</div>
    <div style="display:flex;gap:16px;align-items:center">
      <button id="currencyToggle" style="background:none;border:none;color:rgba(255,255,255,.75);cursor:pointer;font-size:12px">HTG → DOP</button>
      <span>|</span>
      <a href="${root}pages/contact.html">Support</a>
      <a href="${root}pages/track.html">Suivi commande</a>
      ${isAdmin ? `<a href="${root}admin/pages/dashboard.html" style="color:#ffa726;font-weight:700">⚙️ Admin</a>` : ''}
    </div>
  </div>

  <div class="header-main container">
    <a href="${root}index.html" class="logo-wrap">
      <div class="logo-text">
        <span class="logo-name">Jloodna</span>
        <span class="logo-tagline">Global Trading</span>
      </div>
    </a>

    <form class="search-bar" id="searchForm" style="position:relative">
      <select id="searchCat" aria-label="Catégorie">
        <option value="">Toutes</option>
        ${CATEGORIES.map(c => `<option value="${c.slug}">${c.name}</option>`).join('')}
      </select>
      <input type="text" id="searchInput" placeholder="Rechercher produits, marques…" autocomplete="off" aria-label="Recherche">
      <button type="submit" aria-label="Rechercher">🔍</button>
    </form>

    <div class="header-actions">
      <!-- Notifications -->
      <div style="position:relative">
        <button class="header-action-btn" id="notifBtn" aria-label="Notifications">
          <span class="icon">🔔</span>
          <span class="hide-mobile">Alertes</span>
          <span class="badge notif-badge" style="display:none">0</span>
        </button>
        <div class="notif-panel" id="notifPanel">
          <div class="notif-header">
            <span>Notifications</span>
            <button onclick="Notifs.markAllRead();Notifs.render()" style="font-size:12px;color:#1565c0;background:none;border:none;cursor:pointer">Tout lire</button>
          </div>
          <div class="notif-list" id="notifList"></div>
        </div>
      </div>

      <!-- Account -->
      ${user
        ? `<a href="${root}pages/account.html" class="header-action-btn">
             <span class="icon">👤</span>
             <span class="hide-mobile">${user.name?.split(' ')[0] || 'Mon compte'}</span>
           </a>`
        : `<a href="${root}auth/login.html" class="header-action-btn">
             <span class="icon">👤</span>
             <span class="hide-mobile">Connexion</span>
           </a>`}

      <!-- Wishlist -->
      <a href="${root}pages/wishlist.html" class="header-action-btn">
        <span class="icon">❤️</span>
        <span class="hide-mobile">Favoris</span>
        <span class="badge wishlist-count" style="background:#c62828">0</span>
      </a>

      <!-- Cart -->
      <button class="header-action-btn" id="cartBtn" aria-label="Panier">
        <span class="icon">🛒</span>
        <span class="hide-mobile">Panier</span>
        <span class="badge cart-count" style="display:none">0</span>
      </button>
    </div>

    <!-- Mobile menu btn -->
    <button class="btn-icon hide-desktop" id="mobileMenuBtn" style="background:none;color:#fff;font-size:22px" aria-label="Menu">☰</button>
  </div>

  <nav class="header-nav" id="headerNav">
    <div class="container" style="display:flex;width:100%">
      <a href="${root}index.html">🏠 Accueil</a>
      <a href="${root}pages/shop.html">🛍️ Boutique</a>
      ${CATEGORIES.slice(0, 6).map(c => `<a href="${root}pages/category.html?cat=${c.slug}">${c.icon} ${c.name}</a>`).join('')}
      <a href="${root}pages/deals.html" class="nav-special">🔥 Offres du Jour</a>
    </div>
  </nav>

  <!-- Mobile Menu -->
  <div id="mobileMenu" style="display:none;background:#0d2d52;padding:16px">
    <div style="display:flex;flex-direction:column;gap:4px">
      <a href="${root}index.html" style="color:#fff;padding:10px 16px;border-radius:8px;display:block">🏠 Accueil</a>
      <a href="${root}pages/shop.html" style="color:#fff;padding:10px 16px;border-radius:8px;display:block">🛍️ Boutique</a>
      ${CATEGORIES.map(c => `<a href="${root}pages/category.html?cat=${c.slug}" style="color:rgba(255,255,255,.8);padding:8px 16px;border-radius:8px;display:block;font-size:14px">${c.icon} ${c.name}</a>`).join('')}
      ${user
        ? `<a href="${root}pages/account.html" style="color:#ffa726;padding:10px 16px;border-radius:8px;display:block">👤 Mon Compte</a>
           <button onclick="Auth.logout()" style="color:#ff6f00;padding:10px 16px;border-radius:8px;display:block;background:none;border:none;text-align:left;width:100%;font-size:16px;cursor:pointer">🚪 Déconnexion</button>`
        : `<a href="${root}auth/login.html" style="color:#ffa726;padding:10px 16px;border-radius:8px;display:block">🔑 Connexion / Inscription</a>`}
    </div>
  </div>
</header>

<!-- Cart Sidebar -->
<div class="cart-overlay" id="cartOverlay"></div>
<div class="cart-sidebar" id="cartSidebar">
  <div class="cart-header">
    <div class="cart-title">🛒 Mon Panier</div>
    <button class="cart-close" id="cartClose">✕</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-footer">
    <div class="cart-total-row"><span>Sous-total</span><span id="cartSubtotal">G 0.00</span></div>
    <div class="cart-total-row"><span>Livraison</span><span style="color:#2e7d32">Calculé au checkout</span></div>
    <div class="cart-total-row main"><span>Total</span><span id="cartTotal">G 0.00</span></div>
    <a href="${root}pages/checkout.html" class="btn btn-primary btn-block mt-sm" style="margin-top:12px">Passer la commande →</a>
    <a href="${root}pages/shop.html" class="btn btn-outline btn-block" style="margin-top:8px">Continuer les achats</a>
  </div>
</div>

<!-- Toast container -->
<div class="toast-container" id="toastContainer"></div>
`;
}

function buildFooter() {
  const root = getRoot();
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="logo-text">
          <span class="logo-name" style="color:#fff">Jloodna</span>
          <span class="logo-tagline">Global Trading</span>
        </div>
        <p>Votre marketplace de confiance pour Haiti et la République Dominicaine. Produits premium, livraison rapide, service client 24/7.</p>
        <div class="footer-social">
          <a href="#" aria-label="Facebook">📘</a>
          <a href="#" aria-label="Instagram">📸</a>
          <a href="#" aria-label="WhatsApp">💬</a>
          <a href="#" aria-label="Twitter">🐦</a>
          <a href="#" aria-label="YouTube">▶️</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Boutique</h4>
        <ul>
          <li><a href="${root}pages/shop.html">Catalogue complet</a></li>
          <li><a href="${root}pages/deals.html">Offres du Jour</a></li>
          <li><a href="${root}pages/category.html">Catégories</a></li>
          <li><a href="${root}pages/search.html">Recherche avancée</a></li>
          <li><a href="${root}pages/wishlist.html">Mes favoris</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Mon Compte</h4>
        <ul>
          <li><a href="${root}auth/login.html">Connexion</a></li>
          <li><a href="${root}auth/register.html">Inscription</a></li>
          <li><a href="${root}pages/account.html">Mon profil</a></li>
          <li><a href="${root}pages/orders.html">Mes commandes</a></li>
          <li><a href="${root}pages/track.html">Suivi livraison</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Support</h4>
        <ul>
          <li><a href="${root}pages/faq.html">FAQ</a></li>
          <li><a href="${root}pages/contact.html">Nous contacter</a></li>
          <li><a href="${root}pages/returns.html">Retours & Remboursements</a></li>
          <li><a href="${root}pages/privacy.html">Confidentialité</a></li>
          <li><a href="${root}pages/terms.html">Conditions d'utilisation</a></li>
        </ul>
      </div>
    </div>

    <div style="background:rgba(255,255,255,.06);border-radius:12px;padding:20px;margin-top:32px">
      <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:700;color:#fff">📧 Newsletter — Offres exclusives</span>
        <div style="display:flex;gap:8px;flex:1;max-width:400px">
          <input type="email" placeholder="Votre adresse email" id="newsletterEmail"
            style="flex:1;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;font-size:13px">
          <button onclick="subscribeNewsletter()" class="btn btn-primary btn-sm">S'abonner</button>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Jloodna Global Trading. Tous droits réservés.</span>
      <div class="footer-payments">
        <span style="font-size:12px;margin-right:8px">Paiements acceptés:</span>
        <span class="payment-icon">PayPal</span>
        <span class="payment-icon">NatCash</span>
        <span class="payment-icon">HTG</span>
      </div>
      <span>Devise: <strong id="footerCurrency">HTG (G)</strong></span>
    </div>
  </div>
</footer>`;
}

function injectLayout() {
  const headerEl = document.getElementById('appHeader');
  const footerEl = document.getElementById('appFooter');
  if (headerEl) headerEl.innerHTML = buildHeader();
  if (footerEl) footerEl.innerHTML = buildFooter();

  // Update mobile menu toggle
  const mmBtn = document.getElementById('mobileMenuBtn');
  const mm = document.getElementById('mobileMenu');
  if (mmBtn && mm) {
    mmBtn.addEventListener('click', () => {
      mm.style.display = mm.style.display === 'none' ? 'block' : 'none';
    });
  }

  // Update footer currency label
  const fc = document.getElementById('footerCurrency');
  if (fc) fc.textContent = State?.currency === 'DOP' ? 'DOP (RD$)' : 'HTG (G)';
}

function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value;
  if (!email || !email.includes('@')) { Toast.show('error', 'Email invalide', 'Entrez une adresse valide'); return; }
  Toast.show('success', '✉️ Abonné!', 'Bienvenue dans notre newsletter');
  document.getElementById('newsletterEmail').value = '';
}

document.addEventListener('DOMContentLoaded', injectLayout);
