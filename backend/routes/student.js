const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const studyCtrl = require('../controllers/studyPlanController');
const progCtrl = require('../controllers/progressController');
const wellnessCtrl = require('../controllers/wellnessController');

// all routes are authenticated; student role enforced where appropriate
router.post('/studyplan/generate', authenticate, authorize('student'), studyCtrl.generate);
router.get('/studyplans', authenticate, authorize('student'), studyCtrl.list);
router.get('/studyplans/:id', authenticate, authorize('student'), studyCtrl.get);

router.get('/progress', authenticate, authorize('student'), progCtrl.listMy);
router.post('/progress', authenticate, authorize('student'), progCtrl.record);

router.get('/wellness', authenticate, authorize('student'), wellnessCtrl.summary);

module.exports = router;
