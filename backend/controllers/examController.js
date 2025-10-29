const Exam = require('../models/Exam');
const StudyPlan = require('../models/StudyPlan');
const fs = require('fs');
const path = require('path');

function parseDateString(s){
  if (!s) return null;
  const t = Date.parse(s);
  if (!isNaN(t)) return new Date(t);
  let m = s.match(/(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/);
  if (m){
    const parts = m[0].split(/[\/\-]/).map(p=>Number(p));
    if (parts[2] < 100) parts[2] += 2000;
    const day = parts[0], mon = parts[1], year = parts[2];
    return new Date(year, mon-1, day);
  }
  m = s.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(,?\s+\d{4})?\b/i);
  if (m){
    const tryParse = Date.parse(m[0]);
    if (!isNaN(tryParse)) return new Date(tryParse);
  }
  return null;
}

function extractDatesFromText(text){
  const candidates = [];
  if (!text) return candidates;
  const iso = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
  for (const d of iso) candidates.push(d);
  const sl = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
  for (const d of sl) candidates.push(d);
  const mn = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\.,-]{1,2}\d{1,2}(?:,?\s+\d{4})?/gi) || [];
  for (const d of mn) candidates.push(d);
  const dates = candidates.map(c => parseDateString(c)).filter(Boolean);
  return dates;
}

function buildStudyPlanForExam(exam, options={sessionsPerDay:2,durationMinutes:60,days:14}){
  const examDate = new Date(exam.date);
  const days = options.days || 14;
  const sessionsPerDay = options.sessionsPerDay || 2;
  const duration = options.durationMinutes || 60;
  const start = new Date(examDate);
  start.setDate(start.getDate() - days);
  const topics = [];
  if (exam.title) topics.push(exam.title);
  if (exam.subject) topics.push(exam.subject);
  if (exam.syllabusFiles) for (const f of exam.syllabusFiles.slice(0,10)) if (f.filename) topics.push(f.filename);
  if (topics.length === 0) topics.push('General review');
  const schedule = [];
  let topicIdx = 0;
  for (let d = 0; d < days; d++){
    for (let s = 0; s < sessionsPerDay; s++){
      const dt = new Date(start);
      dt.setDate(dt.getDate() + d);
      const baseHour = 18;
      const startHour = baseHour + Math.floor(s * (1.5));
      dt.setHours(startHour, 0, 0, 0);
      const topic = topics[topicIdx % topics.length];
      schedule.push({ date: dt, topic, durationMinutes: duration });
      topicIdx++;
    }
  }
  return schedule;
}

exports.create = async (req, res) => {
  try {
    const { title, subject, classroom, date } = req.body;
    const files = (req.files || []).map(f => ({ url: f.path || f.filename, filename: f.originalname, savedPath: f.path || f.filename }));

    // if no date provided, try to extract from uploaded text files
    let examDate = date ? new Date(date) : null;
    if (!examDate || isNaN(examDate.getTime())){
      for (const f of (req.files || [])){
        try{
          const ext = path.extname(f.originalname || f.filename || '').toLowerCase();
          if (ext === '.txt' || ext === '.md' || ext === '.csv' || ext === '.html'){
            const p = f.path || path.join('uploads', f.filename || '');
            const contents = await fs.promises.readFile(p, 'utf8');
            const dates = extractDatesFromText(contents);
            const now = new Date();
            const future = dates.filter(d => d && d.getTime() >= (now.getTime() - 24*60*60*1000));
            if (future.length){
              future.sort((a,b)=>a-b);
              examDate = future[0];
              break;
            }
          }
        } catch(e){
          // ignore file read errors
          console.warn('Failed to read uploaded file for date extraction', e?.message||e);
        }
      }
    }

    if (!examDate || isNaN(new Date(examDate).getTime())){
      return res.status(400).json({ msg: 'Exam date is required or not found in uploaded materials.' });
    }

    const e = new Exam({ title, subject, classroom, date: examDate, syllabusFiles: files });
    await e.save();

    // generate a class-level study plan and save it
    try{
      const schedule = buildStudyPlanForExam(e, { sessionsPerDay:2, durationMinutes:60, days:14 });
      const sp = new StudyPlan({ student: null, exam: e._id, schedule, metadata: { generatedBy: req.user?._id || null, scope: 'class' } });
      await sp.save();
    } catch(planErr){
      console.warn('Study plan generation failed', planErr?.message||planErr);
    }

    res.status(201).json({ exam: e });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.list = async (req, res) => {
  const items = await Exam.find().populate('classroom');
  res.json({ exams: items });
};

exports.get = async (req, res) => {
  const item = await Exam.findById(req.params.id);
  if (!item) return res.status(404).json({ msg: 'Not found' });
  res.json({ exam: item });
};
