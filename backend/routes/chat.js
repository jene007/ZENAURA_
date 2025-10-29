const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/chatController');

router.post('/', authenticate, ctrl.chat);

module.exports = router;
