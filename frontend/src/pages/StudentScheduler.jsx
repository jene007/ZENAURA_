import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

function loadSchedules() {
  try {
    return JSON.parse(localStorage.getItem('zen_scheduler') || '[]');
  } catch (e) {
    return [];
  }
}

function loadExams() {
  try {
    return JSON.parse(localStorage.getItem('zen_exams') || '[]');
  } catch (e) {
    return [];
  }
}

export default function StudentScheduler(){
  const [items, setItems] = useState(loadSchedules);
  const [exams, setExams] = useState(loadExams);
  const [notifications, setNotifications] = useState(() => { try{ return JSON.parse(localStorage.getItem('zen_notifications')||'[]'); }catch(e){return [];}});
  const [form, setForm] = useState({ title:'', date:'', subject:'' });
  const [subjectsInput, setSubjectsInput] = useState([]); // temporary subjects list for the add form
  const [fileStatus, setFileStatus] = useState('');

  useEffect(() => {
    const onStorage = () => {
      setItems(loadSchedules());
      setExams(loadExams());
    };
    const onCustom = (e) => {
      // custom events to notify same-window changes
      setItems(loadSchedules());
      setExams(loadExams());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('zen_scheduler_updated', onCustom);
    window.addEventListener('zen_study_plans_updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('zen_scheduler_updated', onCustom);
      window.removeEventListener('zen_study_plans_updated', onCustom);
    };
  }, []);

  function removeItem(id) {
    const next = items.filter(i=>i.id !== id);
    setItems(next);
    localStorage.setItem('zen_scheduler', JSON.stringify(next));
  }

  function clearAllScheduled(){
    if (!confirm('Move all scheduled items to reminders? This will clear the scheduler but keep reminders in Notifications.')) return;
    try{
      const list = JSON.parse(localStorage.getItem('zen_scheduler')||'[]');
      if (Array.isArray(list) && list.length){
        // create notifications for each
        const nextNotifs = list.map(i=>({ id: `notif-${Date.now()}-${Math.random()}`, title: i.title || i.notes || 'Study session', date: i.start || i.date || null, meta: { source: 'scheduler' } }));
        const merged = [...nextNotifs, ...notifications];
        localStorage.setItem('zen_notifications', JSON.stringify(merged));
        setNotifications(merged);
      }
      localStorage.removeItem('zen_scheduler');
      setItems([]);
      // notify listeners
      window.dispatchEvent(new Event('zen_scheduler_updated'));
    }catch(e){ console.warn('Failed to clear scheduler', e); }
  }

  function removeExam(id){
    const next = exams.filter(e=>e.id !== id);
    setExams(next);
    localStorage.setItem('zen_exams', JSON.stringify(next));
  }

  function removeExamSchedules(examId){
    if (!confirm('Move this exam\'s scheduled items to reminders?')) return;
    try{
      // remove study plan for this exam
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      if (state[examId]){ delete state[examId]; localStorage.setItem('zen_study_plans', JSON.stringify(state)); }

      // move any zen_scheduler items whose id matches this exam into notifications
      try{
        const list = JSON.parse(localStorage.getItem('zen_scheduler')||'[]');
        const taken = list.filter(x => (String(x.id).startsWith(`plan-${examId}`) || String(x.id).includes(`plan-${examId}-`)));
        const remaining = list.filter(x => !taken.includes(x));
        if (taken.length){
          const nextNotifs = taken.map(i=>({ id: `notif-${Date.now()}-${Math.random()}`, title: i.title || i.notes || 'Study session', date: i.start || i.date || null, meta: { source: `exam-${examId}` } }));
          const merged = [...nextNotifs, ...notifications];
          localStorage.setItem('zen_notifications', JSON.stringify(merged));
          setNotifications(merged);
        }
        localStorage.setItem('zen_scheduler', JSON.stringify(remaining));
      }catch(e){/*ignore*/}

      window.dispatchEvent(new Event('zen_study_plans_updated'));
      window.dispatchEvent(new Event('zen_scheduler_updated'));
      setItems(loadSchedules());
    }catch(e){ console.warn('removeExamSchedules failed', e); }
  }

  function addExam(e){
    e.preventDefault();
    if (!form.title || !form.date) return;
    // normalize date input (accept dd-mm-yyyy or yyyy-mm-dd)
    const parsed = parseDateString(form.date);
    if (!parsed) { alert('Invalid date. Please use dd-mm-yyyy or a valid date.'); return; }
    const dateISO = parsed.toISOString().slice(0,10);
    const ex = { id: Date.now()+Math.random(), title: form.title, subject: form.subject, date: dateISO, subjects: subjectsInput };
    const next = [ex, ...exams];
    setExams(next);
    localStorage.setItem('zen_exams', JSON.stringify(next));
    setForm({ title:'', date:'', subject:'' });
    setSubjectsInput([]);
  }

  // File upload -> extract dates and auto-create exam + plan
  function parseDateString(s){
    if (!s) return null;
    // Try native parse first
    const t = Date.parse(s);
    if (!isNaN(t)) return new Date(t);

    // dd/mm/yyyy or dd-mm-yyyy
    let m = s.match(/(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/);
    if (m){
      const parts = m[0].split(/[\/\-]/).map(p=>Number(p));
      if (parts[2] < 100) parts[2] += 2000;
      // assume day/month/year if day > 12 or if culture preference
      const day = parts[0], mon = parts[1], year = parts[2];
      return new Date(year, mon-1, day);
    }

    // Month name formats: October 20, 2025 or Oct 20 2025
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
    // ISO dates
    const iso = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
    for (const d of iso) candidates.push(d);
    // slashed dates
    const sl = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g) || [];
    for (const d of sl) candidates.push(d);
    // month name dates
    const mn = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\.,-]{1,2}\d{1,2}(?:,?\s+\d{4})?/gi) || [];
    for (const d of mn) candidates.push(d);

    const dates = candidates.map(c => parseDateString(c)).filter(Boolean);
    return dates;
  }

  async function handleFileUpload(file){
    setFileStatus('Reading file...');
    try{
      const text = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onerror = () => rej(new Error('Failed to read file'));
        reader.onload = () => res(reader.result);
        reader.readAsText(file);
      });

      const found = extractDatesFromText(String(text));
      const now = new Date();
      const future = found.filter(d => d && d.getTime() >= (now.getTime() - 24*60*60*1000));
      if (future.length === 0){
        setFileStatus('No future exam date found in file. Please add date manually.');
        return;
      }
      // choose earliest upcoming date
      future.sort((a,b)=>a-b);
      const chosen = future[0];

      const exam = {
        id: Date.now()+Math.random(),
        title: file.name.replace(/\.[^.]+$/, '') || 'Uploaded exam',
        subject: '',
        date: chosen.toISOString().slice(0,10),
        files: [{ filename: file.name }]
      };

      const next = [exam, ...exams];
      setExams(next);
      localStorage.setItem('zen_exams', JSON.stringify(next));
      setFileStatus(`Found exam date ${chosen.toLocaleDateString()} — exam added and study plan generating...`);

      // trigger plan generation with default opts
      // small delay to ensure state persisted
      setTimeout(()=>{
        confirmGenerate(exam, { sessionsPerDay:2, durationMinutes:60, days:14 });
      }, 250);

    } catch (err){
      console.error('file upload error', err);
      setFileStatus('Failed to process file. Try a plain text file.');
    }
  }

  function daysLeftFor(dateStr){
    try{
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = d.setHours(0,0,0,0) - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const days = Math.ceil(diffMs / (1000*60*60*24));
      return days;
    } catch(e){ return null; }
  }

  // Study plan generation
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [showPlanFor, setShowPlanFor] = useState(null);
  const [initialPlanView, setInitialPlanView] = useState(null);

  useEffect(()=>{
    let mounted = true;
    API.get('/assignments').then(res => {
      if (!mounted) return;
      setAssignmentsList(res.data.assignments || []);
    }).catch(()=>{});
    return ()=> mounted = false;
  },[]);

  function loadStudyPlans(){
    try{ return JSON.parse(localStorage.getItem('zen_study_plans')||'{}'); }catch(e){return {};}
  }

  function saveStudyPlan(examId, plan){
    const state = loadStudyPlans();
    state[examId] = plan;
    localStorage.setItem('zen_study_plans', JSON.stringify(state));
  }

  function buildStudyPlan(exam, options={sessionsPerDay:2,durationMinutes:60,days:14}){
    const examDate = new Date(exam.date);
    const days = options.days || 14;
    const sessionsPerDay = options.sessionsPerDay || 2;
    const duration = options.durationMinutes || 60;
    const start = new Date(examDate);
    start.setDate(start.getDate() - days);

    // if exam.subjects provided (array of {name,difficulty}), build subject-wise daily primary plan
    const subs = (exam.subjects || []).map(s => ({ name: s.name, difficulty: (s.difficulty||'medium').toLowerCase() }));
    if (subs && subs.length > 0){
      // categorize
      const hard = subs.filter(s=>s.difficulty === 'hard');
      const medium = subs.filter(s=>s.difficulty === 'medium');
      const easy = subs.filter(s=>s.difficulty === 'easy');

      const nHard = Math.ceil(days * 0.55);
      const nMedium = Math.ceil(days * 0.3);
      const nEasy = Math.max(0, days - nHard - nMedium);

      const daySubjects = [];
      // helper to fill from list cycling
      function fill(targetCount, list){
        if (list.length === 0) return;
        let idx = 0;
        for (let i = 0; i < targetCount; i++){
          daySubjects.push(list[idx % list.length]);
          idx++;
        }
      }
      fill(nHard, hard.length? hard : medium.length? medium : easy);
      fill(nMedium, medium.length? medium : hard.length? hard : easy);
      fill(nEasy, easy.length? easy : medium.length? medium : hard);

      // if still fewer than days, repeat cycle across all subjects
      while (daySubjects.length < days){
        for (const s of subs){
          if (daySubjects.length >= days) break;
          daySubjects.push(s);
        }
      }

      const schedule = [];
      for (let d = 0; d < days; d++){
        const subj = daySubjects[d];
        const dt = new Date(start);
        dt.setDate(dt.getDate() + d);
        // primary session at 18:00
        const st = new Date(dt);
        st.setHours(18,0,0,0);
        const en = new Date(st.getTime() + duration * 60000);
        schedule.push({ id: `plan-${exam.id}-${d}`, day: d+1, date: st.toISOString().slice(0,10), title: subj.name, difficulty: subj.difficulty, start: st.toISOString(), end: en.toISOString(), notes: `Primary focus: ${subj.name}` });
      }
      return schedule;
    }

    // fallback: previous topic-based generation
  const topics = [];
  if (exam.title) topics.push(exam.title);
  if (exam.subject) topics.push(exam.subject);
    for (const a of assignmentsList.slice(0,10)){
      if (a.title) topics.push(a.title);
      if (a.files) for (const f of (a.files||[])) if (f.filename) topics.push(f.filename);
    }
    if (exam.files) for (const f of (exam.files||[])) if (f.filename) topics.push(f.filename);
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
        const end = new Date(dt.getTime() + duration * 60000);
        const topic = topics[topicIdx % topics.length];
        schedule.push({ id: `plan-${exam.id}-${d}-${s}`, title: `Study: ${topic}`, start: dt.toISOString(), end: end.toISOString(), notes: `Focus: ${topic}` });
        topicIdx++;
      }
    }
    return schedule;
  }

  function handleGeneratePlan(exam){
    // Directly generate with sensible defaults when user clicks Generate Plan
    setGeneratingFor(exam.id);
    confirmGenerate(exam, { sessionsPerDay:2, durationMinutes:60, days:14 });
  }

  function confirmGenerate(exam, opts){
    const plan = buildStudyPlan(exam, opts);
    // append plan items into scheduler
    const nextItems = [...plan, ...items];
    setItems(nextItems);
    localStorage.setItem('zen_scheduler', JSON.stringify(nextItems));
    // save plan record
    saveStudyPlan(exam.id, { generatedAt: new Date().toISOString(), exam, plan, opts });
  // notify other parts of the app and ensure PlanViewer reloads
  try{ window.dispatchEvent(new Event('zen_study_plans_updated')); }catch(e){}
  // request PlanViewer to open in studyTable (14-day table) for this exam
  setInitialPlanView({ examId: exam.id, view: 'studyTable' });
    // mark exam as having a plan
    const nextExams = exams.map(e => e.id === exam.id ? {...e, planGenerated: true} : e);
    setExams(nextExams);
    localStorage.setItem('zen_exams', JSON.stringify(nextExams));
    setGeneratingFor(null);
    setShowPlanFor(exam.id);
  }

  function handleViewPlan(exam){
    setShowPlanFor(showPlanFor === exam.id ? null : exam.id);
  }

  return (
    <div className="page container">
      {/* Notifications / reminders panel (top-right) */}
      <div style={{position:'fixed',right:16,top:16,zIndex:1200,maxWidth:360}}>
        {notifications.length > 0 && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <strong>Notifications</strong>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-outline-secondary" onClick={clearAllNotifications}>Clear all</button>
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {notifications.map(n=> (
                <div key={n.id} className="card p-2" style={{background:'#fff',boxShadow:'0 6px 18px rgba(0,0,0,0.06)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600}}>{n.title}</div>
                      {n.date && <div style={{fontSize:12,color:'#666'}}>{new Date(n.date).toLocaleString()}</div>}
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <button className="btn btn-sm btn-outline-primary" onClick={()=>{ alert('Reminder sent: '+ (n.title||'Reminder')); }}>Send</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>dismissNotification(n.id)}>Dismiss</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <h2>Scheduler</h2>
      <p className="lead">Your personal study scheduler helps you plan study blocks and reminders.</p>

      <div className="card p-3 mb-3" style={{maxWidth:720}}>
        <h4 style={{marginBottom:8}}>Add personal exam</h4>
        <form onSubmit={addExam} style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input className="form-control" placeholder="Exam title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} style={{minWidth:160}} />
          <input className="form-control" type="text" placeholder="dd-mm-yyyy" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{width:160}} />
          <input className="form-control" placeholder="Primary subject" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} style={{minWidth:160}} />
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            <input className="form-control" placeholder="Add subject e.g. Math" id="sub-name" style={{width:160}} />
            <select id="sub-difficulty" className="form-control" style={{width:120}}>
              <option value="hard">Hard</option>
              <option value="medium">Medium</option>
              <option value="easy">Easy</option>
            </select>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={()=>{
              const nameEl = document.getElementById('sub-name');
              const diffEl = document.getElementById('sub-difficulty');
              if (!nameEl || !diffEl) return;
              const name = nameEl.value && nameEl.value.trim();
              const difficulty = diffEl.value;
              if (!name) return;
              setSubjectsInput(s => [...s, { name, difficulty }]);
              nameEl.value = '';
            }}>Add Subject</button>
          </div>
          <div style={{width:'100%'}}>
            {subjectsInput.length > 0 && (
              <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                {subjectsInput.map((s,idx)=> {
                  const bg = s.difficulty === 'hard' ? '#fee2e2' : s.difficulty === 'medium' ? '#fef3c7' : '#dcfce7';
                  const border = s.difficulty === 'hard' ? '#fca5a5' : s.difficulty === 'medium' ? '#f59e0b' : '#34d399';
                  const diffColor = s.difficulty === 'hard' ? '#b91c1c' : s.difficulty === 'medium' ? '#92400e' : '#065f46';
                  return (
                    <div key={idx} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 10px',background:bg,border:`1px solid ${border}`,borderRadius:8,color:'#061b22',fontWeight:600}}>
                      <div style={{fontSize:14}}>{s.name}</div>
                      <div style={{fontSize:12,padding:'2px 6px',borderRadius:999,background:diffColor,color:'#fff',fontWeight:700}}>{s.difficulty}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <input className="form-control" type="file" onChange={ev=>{
            const f = ev.target.files && ev.target.files[0];
            if (f) handleFileUpload(f);
            // clear the input so same file can be re-uploaded if needed
            ev.target.value = null;
          }} style={{width:200}} />
          <button className="btn btn-primary" type="submit">Add Exam</button>
          {fileStatus && <div style={{width:'100%',marginTop:8,fontSize:13,color:'#444'}}>{fileStatus}</div>}
        </form>
        <div style={{fontSize:13,color:'#666',marginTop:8}}>Exams added here are personal and only stored in your browser. Teachers should still create official exams in the classroom.</div>
      </div>

      <div className="row">
        <div className="col">
          {/* Exams moved into main view for easier access */}
          <h4 style={{marginBottom:8}}>Your Exams</h4>
          {exams.length === 0 ? (
            <div className="card p-2 muted">No personal exams yet. Add one using the form above.</div>
          ) : (
            <div className="list-group mb-3">
              {exams.map(ex => (
                <div key={ex.id} className="card mb-1 p-2" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:600}}>{ex.title}</div>
                    <div style={{fontSize:13,color:'#666'}}>{ex.subject} • {new Date(ex.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-sm btn-outline-primary" onClick={()=>handleViewPlan(ex)}>{showPlanFor===ex.id? 'Hide Plan' : 'View Plan'}</button>
                    <button className="btn btn-sm btn-primary" onClick={()=>handleGeneratePlan(ex)}>Generate Plan</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>removeExam(ex.id)}>Delete</button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={()=>removeExamSchedules(ex.id)}>Remove exam's schedule</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Render plan viewer for the selected exam */}
          {showPlanFor && (
            <div style={{marginTop:16}}>
              <PlanViewer examId={showPlanFor} initialView={(initialPlanView && initialPlanView.examId===showPlanFor) ? initialPlanView.view : undefined} />
            </div>
          )}

          {/* Scheduled items removed from main view as requested */}
        </div>
      </div>
    </div>
  );
}

// Small component to display a saved plan for an exam
function PlanViewer({ examId, initialView }){
  const [plan, setPlan] = useState([]);
  const [viewMode, setViewMode] = useState(initialView || 'list'); // 'list' | 'calendar' | 'table' | 'studyTable'
  const [reminders, setReminders] = useState(() => {
    try{ return JSON.parse(localStorage.getItem('zen_reminders')||'{}')[examId] || {}; }catch(e){return {};}
  });

  // register in-session timers for reminders
  useEffect(()=>{
    let timers = [];
    if (Notification && Notification.permission !== 'granted') {
      // do not request immediately; request when user clicks set reminder
    }
    try{
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      const p = state[examId];
      const items = (p && p.plan) || [];
      for (const it of items){
        const r = reminders[it.id];
        if (r && r.enabled){
          const start = new Date(it.start).getTime();
          const now = Date.now();
          const ms = start - now - (r.offsetMinutes||0)*60000;
          if (ms > 0 && ms < 1000*60*60*24*14){ // schedule only for next 2 weeks
            const t = setTimeout(()=>{
              try{ if (Notification && Notification.permission === 'granted') new Notification('ZenAura Reminder', { body: it.title + ' at ' + new Date(it.start).toLocaleString() }); }
              catch(e){ console.warn('Notification failed', e); }
            }, ms);
            timers.push(t);
          }
        }
      }
    }catch(e){/*ignore*/}
    return ()=> timers.forEach(t=>clearTimeout(t));
  }, [examId, reminders]);
  useEffect(()=>{
    try{
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      const p = state[examId];
      setPlan((p && p.plan) || []);
    } catch(e){ setPlan([]); }
  },[examId]);

  // reload plan when other parts update study plans
  useEffect(()=>{
    function onUpdated(){
      try{
        const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
        const p = state[examId];
        setPlan((p && p.plan) || []);
      }catch(e){ }
    }
    window.addEventListener('zen_study_plans_updated', onUpdated);
    return ()=> window.removeEventListener('zen_study_plans_updated', onUpdated);
  },[examId]);

  // respond to initialView changes (open in requested view)
  useEffect(()=>{
    if (initialView) setViewMode(initialView);
  },[initialView]);

  if (!plan || plan.length === 0) return <div className="muted">No study plan found.</div>;

  function savePlanLocal(updated){
    try{
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      state[examId] = updated;
      localStorage.setItem('zen_study_plans', JSON.stringify(state));
      setPlan(updated.plan || []);
    }catch(e){ console.warn('Failed to save plan', e); }
  }

  function toggleComplete(itemId){
    try{
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      const p = state[examId];
      if (!p || !p.plan) return;
      const planCopy = {...p, plan: p.plan.map(it => it.id === itemId ? {...it, completed: !it.completed, completedAt: (!it.completed? new Date().toISOString() : undefined)} : it)};
      savePlanLocal(planCopy);
    }catch(e){ console.warn(e); }
  }

  function deleteSession(itemId){
    try{
      // remove from study plans
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      let changed = false;
      for (const k of Object.keys(state)){
        const p = state[k];
        if (p && Array.isArray(p.plan)){
          const before = p.plan.length;
          p.plan = p.plan.filter(x => x.id !== itemId);
          // recompute topics from remaining plan items
          try{
            const topics = Array.from(new Set((p.plan||[]).map(it => (String(it.title||'').replace(/^Study:\s*/i, '').replace(/^Focus:\s*/i, '')))));
            p.metadata = p.metadata || {};
            p.metadata.topics = topics;
          }catch(e){}
          if (p.plan.length !== before){ state[k] = p; changed = true; }
        }
      }
      if (changed) localStorage.setItem('zen_study_plans', JSON.stringify(state));

      // instead of immediate delete, convert to a notification (reminder)
      try{
        const list = JSON.parse(localStorage.getItem('zen_scheduler')||'[]');
        const found = list.find(x=> x.id === itemId);
        if (found){
          const notif = { id: `notif-${Date.now()}-${Math.random()}`, title: found.title || found.notes || 'Study session', date: found.start || found.date || null, meta: { source: 'single-session' } };
          const merged = [notif, ...notifications];
          localStorage.setItem('zen_notifications', JSON.stringify(merged));
          setNotifications(merged);
        }
        const next = list.filter(x=> x.id !== itemId);
        localStorage.setItem('zen_scheduler', JSON.stringify(next));
      }catch(e){}

      // update local plan state for this viewer
      const stateNow = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      const my = stateNow[examId];
      setPlan((my && my.plan) || []);
      // notify parent and other parts of the app in the same window
      window.dispatchEvent(new Event('zen_study_plans_updated'));
      window.dispatchEvent(new Event('zen_scheduler_updated'));
    }catch(e){ console.warn('deleteSession failed', e); }
  }

  function regenerateLocal(){
    // find exam metadata stored with plan
    try{
      const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
      const p = state[examId];
      if (!p || !p.exam) return;
      const newPlan = buildStudyPlan(p.exam, p.opts || { sessionsPerDay:2, durationMinutes:60, days:14 });
      const wrapped = { generatedAt: new Date().toISOString(), exam: p.exam, plan: newPlan, opts: p.opts };
      savePlanLocal(wrapped);
    }catch(e){ console.warn('Regenerate failed', e); }
  }

  function setReminderFor(itemId, enabled, offsetMinutes=0){
    try{
      const all = JSON.parse(localStorage.getItem('zen_reminders')||'{}');
      all[examId] = all[examId] || {};
      all[examId][itemId] = { enabled: !!enabled, offsetMinutes: Number(offsetMinutes) || 0 };
      localStorage.setItem('zen_reminders', JSON.stringify(all));
      setReminders(all[examId]);
      if (enabled && Notification && Notification.permission !== 'granted'){
        Notification.requestPermission().then(p=>{
          if (p === 'granted') console.log('Notifications enabled');
        });
      }
    }catch(e){ console.warn(e); }
  }

  // notification actions
  function dismissNotification(id){
    try{
      const all = JSON.parse(localStorage.getItem('zen_notifications')||'[]');
      const next = all.filter(n=> n.id !== id);
      localStorage.setItem('zen_notifications', JSON.stringify(next));
      setNotifications(next);
    }catch(e){ console.warn(e); }
  }

  function clearAllNotifications(){
    if (!confirm('Clear all notifications?')) return;
    try{ localStorage.removeItem('zen_notifications'); setNotifications([]); }catch(e){}
  }

  // render
  if (viewMode === 'calendar'){
    // group by date
    const grouped = plan.reduce((acc,it)=>{
      const d = new Date(it.start).toLocaleDateString();
      acc[d] = acc[d] || [];
      acc[d].push(it);
      return acc;
    }, {});
    return (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setViewMode('list')}>Switch to list</button>
          <button className="btn btn-sm btn-outline-primary" onClick={regenerateLocal}>Regenerate</button>
        </div>
        {Object.keys(grouped).map(date => (
          <div key={date} className="card mb-2 p-2">
            <div style={{fontWeight:700}}>{date}</div>
            {grouped[date].map(it=> (
              <div key={it.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:6}}>
                <div>
                  <div style={{fontWeight:600}}>{it.title} {it.completed && <span style={{color:'#0b5'}}>✓</span>}</div>
                  <div style={{fontSize:13,color:'#666'}}>{new Date(it.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — {new Date(it.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input type="checkbox" checked={!!it.completed} onChange={()=>toggleComplete(it.id)} />
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=>setReminderFor(it.id, true, 10)}>Remind 10m</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>{ if (confirm('Delete this session?')) deleteSession(it.id); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

    if (viewMode === 'table'){
      return <ScheduleTable plan={plan} />;
    }

    if (viewMode === 'studyTable'){
      try{
        const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}');
        const p = state[examId];
        const exam = (p && p.exam) || null;
        return <StudyTableView plan={plan} exam={exam} />;
      }catch(e){ return <StudyTableView plan={plan} exam={null} />; }
    }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setViewMode('calendar')}>Calendar view</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setViewMode('table')}>Table view</button>
          <button className="btn btn-sm btn-outline-secondary" onClick={()=>setViewMode('studyTable')}>Study table</button>
          <button className="btn btn-sm btn-outline-primary" onClick={regenerateLocal}>Regenerate</button>
        </div>
        <div style={{fontSize:13,color:'#666'}}>Total sessions: {plan.length}</div>
      </div>

      {plan.slice(0,200).map(it => (
        <div key={it.id} className="card mb-1 p-2">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div style={{fontWeight:600}}>{it.title} {it.completed && <span style={{color:'#0b5'}}>✓</span>}</div>
              <div style={{fontSize:13,color:'#666'}}>{new Date(it.start).toLocaleString()} — {new Date(it.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
              {it.notes && <div style={{marginTop:6}}>{it.notes}</div>}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
              <div>
                <input type="checkbox" checked={!!it.completed} onChange={()=>toggleComplete(it.id)} /> <span style={{fontSize:13}}>Done</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>setReminderFor(it.id, true, 10)}>Remind 10m</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>setReminderFor(it.id, true, 30)}>Remind 30m</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>{ if (confirm('Delete this session?')) deleteSession(it.id); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Specialized study table view: Day number | Date | Primary subject (color-coded) | Notes
function StudyTableView({ plan, exam }){
  // if plan items are daily (id includes '-0' pattern), group by date
  const days = plan.slice(0, 100).map((it, idx) => ({
    dayNum: it.day || (idx+1),
    date: it.date || (new Date(it.start).toISOString().slice(0,10)),
    subject: it.title || it.notes || 'Study',
    difficulty: it.difficulty || 'medium',
    notes: it.notes || ''
  }));

  // determine final prep day and exam day
  const examDate = exam && exam.date ? new Date(exam.date) : null;
  const finalPrep = examDate ? new Date(examDate) : null;
  if (finalPrep) finalPrep.setDate(finalPrep.getDate() - 1);

  function colorDot(diff){
    if (diff === 'hard') return <span style={{color:'#dc2626',fontWeight:700}}>🔴</span>;
    if (diff === 'medium') return <span style={{color:'#d97706',fontWeight:700}}>🟡</span>;
    return <span style={{color:'#16a34a',fontWeight:700}}>🟢</span>;
  }

  function downloadCSV(){
    const rows = [['Day','Date','Subject','Difficulty','Notes']];
    for (const d of days){ rows.push([d.dayNum, d.date, d.subject, d.difficulty, d.notes]); }
    const csv = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'study-plan.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <h5 style={{margin:0}}>Generated 14-day Study Plan</h5>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-sm btn-outline-secondary" onClick={downloadCSV}>Download CSV</button>
        </div>
      </div>

      <table className="table table-striped table-sm">
        <thead>
          <tr>
            <th>Day</th>
            <th>Date</th>
            <th>Primary Subject</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {days.map(d => {
            const isFinalPrep = finalPrep && (new Date(d.date).toDateString() === finalPrep.toDateString());
            const isExam = examDate && (new Date(d.date).toDateString() === examDate.toDateString());
            return (
              <tr key={d.dayNum} style={{background: isExam? '#fde68a' : isFinalPrep? '#fee2e2' : undefined}}>
                <td style={{fontWeight:700}}>{d.dayNum}</td>
                <td>{new Date(d.date).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</td>
                <td>{colorDot(d.difficulty)} <span style={{marginLeft:8,fontWeight:600}}>{d.subject}</span></td>
                <td>{d.notes}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// helper to render a 2-week table view: dates as columns, times as rows
function ScheduleTable({ plan }){
  // determine unique dates (in order) for up to 14 days from earliest plan item
  const dates = [];
  const byDate = {};
  const sorted = [...plan].sort((a,b)=>new Date(a.start) - new Date(b.start));
  for (const it of sorted){
    const d = new Date(it.start);
    const key = d.toISOString().slice(0,10);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(it);
    if (!dates.includes(key)) dates.push(key);
  }
  // limit to 14 days from first date
  const limitedDates = dates.slice(0,14);

  // gather unique start times (HH:MM) across limited dates
  const timesSet = new Set();
  for (const d of limitedDates){
    for (const it of (byDate[d] || [])){
      const t = new Date(it.start).toTimeString().slice(0,5);
      timesSet.add(t);
    }
  }
  const times = Array.from(timesSet).sort();

  return (
    <div style={{overflowX:'auto'}}>
      <table className="table table-sm" style={{minWidth:800}}>
        <thead>
          <tr>
            <th style={{width:140}}>Time \ Date</th>
            {limitedDates.map(d => (
              <th key={d} style={{minWidth:120}}>{new Date(d).toLocaleDateString(undefined, {weekday:'short', month:'short', day:'numeric'})}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map(time => (
            <tr key={time}>
              <td style={{fontWeight:600}}>{time}</td>
              {limitedDates.map(d => (
                <td key={d} style={{verticalAlign:'top'}}>
                  {(byDate[d] || []).filter(it=> new Date(it.start).toTimeString().slice(0,5) === time).map(it => (
                    <div key={it.id} className="card p-2 mb-1" style={{borderRadius:6}}>
                      <div style={{fontWeight:600}}>{it.title} {it.completed && <span style={{color:'#0b5'}}>✓</span>}</div>
                      <div style={{fontSize:12,color:'#666'}}>{new Date(it.start).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} — {new Date(it.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
                      <div style={{marginTop:6,display:'flex',gap:6,justifyContent:'flex-end'}}>
                        <button className="btn btn-sm btn-outline-secondary" onClick={()=>{
                          // toggle complete in localStorage
                          try{ const state = JSON.parse(localStorage.getItem('zen_study_plans')||'{}'); const p = state[Object.keys(state).find(k=> (state[k] && state[k].plan && state[k].plan.find(x=>x.id===it.id)))]; if(p){ p.plan = p.plan.map(x=> x.id===it.id? {...x, completed: !x.completed, completedAt: (!x.completed? new Date().toISOString(): undefined)} : x); localStorage.setItem('zen_study_plans', JSON.stringify(state)); window.dispatchEvent(new Event('storage')); } }catch(e){console.warn(e);} 
                        }}>Done</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={()=>{ try{ const all = JSON.parse(localStorage.getItem('zen_reminders')||'{}'); const examKey = Object.keys(JSON.parse(localStorage.getItem('zen_study_plans')||'{}')).find(k=> (JSON.parse(localStorage.getItem('zen_study_plans')||'{}')[k].plan.find(x=>x.id===it.id))); all[examKey] = all[examKey]||{}; all[examKey][it.id] = { enabled:true, offsetMinutes:10 }; localStorage.setItem('zen_reminders', JSON.stringify(all)); window.dispatchEvent(new Event('storage')); alert('Reminder set (in-session)'); }catch(e){console.warn(e);} }}>Remind</button>
                      </div>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
          {times.length === 0 && (
            <tr><td colSpan={1+limitedDates.length} className="muted">No timed sessions to show in table view.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
