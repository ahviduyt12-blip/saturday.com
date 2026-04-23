const jwt = require('jsonwebtoken');
const { db, Q } = require('../models/db');
const JWT_SECRET = process.env.JWT_SECRET || 'saturday_halal_2024_secret';

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ message: 'Login করুন' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user    = await Q.findOne(db.users, { _id: decoded.userId });
    if (!user) return res.status(401).json({ message: 'User পাওয়া যায়নি' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session শেষ হয়ে গেছে। আবার login করুন।' });
  }
}

async function adminMiddleware(req, res, next) {
  await authMiddleware(req, res, async () => {
    if (req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin access required' });
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, JWT_SECRET };
