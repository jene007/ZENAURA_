import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';

export default function AdminClassrooms(){
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', teacher: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(()=>{ if(user) fetchList(); }, [user]);

  const fetchList = async () => {
    try { setLoading(true); const res = await API.get('/admin/classrooms'); setClassrooms(res.data.classrooms || []); setErr(null); }
    catch(e){ setErr(e.response?.data?.msg || 'Failed'); } finally{ setLoading(false); }
  };

  const create = async e => {
    e.preventDefault();
    try{ await API.post('/admin/classrooms', form); setForm({ name:'', code:'', teacher:'' }); fetchList(); }
    catch(e){ setErr(e.response?.data?.msg || 'Create failed'); }
  };

  const startEdit = (c) => { setEditingId(c._id); setForm({ name:c.name, code:c.code, teacher: c.teacher? c.teacher._id : '' }); };
  const saveEdit = async e => { e.preventDefault(); try{ await API.put(`/admin/classrooms/${editingId}`, form); setEditingId(null); setForm({ name:'', code:'', teacher:'' }); fetchList(); } catch(e){ setErr(e.response?.data?.msg || 'Update failed'); } };
  const archive = async id => { if(!confirm('Archive classroom?')) return; try{ await API.delete(`/admin/classrooms/${id}`); fetchList(); } catch(e){ setErr(e.response?.data?.msg || 'Archive failed'); } };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div>
      <h3>Admin — Classrooms</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="card p-3 mb-3" onSubmit={editingId? saveEdit : create}>
        <div className="row">
          <div className="col-md-4 mb-2"><input className="form-control" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required/></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="Code" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} required/></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="TeacherId (optional)" value={form.teacher} onChange={e=>setForm({...form, teacher:e.target.value})}/></div>
          <div className="col-md-2 mb-2"><button className="btn btn-success">{editingId? 'Save' : 'Create'}</button></div>
        </div>
      </form>

      {loading ? <div>Loading...</div> : (
        <table className="table table-striped">
          <thead><tr><th>Name</th><th>Code</th><th>Teacher</th><th>Actions</th></tr></thead>
          <tbody>
            {classrooms.map(c=> (
              <tr key={c._id}><td>{c.name}</td><td>{c.code}</td><td>{c.teacher? c.teacher.name : '-'}</td><td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>startEdit(c)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>archive(c._id)}>Archive</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
