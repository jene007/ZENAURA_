const express = require('express');
const router = express.Router();
const { register, login, me, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

const registerValidators = [
	body('name').isLength({ min: 2 }).withMessage('Name required'),
	body('email').isEmail().withMessage('Valid email required'),
	body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars')
];

const loginValidators = [
	body('email').isEmail().withMessage('Valid email required'),
	body('password').exists().withMessage('Password required')
];

function handleValidation(req, res, next) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
	next();
}

router.post('/register', authLimiter, registerValidators, handleValidation, register);
router.post('/login', authLimiter, loginValidators, handleValidation, login);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, require('../controllers/authController').changePassword);
router.post('/logout', authenticate, logout);

module.exports = router;
