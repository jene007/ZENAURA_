import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function StudentProfile(){
  const { user } = useContext(AuthContext);
  const name = user?.name || 'Student';
  const email = user?.email || 'you@domain.com';
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    async function load(){
      setLoading(true);
      try {
        const res = await API.get('/assignments');
        setAssignments(res.data.assignments || []);
      } catch (e){
        console.warn('Failed to load assignments for profile', e?.message||e);
      } finally { setLoading(false); }
    }
    load();
  },[]);

  // compute progress: percent of assignments with a submission by this user
  const total = assignments.length;
  const submittedCount = assignments.reduce((acc,a)=>{
    const subs = a.submissions || [];
    const has = subs.some(s => {
      // user id may be in user.id or user._id depending on backend
      const sid = s.student || s.student?._id || s.student;
      const uid = user?._id || user?.id;
      return sid && uid && String(sid) === String(uid);
    });
    return acc + (has ? 1 : 0);
  },0);
  const progress = total ? Math.round((submittedCount/total)*100) : 0;

  return (
    <div className="page container">
      <h2>Profile</h2>
      <div className="card p-3" style={{maxWidth:840}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:72,height:72,background:'#eef4ff',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>👤</div>
          <div>
            <div style={{fontSize:18,fontWeight:600}}>{name}</div>
            <div style={{color:'#666'}}>{email}</div>
          </div>
        </div>

        <hr />
        <div>
          <h4>Study Progress</h4>
          <p className="muted">Progress is based on assignments you've submitted.</p>
          <div style={{marginTop:8}}>
            <div style={{height:14,background:'#eef2ff',borderRadius:8,overflow:'hidden'}}>
              <div style={{width:`${progress}%`,height:'100%',background:'#6b8cff'}} />
            </div>
            <div style={{marginTop:8}}>{submittedCount} of {total} assignments submitted — {progress}%</div>
          </div>
        </div>

        <hr />
        <div>
          <h4>Account</h4>
          <p className="muted">Manage your account settings and change your password.</p>
          <Link to="/change-password" className="btn btn-outline-secondary">Change password</Link>
        </div>
      </div>
    </div>
  );
}
