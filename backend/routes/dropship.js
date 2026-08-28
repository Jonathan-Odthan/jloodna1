const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');

router.post('/import', verifyToken, adminOnly, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requise.' });

  // Demo extraction — in production use Puppeteer/Cheerio scraper
  const domains = { 'amazon.com':'Amazon', 'aliexpress.com':'AliExpress', 'alibaba.com':'Alibaba', 'ebay.com':'eBay' };
  const source  = Object.entries(domains).find(([d]) => url.includes(d))?.[1] || 'Source inconnue';

  const mockProduct = {
    title      : `Produit importé depuis ${source}`,
    description: `Produit dropshipping importé depuis ${source} via URL: ${url}`,
    price      : Math.floor(Math.random() * 50000) + 5000,
    image      : '',
    source,
    sourceUrl  : url,
    dropship   : true,
    status     : 'inactive',
  };

  res.json({ success: true, product: mockProduct, message: 'Produit extrait. Vérifiez les informations avant publication.' });
});

router.get('/products', verifyToken, adminOnly, (req, res) => {
  res.json({ products: [] });
});

module.exports = router;
