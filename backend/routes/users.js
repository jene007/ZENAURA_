const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users - admin only
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ users });
});

// GET /api/users/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
