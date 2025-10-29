import React, { useState, useContext } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaEnvelope, FaLock } from 'react-icons/fa';

export default function LoginForm({ onSuccess, role: initialRole }){
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole || 'student');
  const [remember, setRemember] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const submit = async e => {
    e.preventDefault();
    setMsg(null); setLoading(true);
    try{
      // small optimistic UI
      setMsg('🌸 Loading your dashboard...');
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;
      if (remember) localStorage.setItem('zenaura_token', token);
      await login(token);
      const r = user?.role || role || 'student';
      if (onSuccess) onSuccess(r);
      // navigate to the role-specific dashboard
      if (r === 'admin') nav('/admin/dashboard');
      else if (r === 'teacher') nav('/teacher/dashboard');
      else nav('/student/dashboard');
    }catch(err){ setMsg(err?.response?.data?.msg || 'Invalid credentials'); }
    finally{ setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="login-form modern">
      {msg && <div className={`alert ${msg === '🌸 Loading your dashboard...' ? 'info' : 'error-alert'}`}>{msg}</div>}
      <label className="field has-icon"><span className="icon"><FaEnvelope /></span><input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label className="field has-icon"><span className="icon"><FaLock /></span><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>

      <div className="row extras" style={{alignItems:'center'}}>
        <div className="toggle-switch">
          <input id="remember-toggle" type="checkbox" className="toggle-input" checked={remember} onChange={e=>setRemember(e.target.checked)} />
          <label htmlFor="remember-toggle" className="toggle-label"><span className="toggle-thumb"/></label>
          <span style={{marginLeft:8}}>Remember me</span>
        </div>
        <a className="forgot underline-link" href="#">Forgot password?</a>
      </div>

      <div className="actions" style={{flexDirection:'column',gap:12}}>
        <button className="btn primary login-cta full-width" type="submit" disabled={loading}>{loading ? '� Loading your dashboard...' : '� Login'}</button>
        <div style={{display:'flex',justifyContent:'center'}}>
          <button id="login-go-dashboard" type="button" className="role-pill" onClick={() => {
            const r = role || 'student';
            if (r === 'admin') nav('/admin/dashboard');
            else if (r === 'teacher') nav('/teacher/dashboard');
            else nav('/student/dashboard');
          }}>Go to Dashboard</button>
        </div>
      </div>
    </form>
  );
}
