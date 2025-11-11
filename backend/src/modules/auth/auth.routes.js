const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./user.model');
const { authMiddleware } = require('./requireAuth');

const router = express.Router();

function signToken(user) {
  const payload = { sub: user._id.toString(), email: user.email, roles: user.roles || ['user'] };
  const secret = process.env.JWT_SECRET || 'dev_change_me';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function setAuthCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function sanitize(user) {
  const { passwordHash, password, __v, ...data } = user.toObject({ virtuals: true });
  return data;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, roles } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase(), passwordHash, name, roles: roles && roles.length ? roles : ['user'] });

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.status(201).json({ user: sanitize(user) });
  } catch (err) {
    console.error('REGISTER error', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Find user including legacy password if present
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    let ok = false;
    if (user.passwordHash) ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok && user.password) ok = await bcrypt.compare(password, user.password);

    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Migrate legacy password -> passwordHash
    if (!user.passwordHash && user.password) {
      user.passwordHash = await bcrypt.hash(password, 10);
      user.password = undefined;
      await user.save();
    }

    const token = signToken(user);
    setAuthCookie(res, token);
    return res.json({ user: sanitize(user) });
  } catch (err) {
    console.error('LOGIN error', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    path: '/',
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    httpOnly: true,
  });
  res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: sanitize(user) });
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware(), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new password required' });

    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    let ok = false;
    if (user.passwordHash) ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok && user.password) ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.password = undefined; // clear legacy
    await user.save();

    // rotate token
    const token = signToken(user);
    setAuthCookie(res, token);
    res.json({ ok: true });
  } catch (err) {
    console.error('CHANGE PASSWORD error', err);
    res.status(500).json({ error: 'Change password failed' });
  }
});

module.exports = { authRouter: router };
