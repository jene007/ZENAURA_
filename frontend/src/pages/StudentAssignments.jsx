import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import API from '../services/api';
import { useLocation } from 'react-router-dom';

export default function StudentAssignments(){
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const loc = useLocation();

  // helper to get classroom query param if present
  const params = new URLSearchParams(loc.search);
  const classroomFilter = params.get('classroom');

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try{
        const [aRes, cRes] = await Promise.all([
          API.get('/assignments'),
          API.get('/classrooms/mine')
        ]);
        setAssignments(aRes.data.assignments || []);
        setClassrooms(cRes.data.classrooms || []);
      }catch(e){ console.warn('Failed to load assignments/classrooms', e); }
      finally{ setLoading(false); }
    }
    load();
  },[]);

  // filter assignments to those that belong to student's classrooms
  const myClassIds = new Set((classrooms||[]).map(c=> String(c._id || c.id)));
  const myAssignments = (assignments || []).filter(a => a.classroom && myClassIds.has(String(a.classroom._id || a.classroom)));
  const filtered = classroomFilter ? myAssignments.filter(a => String(a.classroom?._id || a.classroom) === String(classroomFilter)) : myAssignments;

  // check if current user has submitted for an assignment
  function hasSubmitted(a){
    const subs = a.submissions || [];
    const uid = user?._id || user?.id;
    return subs.some(s => String(s.student || s.student?._id) === String(uid));
  }

  function mySubmission(a){
    const subs = a.submissions || [];
    const uid = user?._id || user?.id;
    return subs.find(s => String(s.student || s.student?._id) === String(uid));
  }

  // file upload UI state per-assignment
  const [uploadMap, setUploadMap] = useState({});

  function toggleUpload(a){
    setUploadMap(prev => ({ ...prev, [a._id]: { ...(prev[a._id]||{}), open: !(prev[a._id]?.open) } }));
  }

  function setUploadFiles(a, files){
    setUploadMap(prev => ({ ...prev, [a._id]: { ...(prev[a._id]||{}), files } }));
  }

  function setUploadComment(a, comment){
    setUploadMap(prev => ({ ...prev, [a._id]: { ...(prev[a._id]||{}), comment } }));
  }

  function getFileUrl(f){
    if (!f) return '#';
    try{
      const u = f.url || f.path || f.filename;
      if (!u) return '#';
      if (/^https?:\/\//i.test(u)) return u;
      // prefix with API base (without /api) if relative
      const apiBase = API.defaults.baseURL || '';
      const origin = apiBase.replace(/\/api\/?$/,'');
      return origin + (u.startsWith('/')? u : ('/' + u));
    }catch(e){ return f.url || '#'; }
  }

  async function markDone(a){
    if (!confirm('Mark this assignment as done (submit without files)?')) return;
    try{
      await API.post(`/assignments/${a._id}/submit`, { comment: 'Marked done via student UI' });
      // refresh assignments
      const res = await API.get('/assignments');
      setAssignments(res.data.assignments || []);
    }catch(e){
      alert('Failed to mark done');
    }
  }

  return (
    <div className="page container">
      <h3>My Assignments</h3>
      {loading && <div className="muted">Loading…</div>}

      {classrooms && classrooms.length === 0 && <div className="alert alert-info">You have not joined any classrooms yet. Use Join Classroom to add one.</div>}

      {classrooms && classrooms.length > 0 && (
        <div style={{marginBottom:12}}>
          <strong>Classrooms:</strong> {classrooms.map(c => <span key={c._id} style={{marginRight:8}}>{c.name}</span>)}
        </div>
      )}

      <table className="table">
        <thead><tr><th>Title</th><th>Classroom</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {filtered.map(a=> (
            <tr key={a._id}>
              <td>{a.title}</td>
              <td>{a.classroom? a.classroom.name : '-'}</td>
              <td>{a.dueAt? new Date(a.dueAt).toLocaleString() : '-'}</td>
              <td>
                {hasSubmitted(a) ? <span style={{color:'green'}}>Submitted</span> : <span style={{color:'#cc6600'}}>Pending</span>}
                {/* show student's submission files if present */}
                {hasSubmitted(a) && mySubmission(a)?.files?.length > 0 && (
                  <div style={{marginTop:6}}>
                    <small>My files:</small>
                    <div>
                      {mySubmission(a).files.map((f, idx) => (
                        <div key={idx}><a href={getFileUrl(f)} target="_blank" rel="noreferrer">{f.filename || f.originalname || f.url}</a></div>
                      ))}
                    </div>
                  </div>
                )}
              </td>
              <td>
                {/* Teacher-provided files (download) */}
                {a.files && a.files.length > 0 && (
                  <div style={{marginBottom:6}}>
                    <small>Files:</small>
                    <div>
                      {a.files.map((f, i) => (
                        <div key={i}><a href={getFileUrl(f)} target="_blank" rel="noreferrer">{f.filename || f.originalname || f.url}</a></div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasSubmitted(a) && <button className="btn btn-sm btn-primary" onClick={()=>markDone(a)}>Mark as done</button>}
                {!hasSubmitted(a) && <button style={{marginLeft:8}} className="btn btn-sm btn-outline-success" onClick={()=>toggleUpload(a)}>{uploadMap[a._id]?.open ? 'Cancel' : 'Upload/Submit'}</button>}
                {hasSubmitted(a) && <button className="btn btn-sm btn-outline-secondary" disabled>Done</button>}

                {/* inline upload form */}
                {uploadMap[a._id]?.open && (
                  <div style={{marginTop:8, padding:8, border:'1px dashed #ddd', borderRadius:6}}>
                    <div style={{marginBottom:6}}>
                      <input type="file" multiple onChange={(e)=>setUploadFiles(a, e.target.files)} />
                    </div>
                    <div style={{marginBottom:6}}>
                      <input className="form-control form-control-sm" placeholder="Optional comment" value={uploadMap[a._id]?.comment || ''} onChange={(e)=>setUploadComment(a, e.target.value)} />
                    </div>
                    <div>
                      <button className="btn btn-sm btn-success" onClick={async ()=>{
                        const u = uploadMap[a._id] || {};
                        const files = u.files;
                        const comment = u.comment || '';
                        if ((!files || files.length===0) && !comment){ if(!confirm('Submit without files or comment?')) return; }
                        try{
                          const form = new FormData();
                          form.append('comment', comment);
                          if (files && files.length){
                            for (let i=0;i<files.length;i++) form.append('files', files[i]);
                          }
                          await API.post(`/assignments/${a._id}/submit`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
                          // refresh
                          const res = await API.get('/assignments');
                          setAssignments(res.data.assignments || []);
                          setUploadMap(prev => ({ ...prev, [a._id]: { open: false } }));
                        }catch(e){
                          alert('Upload failed');
                        }
                      }}>Send</button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
