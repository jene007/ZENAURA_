const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const Activity = require('../models/Activity');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Analytics: aggregate submissions and grades per classroom
exports.getAnalytics = async (req, res) => {
  try {
    const { id } = req.params; // classroom id
    const cls = await Classroom.findById(id).populate('students', 'name email');
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });

    const assignments = await Assignment.find({ classroom: id, archived: false }).sort({ createdAt: 1 });

    // Build per-student stats
    const studentMap = {};
    for (const s of (cls.students || [])) {
      studentMap[String(s._id)] = { id: s._id, name: s.name || s.email, email: s.email, submissions: 0, gradedCount: 0, totalGrade: 0 };
    }

    let totalSubmissions = 0;
    const assignmentAvgByDate = [];
    for (const a of assignments) {
      let sumGrades = 0; let gradeCount = 0; let submissionCount = 0;
      for (const sub of (a.submissions || [])) {
        submissionCount++;
        totalSubmissions++;
        const sid = String(sub.student);
        if (!studentMap[sid]) {
          // add transient student referenced in submissions
          studentMap[sid] = { id: sub.student, name: sub.student, email: '', submissions: 0, gradedCount: 0, totalGrade: 0 };
        }
        studentMap[sid].submissions = (studentMap[sid].submissions || 0) + 1;
        if (sub.grade !== undefined && sub.grade !== null) {
          gradeCount++; sumGrades += Number(sub.grade);
          studentMap[sid].gradedCount = (studentMap[sid].gradedCount || 0) + 1;
          studentMap[sid].totalGrade = (studentMap[sid].totalGrade || 0) + Number(sub.grade);
        }
      }
      const avg = gradeCount ? (sumGrades / gradeCount) : null;
      assignmentAvgByDate.push({ assignmentId: a._id, title: a.title, date: a.createdAt, avgGrade: avg, submissions: submissionCount });
    }

    const students = Object.values(studentMap).map(s => ({ id: s.id, name: s.name, email: s.email, submissions: s.submissions, averageGrade: s.gradedCount ? +(s.totalGrade / s.gradedCount).toFixed(2) : null }));

    // Pie data: submitted vs not submitted (based on number of students * assignments)
    const totalPossible = (cls.students || []).length * Math.max(1, assignments.length);
    const submitted = totalSubmissions;
    const notSubmitted = Math.max(0, totalPossible - submitted);

    res.json({ classroom: { id: cls._id, name: cls.name }, assignmentsCount: assignments.length, students, timeseries: assignmentAvgByDate, submissionSummary: { submitted, notSubmitted, totalPossible } });
  } catch (err) {
    console.error('getAnalytics error', err);
    res.status(500).json({ msg: 'Failed to get analytics' });
  }
};

// Generate a short unique class code
function generateClassCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

exports.createClassroom = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ msg: 'Name required' });
    // ensure unique code
    let code;
    let tries = 0;
    do {
      code = generateClassCode();
      const exists = await Classroom.findOne({ code });
      if (!exists) break;
      tries++;
    } while (tries < 5);

    const classroom = new Classroom({ name, code, teacher: req.user._id });
    await classroom.save();
    res.json({ classroom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listClassrooms = async (req, res) => {
  try {
    // teachers see their classrooms; admins can pass teacher query
    const filter = { archived: false };
    if (req.user.role === 'teacher') filter.teacher = req.user._id;
    if (req.query.teacher && req.user.role === 'admin') filter.teacher = req.query.teacher;
    const list = await Classroom.find(filter).populate('teacher', 'name email');
    res.json({ classrooms: list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Archive or unarchive a classroom
exports.setArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    // only owner teacher or admin
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    cls.archived = !!archived;
    await cls.save();
    await Activity.create({ type: archived ? 'classroom.archived' : 'classroom.unarchived', message: `${cls.name} ${archived ? 'archived' : 'restored'}`, classroom: cls._id, user: req.user._id });
    res.json({ classroom: cls });
  } catch (err) {
    console.error('setArchive error', err);
    res.status(500).json({ msg: 'Failed to update classroom' });
  }
};

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, classroom, unlockAt, dueAt } = req.body;
    if (!title) return res.status(400).json({ msg: 'Title required' });
    // basic classroom ownership check for teachers
    if (req.user.role === 'teacher') {
      const cls = await Classroom.findById(classroom);
      if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
      if (String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    }

    const files = [];
    if (req.files && req.files.length) {
      // store file metadata (local path). In production integrate Cloudinary or S3.
      for (const f of req.files) {
        files.push({ url: `/uploads/${f.filename}`, filename: f.originalname });
      }
    }

    const a = new Assignment({ title, description, classroom, unlockAt, dueAt, files, createdBy: req.user._id });
    await a.save();
    res.json({ assignment: a });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.listAssignments = async (req, res) => {
  try {
    const filter = { archived: false };
    if (req.query.classroom) filter.classroom = req.query.classroom;
    // teachers can view assignments for their classrooms only
    if (req.user.role === 'teacher') {
      // find teacher's classrooms
      const cls = await Classroom.find({ teacher: req.user._id }).select('_id');
      const ids = cls.map(c => c._id);
      filter.classroom = { $in: ids };
    }
    const items = await Assignment.find(filter).populate('classroom').populate('createdBy', 'name email').sort({ createdAt: -1 });
    res.json({ assignments: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// List students for a classroom (populated user objects)
exports.listStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Classroom.findById(id).populate('students', 'name email role createdAt');
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    // teacher ownership check
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    res.json({ students: cls.students || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Add a student (optionally create user account)
exports.addStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, createAccount } = req.body;
    if (!email || !name) return res.status(400).json({ msg: 'Name and email required' });
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });

    // if user exists, reuse
    let user = await User.findOne({ email });
    if (!user && createAccount === 'true' || createAccount === true) {
      // create account with a temporary password
      const temp = crypto.randomBytes(4).toString('hex') + 'A1';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(temp, salt);
      user = new User({ name, email, password: hash, role: 'student' });
      await user.save();
      // return temp password so teacher can share it (note: emailing not implemented)
      // attach later in response
    }

    if (!user) {
      // if no user created and none existed, create a placeholder student record (not account)
      user = new User({ name, email, password: crypto.randomBytes(8).toString('hex'), role: 'student' });
      // we still save - but this creates an account; if you prefer not to auto-create accounts, change this behavior
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      await user.save();
    }

    // add to classroom if not present
    if (!cls.students.map(s => String(s)).includes(String(user._id))) {
      cls.students.push(user._id);
      await cls.save();
    }

    // log activity
    await Activity.create({ type: 'student.added', message: `${user.name} added to class`, classroom: cls._id, user: req.user._id, meta: { student: user._id } });

    res.json({ student: { id: user._id, name: user.name, email: user.email }, tempPassword: createAccount ? (user ? undefined : undefined) : undefined });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update student basic fields
exports.updateStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const { name, email } = req.body;
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ msg: 'Student not found' });
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    await Activity.create({ type: 'student.updated', message: `${user.name} updated`, classroom: cls._id, user: req.user._id, meta: { student: user._id } });
    res.json({ student: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Remove student from classroom (optionally delete account)
exports.removeStudent = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    cls.students = (cls.students || []).filter(s => String(s) !== String(studentId));
    await cls.save();
    await Activity.create({ type: 'student.removed', message: `Student removed from class`, classroom: cls._id, user: req.user._id, meta: { student: studentId } });
    res.json({ msg: 'Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Import students via CSV upload - columns: name,email
exports.importStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const createAccounts = req.query.createAccounts === 'true' || req.body?.createAccounts === 'true';
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const path = req.file.path;
    const raw = fs.readFileSync(path, 'utf8');
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const added = [];
    for (let i = 0; i < lines.length; i++) {
      const row = lines[i];
      const parts = row.split(',').map(p => p.trim());
      // support header
      if (i === 0 && /name/i.test(parts[0]) && /email/i.test(parts[1] || '')) continue;
      const name = parts[0] || `Student ${i+1}`;
      const email = parts[1] || `${name.replace(/\s+/g,'').toLowerCase()}+${crypto.randomBytes(2).toString('hex')}@example.com`;
      // check existing
      let user = await User.findOne({ email });
      if (!user && createAccounts) {
        const temp = crypto.randomBytes(4).toString('hex') + 'A1';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(temp, salt);
        user = new User({ name, email, password: hash, role: 'student' });
        await user.save();
      }
      if (!user) {
        // create account anyway to be able to reference a student user
        const tmpPass = crypto.randomBytes(8).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tmpPass, salt);
        user = new User({ name, email, password: hash, role: 'student' });
        await user.save();
      }
      if (!cls.students.map(s => String(s)).includes(String(user._id))) {
        cls.students.push(user._id);
        added.push({ id: user._id, name: user.name, email: user.email });
      }
    }
    await cls.save();
    await Activity.create({ type: 'students.import', message: `${added.length} students imported`, classroom: cls._id, user: req.user._id, meta: { count: added.length } });
    res.json({ added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Import failed' });
  }
};

// Export students as CSV
exports.exportStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Classroom.findById(id).populate('students', 'name email createdAt');
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    const rows = [['name','email','createdAt']];
    for (const s of (cls.students || [])) rows.push([s.name || '', s.email || '', s.createdAt ? s.createdAt.toISOString() : '']);
    const csv = rows.map(r => r.map(c => `"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${cls.code || 'class'}-students.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Export failed' });
  }
};

// Return recent activity for classroom
exports.getActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(200, parseInt(req.query.limit || '50'));
    const items = await Activity.find({ classroom: id }).sort({ createdAt: -1 }).limit(limit).populate('user', 'name email');
    res.json({ activity: items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to get activity' });
  }
};

// Get recent activity across all classrooms the teacher owns (or admin)
exports.getTeacherActivity = async (req, res) => {
  try {
    // find classrooms owned by teacher or all for admin
    let clsIds = [];
    if (req.user.role === 'teacher') {
      const cls = await Classroom.find({ teacher: req.user._id }).select('_id');
      clsIds = cls.map(c => c._id);
    }
    const filter = {};
    if (req.user.role === 'teacher') filter.classroom = { $in: clsIds };
    // allow admins to pass teacher query param
    if (req.query.teacher && req.user.role === 'admin') filter.classroom = req.query.teacher;
    const limit = Math.min(200, parseInt(req.query.limit || '50'));
    const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit).populate('user', 'name email');
    res.json({ activity: items });
  } catch (err) {
    console.error('getTeacherActivity error', err);
    res.status(500).json({ msg: 'Failed to get activity' });
  }
};

// Classroom analytics endpoint
exports.getAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await Classroom.findById(id).populate('students', 'name email');
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    // basic teacher ownership check
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });

    // gather assignments for class
    const Assignment = require('../models/Assignment');
    const assignments = await Assignment.find({ classroom: id, archived: false }).sort({ createdAt: 1 }).lean();

    // per-assignment stats (submission count, average grade)
    const assignmentSeries = assignments.map(a => {
      const subs = a.submissions || [];
      const submitted = subs.length;
      const graded = subs.filter(s => s.grade !== undefined && s.grade !== null);
      const avgGrade = graded.length ? (graded.reduce((s, x) => s + (Number(x.grade) || 0), 0) / graded.length) : null;
      return { id: a._id, title: a.title, date: a.createdAt, submitted, total: cls.students.length, avgGrade };
    });

    // per-student completion % and average grade
    const studentStats = (cls.students || []).map(s => ({ id: s._id, name: s.name, email: s.email, submissions: 0, grades: [] }));
    const studentMap = new Map(studentStats.map(s => [String(s.id), s]));
    for (const a of assignments) {
      for (const sub of (a.submissions || [])) {
        const sid = String(sub.student);
        const st = studentMap.get(sid);
        if (st) {
          st.submissions = (st.submissions || 0) + 1;
          if (sub.grade !== undefined && sub.grade !== null) st.grades.push(Number(sub.grade));
        }
      }
    }
    const studentsOut = Array.from(studentMap.values()).map(s => ({ id: s.id, name: s.name, email: s.email, completion: assignments.length ? Math.round((s.submissions / assignments.length) * 100) : 0, avgGrade: s.grades.length ? (s.grades.reduce((a,b)=>a+b,0)/s.grades.length) : null }));

    // submission breakdown
    const totalPossible = (cls.students || []).length * assignments.length;
    let submittedCount = 0;
    for (const a of assignments) submittedCount += (a.submissions || []).length;

    const pie = { submitted: submittedCount, pending: Math.max(0, totalPossible - submittedCount) };

    res.json({ classroom: { id: cls._id, name: cls.name }, assignmentSeries, students: studentsOut, pie });
  } catch (err) {
    console.error('analytics error', err);
    res.status(500).json({ msg: 'Analytics error' });
  }
};
