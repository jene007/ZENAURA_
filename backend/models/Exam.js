const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  date: { type: Date, required: true },
  syllabusFiles: [{ url: String, filename: String }],
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', ExamSchema);
