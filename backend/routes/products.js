/**
 * JLOODNA — Products Routes
 * GET    /api/products
 * GET    /api/products/featured
 * GET    /api/products/search
 * GET    /api/products/:id
 * POST   /api/products          (admin)
 * PUT    /api/products/:id      (admin)
 * DELETE /api/products/:id      (admin)
 */
const router  = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { query } = require('../db');

/* Demo in-memory store — replace with MongoDB/PostgreSQL */
const fields = 'id,title,brand,description,price,price_old,stock,sku,category,status,image,tags,dropship,variants,rating,reviews,created_at,updated_at';
const safe = p => ({ ...p, price: Number(p.price), priceOld: p.price_old == null ? null : Number(p.price_old), stock: Number(p.stock), rating: Number(p.rating), reviews: Number(p.reviews), tags: p.tags || [], variants: p.variants || [], createdAt: p.created_at, updatedAt: p.updated_at, price_old: undefined, created_at: undefined, updated_at: undefined });

/* ─── Helper: sanitize for output ─── */

/* ─── GET all products (public, with filters) ─── */
router.get('/', async (req, res) => {
  try {
    const { q, cat, minPrice, maxPrice, rating, inStock, sort, featured, limit = 50, page = 1 } = req.query;
    const where = ["status = 'active'"]; const params = [];

    if (q) { params.push(`%${q}%`); where.push(`(title ILIKE $${params.length} OR brand ILIKE $${params.length})`); }
    if (cat) { params.push(cat); where.push(`category = $${params.length}`); }
    if (minPrice) { params.push(Number(minPrice)); where.push(`price >= $${params.length}`); }
    if (maxPrice) { params.push(Number(maxPrice)); where.push(`price <= $${params.length}`); }
    if (rating) { params.push(Number(rating)); where.push(`rating >= $${params.length}`); }
    if (inStock === 'true') where.push('stock > 0');
    if (featured === 'true') where.push("tags ? 'featured'");

    const order = { price_asc: 'price ASC', price_desc: 'price DESC', rating: 'rating DESC', reviews: 'reviews DESC', new: 'created_at DESC' }[sort] || 'created_at DESC';
    const totalResult = await query(`SELECT count(*) FROM products WHERE ${where.join(' AND ')}`, params);
    const pageNumber = Math.max(1, Number(page)); const pageLimit = Math.min(100, Math.max(1, Number(limit))); const offset = (pageNumber - 1) * pageLimit;
    const result = await query(`SELECT ${fields} FROM products WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, pageLimit, offset]);

    const total = Number(totalResult.rows[0].count);
    res.json({ total, page: pageNumber, limit: pageLimit, pages: Math.ceil(total / pageLimit), items: result.rows.map(safe) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── GET featured ─── */
router.get('/featured', async (req, res) => {
  const result = await query(`SELECT ${fields} FROM products WHERE status='active' AND tags ? 'featured' ORDER BY created_at DESC LIMIT 12`);
  res.json({ items: result.rows.map(safe) });
});

/* ─── GET search suggestions ─── */
router.get('/suggest', async (req, res) => {
  const q = req.query.q?.toLowerCase() || '';
  if (q.length < 2) return res.json({ suggestions: [] });
  const result = await query("SELECT id,title,price,image,category FROM products WHERE status='active' AND (title ILIKE $1 OR brand ILIKE $1) LIMIT 8", [`%${q}%`]);
  res.json({ suggestions: result.rows.map(safe) });
});

/* ─── GET single product ─── */
router.get('/:id', async (req, res) => {
  const result = await query(`SELECT ${fields} FROM products WHERE id=$1 AND status='active'`, [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ product: safe(result.rows[0]) });
});

/* ─── POST create product (admin only) ─── */
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, brand, description, price, priceOld, stock, sku, category, status, image, tags, dropship, variants } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'Titre et prix requis.' });

    const id = 'p_' + Date.now();
    const result = await query(`INSERT INTO products (id,title,brand,description,price,price_old,stock,sku,category,status,image,tags,dropship,variants) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING ${fields}`, [id, String(title).trim().slice(0, 200), String(brand || '').trim().slice(0, 100), String(description || '').trim().slice(0, 2000), Number(price), priceOld ? Number(priceOld) : null, Number(stock) || 0, String(sku || `JL-${Date.now()}`).trim(), String(category || 'electronique').trim(), ['active','inactive'].includes(status) ? status : 'active', String(image || '').trim(), JSON.stringify(Array.isArray(tags) ? tags.filter(t => ['featured','hot','new','sale'].includes(t)) : []), Boolean(dropship), JSON.stringify(variants || [])]);
    res.status(201).json({ message: 'Produit créé.', product: safe(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── PUT update product (admin only) ─── */
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  const allowed = ['title','brand','description','price','priceOld','stock','sku','category','status','image','tags','dropship','variants'];
  const updates = []; const values = [];
  allowed.forEach(k => { if (req.body[k] !== undefined) { values.push(['tags','variants'].includes(k) ? JSON.stringify(req.body[k]) : req.body[k]); updates.push(`${k === 'priceOld' ? 'price_old' : k}=$${values.length}`); } });
  if (!updates.length) return res.status(400).json({ error: 'Aucune modification.' });
  values.push(req.params.id);
  const result = await query(`UPDATE products SET ${updates.join(',')},updated_at=now() WHERE id=$${values.length} RETURNING ${fields}`, values);
  if (!result.rowCount) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ message: 'Produit mis à jour.', product: safe(result.rows[0]) });
});

/* ─── PATCH toggle status (admin) ─── */
router.patch('/:id/status', verifyToken, adminOnly, async (req, res) => {
  const result = await query(`UPDATE products SET status=CASE WHEN status='active' THEN 'inactive' ELSE 'active' END,updated_at=now() WHERE id=$1 RETURNING ${fields}`, [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ message: `Statut: ${result.rows[0].status}`, product: safe(result.rows[0]) });
});

/* ─── DELETE product (admin only) ─── */
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  const result = await query('DELETE FROM products WHERE id=$1', [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: 'Produit introuvable.' });
  res.json({ message: 'Produit supprimé.' });
});

module.exports = router;
