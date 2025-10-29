const ChatLog = require('../models/ChatLog');

exports.summary = async (req, res) => {
  try {
    const userId = req.user._id;
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const logs = await ChatLog.find({ sender: userId, createdAt: { $gte: since } }).sort({ createdAt: -1 });
    const counts = {};
    logs.forEach(l => { const s = l.sentiment || 'neutral'; counts[s] = (counts[s] || 0) + 1; });
    res.json({ counts, total: logs.length, recent: logs.slice(0, 10) });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
