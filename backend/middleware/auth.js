const jwt = require('jsonwebtoken');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token', error: error.message });
  }
};

// Generate JWT Token
const generateToken = (userId, role = 'user') => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

// Generate Anonymous Token
const generateAnonymousToken = () => {
  return jwt.sign(
    {
      isAnonymous: true,
      timestamp: Date.now(),
    },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '24h' }
  );
};

module.exports = {
  verifyToken,
  generateToken,
  generateAnonymousToken,
};
