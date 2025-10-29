import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function TeacherClassrooms(){
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
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
        // backend already filters archived:false, but be defensive
        const active = (cRes.data.classrooms || []).filter(c => !c.archived);
        setClassrooms(active);
        setAssignments(aRes.data.assignments || []);
      }catch(err){
        console.error('Failed to load classrooms', err?.response?.data || err.message || err);
      } finally { if (mounted) setLoading(false); }
    }
    load();
    return ()=> mounted = false;
  },[]);

  async function toggleArchive(id, value){
    try{
      await API.patch(`/teacher/classrooms/${id}/archive`, { archived: value });
      setClassrooms(prev => prev.filter(c => String(c._id||c.id) !== String(id)));
    }catch(err){ console.error('Archive failed', err); alert('Failed to update classroom'); }
  }

  if (loading) return <div>Loading...</div>;
  const totalClassrooms = classrooms.length;
  const totalStudents = classrooms.reduce((acc, c) => acc + ((c.students && c.students.length) || 0), 0);
  const now = new Date();

  return (
    <div className="page container">
      <h3>My Classrooms</h3>
      <p>Active classrooms (archived classes are hidden).</p>

      <div className="metric-grid mb-3">
        <div className="metric-card metric-primary">
          <div className="icon">🏫</div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.85}}>Total Classrooms</div>
            <div style={{fontSize:20,fontWeight:700}}>{totalClassrooms}</div>
          </div>
        </div>
        <div className="metric-card metric-accent">
          <div className="icon">👩‍🎓</div>
          <div className="body">
            <div style={{fontSize:12,opacity:0.85}}>Total Students</div>
            <div style={{fontSize:20,fontWeight:700}}>{totalStudents}</div>
          </div>
        </div>
        {/* Pending assignments and upcoming deadlines moved to Assignments page */}
      </div>

      <div className="row">
        {classrooms.length === 0 && <div className="col-12">No active classrooms found.</div>}
        {classrooms.map(c => (
          <div key={c._id || c.id} className="col-md-4 mb-3">
            <div className="card p-3 classroom-card">
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>
                  <h5>{c.name}</h5>
                  <div className="small-muted">Code: <strong>{c.code}</strong></div>
                  <div className="small-muted">{(c.students||[]).length} students</div>
                  <div className="small-muted">Next Deadline: {(() => {
                    // find earliest due date for assignments in this classroom
                    const clsAssigns = assignments.filter(a => String(a.classroom?._id || a.classroom) === String(c._id || c.id) && a.dueAt && new Date(a.dueAt) >= now);
                    if (!clsAssigns.length) return '—';
                    clsAssigns.sort((x,y)=> new Date(x.dueAt) - new Date(y.dueAt));
                    return new Date(clsAssigns[0].dueAt).toLocaleDateString();
                  })()}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <button className="btn btn-sm btn-primary" onClick={()=>navigate(`/teacher/classrooms/${c._id||c.id}`)}>Open</button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={()=>toggleArchive(c._id||c.id, true)}>Archive</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
