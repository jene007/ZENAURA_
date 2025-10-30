require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const classroomRoutes = require('./routes/classrooms');
const assignmentRoutes = require('./routes/assignments');
const examRoutes = require('./routes/exams');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files (for development). In production use a CDN or cloud storage.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => res.json({ ok: true, msg: 'ZenAura backend' }));

// Provide a small helpful response for GET /api (useful for health checks or browser requests)
app.get('/api', (req, res) => res.json({ ok: true, msg: 'ZenAura backend API root. See /api/auth, /api/users, /api/classrooms, etc.' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/exams', examRoutes);
// Chat routes (ZenBot) removed
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  // In development, include the error message to help debugging
  if (process.env.NODE_ENV !== 'production') {
    return res.status(500).json({ error: err.message || 'Something went wrong' });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

module.exports = app;
