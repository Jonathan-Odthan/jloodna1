/* ============================================================
   JLOODNA — Products Store (mock DB, dropshipping-ready)
   ============================================================ */

const PRODUCTS_DB = [
  { id: 'p001', title: 'iPhone 15 Pro Max 256GB', category: 'electronique', brand: 'Apple',
    price: 85000, priceOld: 95000, stock: 12, sku: 'APP-IP15PM-256',
    rating: 4.8, reviews: 234, image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=400',
    images: [], tags: ['featured', 'hot'], status: 'active', weight: 0.22,
    description: 'Le dernier iPhone avec puce A17 Pro, caméra 48MP, design titane.', dropship: false },
  { id: 'p002', title: 'Samsung Galaxy S24 Ultra', category: 'electronique', brand: 'Samsung',
    price: 78000, priceOld: 88000, stock: 8, sku: 'SAM-S24U',
    rating: 4.7, reviews: 189, image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
    images: [], tags: ['featured'], status: 'active', dropship: false,
    description: 'Galaxy S24 Ultra avec S Pen intégré, écran 6.8" Dynamic AMOLED 2X.' },
  { id: 'p003', title: 'MacBook Pro M3 14"', category: 'informatique', brand: 'Apple',
    price: 155000, priceOld: 175000, stock: 5, sku: 'APP-MBP-M3-14',
    rating: 4.9, reviews: 98, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    images: [], tags: ['featured', 'new'], status: 'active', dropship: false,
    description: 'MacBook Pro avec puce M3, écran Liquid Retina XDR, jusqu\'à 18h autonomie.' },
  { id: 'p004', title: 'Nike Air Max 270', category: 'sports', brand: 'Nike',
    price: 15000, priceOld: 18000, stock: 45, sku: 'NIK-AM270-BLK',
    rating: 4.5, reviews: 312, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    images: [], tags: ['hot'], status: 'active', dropship: true,
    description: 'Chaussures running avec technologie Air Max 270 pour un amorti maximal.',
    variants: [{ name: 'Taille', options: ['38','39','40','41','42','43','44','45'] }] },
  { id: 'p005', title: 'Robe Élégante Soirée', category: 'mode', brand: 'Jloodna Fashion',
    price: 8500, priceOld: 12000, stock: 28, sku: 'JL-ROBE-001',
    rating: 4.3, reviews: 67, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400',
    images: [], tags: ['new', 'featured'], status: 'active', dropship: false,
    description: 'Robe de soirée élégante disponible en plusieurs couleurs.',
    variants: [{ name: 'Taille', options: ['XS','S','M','L','XL','XXL'] }, { name: 'Couleur', options: ['Noir','Rouge','Bleu','Blanc'] }] },
  { id: 'p006', title: 'Set Cosmétiques Luxe', category: 'beaute', brand: 'Luxe Beauty',
    price: 12000, priceOld: 15000, stock: 32, sku: 'LB-SET-LUXE-001',
    rating: 4.6, reviews: 145, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
    images: [], tags: ['hot', 'sale'], status: 'active', dropship: true,
    description: 'Set complet de cosmétiques premium: fond de teint, palette, rouge à lèvres.' },
  { id: 'p007', title: 'Canapé 3 Places Velours', category: 'maison', brand: 'Home Luxe',
    price: 45000, priceOld: 60000, stock: 4, sku: 'HL-CANAPE-3P',
    rating: 4.4, reviews: 56, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    images: [], tags: ['featured'], status: 'active', dropship: false,
    description: 'Canapé velours 3 places, structure bois, pieds métal doré.' },
  { id: 'p008', title: 'Playstation 5 Console', category: 'electronique', brand: 'Sony',
    price: 55000, priceOld: 60000, stock: 3, sku: 'SNY-PS5-STD',
    rating: 4.9, reviews: 423, image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
    images: [], tags: ['hot', 'featured'], status: 'active', dropship: false,
    description: 'PlayStation 5 avec manette DualSense, SSD ultra-rapide 825Go.' },
  { id: 'p009', title: 'Montre Smartwatch Pro', category: 'electronique', brand: 'TechPro',
    price: 18000, priceOld: 22000, stock: 20, sku: 'TP-WATCH-PRO-01',
    rating: 4.2, reviews: 87, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    images: [], tags: ['new'], status: 'active', dropship: true,
    description: 'Smartwatch avec suivi santé, GPS intégré, autonomie 7 jours.' },
  { id: 'p010', title: 'Sac à Main Designer', category: 'mode', brand: 'Glam Paris',
    price: 25000, priceOld: 32000, stock: 15, sku: 'GP-SAC-D001',
    rating: 4.7, reviews: 93, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
    images: [], tags: ['featured', 'new'], status: 'active', dropship: false,
    description: 'Sac à main cuir synthétique haut de gamme, style parisien.' },
  { id: 'p011', title: 'Set LEGO Architecture 2000 pcs', category: 'jouets', brand: 'LEGO',
    price: 22000, priceOld: 26000, stock: 10, sku: 'LEG-ARCH-2K',
    rating: 4.8, reviews: 178, image: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400',
    images: [], tags: ['new'], status: 'active', dropship: false,
    description: 'Set LEGO Architecture 2000 pièces, reproduction iconic skylines.' },
  { id: 'p012', title: 'Vélo de Route Carbon', category: 'sports', brand: 'CyclePro',
    price: 68000, priceOld: 80000, stock: 6, sku: 'CP-VELO-CARBON',
    rating: 4.6, reviews: 42, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    images: [], tags: ['featured'], status: 'active', dropship: false,
    description: 'Vélo de route cadre carbone, groupe Shimano 105, freins à disque.' }
];

// Save to localStorage for search & cart use
localStorage.setItem('jl_products', JSON.stringify(PRODUCTS_DB));

const Products = {
  all() { return PRODUCTS_DB; },
  get(id) { return PRODUCTS_DB.find(p => p.id === id); },
  featured() { return PRODUCTS_DB.filter(p => p.tags.includes('featured') && p.status === 'active'); },
  hot() { return PRODUCTS_DB.filter(p => p.tags.includes('hot') && p.status === 'active'); },
  newest() { return [...PRODUCTS_DB].filter(p => p.tags.includes('new')); },
  byCategory(slug) { return PRODUCTS_DB.filter(p => p.category === slug && p.status === 'active'); },
  search(q, filters = {}) {
    let res = PRODUCTS_DB.filter(p => p.status === 'active');
    if (q) res = res.filter(p => p.title.toLowerCase().includes(q.toLowerCase()) || p.brand?.toLowerCase().includes(q.toLowerCase()) || p.category?.toLowerCase().includes(q.toLowerCase()));
    if (filters.cat) res = res.filter(p => p.category === filters.cat);
    if (filters.minPrice) res = res.filter(p => p.price >= filters.minPrice);
    if (filters.maxPrice) res = res.filter(p => p.price <= filters.maxPrice);
    if (filters.rating) res = res.filter(p => p.rating >= filters.rating);
    if (filters.inStock) res = res.filter(p => p.stock > 0);
    if (filters.sort === 'price_asc') res.sort((a, b) => a.price - b.price);
    else if (filters.sort === 'price_desc') res.sort((a, b) => b.price - a.price);
    else if (filters.sort === 'rating') res.sort((a, b) => b.rating - a.rating);
    else if (filters.sort === 'reviews') res.sort((a, b) => b.reviews - a.reviews);
    return res;
  },

  renderCard(p, small = false) {
    const discountPct = p.priceOld ? Math.round((1 - p.price / p.priceOld) * 100) : 0;
    const root = getRoot();
    return `
      <div class="product-card">
        <div class="product-card-img">
          <a href="${root}pages/product.html?id=${p.id}">
            <img src="${p.image}" alt="${sanitize(p.title)}" loading="lazy" onerror="this.src='${root}frontend/assets/images/placeholder.svg'">
          </a>
          <div class="product-card-badges">
            ${discountPct > 0 ? `<span class="badge badge-sale">-${discountPct}%</span>` : ''}
            ${p.tags.includes('new') ? '<span class="badge badge-new">Nouveau</span>' : ''}
            ${p.tags.includes('hot') ? '<span class="badge badge-hot">🔥 Hot</span>' : ''}
            ${p.dropship ? '<span class="badge" style="background:#6a1b9a;color:#fff">Drop</span>' : ''}
          </div>
          <div class="product-card-actions">
            <button class="product-card-action-btn ${Wishlist.has(p.id) ? 'active' : ''}"
              data-wishlist-btn="${p.id}"
              onclick='Wishlist.toggle(${JSON.stringify({ id: p.id, title: p.title, price: p.price, image: p.image })});this.classList.toggle("active")'
              title="Favoris">❤️</button>
            <a href="${root}pages/product.html?id=${p.id}" class="product-card-action-btn" title="Voir détails">👁️</a>
            <button class="product-card-action-btn" title="Comparer" onclick="Toast.show('info','Comparaison','Fonctionnalité bientôt disponible')">⚖️</button>
          </div>
        </div>
        <div class="product-card-body">
          <div class="product-card-category">${CATEGORIES.find(c => c.slug === p.category)?.name || p.category}</div>
          <a href="${root}pages/product.html?id=${p.id}" class="product-card-title">${sanitize(p.title)}</a>
          <div class="product-card-brand">${p.brand}</div>
          <div class="product-stars">
            <span class="stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</span>
            <span class="rating-count">(${p.reviews})</span>
          </div>
          <div class="product-card-price">
            ${p.priceOld ? `<span class="price-original" data-price="${p.priceOld}">${Currency.format(p.priceOld)}</span>` : ''}
            <span class="price-current"><span data-price="${p.price}">${Currency.format(p.price)}</span></span>
            ${discountPct > 0 ? `<span class="price-discount"> -${discountPct}%</span>` : ''}
            <div class="price-drr" style="font-size:11px;color:#666">${Currency.format(p.price, 'DOP')}</div>
          </div>
        </div>
        <div class="product-card-footer">
          <button class="btn btn-primary" onclick='Cart.add(${JSON.stringify({ id: p.id, title: p.title, price: p.price, image: p.image, variant: "" })})'>
            🛒 Ajouter au panier
          </button>
        </div>
      </div>`;
  },

  renderGrid(products, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!products.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📦</div><div class="empty-state-title">Aucun produit trouvé</div></div>`;
      return;
    }
    el.innerHTML = products.map(p => Products.renderCard(p)).join('');
  }
};
