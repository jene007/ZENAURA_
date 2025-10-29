import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function TeacherClassrooms(){
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [name, setName] = useState('');
  const [err, setErr] = useState(null);

  useEffect(()=>{ if(user) fetch(); }, [user]);
  const fetch = async ()=>{ try{ const res = await API.get('/teacher/classrooms'); setClassrooms(res.data.classrooms||[]); }catch(e){ setErr(e.response?.data?.msg||'Failed'); } };

  const create = async e => { e.preventDefault(); try{ const res = await API.post('/teacher/classrooms', { name }); setName(''); fetch(); }catch(e){ setErr(e.response?.data?.msg || 'Create failed'); } };

  if(!user) return <div>Please login</div>;
  if(!['teacher','admin'].includes(user.role)) return <div>Access denied</div>;

  return (
    <div>
      <h3>My Classrooms</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="mb-3" onSubmit={create}>
        <div className="input-group">
          <input className="form-control" placeholder="Classroom name" value={name} onChange={e=>setName(e.target.value)} required />
          <button className="btn btn-primary">Create</button>
        </div>
      </form>
      <table className="table table-striped">
        <thead><tr><th>Name</th><th>Code</th><th>Teacher</th></tr></thead>
        <tbody>
          {classrooms.map(c => (
            <tr key={c._id}><td>{c.name}</td><td>{c.code}</td><td>{c.teacher? c.teacher.name : '-'}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
