import React, { useState, useContext } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

export default function SignupForm({ role: presetRole }){
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const role = presetRole || 'student';
  const [msg, setMsg] = useState(null);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const submit = async e => {
    e.preventDefault();
    // client-side validation
    setMsg(null);
    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      setMsg('Password must be at least 8 characters and include letters and numbers');
      return;
    }

    try{
      const reg = await API.post('/auth/register', { name, email, password, role });
      const token = reg.data?.token;
      if (token) {
        await login(token);
        // show success message then navigate
        setSuccess(true);
        setMsg('Sign up successful — Redirecting...');
        setTimeout(() => {
          if (role === 'student') nav('/student/dashboard');
          else if (role === 'teacher') nav('/teacher/dashboard');
          else if (role === 'admin') nav('/admin/dashboard');
          else nav('/dashboard');
        }, 900);
      } else {
        // fallback: try login
        const res = await API.post('/auth/login', { email, password });
        const t2 = res.data?.token;
        if (t2) {
          await login(t2);
          setSuccess(true);
          setMsg('Sign up successful — Redirecting...');
          setTimeout(() => nav('/dashboard'), 900);
        } else {
          nav('/login');
        }
      }
    }catch(err){ setMsg(err.response?.data?.msg || 'Registration failed'); }
  };

  return (
    <form onSubmit={submit} className="login-form modern">
      {msg && <div className="alert error-alert">{msg}</div>}
      <label className="field has-icon" htmlFor="sf-name"><span className="icon"><FaUser /></span><input id="sf-name" name="name" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label>
      <label className="field has-icon" htmlFor="sf-email"><span className="icon"><FaEnvelope /></span><input id="sf-email" name="email" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <label className="field has-icon" htmlFor="sf-password"><span className="icon"><FaLock /></span><input id="sf-password" name="password" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password"/></label>
      <label className="field has-icon" htmlFor="sf-confirm-password"><span className="icon"><FaLock /></span><input id="sf-confirm-password" name="confirmPassword" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required autoComplete="new-password"/></label>
      <div className="actions">
        <button className="btn primary" type="submit" disabled={success}>📝 Create account</button>
        <button id="signup-go-dashboard" type="button" className="btn secondary" onClick={() => {
          // quick navigate to dashboard based on selected role
          if (role === 'admin') nav('/admin/dashboard');
          else if (role === 'teacher') nav('/teacher/dashboard');
          else nav('/student/dashboard');
        }}>🚀 Go to Dashboard</button>
      </div>
    </form>
  );
}
