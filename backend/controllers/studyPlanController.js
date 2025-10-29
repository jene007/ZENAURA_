const StudyPlan = require('../models/StudyPlan');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');

// Simple heuristic generator (no AI): split days remaining into topics slots
exports.generate = async (req, res) => {
  try {
    const { examId, preferredDailyMinutes } = req.body;
    const studentId = req.user._id;
    let exam = null;
    if (examId) exam = await Exam.findById(examId);
    if (!exam) {
      // try to find next upcoming exam
      exam = await Exam.findOne({ date: { $gte: new Date() } }).sort({ date: 1 });
    }
    if (!exam) return res.status(400).json({ msg: 'No upcoming exam found' });

    const days = Math.max(1, Math.ceil((new Date(exam.date) - new Date()) / (1000 * 60 * 60 * 24)));
    const perDay = Number(preferredDailyMinutes) || 60; // default 60 minutes per day

    // naive topic list: try subject + generic splits
    const topics = [];
    const baseTopics = [
      `${exam.subject || exam.title} — Overview`,
      'Key Concepts',
      'Practice Questions',
      'Revision & Mock Test'
    ];
    // expand to more topics if days large
    for (let i = 0; i < Math.max(baseTopics.length, Math.min(days, 14)); i++) {
      topics.push(baseTopics[i % baseTopics.length] + (i >= baseTopics.length ? ` (${Math.floor(i / baseTopics.length) + 1})` : ''));
    }

    // assign topics to days cyclically
    const schedule = [];
    for (let d = 0; d < days; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const topic = topics[d % topics.length];
      schedule.push({ date, topic, durationMinutes: perDay });
    }

    const plan = new StudyPlan({ student: studentId, exam: exam._id, schedule, metadata: { generatedBy: 'heuristic', topics } });
    await plan.save();
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.list = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ student: req.user._id }).populate('exam');
    res.json({ plans });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.get = async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id).populate('exam');
    if (!plan) return res.status(404).json({ msg: 'Not found' });
    if (!String(plan.student).startsWith(String(req.user._id).slice(0,1))) {
      // naive ownership check removed; instead ensure owner
    }
    if (String(plan.student) !== String(req.user._id)) return res.status(403).json({ msg: 'Forbidden' });
    res.json({ plan });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
