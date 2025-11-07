const jwt = require('jsonwebtoken');
const User = require('./user.model');

function authMiddleware() {
  return async function requireAuth(req, res, next) {
    try {
      const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_change_me');
      // Try by id first
      let user = await User.findById(payload.sub);
      if (!user && payload.email) {
        user = await User.findOne({ email: payload.email.toLowerCase() });
      }
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      req.user = { id: user._id.toString(), _id: user._id, email: user.email, roles: user.roles || ['user'] };
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

module.exports = { authMiddleware };
