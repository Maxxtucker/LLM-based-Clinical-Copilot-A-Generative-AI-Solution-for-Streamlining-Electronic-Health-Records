const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/me - get current user's full profile
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Remove sensitive fields just in case
  delete user.passwordHash;
  res.json({ user });
}));

// PATCH /api/users/me - update current user's profile fields
router.patch('/me', requireAuth, asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'role', 'department', 'employeeId', 'joinDate', 'address', 'avatar', 'email'];
  const update = {};
  for (const key of allowed) {
    if (key in req.body) update[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: update },
    { new: true, runValidators: true }
  ).lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  delete user.passwordHash;
  res.json({ user });
}));

module.exports = router;
