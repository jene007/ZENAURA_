const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/classroomController');

router.post('/', authenticate, authorize('teacher','admin'), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/mine', authenticate, ctrl.mine);
router.get('/:id', authenticate, ctrl.get);
// Announcements
router.post('/:id/announcements', authenticate, authorize('teacher','admin'), ctrl.createAnnouncement);
router.get('/:id/announcements', authenticate, ctrl.listAnnouncements);
router.post('/join', authenticate, ctrl.joinByCode);

module.exports = router;
