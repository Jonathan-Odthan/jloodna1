/**
 * JLOODNA — Auth Middleware
 * JWT verification + Admin-only guard
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ADMIN_EMAILS = ['jloodna@gmail.com'];
const JWT_SECRET   = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

/* ─── Verify JWT token ─── */
function verifyToken(req, res, next) {
  try {
    const auth   = req.headers.authorization || '';
    const cookie = req.cookies?.jl_token;
    const token  = auth.startsWith('Bearer ') ? auth.slice(7) : cookie;

    if (!token) {
      return res.status(401).json({ error: 'Token manquant. Veuillez vous connecter.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expirée. Reconnectez-vous.'
      : 'Token invalide.';
    return res.status(401).json({ error: msg });
  }
}

/* ─── Admin-only access ─── */
function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  const email = req.user.email?.toLowerCase();
  if (!ADMIN_EMAILS.includes(email) || req.user.role !== 'admin') {
    // Log unauthorized attempt
    console.warn(`[SECURITY] Unauthorized admin attempt: ${email} @ ${new Date().toISOString()} — IP: ${req.ip}`);
    return res.status(403).json({ error: 'Accès refusé. Permissions insuffisantes.' });
  }

  next();
}

/* ─── Optional auth (does not block if no token) ─── */
function optionalAuth(req, res, next) {
  try {
    const auth  = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.cookies?.jl_token;
    if (token) req.user = jwt.verify(token, JWT_SECRET);
  } catch (_) {}
  next();
}

/* ─── Generate tokens ─── */
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn, issuer: 'jloodna.com' });
}

function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || crypto.createHash('sha256').update(`${JWT_SECRET}:refresh`).digest('hex');
  return jwt.sign(payload, secret, { expiresIn: '30d', issuer: 'jloodna.com' });
}

/* ─── Set secure cookie ─── */
function setAuthCookie(res, token) {
  res.cookie('jl_token', token, {
    httpOnly: true,
    secure  : process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge  : 7 * 24 * 3600 * 1000, // 7 days
    path    : '/',
  });
}

/* ─── CSRF protection (simple double-submit cookie) ─── */
function csrfProtect(req, res, next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.csrf_token;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'CSRF token invalide.' });
  }
  next();
}

module.exports = { verifyToken, adminOnly, optionalAuth, signToken, signRefreshToken, setAuthCookie, csrfProtect, ADMIN_EMAILS, JWT_SECRET };
