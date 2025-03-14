const jwt = require('jsonwebtoken');

exports.generateToken = (userId) => {
  const payload = { user: { id: userId } };
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

exports.generateResetToken = (userId) => {
  const payload = { user: { id: userId } };
  return jwt.sign(payload, process.env.JWT_RESET_SECRET || 'resetsecret', { expiresIn: '1h' });
};
