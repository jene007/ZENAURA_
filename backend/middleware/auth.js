const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');

exports.authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ msg: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    // check blacklist
    const revoked = await RevokedToken.findOne({ token });
    if (revoked) return res.status(401).json({ msg: 'Token revoked' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'Invalid token' });
    req.user = user;
    req.tokenPayload = payload;
    req.rawToken = token;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token error', error: err.message });
  }
};

exports.authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ msg: 'Not authenticated' });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  next();
};

// Alias for authorize - clearer intent in routes
exports.permit = (...roles) => exports.authorize(...roles);

// authorizeOrOwner: allows users with one of the allowedRoles OR the owner of a resource.
// Usage: authorizeOrOwner({ model: require('../models/Classroom'), idParam: 'id', ownerField: 'teacher', roles: ['admin','teacher'] })
exports.authorizeOrOwner = ({ model, idParam = 'id', ownerField = 'teacher', roles = [] }) => {
  return async (req, res, next) => {
    try {
      // if user has role allowed, allow
      if (req.user && roles.includes(req.user.role)) return next();

      // otherwise check ownership
      const id = req.params[idParam] || req.body[idParam] || req.query[idParam];
      if (!id) return res.status(400).json({ msg: 'Resource id missing' });
      // ensure model provided
      if (!model) return res.status(500).json({ msg: 'Model not provided to authorizeOrOwner' });
      const resource = await model.findById(id).select(ownerField).lean();
      if (!resource) return res.status(404).json({ msg: 'Resource not found' });
      const owner = resource[ownerField];
      if (!owner) return res.status(403).json({ msg: 'No owner defined' });
      if (String(owner) !== String(req.user._id)) return res.status(403).json({ msg: 'Forbidden' });
      return next();
    } catch (err) {
      console.error('authorizeOrOwner error', err);
      return res.status(500).json({ msg: 'Server error' });
    }
  };
};
