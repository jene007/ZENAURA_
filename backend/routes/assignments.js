const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/assignmentController');

router.post('/', authenticate, authorize('teacher','admin'), upload.array('files'), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.get);
router.post('/:id/submit', authenticate, upload.array('files'), ctrl.submit);

module.exports = router;
