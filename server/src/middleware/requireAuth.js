const { verifyJwt } = require('../utils/auth');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const token = req.cookies && req.cookies['token'];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = verifyJwt(token);
    if (!payload || !payload.sub) return res.status(401).json({ error: 'Unauthorized' });

    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    req.user = { id: user._id.toString(), email: user.email, name: user.name, roles: user.roles };
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = requireAuth;
