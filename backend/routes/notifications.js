const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const { query } = require('../db');

router.get('/my', verifyToken, async (req, res) => {
  const result = await query("SELECT id,user_id AS \"userId\",title,message,type,global_notice AS global,read,created_at AS time FROM notifications WHERE user_id=$1 OR global_notice=true ORDER BY created_at DESC LIMIT 50", [req.user.id]);
  res.json({ notifications: result.rows, unread: result.rows.filter(n => !n.read).length });
});

router.patch('/read-all', verifyToken, async (req, res) => {
  await query('UPDATE notifications SET read=true WHERE user_id=$1', [req.user.id]);
  res.json({ message: 'Tout marqué comme lu.' });
});

router.post('/broadcast', verifyToken, adminOnly, async (req, res) => {
  const { title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Titre et message requis.' });
  const notif = { id: `n_${Date.now()}`, title, message, type: type || 'info', global: true, read: false, time: new Date().toISOString() };
  await query('INSERT INTO notifications (id,title,message,type,global_notice,read,created_at) VALUES ($1,$2,$3,$4,true,false,$5)', [notif.id, title, message, notif.type, notif.time]);
  res.status(201).json({ message: 'Notification envoyée.', notif });
});

module.exports = router;
