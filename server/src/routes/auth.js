const express = require('express');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { hashPassword, comparePassword, signJwt, getCookieOptions } = require('../utils/auth');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(409).json({ error: 'email already in use' });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email: email.toLowerCase(), passwordHash, name });

  const token = signJwt({ sub: user._id.toString(), email: user.email, roles: user.roles });
  res.cookie('token', token, getCookieOptions());
  res.status(201).json({ user: user.toJSON() });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  const token = signJwt({ sub: user._id.toString(), email: user.email, roles: user.roles });
  res.cookie('token', token, getCookieOptions());
  res.json({ user: user.toJSON() });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...getCookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
