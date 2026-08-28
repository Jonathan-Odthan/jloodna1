const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { query } = require('../db');


router.post('/validate', async (req, res) => {
  const { code, orderTotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Code requis.' });

  const result = await query('SELECT * FROM coupons WHERE code=$1 AND active=true AND expires>=CURRENT_DATE AND uses<max_uses', [code.toUpperCase()]);
  const coupon = result.rows[0];
  if (!coupon) return res.status(400).json({ error: 'Coupon invalide ou expiré.' });
  if (!Number.isFinite(Number(orderTotal)) || Number(orderTotal) < Number(coupon.min_order)) return res.status(400).json({ error: `Commande minimum: G ${Number(coupon.min_order).toLocaleString()}` });
  const discount = coupon.type === 'percent' ? Math.round(Number(orderTotal) * Number(coupon.value) / 100) : Math.min(Number(coupon.value), Number(orderTotal));

  res.json({ valid: true, coupon: { code: coupon.code, type: coupon.type, value: Number(coupon.value) }, discount, message: `Réduction de ${coupon.type==='percent'?coupon.value+'%':'G '+coupon.value} appliquée!` });
});

router.post('/apply', async (req, res) => {
  const result = await query('UPDATE coupons SET uses=uses+1 WHERE code=$1 AND active=true AND expires>=CURRENT_DATE AND uses<max_uses RETURNING uses', [String(req.body.code || '').toUpperCase()]);
  if (!result.rowCount) return res.status(400).json({ error: 'Coupon invalide ou épuisé.' });
  res.json({ success: true, uses: result.rows[0].uses });
});

router.get('/', verifyToken, adminOnly, async (req, res) => res.json({ coupons: (await query('SELECT * FROM coupons ORDER BY code')).rows }));
router.post('/', verifyToken, adminOnly, (req, res) => {
  const { code, type, value, minOrder, maxUses, expires } = req.body;
  if (!code || !type || !value) return res.status(400).json({ error: 'Champs requis manquants.' });
  const coupon = { code:code.toUpperCase(), type, value:Number(value), minOrder:Number(minOrder)||0, maxUses:Number(maxUses)||100, expires };
  query('INSERT INTO coupons (code,type,value,min_order,max_uses,uses,active,expires) VALUES ($1,$2,$3,$4,$5,0,true,$6) RETURNING *', [coupon.code, coupon.type, coupon.value, coupon.minOrder, coupon.maxUses, coupon.expires]).then(result => res.status(201).json({ message: 'Coupon créé.', coupon: result.rows[0] })).catch(err => res.status(400).json({ error: err.message }));
});
router.delete('/:code', verifyToken, adminOnly, async (req, res) => {
  await query('DELETE FROM coupons WHERE code=$1', [req.params.code.toUpperCase()]);
  res.json({ message: 'Coupon supprimé.' });
});

module.exports = router;
