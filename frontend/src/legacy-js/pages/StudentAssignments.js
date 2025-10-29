import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function StudentAssignments(){
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [err, setErr] = useState(null);
  const [selected, setSelected] = useState('');
  const [files, setFiles] = useState([]);
  const [comment, setComment] = useState('');

  useEffect(()=>{ if(user) load(); }, [user]);
  const load = async ()=>{
    try{
      const cr = await API.get('/classrooms/mine');
      setClassrooms(cr.data.classrooms||[]);
      const as = await API.get('/assignments');
      setAssignments(as.data.assignments || []);
    }catch(e){ setErr('Failed to load'); }
  };

  const onFiles = e => setFiles(e.target.files);

  const submit = async (e) => {
    e.preventDefault();
    if(!selected) return setErr('Choose assignment');
    try{
      const fd = new FormData();
      for (let i=0;i<files.length;i++) fd.append('files', files[i]);
      fd.append('comment', comment);
      await API.post(`/assignments/${selected}/submit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFiles([]); setComment(''); setErr(null);
      load();
    }catch(e){ setErr(e.response?.data?.msg || 'Submit failed'); }
  };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'student') return <div>Access denied</div>;

  // show assignments that belong to student's classrooms
  const myClassIds = new Set(classrooms.map(c=>c._id));
  const myAssignments = assignments.filter(a => a.classroom && myClassIds.has(a.classroom._id));

  return (
    <div>
      <h3>My Assignments</h3>
      {err && <div className="alert alert-danger">{err}</div>}

      <table className="table table-striped mb-3">
        <thead><tr><th>Title</th><th>Classroom</th><th>Files</th><th>Due</th></tr></thead>
        <tbody>
          {myAssignments.map(a => (
            <tr key={a._id}><td>{a.title}</td><td>{a.classroom? a.classroom.name : '-'}</td><td>{(a.files||[]).map(f=> <div key={f.filename}><a href={f.url} target="_blank" rel="noreferrer">{f.filename}</a></div>)}</td><td>{a.dueAt? new Date(a.dueAt).toLocaleString() : '-'}</td></tr>
          ))}
        </tbody>
      </table>

      <form className="card p-3" onSubmit={submit}>
        <h5>Submit Assignment</h5>
        <div className="mb-2">
          <select className="form-select" value={selected} onChange={e=>setSelected(e.target.value)} required>
            <option value="">Select assignment</option>
            {myAssignments.map(a=> <option key={a._id} value={a._id}>{a.title} ({a.classroom? a.classroom.name : ''})</option>)}
          </select>
        </div>
        <div className="mb-2"><input type="file" className="form-control" multiple onChange={onFiles} /></div>
        <div className="mb-2"><textarea className="form-control" placeholder="Comment" value={comment} onChange={e=>setComment(e.target.value)} /></div>
        <button className="btn btn-primary">Submit</button>
      </form>
    </div>
  );
}
