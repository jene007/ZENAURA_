const Assignment = require('../models/Assignment');
const Activity = require('../models/Activity');

exports.create = async (req, res) => {
  try {
    const { title, description, classroom, unlockAt, dueAt } = req.body;
    const files = (req.files || []).map(f => ({ url: f.path || f.filename, filename: f.originalname }));
    const a = new Assignment({ title, description, classroom, unlockAt, dueAt, files, createdBy: req.user.id });
    await a.save();
    try{
      await Activity.create({ type: 'assignment_created', message: `Assignment "${title}" created`, classroom, user: req.user._id, meta: { assignmentId: a._id } });
    }catch(e){ console.warn('Activity log failed', e?.message||e); }
    res.status(201).json({ assignment: a });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.list = async (req, res) => {
  const items = await Assignment.find({ archived: false }).populate('createdBy', 'name email').populate('classroom');
  res.json({ assignments: items });
};

exports.get = async (req, res) => {
  const item = await Assignment.findById(req.params.id).populate('createdBy');
  if (!item) return res.status(404).json({ msg: 'Not found' });
  res.json({ assignment: item });
};

exports.submit = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    const files = (req.files || []).map(f => ({ url: `/uploads/${f.filename}`, filename: f.originalname }));

    assignment.submissions = assignment.submissions || [];
    assignment.submissions.push({ student: req.user._id, files, submittedAt: new Date(), comment });
    await assignment.save();
    try{
      await Activity.create({ type: 'submission', message: `Submission for ${assignment.title}`, classroom: assignment.classroom, user: req.user._id, meta: { assignmentId: assignment._id } });
    }catch(e){ console.warn('Activity log failed', e?.message||e); }
    res.json({ msg: 'Submission received', assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Submit error' });
  }
};

// Grade a specific submission (teacher action)
exports.gradeSubmission = async (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    // teacher ownership check would be handled by route middleware; double-check classroom
    const sub = (assignment.submissions || []).id(submissionId);
    if (!sub) return res.status(404).json({ msg: 'Submission not found' });
    if (grade !== undefined) sub.grade = Number(grade);
    if (feedback !== undefined) sub.feedback = feedback;
    await assignment.save();
    try{ await Activity.create({ type: 'graded', message: `Submission graded (${grade})`, classroom: assignment.classroom, user: req.user._id, meta: { assignmentId: assignment._id, submissionId } }); }catch(e){/* ignore */}
    res.json({ msg: 'Graded', submission: sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Grade failed' });
  }
};

// Auto-evaluate ungraded submissions for an assignment using simple heuristics.
// Heuristics implemented:
// - If submission.comment contains `auto:score=NN` use NN as grade.
// - Else if submission.files present, assign 100.
// - Else assign 0.
exports.autoEvaluate = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    let updated = 0;
    for (const sub of (assignment.submissions || [])) {
      if (sub.grade !== undefined && sub.grade !== null) continue; // skip already graded
      let grade = null;
      if (sub.comment && typeof sub.comment === 'string') {
        const m = sub.comment.match(/auto:score=(\d{1,3})/i);
        if (m) grade = Math.max(0, Math.min(100, Number(m[1])));
      }
      if (grade === null) {
        if (sub.files && sub.files.length) grade = 100;
        else grade = 0;
      }
      sub.grade = grade;
      updated++;
    }
    await assignment.save();
    try{ await Activity.create({ type: 'auto_graded', message: `Auto-evaluated ${updated} submissions`, classroom: assignment.classroom, user: req.user._id, meta: { assignmentId: assignment._id, updated } }); }catch(e){/* ignore */}
    res.json({ msg: 'Auto-evaluation complete', updated });
  } catch (err) {
    console.error('autoEvaluate error', err);
    res.status(500).json({ msg: 'Auto-evaluation failed' });
  }
};
