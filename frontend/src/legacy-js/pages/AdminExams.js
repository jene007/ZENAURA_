import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminExams(){
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ title:'', subject:'', classroom:'', date:'' });
  const [editingId, setEditingId] = useState(null);

  useEffect(()=>{ if(user) fetchList(); }, [user]);
  const fetchList = async ()=>{ try{ setLoading(true); const res = await API.get('/admin/exams'); setItems(res.data.exams||[]); setErr(null);}catch(e){ setErr(e.response?.data?.msg||'Failed'); }finally{ setLoading(false);} };

  const create = async e => { e.preventDefault(); try{ await API.post('/admin/exams', form); setForm({ title:'', subject:'', classroom:'', date:''}); fetchList(); }catch(e){ setErr(e.response?.data?.msg || 'Create failed'); } };
  const startEdit = (a)=>{ setEditingId(a._id); setForm({ title:a.title, subject:a.subject||'', classroom: a.classroom? a.classroom._id : '', date: a.date? new Date(a.date).toISOString().slice(0,16) : '' }); };
  const saveEdit = async e => { e.preventDefault(); try{ await API.put(`/admin/exams/${editingId}`, form); setEditingId(null); setForm({ title:'', subject:'', classroom:'', date:''}); fetchList(); }catch(e){ setErr(e.response?.data?.msg||'Update failed'); } };
  const archive = async id => { if(!confirm('Archive exam?')) return; try{ await API.delete(`/admin/exams/${id}`); fetchList(); }catch(e){ setErr(e.response?.data?.msg||'Archive failed'); } };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div>
      <h3>Admin — Exams</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      <form className="card p-3 mb-3" onSubmit={editingId? saveEdit: create}>
        <div className="row">
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required /></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} /></div>
          <div className="col-md-3 mb-2"><input className="form-control" placeholder="ClassroomId" value={form.classroom} onChange={e=>setForm({...form, classroom:e.target.value})} /></div>
          <div className="col-md-3 mb-2"><input type="datetime-local" className="form-control" placeholder="Date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} /></div>
        </div>
        <div className="mt-2"><button className="btn btn-success">{editingId? 'Save' : 'Create'}</button></div>
      </form>

      {loading ? <div>Loading...</div> : (
        <table className="table table-striped">
          <thead><tr><th>Title</th><th>Subject</th><th>Classroom</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {items.map(a=> (
              <tr key={a._id}><td>{a.title}</td><td>{a.subject||'-'}</td><td>{a.classroom? a.classroom.name : '-'}</td><td>{a.date? new Date(a.date).toLocaleString() : '-'}</td><td>
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
