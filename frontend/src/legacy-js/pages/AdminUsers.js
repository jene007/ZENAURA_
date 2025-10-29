import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminUsers() {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchUsers();
  }, [user]);

  const fetchUsers = async (q) => {
    try {
      setLoading(true);
      const params = {};
      if (q) params.q = q;
      const res = await API.get('/admin/users', { params });
      setUsers(res.data.users || []);
      setErr(null);
    } catch (e) {
      setErr(e.response?.data?.msg || 'Failed to fetch users');
    } finally { setLoading(false); }
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchUsers(query);
  };

  const handleCreate = async e => {
    e.preventDefault();
    try {
      const payload = { ...form };
      const res = await API.post('/admin/users', payload);
      setForm({ name: '', email: '', password: '', role: 'student', department: '' });
      setCreating(false);
      fetchUsers();
    } catch (e) {
      setErr(e.response?.data?.msg || 'Create failed');
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || '' });
  };

  const handleUpdate = async e => {
    e.preventDefault();
    try {
      await API.put(`/admin/users/${editingId}`, form);
      setEditingId(null);
      setForm({ name: '', email: '', password: '', role: 'student', department: '' });
      fetchUsers();
    } catch (e) {
      setErr(e.response?.data?.msg || 'Update failed');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this user?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (e) {
      setErr(e.response?.data?.msg || 'Archive failed');
    }
  };

  if (!user) return <div>Please login</div>;
  if (user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div>
      <h3>Admin — Users</h3>
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="d-flex mb-3">
        <form className="me-2" onSubmit={handleSearch}>
          <input className="form-control" placeholder="Search name or email" value={query} onChange={e=>setQuery(e.target.value)} />
        </form>
        <button className="btn btn-primary" onClick={()=>setCreating(!creating)}>{creating ? 'Cancel' : 'Add user'}</button>
      </div>

      {creating && (
        <form className="card p-3 mb-3" onSubmit={handleCreate}>
          <div className="row">
            <div className="col-md-3 mb-2"><input className="form-control" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></div>
            <div className="col-md-3 mb-2"><input className="form-control" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></div>
            <div className="col-md-2 mb-2"><input type="password" className="form-control" placeholder="Password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} required /></div>
            <div className="col-md-2 mb-2">
              <select className="form-select" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-md-2 mb-2"><input className="form-control" placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})} /></div>
          </div>
          <div className="mt-2">
            <button className="btn btn-success">Create</button>
          </div>
        </form>
      )}

      {loading ? <div>Loading...</div> : (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.department || '-'}</td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>startEdit(u)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>handleArchive(u._id)}>Archive</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingId && (
        <div className="card p-3">
          <h5>Edit user</h5>
          <form onSubmit={handleUpdate}>
            <div className="row">
              <div className="col-md-3 mb-2"><input className="form-control" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></div>
              <div className="col-md-3 mb-2"><input className="form-control" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required /></div>
              <div className="col-md-2 mb-2"><input type="password" className="form-control" placeholder="Reset password (optional)" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
              <div className="col-md-2 mb-2">
                <select className="form-select" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-2 mb-2"><input className="form-control" placeholder="Department" value={form.department} onChange={e=>setForm({...form, department:e.target.value})} /></div>
            </div>
            <div className="mt-2">
              <button className="btn btn-primary me-2">Save</button>
              <button type="button" className="btn btn-secondary" onClick={()=>{ setEditingId(null); setForm({ name: '', email: '', password: '', role: 'student', department: '' }); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
