/**
 * JLOODNA — Real-time Notifications System
 * Uses: localStorage events (cross-tab) + polling simulation
 * Production: replace with WebSockets or Server-Sent Events
 */

const RealTime = {
  pollInterval: null,
  lastCheck: Date.now(),

  init() {
    // Cross-tab events via storage
    window.addEventListener('storage', e => {
      if (e.key === 'jl_rt_event') {
        try { this.handleEvent(JSON.parse(e.newValue)); } catch (_) {}
      }
    });
    // Poll every 30s for new activity
    this.pollInterval = setInterval(() => this.poll(), 30000);
    // Demo: fire sample events
    this.scheduleDemoEvents();
  },

  // Broadcast event to all tabs
  broadcast(type, data) {
    const event = { type, data, time: Date.now() };
    localStorage.setItem('jl_rt_event', JSON.stringify(event));
    this.handleEvent(event);
  },

  handleEvent(event) {
    switch (event.type) {
      case 'order_update':
        Notifs.add({ title: '📦 Commande mise à jour', message: `Commande ${event.data.id}: ${event.data.status}`, type: 'order' });
        break;
      case 'promo_flash':
        Notifs.add({ title: '⚡ Offre Flash!', message: event.data.message, type: 'promo' });
        break;
      case 'stock_low':
        Notifs.add({ title: '⚠️ Stock limité', message: `${event.data.title}: plus que ${event.data.stock} en stock!`, type: 'system' });
        break;
      case 'price_drop':
        Notifs.add({ title: '💰 Prix en baisse!', message: `${event.data.title} a baissé à ${Currency.format(event.data.price)}`, type: 'promo' });
        break;
      case 'new_product':
        Notifs.add({ title: '🆕 Nouveau produit', message: event.data.message, type: 'system' });
        break;
    }
  },

  poll() {
    // In production: fetch('/api/notifications/poll?since=' + this.lastCheck)
    this.lastCheck = Date.now();
  },

  scheduleDemoEvents() {
    // Only on homepage & shop
    const page = window.location.pathname;
    if (!page.includes('index') && page !== '/' && !page.includes('shop') && !page.includes('deals')) return;

    const demoEvents = [
      { delay: 12000, type: 'promo_flash',  data: { message: '🔥 -25% sur toute la mode pendant 2h!' } },
      { delay: 45000, type: 'stock_low',    data: { title: 'iPhone 15 Pro Max', stock: 2 } },
      { delay: 90000, type: 'price_drop',   data: { title: 'Samsung Galaxy S24', price: 72000 } },
      { delay: 120000, type: 'new_product', data: { message: '5 nouveaux produits ajoutés en Électronique' } },
    ];
    demoEvents.forEach(e => setTimeout(() => this.handleEvent(e), e.delay));
  },

  stop() { clearInterval(this.pollInterval); }
};

// Cart persistence across tabs
window.addEventListener('storage', e => {
  if (e.key === 'jl_cart') {
    State.cart = JSON.parse(e.newValue || '[]');
    Cart.updateUI();
    if (document.getElementById('cartItems')?.closest('#cartSidebar')?.classList.contains('open')) {
      Cart.renderSidebar();
    }
  }
  if (e.key === 'jl_wishlist') {
    State.wishlist = JSON.parse(e.newValue || '[]');
    Wishlist.updateUI();
  }
});

// Init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof Notifs !== 'undefined') RealTime.init();
});
