const router = require('express').Router();
const { verifyToken, adminOnly } = require('../middleware/auth');

const CATEGORIES = [
  { slug:'electronique', name:'Électronique', icon:'📱', active:true },
  { slug:'mode',         name:'Mode',         icon:'👗', active:true },
  { slug:'maison',       name:'Maison',        icon:'🏠', active:true },
  { slug:'beaute',       name:'Beauté',        icon:'💄', active:true },
  { slug:'sports',       name:'Sports',        icon:'⚽', active:true },
  { slug:'jouets',       name:'Jouets',         icon:'🧸', active:true },
  { slug:'informatique', name:'Informatique',  icon:'💻', active:true },
  { slug:'auto',         name:'Auto',          icon:'🚗', active:true },
  { slug:'bijoux',       name:'Bijoux',        icon:'💎', active:true },
  { slug:'livres',       name:'Livres',        icon:'📚', active:true },
  { slug:'alimentation', name:'Alimentation',  icon:'🛒', active:true },
  { slug:'dropshipping', name:'Dropshipping',  icon:'🌐', active:true },
];

router.get('/', (req, res) => res.json({ categories: CATEGORIES }));
router.get('/:slug', (req, res) => {
  const cat = CATEGORIES.find(c => c.slug === req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Catégorie introuvable.' });
  res.json({ category: cat });
});
router.post('/', verifyToken, adminOnly, (req, res) => res.status(501).json({ message: 'À implémenter avec DB.' }));
router.put('/:slug', verifyToken, adminOnly, (req, res) => res.status(501).json({ message: 'À implémenter avec DB.' }));

module.exports = router;
