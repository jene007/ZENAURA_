import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useParams, Link } from 'react-router-dom';

export default function TeacherClassroom(){
  const { id } = useParams();
  const [cls, setCls] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [tab, setTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', unlockAt: '', dueAt: '' });
  const [assignmentFiles, setAssignmentFiles] = useState([]);
  const [viewingSubmissions, setViewingSubmissions] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', createAccount: false });
  const [importing, setImporting] = useState(false);

  useEffect(()=>{
    let mounted = true;
    async function load(){
      try{
        const res = await API.get('/teacher/classrooms');
        const my = (res.data.classrooms || []).find(c => String(c._id) === String(id) || String(c.id) === String(id));
        if (!mounted) return;
        setCls(my || null);
        // fetch assignments for this classroom
        const aRes = await API.get('/teacher/assignments');
        const list = (aRes.data.assignments || []).filter(a => String(a.classroom?._id || a.classroom) === String(id));
        setAssignments(list);
        // fetch students via API (populated)
        try{
          const sRes = await API.get(`/teacher/classrooms/${id}/students`);
          setStudents(sRes.data.students || []);
        }catch(e){
          setStudents(my?.students || []);
        }
        // fetch announcements (if any)
        try{
          const clsRes = await API.get(`/classrooms/${id}`);
          if (clsRes.data.announcements) setAnnouncements(clsRes.data.announcements || []);
        }catch(e){}
      }catch(e){ console.warn('Failed to load classroom', e?.message||e); }
    }
    load();
    return ()=> mounted = false;
  },[id]);

  if (!cls) return <div className="page container">Classroom not found. <Link to="/teacher/classrooms">Back</Link></div>;

  return (
    <div className="page container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <h2>{cls.name}</h2>
          <div style={{color:'#666'}}>Code: {cls.code} • Created: {new Date(cls.createdAt).toLocaleDateString()}</div>
        </div>
        <div>
          <button className="btn btn-outline-secondary" onClick={() => setShowShare(true)}>Share Code</button>
        </div>

        {/* Share link modal */}
        {showShare && (
          <div className="modal-backdrop">
            <div className="modal-dialog">
              <div className="modal-content p-3">
                <h5>Share Join Link</h5>
                <div style={{marginTop:8}}>
                  <input className="form-control" readOnly value={(typeof window !== 'undefined' ? window.location.origin : '') + '/student/join?code=' + encodeURIComponent(cls.code)} onFocus={(e)=>e.target.select()} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                  <div>
                    {copiedLink && <span className="badge bg-success">Copied</span>}
                  </div>
                  <div>
                    <button className="btn btn-outline-secondary me-2" onClick={async ()=>{
                      const link = (typeof window !== 'undefined' ? window.location.origin : '') + '/student/join?code=' + encodeURIComponent(cls.code);
                      try{
                        if (navigator.clipboard && navigator.clipboard.writeText){
                          await navigator.clipboard.writeText(link);
                          setCopiedLink(true);
                          setTimeout(()=>setCopiedLink(false), 2000);
                        } else {
                          // fallback to prompt
                          prompt('Copy this join link', link);
                        }
                      }catch(e){ prompt('Copy this join link', link); }
                    }}>Copy</button>
                    <button className="btn btn-secondary" onClick={()=>{ setShowShare(false); setCopiedLink(false); }}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Submissions modal */}
      {viewingSubmissions && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-content p-3">
              <h5>Submissions — {viewingSubmissions.title}</h5>
              <div style={{maxHeight:400,overflow:'auto'}}>
                {(viewingSubmissions.submissions||[]).map(s => (
                  <div key={s._id || s.id} className="card p-2 mb-2" style={{display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>{s.student?.name || (s.student ? s.student : 'Student')}</div>
                      <div style={{fontSize:13,color:'#666'}}>Submitted: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'}</div>
                      <div style={{fontSize:13}}>{s.comment}</div>
                      <div>
                        {(s.files||[]).map(f=> <div key={f.filename}><a href={f.url} target="_blank" rel="noreferrer">{f.filename}</a></div>)}
                      </div>
                    </div>
                    <div style={{minWidth:220}}>
                      <div>
                        <label>Grade</label>
                        <input defaultValue={s.grade||''} type="number" id={`grade_${s._id||s.id}`} className="form-control" />
                      </div>
                      <div className="mt-2">
                        <label>Feedback</label>
                        <textarea id={`fb_${s._id||s.id}`} className="form-control">{s.feedback||''}</textarea>
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:8}}>
                        <button className="btn btn-primary" onClick={async ()=>{
                          const grade = document.getElementById(`grade_${s._id||s.id}`).value;
                          const feedback = document.getElementById(`fb_${s._id||s.id}`).value;
                          try{
                            const res = await API.post(`/teacher/assignments/${viewingSubmissions._id}/submissions/${s._id}/grade`, { grade, feedback });
                            alert('Graded');
                            // update local state
                            setAssignments(st=>st.map(a=>{ if (String(a._id)===String(viewingSubmissions._id)){
                                return { ...a, submissions: a.submissions.map(x => x._id === s._id ? { ...x, grade: res.data.submission.grade, feedback: res.data.submission.feedback } : x) };
                              } return a; }));
                          }catch(e){ console.warn(e); alert('Grade failed'); }
                        }}>Save</button>
                        <button className="btn btn-outline-secondary" onClick={()=>setViewingSubmissions(null)}>Close</button>
                      </div>
                    </div>
                  </div>
                ))}
                {((viewingSubmissions.submissions||[]).length === 0) && <div className="muted p-2">No submissions yet</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="btn-group">
          <button className={`btn ${tab==='overview'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('overview')}>Overview</button>
          <button className={`btn ${tab==='students'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('students')}>Students</button>
          <button className={`btn ${tab==='assignments'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('assignments')}>Assignments</button>
          <button className={`btn ${tab==='announcements'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setTab('announcements')}>Announcements</button>
        </div>

        <div className="card p-3 mt-3">
          {tab === 'overview' && (
            <div>
              <h4>Overview</h4>
              <div style={{display:'flex',gap:24}}>
                <div>Total students: {(cls.students||[]).length}</div>
                <div>Total assignments: {assignments.length}</div>
                <div>Last updated: {assignments[0] ? new Date(assignments[0].createdAt).toLocaleDateString() : '—'}</div>
              </div>
            </div>
          )}

          {tab === 'students' && (
            <div>
              <h4>Students</h4>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <p className="muted">Manage students (add / import / export).</p>
                <div>
                  <button className="btn btn-outline-secondary me-2" onClick={()=>{document.getElementById('csvImportInput').click();}}>Import CSV</button>
                  <input id="csvImportInput" type="file" accept=".csv" style={{display:'none'}} onChange={async (e)=>{
                    const f = e.target.files && e.target.files[0];
                    if (!f) return;
                    setImporting(true);
                    try{
                      const fd = new FormData(); fd.append('file', f);
                      const res = await API.post(`/teacher/classrooms/${id}/students/import?createAccounts=true`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      alert(`Imported ${res.data.added.length} students`);
                      // reload students
                      const sr = await API.get(`/teacher/classrooms/${id}/students`);
                      setStudents(sr.data.students || []);
                    }catch(err){ console.warn(err); alert('Import failed'); }
                    setImporting(false);
                    e.target.value = null;
                  }}/>
                  <button className="btn btn-outline-primary" onClick={async ()=>{
                    try{
                      const resp = await API.get(`/teacher/classrooms/${id}/students/export`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([resp.data]));
                      const a = document.createElement('a');
                      a.href = url; a.download = `${cls.code || 'class'}-students.csv`; a.click();
                    }catch(e){ console.warn(e); alert('Export failed'); }
                  }}>Export CSV</button>
                </div>
              </div>

              <div className="mt-2" style={{display:'flex',gap:12,alignItems:'center'}}>
                <button className="btn btn-primary" onClick={()=>setShowAdd(s => !s)}>{showAdd ? 'Cancel' : 'Add Student'}</button>
                {importing && <span className="muted">Importing...</span>}
              </div>

              {showAdd && (
                <div className="card p-3 mt-2">
                  <div style={{display:'flex',gap:12}}>
                    <input placeholder="Full name" value={newStudent.name} onChange={e=>setNewStudent(s=>({...s,name:e.target.value}))} />
                    <input placeholder="Email" value={newStudent.email} onChange={e=>setNewStudent(s=>({...s,email:e.target.value}))} />
                    <label style={{display:'flex',alignItems:'center',gap:6}}><input type="checkbox" checked={newStudent.createAccount} onChange={e=>setNewStudent(s=>({...s,createAccount:e.target.checked}))} /> Create account</label>
                    <button className="btn btn-success" onClick={async ()=>{
                      if (!newStudent.name || !newStudent.email) return alert('Name and email required');
                      try{
                        const res = await API.post(`/teacher/classrooms/${id}/students`, newStudent);
                        setStudents(s=>[...s, res.data.student]);
                        setNewStudent({ name:'', email:'', createAccount:false });
                        setShowAdd(false);
                      }catch(err){ console.warn(err); alert('Add failed'); }
                    }}>Add</button>
                  </div>
                </div>
              )}

              <div className="mt-3">
                {students.length === 0 && <div>No students in this class</div>}
                {students.map(s => (
                  <div key={s._id || s.id} className="card p-2 mb-2" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:600}}>{s.name}</div>
                      <div style={{fontSize:13,color:'#666'}}>{s.email}</div>
                    </div>
                    <div>
                      <button className="btn btn-sm btn-outline-secondary me-2" onClick={async ()=>{
                        const newName = prompt('Edit name', s.name);
                        if (newName == null) return;
                        try{
                          const r = await API.put(`/teacher/classrooms/${id}/students/${s._id || s.id}`, { name: newName });
                          setStudents(st=>st.map(x => (String(x._id||x.id)===String(s._id||s.id)?{...x,name:r.data.student.name}:x)));
                        }catch(err){ console.warn(err); alert('Update failed'); }
                      }}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={async ()=>{
                        if (!confirm('Remove student from class?')) return;
                        try{
                          await API.delete(`/teacher/classrooms/${id}/students/${s._id || s.id}`);
                          setStudents(st=>st.filter(x=>String(x._id||x.id)!==String(s._id||s.id)));
                        }catch(err){ console.warn(err); alert('Remove failed'); }
                      }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'assignments' && (
            <div>
              <h4>Assignments</h4>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div />
                  <div>
                    <button className="btn btn-outline-secondary me-2" onClick={()=>setShowCreateAssignment(s=>!s)}>{showCreateAssignment ? 'Cancel' : '➕ New Assignment'}</button>
                  </div>
                </div>

                {showCreateAssignment && (
                  <div className="card p-3 my-2">
                    <input className="form-control my-1" placeholder="Title" value={newAssignment.title} onChange={e=>setNewAssignment(n=>({...n,title:e.target.value}))} />
                    <textarea className="form-control my-1" placeholder="Description" value={newAssignment.description} onChange={e=>setNewAssignment(n=>({...n,description:e.target.value}))} />
                    <div style={{display:'flex',gap:8}}>
                      <input type="datetime-local" value={newAssignment.unlockAt} onChange={e=>setNewAssignment(n=>({...n,unlockAt:e.target.value}))} />
                      <input type="datetime-local" value={newAssignment.dueAt} onChange={e=>setNewAssignment(n=>({...n,dueAt:e.target.value}))} />
                      <input type="file" multiple onChange={e=>setAssignmentFiles(Array.from(e.target.files))} />
                      <button className="btn btn-primary" onClick={async ()=>{
                        if (!newAssignment.title) return alert('Title required');
                        try{
                          const fd = new FormData();
                          fd.append('title', newAssignment.title);
                          fd.append('description', newAssignment.description);
                          fd.append('classroom', id);
                          if (newAssignment.unlockAt) fd.append('unlockAt', new Date(newAssignment.unlockAt).toISOString());
                          if (newAssignment.dueAt) fd.append('dueAt', new Date(newAssignment.dueAt).toISOString());
                          for (const f of assignmentFiles) fd.append('files', f);
                          const res = await API.post('/teacher/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          setAssignments(st=>[res.data.assignment, ...st]);
                          setShowCreateAssignment(false);
                          setNewAssignment({ title:'', description:'', unlockAt:'', dueAt:'' });
                          setAssignmentFiles([]);
                        }catch(e){ console.warn(e); alert('Failed to create assignment'); }
                      }}>Create</button>
                    </div>
                  </div>
                )}

                {assignments.length === 0 && <div>No assignments yet</div>}
                {assignments.map(a => (
                <div key={a._id} className="card p-2 mb-2">
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <div style={{fontWeight:600}}>{a.title}</div>
                      <div style={{fontSize:13,color:'#666'}}>Due: {a.dueAt ? new Date(a.dueAt).toLocaleString() : '—'}</div>
                    </div>
                      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end'}}>
                        <div>{(a.submissions||[]).length} submissions</div>
                        <div className="mt-2">
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>setViewingSubmissions(a)}>View Submissions</button>
                          <button className="btn btn-sm btn-outline-secondary" onClick={async ()=>{
                            // quick toggle unlock
                            try{
                              const resp = await API.post(`/teacher/assignments/${a._id}/submissions/noop`);
                            }catch(e){}
                          }}>Manage</button>
                        </div>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources tab removed as requested */}

          {tab === 'announcements' && (
            <div>
              <h4>Announcements</h4>
              <p className="muted">Post updates and pinned notices to students.</p>
              <div style={{marginTop:8}}>
                <textarea className="form-control" placeholder="Write an announcement..." value={newAnnouncement} onChange={e=>setNewAnnouncement(e.target.value)} rows={3} />
                <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:8}}>
                  <button className="btn btn-outline-secondary" onClick={()=>{ setNewAnnouncement(''); }}>Cancel</button>
                  <button className="btn btn-primary" onClick={async ()=>{
                    if (!newAnnouncement || !newAnnouncement.trim()) return alert('Please write a message');
                    try{
                      await API.post(`/classrooms/${id}/announcements`, { message: newAnnouncement.trim() });
                      // reload announcements
                      const res = await API.get(`/classrooms/${id}`);
                      setAnnouncements(res.data.announcements || []);
                      setNewAnnouncement('');
                    }catch(e){ console.error(e); alert('Failed to post announcement'); }
                  }}>Post</button>
                </div>
              </div>
              <div style={{marginTop:12}}>
                {announcements.length === 0 && <div className="muted">No announcements yet</div>}
                {announcements.map(an => (
                  <div key={an._id || an.id} className="card p-2 mb-2">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontWeight:600}}>{an.user ? an.user.name : 'Teacher'}</div>
                        <div style={{fontSize:13,color:'#666'}}>{new Date(an.createdAt).toLocaleString()}</div>
                        <div style={{marginTop:6}}>{an.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
