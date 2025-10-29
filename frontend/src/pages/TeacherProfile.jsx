import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../services/api';

export default function TeacherProfile(){
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStudent, setNewStudent] = useState({ name:'', email:'', createAccount:true });

  useEffect(()=>{
    let mounted = true;
    async function load(){
      try{
        const res = await API.get('/teacher/classrooms');
        if (!mounted) return;
        setClassrooms(res.data.classrooms || []);
        if ((res.data.classrooms || []).length) {
          setSelectedClass((res.data.classrooms || [])[0]);
        }
      }catch(e){ console.warn('Failed to load classrooms', e); }
      finally{ if (mounted) setLoading(false); }
    }
    load();
    return ()=> mounted = false;
  },[]);

  useEffect(()=>{
    let mounted = true;
    async function loadStudents(){
      if (!selectedClass) return setStudents([]);
      try{
        const res = await API.get(`/teacher/classrooms/${selectedClass._id || selectedClass.id}/students`);
        if (!mounted) return;
        setStudents(res.data.students || []);
      }catch(e){ console.warn('Failed to load students', e); }
    }
    loadStudents();
    return ()=> mounted = false;
  },[selectedClass]);

  async function addStudent(e){
    e.preventDefault();
    if (!selectedClass) return alert('Select a classroom');
    try{
      const res = await API.post(`/teacher/classrooms/${selectedClass._id || selectedClass.id}/students`, newStudent);
      setStudents(prev => [res.data.student, ...prev]);
      setNewStudent({ name:'', email:'', createAccount:true });
    }catch(err){ console.error('Add failed', err); alert('Failed to add student'); }
  }

  async function removeStudent(studentId){
    if (!selectedClass) return;
    if (!confirm('Remove this student from the classroom?')) return;
    try{
      await API.delete(`/teacher/classrooms/${selectedClass._id || selectedClass.id}/students/${studentId}`);
      setStudents(prev => prev.filter(s => String(s._id||s.id) !== String(studentId)));
    }catch(err){ console.error('Remove failed', err); alert('Failed to remove student'); }
  }

  function startEdit(s){
    setStudents(prev => prev.map(x => x._id === s._id ? ({...s, _editing:true}) : x));
  }

  function cancelEdit(s){
    setStudents(prev => prev.map(x => x._id === s._id ? ({...s, _editing:false}) : x));
  }

  async function saveEdit(s){
    try{
      const payload = { name: s.name, email: s.email };
      await API.put(`/teacher/classrooms/${selectedClass._id || selectedClass.id}/students/${s._id}` , payload);
      setStudents(prev => prev.map(x => x._id === s._id ? ({...x, ...payload, _editing:false}) : x));
    }catch(err){ console.error('Update failed', err); alert('Failed to update student'); }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page container">
      <h2>Profile</h2>
      <div className="card p-3 mb-3" style={{maxWidth:900}}>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <div style={{width:72,height:72,background:'#eef4ff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>👩‍🏫</div>
          <div>
            <div style={{fontSize:18,fontWeight:600}}>{user?.name || 'Teacher'}</div>
            <div style={{color:'#666'}}>{user?.email}</div>
            <div style={{marginTop:6,fontSize:13,color:'#666'}}>Role: {user?.role}</div>
          </div>
        </div>
      </div>

      <div className="card p-3" style={{maxWidth:900}}>
        <h4>Manage Students</h4>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:12}}>
          <label style={{fontSize:13,opacity:0.9}}>Classroom</label>
          <select value={selectedClass?._id || selectedClass?.id || ''} onChange={e=>{
            const id = e.target.value; const cls = classrooms.find(c=>String(c._id||c.id)===String(id)); setSelectedClass(cls);
          }}>
            {(classrooms||[]).map(c=> <option key={c._id||c.id} value={c._id||c.id}>{c.name} ({(c.students||[]).length})</option>)}
          </select>
        </div>

        <form onSubmit={addStudent} style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <input placeholder="Name" value={newStudent.name} onChange={e=>setNewStudent(s=>({...s,name:e.target.value}))} />
          <input placeholder="Email" value={newStudent.email} onChange={e=>setNewStudent(s=>({...s,email:e.target.value}))} />
          <label style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={newStudent.createAccount} onChange={e=>setNewStudent(s=>({...s,createAccount:e.target.checked}))} /> Create account</label>
          <button className="btn btn-primary" type="submit">Add Student</button>
        </form>

        <div>
          <h5 style={{marginTop:6}}>Students</h5>
          <div>
            {students.length === 0 && <div className="muted">No students in this classroom.</div>}
            {students.map(s => (
              <div key={s._id || s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                <div>
                  {s._editing ? (
                    <div style={{display:'flex',gap:8}}>
                      <input value={s.name} onChange={e=>setStudents(prev=>prev.map(x=>x._id===s._id?({...x,name:e.target.value}):x))} />
                      <input value={s.email} onChange={e=>setStudents(prev=>prev.map(x=>x._id===s._id?({...x,email:e.target.value}):x))} />
                    </div>
                  ) : (
                    <div><strong>{s.name}</strong> <div style={{fontSize:13,color:'#666'}}>{s.email}</div></div>
                  )}
                </div>
                <div style={{display:'flex',gap:8}}>
                  {s._editing ? (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={()=>saveEdit(s)}>Save</button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={()=>cancelEdit(s)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm btn-outline-primary" onClick={()=>startEdit(s)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={()=>removeStudent(s._id||s.id)}>Remove</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
