import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function TeacherAssignments(){
  const [assignments, setAssignments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState({});
  const navigate = useNavigate();

  async function loadAll(){
    try{
      const [aRes, actRes] = await Promise.all([
        API.get('/teacher/assignments'),
        API.get('/teacher/activity?limit=12')
      ]);
      setAssignments(aRes.data.assignments || []);
      setRecentActivity(actRes.data.activity || []);
    }catch(e){ console.error('Failed to load assignments or activity', e); }
  }

  useEffect(()=>{
    let mounted = true;
    async function load(){
      if (!mounted) return;
      setLoading(true);
      await loadAll();
      if (mounted) setLoading(false);
    }
    load();
    return ()=> mounted = false;
  },[]);

  async function runAutoEval(assignmentId){
    try{
      setRunning(r=>({...r,[assignmentId]:true}));
      await API.post(`/teacher/assignments/${assignmentId}/auto-evaluate`);
      // refresh lists
      await loadAll();
      alert('Auto-evaluation completed');
    }catch(e){ console.error('Auto-eval failed', e); alert('Auto-evaluation failed'); }
    finally{ setRunning(r=>({...r,[assignmentId]:false})); }
  }

  if (loading) return <div>Loading...</div>;

  const now = new Date();
  const pendingAssignments = assignments.filter(a => !a.unlocked && (!a.unlockAt || new Date(a.unlockAt) > now) && a.dueAt && new Date(a.dueAt) > now).length;
  const upcomingDeadlines = assignments.filter(a => a.dueAt && (new Date(a.dueAt) - now) <= 7*24*60*60*1000 && (new Date(a.dueAt) - now) >= 0).length;

  return (
    <div className="page container">
      <h3>Assignments</h3>
      <p>Manage assignments and view upcoming deadlines.</p>

      <div className="metric-grid mb-3">
        <div className="metric-card metric-olive">
          <div className="icon">📄</div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.85}}>Pending Assignments</div>
            <div style={{fontSize:20,fontWeight:700}}>{pendingAssignments}</div>
          </div>
        </div>
        <div className="metric-card metric-warning">
          <div className="icon">⏰</div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.85}}>Upcoming Deadlines</div>
            <div style={{fontSize:20,fontWeight:700}}>{upcomingDeadlines}</div>
          </div>
        </div>
      </div>

      <div className="card p-3 mb-3">
        <h4>Recent Activity</h4>
        <div className="list-group mt-2">
          {recentActivity.length === 0 && <div className="muted p-2">No recent activity.</div>}
          {recentActivity.slice(0,12).map(it => (
            <div key={it._id || it.id} className="list-group-item">
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontWeight:600}}>{it.type?.replace(/\.|_/g,' ') || 'Activity'}</div>
                  <div style={{fontSize:13,color:'#666'}}>{it.message}</div>
                  <div style={{fontSize:12,color:'#999'}}>{new Date(it.createdAt).toLocaleString()}</div>
                </div>
                <div style={{fontSize:13,color:'#666'}}>{it.user ? it.user.name : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <h4>Recent Assignments</h4>
        <div className="list-group mt-2 mb-3">
          {assignments.length === 0 && <div className="muted p-2">No assignments found.</div>}
          {assignments.slice().sort((x,y)=> new Date(y.createdAt || 0) - new Date(x.createdAt || 0)).slice(0,6).map(a => (
            <div key={a._id || a.id} className="list-group-item" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{a.title}</div>
                <div style={{fontSize:13,color:'#666'}}>{a.classroom ? (a.classroom.name || a.classroom) : ''} • Created: {a.createdAt ? new Date(a.createdAt).toLocaleString() : (a.dueAt ? new Date(a.dueAt).toLocaleString() : '—')}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-outline-primary" onClick={()=>navigate(`/teacher/classrooms/${a.classroom?._id||a.classroom}`)}>Open Class</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>runAutoEval(a._id || a.id)} disabled={!!running[a._id || a.id]}>{running[a._id || a.id] ? 'Running…' : 'Auto-evaluate'}</button>
              </div>
            </div>
          ))}
        </div>

        <h4>All Assignments</h4>
        <div className="list-group mt-2">
          {assignments.length === 0 && <div className="muted p-2">No assignments found.</div>}
          {assignments.map(a => (
            <div key={a._id || a.id} className="list-group-item" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600}}>{a.title}</div>
                <div style={{fontSize:13,color:'#666'}}>{a.classroom ? (a.classroom.name || a.classroom) : ''} • Due: {a.dueAt ? new Date(a.dueAt).toLocaleString() : '—'}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-sm btn-outline-primary" onClick={()=>navigate(`/teacher/classrooms/${a.classroom?._id||a.classroom}`)}>Open Class</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={()=>runAutoEval(a._id || a.id)} disabled={!!running[a._id || a.id]}>{running[a._id || a.id] ? 'Running…' : 'Auto-evaluate'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
