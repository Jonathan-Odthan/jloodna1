const router = require('express').Router();
const { verifyToken, adminOnly, optionalAuth } = require('../middleware/auth');

router.post('/paypal/verify', optionalAuth, async (req, res) => {
  const { orderId, paypalOrderId, amount } = req.body;
  if (!orderId || !paypalOrderId) return res.status(400).json({ error: 'Données manquantes.' });
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.status(503).json({ error: 'Vérification PayPal non configurée.' });
  try {
    const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com';
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    if (!authResponse.ok) throw new Error('PayPal authentication failed');
    const { access_token: accessToken } = await authResponse.json();
    const paypalResponse = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!paypalResponse.ok) return res.status(400).json({ error: 'Commande PayPal introuvable.' });
    const paypalOrder = await paypalResponse.json();
    const paypalAmount = Number(paypalOrder.purchase_units?.[0]?.amount?.value);
    if (paypalOrder.status !== 'COMPLETED' || !Number.isFinite(paypalAmount)) {
      return res.status(400).json({ error: 'Paiement PayPal non confirmé.' });
    }
    if (amount !== undefined && Math.abs(paypalAmount - Number(amount)) > 0.01) {
      return res.status(400).json({ error: 'Montant PayPal incorrect.' });
    }
    console.log(`[PAYMENT] PayPal verified: ${paypalOrderId} for order ${orderId}`);
    res.json({ success: true, message: 'Paiement PayPal confirmé.', transactionId: paypalOrderId });
  } catch (err) {
    console.error('[PAYMENT] PayPal verification failed:', err.message);
    res.status(502).json({ error: 'Vérification PayPal indisponible.' });
  }
});

router.post('/natcash/confirm', optionalAuth, (req, res) => {
  const { orderId, phone } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Numéro de commande requis.' });
  console.log(`[PAYMENT] NatCash pending: order ${orderId} from ${phone}`);
  res.json({ success: true, message: 'Paiement NatCash en attente de vérification manuelle.', status: 'pending_verification' });
});

router.get('/', verifyToken, adminOnly, (req, res) => {
  res.json({ payments: [], total: 0 });
});

module.exports = router;
