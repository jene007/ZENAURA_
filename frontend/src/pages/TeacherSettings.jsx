import React, { useState } from 'react';

export default function TeacherSettings(){
  const [profile, setProfile] = useState({ name:'', email:'' });
  const [dark, setDark] = useState(false);
  return (
    <div className="page container">
      <h2>Settings & Profile</h2>
      <div className="card p-3" style={{maxWidth:720}}>
        <h4>Profile</h4>
        <div className="form-row mt-2">
          <input placeholder="Name" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} />
          <input placeholder="Email" value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))} />
        </div>
        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary">Save</button>
          <button className="btn btn-outline-secondary" onClick={()=>setDark(d=>!d)}>{dark ? 'Disable Dark' : 'Enable Dark'}</button>
        </div>
      </div>

      <div className="card p-3 mt-3" style={{maxWidth:720}}>
        <h4>Security</h4>
        <p className="muted">Change password and manage sessions.</p>
        <div style={{display:'flex',gap:8}}>
          <input placeholder="Current password" type="password" />
          <input placeholder="New password" type="password" />
          <button className="btn btn-primary">Change Password</button>
        </div>
      </div>
    </div>
  );
}
