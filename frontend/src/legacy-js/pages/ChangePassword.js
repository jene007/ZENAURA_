import React, { useState } from 'react';
import API from '../services/api';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState(null);

  const submit = async e => {
    e.preventDefault();
    if (newPassword !== confirm) return setMsg('New passwords do not match');
    try {
      const token = localStorage.getItem('zenaura_token');
      if (token) API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const res = await API.post('/auth/change-password', { oldPassword, newPassword });
      setMsg(res.data.msg || 'Password changed');
      setOldPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Change failed');
    }
  };

  return (
    <div className="col-md-6">
      <h3>Change Password</h3>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Old Password</label>
          <input type="password" className="form-control" value={oldPassword} onChange={e=>setOldPassword(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input type="password" className="form-control" value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Confirm New Password</label>
          <input type="password" className="form-control" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </div>
        <button className="btn btn-primary">Change Password</button>
      </form>
    </div>
  );
}
