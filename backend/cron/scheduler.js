// Scheduler: unlock assignments when unlockAt passes and create reminders for due assignments
const cron = require('node-cron');
const Assignment = require('../models/Assignment');
const Classroom = require('../models/Classroom');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Runs every minute (for demo). In production, run less frequently (e.g., hourly).
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();

    // Unlock assignments whose unlockAt has passed and are not yet marked unlocked
    const toUnlock = await Assignment.find({ unlockAt: { $lte: now }, unlocked: false, archived: false });
    for (const a of toUnlock) {
      a.unlocked = true;
      await a.save();

      // notify students in the classroom
      if (a.classroom) {
        const room = await Classroom.findById(a.classroom).populate('students');
        if (room && room.students && room.students.length) {
          const promises = room.students.map(s => {
            return Notification.create({ user: s._id, message: `Assignment "${a.title}" is now available.`, link: `/assignments/${a._id}` });
          });
          await Promise.all(promises);
        }
      }
    }

    // Send due reminders for assignments due within next 24 hours and not yet reminded
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dueSoon = await Assignment.find({ dueAt: { $gt: now, $lte: in24h }, reminderSent: false, archived: false });
    for (const a of dueSoon) {
      // notify students in the classroom
      if (a.classroom) {
        const room = await Classroom.findById(a.classroom).populate('students');
        if (room && room.students && room.students.length) {
          const promises = room.students.map(s => {
            return Notification.create({ user: s._id, message: `Reminder: Assignment "${a.title}" is due on ${a.dueAt.toLocaleString()}.`, link: `/assignments/${a._id}` });
          });
          await Promise.all(promises);
        }
      }
      a.reminderSent = true;
      await a.save();
    }

  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
});

module.exports = cron;
