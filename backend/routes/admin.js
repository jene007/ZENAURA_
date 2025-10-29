const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
let Classroom, Assignment, Exam;
try { Classroom = require('../models/Classroom'); } catch (e) { Classroom = null; }
try { Assignment = require('../models/Assignment'); } catch (e) { Assignment = null; }
try { Exam = require('../models/Exam'); } catch (e) { Exam = null; }

// GET /api/admin/stats - admin only
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [users, teachers, students, classrooms, assignments, exams] = await Promise.all([
      User.countDocuments({ archived: false }),
      User.countDocuments({ role: 'teacher', archived: false }),
      User.countDocuments({ role: 'student', archived: false }),
      Classroom ? Classroom.countDocuments() : 0,
      Assignment ? Assignment.countDocuments() : 0,
      Exam ? Exam.countDocuments() : 0
    ]);

    res.json({
      totalUsers: users,
      teachers,
      students,
      classrooms,
      assignments,
      exams
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -- User CRUD for admin
// GET /api/admin/users?role=teacher&q=nameOrEmail
router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role, q } = req.query;
    const filter = { archived: false };
    if (role) filter.role = role;
    if (q) filter.$or = [ { name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') } ];
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/admin/users - create user
router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already used' });
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hash, role: role || 'student', department });
    await user.save();
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/admin/users/:id - update user (optionally reset password)
router.put('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, password } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (department) user.department = department;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }
    await user.save();
    res.json({ msg: 'User updated', user: { id: user._id, name: user.name, email: user.email, role: user.role, department: user.department } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - permanent delete user and cleanup references
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Remove user document
    await User.findByIdAndDelete(id);

    // Remove user from any classroom students arrays
    if (Classroom) {
      await Classroom.updateMany({ students: id }, { $pull: { students: id } });
      // If user was a teacher for any classroom, unset the teacher field
      await Classroom.updateMany({ teacher: id }, { $unset: { teacher: "" } });
    }

    // Remove submissions made by this user from assignments
    if (Assignment) {
      await Assignment.updateMany({}, { $pull: { submissions: { student: id } } });
    }

    // Note: we intentionally do not attempt to delete activity logs or other historic data,
    // but references to the user will be removed from active collections above.

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// -- Classroom CRUD
router.get('/classrooms', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { q, teacher } = req.query;
    const filter = { archived: false };
    if (teacher) filter.teacher = teacher;
    if (q) filter.name = new RegExp(q, 'i');
    const items = await Classroom.find(filter).populate('teacher', 'name email').sort({ createdAt: -1 });
    res.json({ classrooms: items });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.post('/classrooms', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { name, code, teacher } = req.body;
    if (!name || !code) return res.status(400).json({ msg: 'Missing fields' });
    const existing = await Classroom.findOne({ code });
    if (existing) return res.status(400).json({ msg: 'Class code already exists' });
    const room = new Classroom({ name, code, teacher });
    await room.save();
    res.json({ classroom: room });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.put('/classrooms/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, teacher } = req.body;
    const room = await Classroom.findById(id);
    if (!room) return res.status(404).json({ msg: 'Classroom not found' });
    if (name) room.name = name;
    if (code) room.code = code;
    if (teacher) room.teacher = teacher;
    await room.save();
    res.json({ msg: 'Classroom updated', classroom: room });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.delete('/classrooms/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Classroom.findById(id);
    if (!room) return res.status(404).json({ msg: 'Classroom not found' });
    room.archived = true;
    await room.save();
    res.json({ msg: 'Classroom archived' });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// -- Assignment CRUD
router.get('/assignments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { q, classroom } = req.query;
    const filter = { archived: false };
    if (classroom) filter.classroom = classroom;
    if (q) filter.title = new RegExp(q, 'i');
    const items = await Assignment.find(filter).populate('classroom').populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ assignments: items });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.post('/assignments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, description, classroom, unlockAt, dueAt } = req.body;
    if (!title) return res.status(400).json({ msg: 'Missing title' });
    const a = new Assignment({ title, description, classroom, unlockAt, dueAt, createdBy: req.user._id });
    await a.save();
    res.json({ assignment: a });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.put('/assignments/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, classroom, unlockAt, dueAt } = req.body;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ msg: 'Assignment not found' });
    if (title) a.title = title;
    if (description) a.description = description;
    if (classroom) a.classroom = classroom;
    if (unlockAt) a.unlockAt = unlockAt;
    if (dueAt) a.dueAt = dueAt;
    await a.save();
    res.json({ msg: 'Assignment updated', assignment: a });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.delete('/assignments/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const a = await Assignment.findById(id);
    if (!a) return res.status(404).json({ msg: 'Assignment not found' });
    a.archived = true;
    await a.save();
    res.json({ msg: 'Assignment archived' });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

// -- Exam CRUD
router.get('/exams', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { q, classroom } = req.query;
    const filter = { archived: false };
    if (classroom) filter.classroom = classroom;
    if (q) filter.title = new RegExp(q, 'i');
    const items = await Exam.find(filter).populate('classroom').sort({ date: -1 });
    res.json({ exams: items });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.post('/exams', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { title, subject, classroom, date } = req.body;
    if (!title || !date) return res.status(400).json({ msg: 'Missing fields' });
    const ex = new Exam({ title, subject, classroom, date });
    await ex.save();
    res.json({ exam: ex });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.put('/exams/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, classroom, date } = req.body;
    const ex = await Exam.findById(id);
    if (!ex) return res.status(404).json({ msg: 'Exam not found' });
    if (title) ex.title = title;
    if (subject) ex.subject = subject;
    if (classroom) ex.classroom = classroom;
    if (date) ex.date = date;
    await ex.save();
    res.json({ msg: 'Exam updated', exam: ex });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

router.delete('/exams/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const ex = await Exam.findById(id);
    if (!ex) return res.status(404).json({ msg: 'Exam not found' });
    ex.archived = true;
    await ex.save();
    res.json({ msg: 'Exam archived' });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
});

module.exports = router;

