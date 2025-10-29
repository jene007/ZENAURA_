const Classroom = require('../models/Classroom');
const Activity = require('../models/Activity');

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const classroom = new Classroom({ name, code, teacher: req.user.id });
    await classroom.save();
    res.status(201).json({ classroom });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.list = async (req, res) => {
  const classes = await Classroom.find().populate('teacher', 'name email');
  res.json({ classes });
};

exports.get = async (req, res) => {
  const classroom = await Classroom.findById(req.params.id).populate('students teacher');
  if (!classroom) return res.status(404).json({ msg: 'Not found' });
  try{
    const announcements = await Activity.find({ classroom: classroom._id, type: 'announcement' }).sort({ createdAt: -1 }).limit(50).populate('user', 'name');
    res.json({ classroom, announcements });
  }catch(e){
    res.json({ classroom, announcements: [] });
  }
};

// Teacher posts an announcement to a classroom
exports.createAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message) return res.status(400).json({ msg: 'Message required' });
    const cls = await Classroom.findById(id);
    if (!cls) return res.status(404).json({ msg: 'Classroom not found' });
    // only teacher or admin may post
    if (req.user.role === 'teacher' && String(cls.teacher) !== String(req.user._id)) return res.status(403).json({ msg: 'Not your classroom' });
    const act = new Activity({ type: 'announcement', message, classroom: cls._id, user: req.user._id });
    await act.save();
    res.json({ announcement: act });
  } catch (err) {
    console.error('createAnnouncement error', err);
    res.status(500).json({ msg: 'Failed to post announcement' });
  }
};

// List announcements for a classroom (visible to authenticated users)
exports.listAnnouncements = async (req, res) => {
  try{
    const { id } = req.params;
    const items = await Activity.find({ classroom: id, type: 'announcement' }).sort({ createdAt: -1 }).limit(200).populate('user', 'name');
    res.json({ announcements: items });
  }catch(err){ console.error(err); res.status(500).json({ msg: 'Failed to list announcements' }); }
};

exports.mine = async (req, res) => {
  try {
    const userId = req.user._id;
    const classes = await Classroom.find({ $or: [ { teacher: userId }, { students: userId } ] }).populate('teacher', 'name email');
    res.json({ classrooms: classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.joinByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ msg: 'Code required' });
    const classroom = await Classroom.findOne({ code });
    if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });
    // avoid duplicates
    const exists = (classroom.students || []).some(s => String(s) === String(req.user._id));
    if (exists) return res.json({ msg: 'Already enrolled', classroom });
    classroom.students = classroom.students || [];
    classroom.students.push(req.user._id);
    await classroom.save();
    res.json({ msg: 'Joined classroom', classroom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
