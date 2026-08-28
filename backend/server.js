/**
 * JLOODNA GLOBAL TRADING — Backend Server
 * Node.js + Express REST API
 * Run: npm install && npm start
 */

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan       = require('morgan');
const path         = require('path');
require('dotenv').config();
const { initDatabase } = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ─── SECURITY MIDDLEWARE ─── */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc : ["'self'"],
      scriptSrc  : ["'self'", 'https://www.paypal.com', 'https://www.paypalobjects.com'],
      frameSrc   : ["'self'", 'https://www.paypal.com'],
      imgSrc     : ["'self'", 'data:', 'https:', 'blob:'],
      styleSrc   : ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc    : ["'self'", 'https://fonts.gstatic.com'],
      connectSrc : ["'self'", 'https://api.paypal.com'],
    }
  }
}));

app.use(cors({
  origin  : process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods : ['GET','POST','PUT','PATCH','DELETE'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token']
}));

/* ─── RATE LIMITING ─── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max     : 300,
  message : { error: 'Trop de requêtes. Réessayez dans 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 10,
  message : { error: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max     : 5,
  message : { error: 'Trop de tentatives de paiement.' }
});

app.use(globalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'jloodna-secret-change-this'));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ─── STATIC FILES ─── */
app.use(express.static(path.join(__dirname, '..')));

/* ─── HEALTH CHECK ─── */
app.get('/api/health', (req, res) => {
  res.json({
    status  : 'OK',
    service : 'Jloodna Global Trading API',
    version : '1.0.0',
    time    : new Date().toISOString(),
    env     : process.env.NODE_ENV || 'development'
  });
});

/* ─── ROUTES ─── */
app.use('/api/auth',       authLimiter,    require('./routes/auth'));
app.use('/api/products',                   require('./routes/products'));
app.use('/api/orders',                     require('./routes/orders'));
app.use('/api/categories',                 require('./routes/categories'));
app.use('/api/admin',                      require('./routes/admin'));
app.use('/api/payments',   paymentLimiter, require('./routes/payments'));
app.use('/api/dropship',                   require('./routes/dropship'));
app.use('/api/notifications',              require('./routes/notifications'));
app.use('/api/coupons',                    require('./routes/coupons'));

/* ─── FALLBACK ─── */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Route API introuvable' });
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'pages', '404.html'));
});

/* ─── GLOBAL ERROR HANDLER ─── */
app.use((err, req, res, _next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error  : process.env.NODE_ENV === 'production' ? 'Erreur serveur interne' : err.message,
    status,
  });
});

/* ─── START SERVER ─── */
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════╗
  ║   JLOODNA Global Trading — API       ║
  ║   Running on http://localhost:${PORT}   ║
  ║   Env: ${(process.env.NODE_ENV||'development').padEnd(28)}║
  ╚══════════════════════════════════════╝
    `);
  });
}

if (require.main === module) {
  start().catch(err => {
    console.error('Database startup failed:', err);
    process.exit(1);
  });
}

module.exports = app;
