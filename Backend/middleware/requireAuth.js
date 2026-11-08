const { createHash } = require('node:crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const revokedSessionIds = new Set();

const requireAuth = async (req, res, next) => {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication is required.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'The access token is invalid or expired.' });
  }

  if (typeof payload.sub !== 'string') {
    return res.status(401).json({ error: 'The access token is invalid.' });
  }

  const sessionId = createHash('sha256').update(token, 'utf8').digest('hex');
  if (revokedSessionIds.has(sessionId)) {
    return res.status(401).json({ error: 'This session has been logged out.' });
  }

  try {
    const user = await User.findById(payload.sub).select('name email');
    if (!user) return res.status(401).json({ error: 'The account no longer exists.' });
    req.user = {
      userId: user.id,
      name: user.name,
      email: user.email,
      sessionId,
      tokenExpiration: payload.exp * 1000,
    };
    return next();
  } catch (error) {
    console.error('Unable to verify authenticated user:', error.message);
    return res.status(500).json({ error: 'Could not verify the authenticated user.' });
  }
};

module.exports = requireAuth;
module.exports.revokeSession = (sessionId, expiresAt) => {
  revokedSessionIds.add(sessionId);
  const delay = Math.max(0, expiresAt - Date.now());
  const cleanupTimer = setTimeout(() => revokedSessionIds.delete(sessionId), delay);
  cleanupTimer.unref?.();
};
