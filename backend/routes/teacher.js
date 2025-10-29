const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/teacherController');

// Teachers and admins can create/list classrooms
router.post('/classrooms', authenticate, authorize('teacher','admin'), ctrl.createClassroom);
router.get('/classrooms', authenticate, ctrl.listClassrooms);
// Archive/unarchive classroom
router.patch('/classrooms/:id/archive', authenticate, authorize('teacher','admin'), ctrl.setArchive);

// Assignments: teachers upload files and create assignments
router.post('/assignments', authenticate, authorize('teacher','admin'), upload.array('files'), ctrl.createAssignment);
router.get('/assignments', authenticate, ctrl.listAssignments);
// Auto-evaluate submissions for an assignment (teacher/admin)
router.post('/assignments/:id/auto-evaluate', authenticate, authorize('teacher','admin'), require('../controllers/assignmentController').autoEvaluate);
// Grade submissions
router.post('/assignments/:id/submissions/:submissionId/grade', authenticate, authorize('teacher','admin'), require('../controllers/assignmentController').gradeSubmission);

// Students CRUD + CSV import/export per classroom
router.get('/classrooms/:id/students', authenticate, authorize('teacher','admin'), ctrl.listStudents);
router.post('/classrooms/:id/students', authenticate, authorize('teacher','admin'), ctrl.addStudent);
router.put('/classrooms/:id/students/:studentId', authenticate, authorize('teacher','admin'), ctrl.updateStudent);
router.delete('/classrooms/:id/students/:studentId', authenticate, authorize('teacher','admin'), ctrl.removeStudent);
router.post('/classrooms/:id/students/import', authenticate, authorize('teacher','admin'), upload.single('file'), ctrl.importStudents);
router.get('/classrooms/:id/students/export', authenticate, authorize('teacher','admin'), ctrl.exportStudents);

// Activity feed for a classroom
router.get('/classrooms/:id/activity', authenticate, authorize('teacher','admin'), ctrl.getActivity);

// Recent activity across teacher's classrooms
router.get('/activity', authenticate, authorize('teacher','admin'), ctrl.getTeacherActivity);

// Analytics for classroom (students performance, submission stats)
router.get('/classrooms/:id/analytics', authenticate, authorize('teacher','admin'), ctrl.getAnalytics);
// Analytics for a classroom
router.get('/classrooms/:id/analytics', authenticate, authorize('teacher','admin'), ctrl.getAnalytics);

module.exports = router;
