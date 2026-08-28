/**
 * JLOODNA — Auth Routes
 * POST /api/auth/login
 * POST /api/auth/register
 * POST /api/auth/logout
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password
 * GET  /api/auth/me
 */
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');
const { query } = require('../db');
const { signToken, signRefreshToken, setAuthCookie, verifyToken, ADMIN_EMAILS } = require('../middleware/auth');

/* In production: replace with real DB queries */

/* ─── REGISTER ─── */
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    const emailLower = email?.toLowerCase().trim();

    // Block admin emails from registration
    if (ADMIN_EMAILS.includes(emailLower)) {
      return res.status(400).json({ error: 'Cet email n\'est pas disponible.' });
    }

    // Validation
    if (!firstName || !lastName || !emailLower || !password) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ error: 'Format d\'email invalide.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
    }
    const existing = await query('SELECT id FROM users WHERE email=$1', [emailLower]);
    if (existing.rowCount) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = {
      id        : 'u_' + crypto.randomBytes(8).toString('hex'),
      firstName,
      lastName,
      name      : `${firstName} ${lastName}`,
      email     : emailLower,
      phone     : phone || null,
      passwordHash: hash,
      role      : 'customer',
      createdAt : new Date().toISOString(),
      verified  : false,
    };

    await query('INSERT INTO users (id,first_name,last_name,name,email,phone,password_hash,role,verified,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [user.id, user.firstName, user.lastName, user.name, user.email, user.phone, user.passwordHash, user.role, user.verified, user.createdAt]);

    const safeUser = { ...user };
    delete safeUser.passwordHash;
    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    setAuthCookie(res, token);

    res.status(201).json({ message: 'Compte créé avec succès.', user: safeUser, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur lors de la création du compte.' });
  }
});

/* ─── LOGIN ─── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = email?.toLowerCase().trim();

    if (!emailLower || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    /* Admin authentication */
    if (ADMIN_EMAILS.includes(emailLower)) {
      const adminPass = process.env.ADMIN_PASSWORD;
      if (!adminPass) return res.status(503).json({ error: 'Connexion administrateur non configurée.' });
      if (password !== adminPass) {
        console.warn(`[SECURITY] Failed admin login attempt: ${emailLower} @ ${new Date().toISOString()}`);
        return res.status(401).json({ error: 'Identifiants incorrects.' });
      }
      const adminUser = { id: `admin_${emailLower}`, email: emailLower, name: 'Administrateur', role: 'admin' };
      const token     = signToken(adminUser, '1d');
      const refresh   = signRefreshToken(adminUser);
      setAuthCookie(res, token);
      console.log(`[AUDIT] Admin login: ${emailLower} @ ${new Date().toISOString()} — IP: ${req.ip}`);
      return res.json({ message: 'Connexion admin réussie.', user: adminUser, token, refresh });
    }

    /* Customer authentication */
    const result = await query('SELECT id,first_name,last_name,name,email,phone,password_hash,role,verified,created_at FROM users WHERE email=$1', [emailLower]);
    if (!result.rowCount) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const record = result.rows[0];
    const user = { id: record.id, firstName: record.first_name, lastName: record.last_name, name: record.name, email: record.email, phone: record.phone, passwordHash: record.password_hash, role: record.role, verified: record.verified, createdAt: record.created_at };
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect.' });
    }

    const safeUser = { ...user };
    delete safeUser.passwordHash;
    const token   = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
    const refresh = signRefreshToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);

    res.json({ message: 'Connexion réussie.', user: safeUser, token, refresh });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
});

/* ─── LOGOUT ─── */
router.post('/logout', (req, res) => {
  res.clearCookie('jl_token', { path: '/' });
  res.json({ message: 'Déconnexion réussie.' });
});

/* ─── GET CURRENT USER ─── */
router.get('/me', verifyToken, (req, res) => {
  const safeUser = { ...req.user };
  delete safeUser.passwordHash;
  res.json({ user: safeUser });
});

/* ─── FORGOT PASSWORD ─── */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = email?.toLowerCase().trim();

    if (!emailLower) return res.status(400).json({ error: 'Email requis.' });

    // Always return success to prevent email enumeration
    const userResult = await query('SELECT email FROM users WHERE email=$1', [emailLower]);
    if (userResult.rowCount) {
      const token = crypto.randomBytes(32).toString('hex');
      await query('DELETE FROM reset_tokens WHERE email=$1', [emailLower]);
      await query('INSERT INTO reset_tokens (token_hash,email,expires_at) VALUES ($1,$2,$3)', [crypto.createHash('sha256').update(token).digest('hex'), emailLower, new Date(Date.now() + 30 * 60 * 1000)]);
      console.log(`[PASSWORD RESET] Reset requested for ${emailLower}`);
    }
    res.json({ message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  } catch {
    res.status(500).json({ error: 'Erreur lors de la demande.' });
  }
});

/* ─── RESET PASSWORD ─── */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 8) {
      return res.status(400).json({ error: 'Token ou mot de passe invalide.' });
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetResult = await query('SELECT email,expires_at FROM reset_tokens WHERE token_hash=$1', [tokenHash]);
    if (!resetResult.rowCount || new Date(resetResult.rows[0].expires_at) < new Date()) {
      await query('DELETE FROM reset_tokens WHERE token_hash=$1', [tokenHash]);
      return res.status(400).json({ error: 'Token de réinitialisation invalide ou expiré.' });
    }
    const hash = await bcrypt.hash(password, 12);
    await query('UPDATE users SET password_hash=$1 WHERE email=$2', [hash, resetResult.rows[0].email]);
    await query('DELETE FROM reset_tokens WHERE token_hash=$1', [tokenHash]);
    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la réinitialisation.' });
  }
});

module.exports = router;
