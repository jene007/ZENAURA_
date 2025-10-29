import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function TeacherAssignments(){
  const { user } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classroom, setClassroom] = useState('');
  const [files, setFiles] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(()=>{ if(user) { fetch(); fetchClassrooms(); } }, [user]);
  const fetch = async ()=>{ try{ const res = await API.get('/teacher/assignments'); setAssignments(res.data.assignments||[]); }catch(e){ setErr(e.response?.data?.msg||'Failed'); } };
  const fetchClassrooms = async () => { try { const res = await API.get('/teacher/classrooms'); setClassrooms(res.data.classrooms || []); } catch (e) { /* ignore */ } };

  const onFiles = e => setFiles(e.target.files);

  const submit = async e => {
    e.preventDefault();
    try{
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      if (classroom) fd.append('classroom', classroom);
      for (let i=0;i<files.length;i++) fd.append('files', files[i]);
      const res = await API.post('/teacher/assignments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle(''); setDescription(''); setClassroom(''); setFiles([]);
      fetch();
    }catch(e){ setErr(e.response?.data?.msg || 'Upload failed'); }
  };

  if(!user) return <div>Please login</div>;
  if(!['teacher','admin'].includes(user.role)) return <div>Access denied</div>;

  return (
    <div>
      <h3>Assignments</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="card p-3 mb-3" onSubmit={submit}>
        <div className="row mb-2">
          <div className="col-md-4"><input className="form-control" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required /></div>
          <div className="col-md-4">
            <select className="form-select" value={classroom} onChange={e=>setClassroom(e.target.value)}>
              <option value="">No classroom</option>
              {classrooms.map(c=> <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="col-md-4"><input type="file" className="form-control" multiple onChange={onFiles} /></div>
        </div>
        <div className="mb-2"><textarea className="form-control" placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} /></div>
        <button className="btn btn-success">Upload Assignment</button>
      </form>

      <table className="table table-striped">
        <thead><tr><th>Title</th><th>Classroom</th><th>Files</th><th>Created</th></tr></thead>
        <tbody>
          {assignments.map(a => (
            <tr key={a._id}><td>{a.title}</td><td>{a.classroom? a.classroom.name : '-'}</td><td>{(a.files||[]).map(f=> <div key={f.filename}><a href={f.url} target="_blank" rel="noreferrer">{f.filename}</a></div>)}</td><td>{new Date(a.createdAt).toLocaleString()}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
