const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // basic server-side checks (routes also validate)
    if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email taken' });
    // password strength: at least 8 chars, letters & numbers
    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      return res.status(400).json({ msg: 'Password too weak' });
    }
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hash, role });
    await user.save();
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.me = (req, res) => {
  res.json({ user: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ msg: 'Not authenticated' });
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ msg: 'Missing fields' });

    // basic password strength check
    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
      return res.status(400).json({ msg: 'Password must be at least 8 characters and include letters and numbers' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ msg: 'Old password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    user.password = hash;
    await user.save();

    res.json({ msg: 'Password changed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.logout = async (req, res) => {
  try {
    // blacklist the token so it cannot be reused
    const token = req.rawToken || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(400).json({ msg: 'No token provided' });
    // determine expiry from token
    let exp = null;
    try {
      const payload = jwt.decode(token);
      if (payload && payload.exp) exp = new Date(payload.exp * 1000);
    } catch (e) { /* ignore */ }
    const RevokedToken = require('../models/RevokedToken');
    const doc = new RevokedToken({ token, expiresAt: exp || new Date(Date.now() + 7*24*60*60*1000) });
    await doc.save();
    res.json({ msg: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Logout failed' });
  }
};
