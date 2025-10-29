const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['assignment','resource'], default: 'assignment' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  files: [{ url: String, filename: String }],
  submissions: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, files: [{ url: String, filename: String }], submittedAt: Date, comment: String, grade: Number, feedback: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  unlockAt: { type: Date },
  dueAt: { type: Date },
  archived: { type: Boolean, default: false },
  unlocked: { type: Boolean, default: false },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
