/**
 * JLOODNA — Orders Routes
 * POST /api/orders              — Create order
 * GET  /api/orders/my           — My orders (customer)
 * GET  /api/orders/:id/track    — Public tracking
 * GET  /api/orders              — All orders (admin)
 * PUT  /api/orders/:id/status   — Update status (admin)
 */
const router = require('express').Router();
const crypto = require('crypto');
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');
const { query } = require('../db');


/* ─── CREATE ORDER ─── */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { items, address, shipping, payment, coupon, currency } = req.body;
    if (!items?.length)    return res.status(400).json({ error: 'Panier vide.' });
    if (!address?.email)   return res.status(400).json({ error: 'Adresse de livraison requise.' });
    if (!payment || !['paypal', 'natcash'].includes(String(payment).toLowerCase())) {
      return res.status(400).json({ error: 'Mode de paiement invalide.' });
    }
    if (currency && !['HTG', 'DOP'].includes(currency)) return res.status(400).json({ error: 'Devise invalide.' });

    const normalizedItems = [];
    for (const item of items) {
      const productResult = await query('SELECT id,title,price,image,stock FROM products WHERE id=$1 AND status=$2 FOR UPDATE', [item.id, 'active']);
      const product = productResult.rows[0];
      const qty = Number(item.qty);
      if (!product || !Number.isInteger(qty) || qty < 1 || qty > 99) {
        return res.status(400).json({ error: 'Produit ou quantité invalide.' });
      }
      if (qty > product.stock) return res.status(400).json({ error: `Stock insuffisant pour ${product.title}.` });
      normalizedItems.push({ id: product.id, title: product.title, price: product.price, image: product.image, qty, variant: item.variant || '' });
    }

    const shippingPrices = { std: 500, exp: 1200, rd: 1800, intl: 4500 };
    const shippingId = shipping?.id || 'std';
    if (!Object.prototype.hasOwnProperty.call(shippingPrices, shippingId)) return res.status(400).json({ error: 'Livraison invalide.' });
    const subtotal  = normalizedItems.reduce((s, i) => s + (i.price * i.qty), 0);
    const shipCost  = shippingPrices[shippingId];
    let couponResult = { discount: 0 };
    if (coupon?.code) {
      const couponQuery = await query('SELECT * FROM coupons WHERE code=$1 AND active=true AND expires>=CURRENT_DATE AND uses<max_uses', [String(coupon.code).toUpperCase()]);
      const couponRow = couponQuery.rows[0];
      if (!couponRow || subtotal < Number(couponRow.min_order)) return res.status(400).json({ error: 'Coupon invalide, expiré ou commande minimum non atteinte.' });
      couponResult = { coupon: couponRow, discount: couponRow.type === 'percent' ? Math.round(subtotal * Number(couponRow.value) / 100) : Math.min(Number(couponRow.value), subtotal) };
    }
    const discount  = couponResult.discount;
    const total     = Math.max(0, subtotal + shipCost - discount);

    const orderId   = `JL-${Date.now()}`;
    const order     = {
      id         : orderId,
      userId     : req.user?.id || null,
      items: normalizedItems,
      address,
      shipping,
      payment,
      currency   : currency || 'HTG',
      subtotal,
      shipCost,
      discount,
      total,
      status     : 'pending',
      paymentStatus: 'pending',
      trackingCode : crypto.randomBytes(6).toString('hex').toUpperCase(),
      notes      : req.body.notes || '',
      createdAt  : new Date().toISOString(),
      updatedAt  : new Date().toISOString(),
      history    : [{ status:'pending', time: new Date().toISOString(), note:'Commande reçue' }],
    };

    await query('INSERT INTO orders (id,user_id,items,address,shipping,payment,currency,subtotal,ship_cost,discount,total,status,payment_status,tracking_code,notes,history,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)', [order.id, order.userId, JSON.stringify(order.items), JSON.stringify(order.address), JSON.stringify(order.shipping), order.payment, order.currency, order.subtotal, order.shipCost, order.discount, order.total, order.status, order.paymentStatus, order.trackingCode, order.notes, JSON.stringify(order.history), order.createdAt, order.updatedAt]);
    for (const item of normalizedItems) {
      await query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.qty, item.id]);
    }
    if (couponResult.coupon) await query('UPDATE coupons SET uses=uses+1 WHERE code=$1 AND uses<max_uses', [couponResult.coupon.code]);
    console.log(`[ORDER] New: ${orderId} — ${total} HTG — ${payment} — ${address.email}`);

    // Mask sensitive info in response
    const safeOrder = { ...order, address: { ...order.address, phone: '***' } };
    res.status(201).json({ message: 'Commande créée.', order: safeOrder, orderId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── MY ORDERS (customer) ─── */
router.get('/my', verifyToken, (req, res) => {
  query("SELECT *,created_at AS \"createdAt\",updated_at AS \"updatedAt\",user_id AS \"userId\",ship_cost AS \"shipCost\",payment_status AS \"paymentStatus\",tracking_code AS \"trackingCode\" FROM orders WHERE user_id=$1 OR address->>'email'=$2 ORDER BY created_at DESC", [req.user.id, req.user.email]).then(result => res.json({ orders: result.rows.map(o => ({ ...o, items: o.items, address: { ...o.address, phone: o.address.phone?.replace(/\d(?=\d{4})/g,'*') } })) })).catch(err => res.status(500).json({ error: err.message }));
});

/* ─── PUBLIC TRACKING ─── */
router.get('/track', async (req, res) => {
  const { id, email } = req.query;
  if (!id && !email) return res.status(400).json({ error: 'Numéro de commande ou email requis.' });

  const result = await query("SELECT id,status,created_at AS \"createdAt\",updated_at AS \"updatedAt\",shipping,tracking_code AS \"trackingCode\",history,items FROM orders WHERE ($1::text IS NULL OR id=$1) AND ($2::text IS NULL OR lower(address->>'email')=lower($2)) ORDER BY created_at DESC LIMIT 1", [id || null, email || null]);
  const order = result.rows[0];

  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

  // Return only public tracking info
  res.json({
    id          : order.id,
    status      : order.status,
    createdAt   : order.createdAt,
    updatedAt   : order.updatedAt,
    shipping    : order.shipping,
    items       : order.items.map(item => ({ id: item.id, title: item.title, image: item.image, qty: item.qty, price: item.price })),
    trackingCode: order.trackingCode,
    history     : order.history,
    items       : order.items,
    estimatedDelivery: getEstimatedDelivery(order),
  });
});

/* ─── ALL ORDERS (admin) ─── */
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const params = []; const where = status ? 'WHERE status=$1' : ''; if (status) params.push(status); const count = await query(`SELECT count(*) FROM orders ${where}`, params); const items = await query(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, Number(limit), (Number(page)-1)*Number(limit)]); res.json({ total: Number(count.rows[0].count), page: Number(page), items: items.rows });
});

/* ─── GET single order (admin or owner) ─── */
router.get('/:id', verifyToken, async (req, res) => {
  const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]); const order = result.rows[0];
  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });
  const isAdmin = ['jloodna@gmail.com','odthanempire@gmail.com'].includes(req.user.email);
  const isOwner = order.user_id === req.user.id || order.address?.email === req.user.email;
  if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Accès refusé.' });
  res.json({ order });
});

/* ─── UPDATE ORDER STATUS (admin) ─── */
router.put('/:id/status', verifyToken, adminOnly, async (req, res) => {
  const { status, note } = req.body;
  const validStatuses = ['pending','processing','shipped','delivered','cancelled','refunded'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide.' });

  const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]); const order = result.rows[0];
  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

  order.status    = status;
  if (status === 'delivered' && order.paymentStatus === 'pending') order.paymentStatus = 'paid';
  if (['cancelled', 'refunded'].includes(status) && order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
  order.updatedAt = new Date().toISOString();
  order.history.push({ status, time: new Date().toISOString(), note: note || '', updatedBy: req.user.email });
  await query('UPDATE orders SET status=$1,payment_status=$2,updated_at=now(),history=$3 WHERE id=$4', [order.status, order.payment_status || order.paymentStatus, JSON.stringify(order.history), order.id]);

  console.log(`[AUDIT] Order ${order.id} status → ${status} by ${req.user.email}`);
  res.json({ message: 'Statut mis à jour.', order });
});

/* ─── CANCEL ORDER (owner or admin) ─── */
router.post('/:id/cancel', verifyToken, async (req, res) => {
  const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]); const order = result.rows[0];
  if (!order) return res.status(404).json({ error: 'Commande introuvable.' });

  const isAdmin = ['jloodna@gmail.com','odthanempire@gmail.com'].includes(req.user.email);
  const isOwner = order.userId === req.user.id;
  if (!isAdmin && !isOwner) return res.status(403).json({ error: 'Accès refusé.' });

  if (!['pending','processing'].includes(order.status)) {
    return res.status(400).json({ error: 'Cette commande ne peut plus être annulée.' });
  }

  order.status    = 'cancelled';
  if (order.paymentStatus === 'paid') order.paymentStatus = 'refund_pending';
  order.updatedAt = new Date().toISOString();
  order.history.push({ status:'cancelled', time: new Date().toISOString(), note: 'Annulé par le client' });
  await query('UPDATE orders SET status=$1,payment_status=$2,updated_at=now(),history=$3 WHERE id=$4', ['cancelled', order.payment_status || order.paymentStatus, JSON.stringify(order.history), order.id]);
  res.json({ message: 'Commande annulée.' });
});

function getEstimatedDelivery(order) {
  const days = { std:5, exp:2, rd:7, intl:15 };
  const d    = days[order.shipping?.id] || 5;
  const est  = new Date(order.createdAt);
  est.setDate(est.getDate() + d);
  return est.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

module.exports = router;
