/**
 * JLOODNA — Admin Routes
 */
const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { query } = require('../db');

router.use(verifyToken, adminOnly);

router.get('/stats', async (req, res) => {
  const result = await query("SELECT (SELECT COALESCE(SUM(total),0) FROM orders WHERE payment_status='paid') AS revenue,(SELECT count(*) FROM orders) AS orders,(SELECT count(*) FROM products WHERE status='active') AS products,(SELECT count(*) FROM users WHERE role='customer') AS customers");
  res.json({ ...result.rows[0], updatedAt: new Date().toISOString() });
});

router.get('/audit-log', (req, res) => {
  res.json({ total: 0, items: [] });
});

router.get('/security-log', (req, res) => {
  res.json({ log: [] });
});

module.exports = router;
