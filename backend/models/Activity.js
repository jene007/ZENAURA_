const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: { type: String },
  message: { type: String },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Activity', ActivitySchema);
