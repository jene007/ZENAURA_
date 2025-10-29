const mongoose = require('mongoose');

const StudyPlanSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  schedule: [{ date: Date, topic: String, durationMinutes: Number }],
  generatedAt: { type: Date, default: Date.now },
  metadata: { type: Object }
});

module.exports = mongoose.model('StudyPlan', StudyPlanSchema);
