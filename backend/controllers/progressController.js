const Progress = require('../models/Progress');

exports.listMy = async (req, res) => {
  try {
    const list = await Progress.find({ student: req.user._id }).populate('classroom assignment');
    // basic aggregates
    const total = list.length;
    const completed = list.filter(p => p.completedAt).length;
    const avgScore = list.reduce((acc, p) => acc + (p.score || 0), 0) / (total || 1);
    res.json({ total, completed, avgScore, items: list });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.record = async (req, res) => {
  try {
    const { assignmentId, score, notes } = req.body;
    if (!assignmentId) return res.status(400).json({ msg: 'assignmentId required' });
    const p = new Progress({ student: req.user._id, assignment: assignmentId, score, notes, completedAt: score != null ? new Date() : null });
    await p.save();
    res.json({ msg: 'Recorded', progress: p });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
