const express = require('express');
const User = require('./user.model');
const { authMiddleware } = require('./requireAuth');

const router = express.Router();

function sanitize(user) {
  const { passwordHash, password, __v, ...data } = user.toObject({ virtuals: true });
  return data;
}

// GET /api/users/me
router.get('/me', authMiddleware(), async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ user: sanitize(user) });
});

// PATCH /api/users/me
router.patch('/me', authMiddleware(), async (req, res) => {
  const allowed = [
    'name', 'email', 'phone', 'role', 'department', 'employeeId', 'joinDate', 'address',
    'avatarUrl', 'avatarKey', 'avatarETag', 'avatarUpdatedAt'
  ];

  const updates = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) updates[key] = req.body[key];
  }

  if (updates.email) updates.email = String(updates.email).toLowerCase();

  try {
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitize(user) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email already in use' });
    console.error('PATCH /users/me error', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = { usersRouter: router };
