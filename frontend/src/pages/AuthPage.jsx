import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import SignupForm from '../components/SignupForm.jsx';
import ZenLogo from '../components/ZenLogo.jsx';

export default function AuthPage(){
  const location = useLocation();
  const [tab, setTab] = useState(() => (location.pathname === '/signup' ? 'signup' : 'login'));
  const [role, setRole] = useState('student');

  // Update tab if the route changes (e.g. user clicks top nav link)
  useEffect(() => {
    if (location.pathname === '/signup' && tab !== 'signup') setTab('signup');
    if (location.pathname === '/login' && tab !== 'login') setTab('login');
  }, [location.pathname]);

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="top-controls">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <ZenLogo size={44} />
            <div style={{fontWeight:700}}>ZenAura <small style={{display:'block',fontWeight:400}}>Balance. Learn. Grow.</small></div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className={tab==='login' ? 'btn primary' : 'btn secondary'} onClick={() => setTab('login')}>Login</button>
            <button className={tab==='signup' ? 'btn primary' : 'btn secondary'} onClick={() => setTab('signup')}>Sign Up</button>
          </div>
        </div>

        <div className="proceed-row" style={{marginTop:6,marginBottom:8}}>
          <div className="proceed-label">Proceed as</div>
          <div className="proceed-pills">
            <button className={`role-pill ${role==='student'?'selected':''}`} onClick={() => setRole('student')}>Student</button>
            <button className={`role-pill ${role==='teacher'?'selected':''}`} onClick={() => setRole('teacher')}>Teacher</button>
            <button className={`role-pill ${role==='admin'?'selected':''}`} onClick={() => setRole('admin')}>Admin</button>
          </div>
        </div>

        <div className="card-body auth-slides">
          <div className={`slide ${tab==='login' ? 'active' : ''}`}><div style={{padding:'1rem 0'}}><h3>Welcome Back to ZenAura 🌸</h3><p className="sub">Sign in to continue your smart learning journey.</p><LoginForm role={role} /></div></div>
          <div className={`slide ${tab==='signup' ? 'active' : ''}`}><div style={{padding:'1rem 0'}}><h3>Create your account</h3><p className="sub">Join ZenAura as Student, Teacher, or Admin.</p><SignupForm role={role} /></div></div>
        </div>

      </div>
    </div>
  );
}
