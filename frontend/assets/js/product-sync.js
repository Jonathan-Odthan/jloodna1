/**
 * ============================================================
 *  JLOODNA — product-sync.js
 *  Synchronisation automatique des produits (Admin → Boutique)
 * ============================================================
 *
 *  INSTALLATION :
 *  Ajouter ce script dans <head> ou avant </body> sur TOUTES
 *  les pages de la boutique (index, catalogue, produit, panier…)
 *
 *  <script src="/frontend/assets/js/product-sync.js"></script>
 *
 *  ► Le dashboard admin utilise déjà localStorage :
 *      'jl_admin_products'  ← source principale (admin)
 *      'jl_products'        ← copie lue par les pages publiques
 *
 *  Ce fichier :
 *    1. Lit 'jl_admin_products' comme source de vérité
 *    2. Tient 'jl_products' toujours à jour
 *    3. Détecte les changements en temps réel (StorageEvent)
 *    4. Expose une API globale window.JlProductSync
 *    5. Déclenche des événements DOM pour que les pages puissent
 *       rafraîchir leur affichage sans reload
 * ============================================================
 */

(function (window) {
  'use strict';

  /* ── Clés localStorage ─────────────────────────────────── */
  const KEY_ADMIN   = 'jl_admin_products';   // source admin (vérité)
  const KEY_PUBLIC  = 'jl_products';         // copie publique
  const KEY_VERSION = 'jl_products_version'; // numéro de version

  /* ── Événement personnalisé émis lors d'une mise à jour ── */
  const SYNC_EVENT = 'jloodna:products:updated';

  /* ────────────────────────────────────────────────────────
   *  Lecture / écriture
   * ──────────────────────────────────────────────────────── */
  function readAdmin() {
    try {
      return JSON.parse(localStorage.getItem(KEY_ADMIN) || '[]');
    } catch (e) {
      console.warn('[JlSync] Erreur lecture admin:', e);
      return [];
    }
  }

  function readPublic() {
    try {
      return JSON.parse(localStorage.getItem(KEY_PUBLIC) || '[]');
    } catch (e) {
      return [];
    }
  }

  function writePublic(products) {
    try {
      localStorage.setItem(KEY_PUBLIC, JSON.stringify(products));
      localStorage.setItem(KEY_VERSION, Date.now().toString());
    } catch (e) {
      console.warn('[JlSync] Erreur écriture publique:', e);
    }
  }

  /* ────────────────────────────────────────────────────────
   *  Synchronisation principale
   *  Copie jl_admin_products → jl_products (actifs seulement)
   * ──────────────────────────────────────────────────────── */
  function syncProducts(options) {
    const opts = Object.assign({ activeOnly: false, silent: false }, options);
    const admin = readAdmin();

    if (!admin.length && readPublic().length > 0) {
      // Rien dans l'admin → ne pas écraser les produits publics existants
      if (!opts.silent) console.log('[JlSync] Admin vide — synchronisation ignorée');
      return readPublic();
    }

    const products = opts.activeOnly
      ? admin.filter(p => p.status !== 'inactive')
      : admin;

    writePublic(products);

    if (!opts.silent) {
      console.log(`[JlSync] ✅ ${products.length} produit(s) synchronisé(s)`);
    }

    // Émettre un événement DOM pour que les pages puissent réagir
    dispatchSyncEvent(products);

    return products;
  }

  /* ────────────────────────────────────────────────────────
   *  Émission d'événement DOM
   * ──────────────────────────────────────────────────────── */
  function dispatchSyncEvent(products) {
    try {
      const event = new CustomEvent(SYNC_EVENT, {
        detail: { products, count: products.length, timestamp: Date.now() },
        bubbles: true,
      });
      window.dispatchEvent(event);
    } catch (e) {
      // IE fallback
      const event = document.createEvent('Event');
      event.initEvent(SYNC_EVENT, true, true);
      window.dispatchEvent(event);
    }
  }

  /* ────────────────────────────────────────────────────────
   *  Écoute des changements inter-onglets (StorageEvent)
   *  ► Se déclenche quand l'admin sauvegarde depuis un autre onglet
   * ──────────────────────────────────────────────────────── */
  window.addEventListener('storage', function (e) {
    if (e.key === KEY_ADMIN || e.key === KEY_PUBLIC) {
      console.log('[JlSync] 🔄 Changement détecté dans localStorage — resynchronisation');
      syncProducts({ silent: true });
    }
  });

  /* ────────────────────────────────────────────────────────
   *  Polling léger (fallback même onglet)
   *  Vérifie si la version a changé toutes les 3 secondes
   * ──────────────────────────────────────────────────────── */
  let _lastVersion = localStorage.getItem(KEY_VERSION) || '0';

  function pollVersion() {
    const current = localStorage.getItem(KEY_VERSION) || '0';
    if (current !== _lastVersion) {
      _lastVersion = current;
      const products = readPublic();
      console.log('[JlSync] 🔄 Version mise à jour — rendu déclenché');
      dispatchSyncEvent(products);
    }
  }

  setInterval(pollVersion, 3000);

  /* ────────────────────────────────────────────────────────
   *  API publique — window.JlProductSync
   * ──────────────────────────────────────────────────────── */
  window.JlProductSync = {

    /**
     * Retourne tous les produits (actifs + inactifs)
     */
    getAll: function () {
      return readPublic();
    },

    /**
     * Retourne uniquement les produits actifs
     */
    getActive: function () {
      return readPublic().filter(p => p.status !== 'inactive');
    },

    /**
     * Filtre par catégorie
     * @param {string} slug  ex: 'electronique'
     */
    getByCategory: function (slug) {
      return readPublic().filter(p => p.category === slug && p.status !== 'inactive');
    },

    /**
     * Filtre par tag
     * @param {string} tag  ex: 'featured' | 'hot' | 'new'
     */
    getByTag: function (tag) {
      return readPublic().filter(p => (p.tags || []).includes(tag) && p.status !== 'inactive');
    },

    /**
     * Cherche par texte (titre, marque, description)
     * @param {string} query
     */
    search: function (query) {
      const q = query.toLowerCase();
      return readPublic().filter(p =>
        p.status !== 'inactive' && (
          (p.title || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
        )
      );
    },

    /**
     * Retourne un produit par son ID
     * @param {string} id
     */
    getById: function (id) {
      return readPublic().find(p => p.id === id) || null;
    },

    /**
     * Force une resynchronisation manuelle
     */
    sync: function () {
      return syncProducts();
    },

    /**
     * Écoute les mises à jour de produits
     * @param {function} callback  reçoit (products[])
     * @returns {function} unsubscribe
     */
    onUpdate: function (callback) {
      function handler(e) {
        callback(e.detail ? e.detail.products : readPublic());
      }
      window.addEventListener(SYNC_EVENT, handler);
      return function () { window.removeEventListener(SYNC_EVENT, handler); };
    },

    /**
     * Formate un prix en HTG
     * @param {number} n
     */
    formatPrice: function (n) {
      return 'G ' + Number(n).toLocaleString('fr-HT', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },

    /**
     * Génère le HTML d'une carte produit prêt à insérer
     * Adapte le chemin href selon la structure de ton projet
     * @param {object} p  objet produit
     */
    renderCard: function (p) {
      const price    = this.formatPrice(p.price);
      const oldPrice = p.priceOld ? this.formatPrice(p.priceOld) : '';
      const badge    = (p.tags || []).includes('hot')
        ? '<span class="product-badge badge-hot">🔥 Hot</span>'
        : (p.tags || []).includes('new')
          ? '<span class="product-badge badge-new">🆕 Nouveau</span>'
          : (p.tags || []).includes('featured')
            ? '<span class="product-badge badge-featured">⭐ Vedette</span>'
            : '';
      const discount = p.priceOld && p.priceOld > p.price
        ? Math.round((1 - p.price / p.priceOld) * 100)
        : 0;
      const discountBadge = discount > 0
        ? `<span class="product-badge badge-discount">-${discount}%</span>`
        : '';

      return `
        <div class="product-card" data-id="${p.id}" data-category="${p.category || ''}">
          <a href="/pages/product.html?id=${p.id}" class="product-card-link">
            <div class="product-card-img-wrap">
              ${badge}${discountBadge}
              <img
                src="${p.image || '/frontend/assets/images/placeholder.png'}"
                alt="${p.title}"
                loading="lazy"
                onerror="this.src='/frontend/assets/images/placeholder.png'"
                class="product-card-img"
              >
              ${p.stock === 0 ? '<div class="product-card-rupture">Rupture de stock</div>' : ''}
            </div>
            <div class="product-card-body">
              ${p.brand ? `<div class="product-card-brand">${p.brand}</div>` : ''}
              <div class="product-card-title">${p.title}</div>
              <div class="product-card-price">
                <span class="price-htg">${price}</span>
                ${oldPrice ? `<span class="price-old">${oldPrice}</span>` : ''}
              </div>
              <div class="product-card-rating">
                ${'★'.repeat(Math.round(p.rating || 4))}${'☆'.repeat(5 - Math.round(p.rating || 4))}
                <span class="review-count">(${p.reviews || 0})</span>
              </div>
            </div>
          </a>
          <button
            class="product-card-cart-btn ${p.stock === 0 ? 'disabled' : ''}"
            onclick="${p.stock === 0 ? '' : `JlProductSync.addToCart('${p.id}')`}"
            ${p.stock === 0 ? 'disabled' : ''}
          >
            ${p.stock === 0 ? 'Indisponible' : '🛒 Ajouter au panier'}
          </button>
        </div>`;
    },

    /**
     * Ajoute un produit au panier (compatible avec cart existant)
     * @param {string} id
     * @param {number} qty
     */
    addToCart: function (id, qty) {
      qty = qty || 1;
      const product = this.getById(id);
      if (!product) { console.warn('[JlSync] Produit introuvable:', id); return; }
      if (product.stock === 0) { alert('Ce produit est en rupture de stock.'); return; }

      const cart = JSON.parse(localStorage.getItem('jl_cart') || '[]');
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty = (existing.qty || 1) + qty;
      } else {
        cart.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          qty: qty,
        });
      }
      localStorage.setItem('jl_cart', JSON.stringify(cart));

      // Met à jour le badge panier s'il existe
      const badge = document.querySelector('.cart-count, #cartCount, .cart-badge');
      if (badge) badge.textContent = cart.reduce((s, i) => s + (i.qty || 1), 0);

      // Notification discrète
      if (window.toast) {
        window.toast('success', `"${product.title}" ajouté au panier!`);
      } else {
        const notif = document.createElement('div');
        notif.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#0a2342;color:#fff;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;z-index:9999;border-left:4px solid #ff6f00;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:slideIn .3s ease';
        notif.innerHTML = `✅ "${product.title}" ajouté au panier!`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
      }

      window.dispatchEvent(new CustomEvent('jloodna:cart:updated', { detail: { cart } }));
    },

    /**
     * Remplit automatiquement un conteneur HTML avec les produits
     * @param {string|Element} selector  sélecteur CSS ou élément DOM
     * @param {object}         options   { category, tag, limit, activeOnly }
     */
    autoRender: function (selector, options) {
      const opts = Object.assign({ category: null, tag: null, limit: null, activeOnly: true }, options);
      const container = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (!container) {
        console.warn('[JlSync] Conteneur introuvable:', selector);
        return;
      }

      const render = function () {
        let products = opts.activeOnly
          ? readPublic().filter(p => p.status !== 'inactive')
          : readPublic();

        if (opts.category) products = products.filter(p => p.category === opts.category);
        if (opts.tag)      products = products.filter(p => (p.tags || []).includes(opts.tag));
        if (opts.limit)    products = products.slice(0, opts.limit);

        if (!products.length) {
          container.innerHTML = '<div class="products-empty" style="text-align:center;padding:40px;color:#9aa3b2;font-size:14px">Aucun produit disponible pour le moment.</div>';
          return;
        }

        container.innerHTML = products.map(p => window.JlProductSync.renderCard(p)).join('');
      };

      // Premier rendu
      render();

      // Ré-rendu automatique à chaque mise à jour
      window.addEventListener(SYNC_EVENT, render);
    },
  };

  /* ────────────────────────────────────────────────────────
   *  Initialisation au chargement de la page
   * ──────────────────────────────────────────────────────── */
  function init() {
    // Synchronise immédiatement au chargement
    syncProducts({ silent: false });

    // Cherche les conteneurs avec attributs data-jl-* dans la page
    // et les remplit automatiquement (sans écrire de JS supplémentaire)
    //
    //  Exemple HTML :
    //  <div data-jl-products data-jl-limit="8" data-jl-tag="featured"></div>
    //  <div data-jl-products data-jl-category="electronique"></div>
    //
    document.querySelectorAll('[data-jl-products]').forEach(function (el) {
      window.JlProductSync.autoRender(el, {
        category  : el.dataset.jlCategory  || null,
        tag       : el.dataset.jlTag       || null,
        limit     : el.dataset.jlLimit     ? parseInt(el.dataset.jlLimit) : null,
        activeOnly: el.dataset.jlAll !== 'true',
      });
    });

    console.log('[JlSync] 🚀 product-sync.js initialisé');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);
