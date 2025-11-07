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

  // Support legacy records where bcrypt hash might be in `password` instead of `passwordHash`
  const storedHash = user.passwordHash || user.password;
  if (!storedHash) return res.status(401).json({ error: 'invalid credentials' });

  const ok = await comparePassword(password, storedHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });

  // Migrate legacy field to `passwordHash` and remove `password`
  if (!user.passwordHash && user.password) {
    await User.updateOne(
      { _id: user._id },
      { $set: { passwordHash: user.password }, $unset: { password: "" } }
    );
  }

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

// Change password
router.post('/change-password', requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (confirmPassword !== undefined && confirmPassword !== newPassword) {
    return res.status(400).json({ error: 'passwords do not match' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'new password must be at least 8 characters' });
  }

  // Try finding by id from auth middleware; if not found (e.g., legacy/stale token), fallback by email
  let user = await User.findById(req.user.id);
  if (!user && req.user.email) {
    user = await User.findOne({ email: req.user.email.toLowerCase() });
  }
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Support legacy seeded users where password may be stored in `password` instead of `passwordHash`
  const storedHash = user.passwordHash || user.password; // note: legacy field `password` should contain a bcrypt hash too
  if (!storedHash) {
    return res.status(400).json({ error: 'Password not set for this account' });
  }

  const ok = await comparePassword(currentPassword, storedHash);
  if (!ok) return res.status(401).json({ error: 'current password is incorrect' });

  // Always save new password as bcrypt hash in passwordHash and remove legacy field
  user.passwordHash = await hashPassword(newPassword);
  if (user.password) {
    user.password = undefined;
  }
  await user.save();

  // Rotate JWT to be safe
  const token = signJwt({ sub: user._id.toString(), email: user.email, roles: user.roles });
  res.cookie('token', token, getCookieOptions());

  res.json({ ok: true });
}));

module.exports = router;
