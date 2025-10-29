import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiUsers, FiFileText, FiCalendar, FiClipboard, FiArrowUpRight, FiUpload, FiBell, FiCheckSquare } from 'react-icons/fi';

export default function TeacherDashboard(){
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  useEffect(()=>{
    let mounted = true;
    async function load(){
      try{
        const [cRes, aRes] = await Promise.all([
          API.get('/teacher/classrooms'),
          API.get('/teacher/assignments')
        ]);
        if (!mounted) return;
        setClassrooms(cRes.data.classrooms || []);
        setAssignments(aRes.data.assignments || []);
        // fetch recent activity for up to first 5 classrooms in parallel
        try{
          const cls = cRes.data.classrooms || [];
          const fetches = cls.slice(0,5).map(c => API.get(`/teacher/classrooms/${c._id || c.id}/activity?limit=8`).catch(()=>({data:{activity:[]}})));
          const results = await Promise.all(fetches);
          const flat = results.flatMap(r => r.data.activity || []);
          // sort by date desc and limit
          flat.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
          setRecentActivity(flat.slice(0,12));
        }catch(e){ /* ignore */ }
      }catch(e){
        console.warn('Failed to load teacher data', e?.message||e);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return ()=> mounted = false;
  },[]);

  function classroomAssignmentsCount(id){
    return assignments.filter(a => String(a.classroom?._id || a.classroom) === String(id)).length;
  }

  function classroomNextUnlock(id){
    const now = new Date();
    const items = assignments.filter(a => String(a.classroom?._id || a.classroom) === String(id));
    const future = items.map(i => i.unlockAt ? new Date(i.unlockAt) : (i.dueAt ? new Date(i.dueAt) : null)).filter(Boolean).filter(d => d >= now);
    if (!future.length) return null;
    future.sort((a,b)=>a-b);
    return future[0];
  }

  async function createClassroom(e){
    e.preventDefault();
    if (!newName) return;
    try{
      const res = await API.post('/teacher/classrooms', { name: newName });
      setClassrooms(prev => [res.data.classroom, ...prev]);
      setNewName('');
      setShowCreate(false);
    } catch(err){
      console.error('Create failed', err?.response?.data || err.message || err);
      alert('Failed to create classroom');
    }
  }

  function copyToClipboard(text){
    try{ navigator.clipboard.writeText(text); }catch(e){ /* ignore */ }
  }

  if (loading) return <div>Loading...</div>;

  const totalStudents = classrooms.reduce((acc,c)=> acc + (c.students? c.students.length : 0), 0);
  const pendingAssignments = assignments.filter(a => !a.unlocked && a.dueAt && new Date(a.dueAt) > new Date()).length;
  const upcomingDeadlines = assignments.filter(a => a.dueAt && (new Date(a.dueAt) - new Date()) <= 7*24*60*60*1000 && (new Date(a.dueAt) - new Date()) >=0).length;

  return (
    <div className="page container">
      <h2>Teacher Dashboard</h2>
      <p className="lead">Overview of your classrooms and recent activity.</p>

      <div className="big-icon-grid">
        <div className="big-tile" onClick={()=>navigate('/teacher/classrooms')}>
          <div className="tile-icon"><FiUsers size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">My Classrooms</div>
            <div className="tile-sub">Manage students, assignments and resources</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/teacher/assignments')}>
          <div className="tile-icon"><FiFileText size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Assignments</div>
            <div className="tile-sub">Create, review and grade assignments</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/teacher/analytics')}>
          <div className="tile-icon"><FiCalendar size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Analytics</div>
            <div className="tile-sub">View class performance and trends</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/teacher/profile')}>
          <div className="tile-icon"><FiClipboard size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Profile</div>
            <div className="tile-sub">View profile and manage students</div>
          </div>
        </div>
      </div>

      <div className="metric-grid mb-4">
        <div className="metric-card metric-primary clickable" onClick={()=>navigate('/teacher/classrooms')}>
          <div className="icon"><FiHome size={20} /></div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.9}}>🏫 Total Classrooms</div>
            <div style={{fontSize:20,fontWeight:700}}>{classrooms.length} <span style={{fontSize:12,fontWeight:400,opacity:0.9}}>Active</span></div>
          </div>
        </div>
        <div className="metric-card metric-accent clickable" onClick={()=>navigate('/teacher/classrooms')}>
          <div className="icon"><FiUsers size={20} /></div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.9}}>👩‍🎓 Total Students</div>
            <div style={{fontSize:20,fontWeight:700}}>{totalStudents} <span style={{fontSize:12,fontWeight:400,opacity:0.9}}>Students</span></div>
          </div>
        </div>
        <div className="metric-card metric-olive clickable" onClick={()=>navigate('/teacher/assignments')}>
          <div className="icon"><FiFileText size={20} /></div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.9}}>📄 Pending Assignments</div>
            <div style={{fontSize:20,fontWeight:700}}>{pendingAssignments} <span style={{fontSize:12,fontWeight:400,opacity:0.9}}>To Review</span></div>
          </div>
        </div>
        <div className="metric-card metric-warning clickable" onClick={()=>navigate('/teacher/assignments')}>
          <div className="icon"><FiCalendar size={20} /></div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.9}}>📅 Upcoming Deadlines</div>
            <div style={{fontSize:20,fontWeight:700}}>{upcomingDeadlines} <span style={{fontSize:12,fontWeight:400,opacity:0.9}}>This Week</span></div>
          </div>
        </div>
      </div>

      <div className="card p-3 mb-4">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h4 style={{margin:0}}>Active Classrooms</h4>
          <div>
            <button className="btn btn-outline-primary me-2" onClick={()=>setShowCreate(true)}>➕ Create New Classroom</button>
          </div>
        </div>

        <div className="row mt-3">
          {classrooms.length === 0 ? (
            <div className="col-12">You have not created any classrooms yet.</div>
          ) : classrooms.map(cls => (
            <div key={cls._id || cls.id} className="col-md-4 mb-3">
              <div className="classroom-card card p-3">
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div>
                    <h5>{cls.name}</h5>
                    <div className="small-muted">Code: <strong>{cls.code}</strong> <button className="btn btn-sm btn-link" onClick={()=>copyToClipboard(cls.code)}><FiClipboard /></button></div>
                    <div className="small-muted" style={{marginTop:8}}>{(cls.students||[]).length} students • {classroomAssignmentsCount(cls._id || cls.id)} assignments</div>
                    <div className="small-muted" style={{marginTop:6}}>Next Unlock: {(() => { const d = classroomNextUnlock(cls._id||cls.id); return d ? d.toLocaleDateString() : '—'; })()}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                    <button className="btn btn-primary" onClick={()=>navigate(`/teacher/classrooms/${cls._id||cls.id}`)}>View Classroom <FiArrowUpRight /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-3">
        <h4>Recent Activity</h4>
        <div className="recent-activity list-group mt-2">
          {(recentActivity.length ? recentActivity : assignments.slice(0,8)).slice(0,12).map(a => {
            let Icon = FiFileText;
            if ((a.type || '').toLowerCase().includes('submission') || a.type === 'submission') Icon = FiUpload;
            if ((a.type || '').toLowerCase().includes('unlocked') || (a.message||'').toLowerCase().includes('unlock')) Icon = FiBell;
            if ((a.type || '').toLowerCase().includes('graded') ) Icon = FiCheckSquare;
            return (
              <div key={a._id || a.id} className="list-group-item">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{display:'flex',gap:12,alignItems:'center'}}>
                    <div style={{width:44,height:44,display:'flex',alignItems:'center',justifyContent:'center',background:'#f1f7ff',borderRadius:8}}><Icon /></div>
                    <div>
                      <div style={{fontWeight:600}}>{a.type ? (a.type.replace(/\.|_/g,' ')) : (a.title || 'Activity')}</div>
                      <div style={{fontSize:13,color:'#666'}}>{a.message || (a.title ? `For ${a.classroom? a.classroom.name : ''}` : '')}</div>
                      <div style={{fontSize:12,color:'#999'}}>{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:'#666'}}>{a.user ? a.user.name : ''}</div>
                </div>
              </div>
            );
          })}
          {recentActivity.length === 0 && assignments.length === 0 && <div className="muted p-2">No recent activity</div>}
        </div>
      </div>

      {showCreate && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h5>Create New Classroom</h5>
              <form onSubmit={createClassroom}>
                <input className="form-control my-2" placeholder="Classroom name" value={newName} onChange={e=>setNewName(e.target.value)} />
                <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                  <button className="btn btn-outline-secondary" type="button" onClick={()=>setShowCreate(false)}>Cancel</button>
                  <button className="btn btn-primary" type="submit">Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
