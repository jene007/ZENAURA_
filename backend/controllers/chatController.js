const ChatLog = require('../models/ChatLog');
const Assignment = require('../models/Assignment');
const Exam = require('../models/Exam');
const { chatCompletion } = require('../services/openai');
const Sentiment = require('sentiment');
const sentiment = new Sentiment();

// ZenBot: uses OPENAI_API_KEY if provided in .env; adds sentiment analysis and stores meta
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ msg: 'Message required' });
    // Build server-side study context from recent assignments/exams
    let studyParts = [];
    try {
      const assignments = await Assignment.find({ archived: { $ne: true } }).sort({ dueAt: 1 }).limit(8).lean();
      const exams = await Exam.find({ archived: { $ne: true } }).sort({ date: 1 }).limit(8).lean();
      for (const a of assignments) {
        studyParts.push(`Assignment: ${a.title}\nDescription: ${a.description || ''}\nFiles: ${(a.files||[]).map(f=>f.filename).join(', ')}`);
      }
      for (const x of exams) {
        studyParts.push(`Exam: ${x.title}\nSubject: ${x.subject||''}\nDate: ${x.date ? new Date(x.date).toLocaleDateString() : ''}\nFiles: ${(x.syllabusFiles||[]).map(f=>f.filename).join(', ')}`);
      }
    } catch (e) {
      console.warn('Failed to fetch study materials for context:', e.message || e);
    }

    const studyContext = studyParts.join('\n---\n') || '';

    let responseText = 'ZenBot is not configured to use an external AI. Showing local study help instead.';
    let meta = { contextProvided: !!studyContext };

    // If an OpenAI key is configured, prefer using it with a controlled system prompt
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = `You are ZenBot, an academic assistant for a student. Use the study materials below to answer concisely and cite which assignment/exam the info came from when relevant.\n\nStudy materials:\n${studyContext}`;
        const out = await chatCompletion(message, { system: systemPrompt, max_tokens: 600 });
        responseText = out?.choices?.[0]?.message?.content || responseText;
        meta.openai = { usage: out.usage, id: out.id };
      } catch (e) {
        console.error('OpenAI error:', e.message);
      }
    } else {
      // Fallback: simple keyword-retrieval over the studyContext
      try {
        const q = (message || '').toLowerCase();
        const tokens = q.split(/\W+/).filter(t => t.length > 3).slice(0,8);
        const lines = studyContext.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const matches = [];
        for (const line of lines) {
          const low = line.toLowerCase();
          if (tokens.some(tok => low.includes(tok))) {
            matches.push(line);
          }
        }
        if (matches.length) {
          // Return up to 3 matched snippets as a simple synthesized answer
          const top = matches.slice(0,3).join('\n---\n');
          responseText = `I couldn't use an external AI, but I found these relevant items from your study materials:\n\n${top}`;
          meta.fallback = { type: 'local_retrieval', results: matches.length };
        } else if (studyParts.length) {
          // No direct match — provide a short snapshot of upcoming materials
          const upcoming = studyParts.slice(0,4).join('\n---\n');
          responseText = `No direct match found in study materials. Here's a short snapshot of upcoming items:\n\n${upcoming}`;
          meta.fallback = { type: 'snapshot', count: studyParts.length };
        } else {
          responseText = `I don't have access to AI and no study materials were found. Try asking a simpler question or upload materials.`;
          meta.fallback = { type: 'no_materials' };
        }
      } catch (e) {
        console.error('Fallback error:', e.message || e);
        responseText = 'ZenBot could not produce a response right now.';
      }
    }

    // sentiment analysis (fallback to simple package)
    try {
      const s = sentiment.analyze(message);
      meta.sentiment = s;
    } catch (e) {
      meta.sentiment = { error: e.message };
    }

    const score = (meta.sentiment && meta.sentiment.score) || 0;
    const sentimentLabel = score > 1 ? 'positive' : score < -1 ? 'negative' : 'neutral';

    const log = new ChatLog({ sender: req.user ? req.user.id : null, message, response: responseText, sentiment: sentimentLabel, meta });
    await log.save();
    res.json({ reply: responseText, sentiment: sentimentLabel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Chat error' });
  }
};
