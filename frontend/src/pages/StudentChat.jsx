import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Build a short context from assignments/exams for the conversational model
async function buildStudyContext() {
  try {
    const [aRes, eRes] = await Promise.all([API.get('/assignments'), API.get('/exams')]);
    const assignments = (aRes.data && aRes.data.assignments) || [];
    const exams = (eRes.data && eRes.data.exams) || [];
    const parts = [];
    for (const a of assignments.slice(0,6)) {
      parts.push(`Assignment: ${a.title}\nDescription: ${a.description || ''}\nFiles: ${(a.files||[]).map(f=>f.filename).join(', ')}\n`);
    }
    for (const x of exams.slice(0,6)) {
      parts.push(`Exam: ${x.title}\nSubject: ${x.subject||''}\nSyllabus files: ${(x.syllabusFiles||[]).map(f=>f.filename).join(', ')}\n`);
    }
    return parts.join('\n---\n');
  } catch (e) {
    console.warn('Failed to build study context', e.message || e);
    return '';
  }
}

export default function StudentChat() {
  const [messages, setMessages] = useState(() => {
    // preload a greeting
    return [
      { id: 1, from: 'bot', text: "Hello — I'm ZenBot. Type a message or try 'schedule study' to add a 30-minute study block.", time: now() }
    ];
  });
  const [input, setInput] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    // scroll to bottom on new message
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  function addMessage(from, text) {
    setMessages(m => [...m, { id: Date.now() + Math.random(), from, text, time: now() }]);
  }

  async function handleSend(e) {
    e && e.preventDefault();
    const text = input.trim();
    if (!text) return;
    addMessage('user', text);
    setInput('');

  // Prepare payload for backend chat. We send only the user's question; server will build context.
  const payload = { message: text };

    try {
      const res = await API.post('/chat', payload);
      const reply = res.data && (res.data.reply || res.data.replyText || res.data.reply);
      if (reply) addMessage('bot', reply);
      else addMessage('bot', "Sorry, I couldn't produce an answer right now.");
    } catch (err) {
      console.error('Chat API error', err?.response?.data || err.message || err);
      // Fallback: simple keyword search over context
      if (context) {
        const q = text.toLowerCase();
        const lines = context.split(/\n+/);
        const match = lines.find(l => l.toLowerCase().includes(q.split(' ')[0] || ''));
        if (match) addMessage('bot', `Found related material: ${match}`);
        else addMessage('bot', "I couldn't reach the chat service. Try again later or ask a different question.");
      } else {
        addMessage('bot', "I couldn't reach the chat service and there's no study material available.");
      }
    }
  }

  function quickSchedule() {
    // removed quick schedule action as requested; keep helper for future use
    addMessage('bot', "Quick schedule has been disabled in this ZenBot configuration.");
  }

  return (
    <div className="page container">
      <h3 className="mb-3">ZenBot — study assistant</h3>
      <div className="chat-wrap card p-3" style={{maxWidth:800}}>
        <div ref={listRef} className="chat-list mb-3" style={{maxHeight:300, overflowY:'auto'}}>
          {messages.map(m => (
            <div key={m.id} className={`chat-message ${m.from === 'bot' ? 'bot' : 'user'}`} style={{marginBottom:10}}>
              <div className="meta" style={{fontSize:12, color:'#666'}}>{m.from === 'bot' ? 'ZenBot' : 'You'} • {m.time}</div>
              <div className="bubble" style={{padding:10, borderRadius:8, background: m.from === 'bot' ? '#f3f6fb' : '#d1e7ff', display:'inline-block', marginTop:4}}>{m.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} style={{display:'flex', gap:8}}>
          <input aria-label="Message to ZenBot" value={input} onChange={e=>setInput(e.target.value)} className="form-control" placeholder="Ask ZenBot or type 'schedule study'" />
          <button type="submit" className="btn btn-primary">Send</button>
          <button type="button" className="btn btn-outline-secondary" onClick={quickSchedule}>Quick 30m</button>
        </form>

        <div className="mt-3" style={{fontSize:13,color:'#666'}}>
          Tip: Try "schedule study" or use the Quick 30m button to create a study block.
        </div>
      </div>
    </div>
  );
}
