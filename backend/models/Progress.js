const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  score: { type: Number },
  completedAt: { type: Date },
  notes: { type: String }
});

module.exports = mongoose.model('Progress', ProgressSchema);
