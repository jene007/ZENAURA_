import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminAssignments(){
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ title:'', description:'', classroom:'', unlockAt:'', dueAt:'' });
  const [editingId, setEditingId] = useState(null);

  useEffect(()=>{ if(user) fetchList(); }, [user]);
  const fetchList = async ()=>{ try{ setLoading(true); const res = await API.get('/admin/assignments'); setItems(res.data.assignments||[]); setErr(null);}catch(e){ setErr(e.response?.data?.msg||'Failed'); }finally{ setLoading(false);} };

  const create = async e => { e.preventDefault(); try{ await API.post('/admin/assignments', form); setForm({ title:'', description:'', classroom:'', unlockAt:'', dueAt:''}); fetchList(); }catch(e){ setErr(e.response?.data?.msg || 'Create failed'); } };
  const startEdit = (a)=>{ setEditingId(a._id); setForm({ title:a.title, description:a.description||'', classroom: a.classroom? a.classroom._id : '', unlockAt: a.unlockAt||'', dueAt: a.dueAt||'' }); };
  const saveEdit = async e => { e.preventDefault(); try{ await API.put(`/admin/assignments/${editingId}`, form); setEditingId(null); setForm({ title:'', description:'', classroom:'', unlockAt:'', dueAt:''}); fetchList(); }catch(e){ setErr(e.response?.data?.msg||'Update failed'); } };
  const archive = async id => { if(!confirm('Archive assignment?')) return; try{ await API.delete(`/admin/assignments/${id}`); fetchList(); }catch(e){ setErr(e.response?.data?.msg||'Archive failed'); } };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div>
      <h3>Admin — Assignments</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="card p-3 mb-3" onSubmit={editingId? saveEdit: create}>
        <div className="row">
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required /></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="ClassroomId" value={form.classroom} onChange={e=>setForm({...form, classroom:e.target.value})} /></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="UnlockAt" value={form.unlockAt} onChange={e=>setForm({...form, unlockAt:e.target.value})} /></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="DueAt" value={form.dueAt} onChange={e=>setForm({...form, dueAt:e.target.value})} /></div>
        </div>
        <div className="mt-2"><button className="btn btn-success">{editingId? 'Save' : 'Create'}</button></div>
      </form>

      {loading ? <div>Loading...</div> : (
        <table className="table table-striped">
          <thead><tr><th>Title</th><th>Classroom</th><th>Unlock</th><th>Due</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(a=> (
              <tr key={a._id}><td>{a.title}</td><td>{a.classroom? a.classroom.name : '-'}</td><td>{a.unlockAt? new Date(a.unlockAt).toLocaleString() : '-'}</td><td>{a.dueAt? new Date(a.dueAt).toLocaleString() : '-'}</td><td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>startEdit(a)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>archive(a._id)}>Archive</button>
              </td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
