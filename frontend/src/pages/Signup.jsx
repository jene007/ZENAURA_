import React, { useState, useContext } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaUser, FaEnvelope, FaLock, FaUserGraduate, FaMagic } from 'react-icons/fa';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [msg, setMsg] = useState(null);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const submit = async e => {
    e.preventDefault();
    console.debug('Signup page submit', { name, email, role });
    setMsg(null);
    // client-side validation
    if (password !== confirmPassword) {
      setMsg('Passwords do not match');
      return;
    }
    if (password.length < 8 || !/[0-9]/.test(password) || !/[a-zA-Z]/.test(password)) {
      setMsg('Password must be at least 8 characters and include letters and numbers');
      return;
    }
    try {
      const reg = await API.post('/auth/register', { name, email, password, role });
      const token = reg.data?.token;
      if (token) {
        // persist and auto-login, then redirect to role dashboard
        await login(token);
        setSuccess(true);
        setMsg('Account created — Redirecting...');
        setTimeout(() => {
          if (role === 'student') nav('/student/dashboard');
          else if (role === 'teacher') nav('/teacher/dashboard');
          else if (role === 'admin') nav('/admin/dashboard');
          else nav('/dashboard');
        }, 800);
      } else {
        // fallback behaviour: attempt login
        const res = await API.post('/auth/login', { email, password });
        const t2 = res.data?.token;
        if (t2) {
          await login(t2);
          setSuccess(true);
          setTimeout(() => {
            if (role === 'student') nav('/student/dashboard');
            else if (role === 'teacher') nav('/teacher/dashboard');
            else if (role === 'admin') nav('/admin/dashboard');
            else nav('/dashboard');
          }, 800);
        } else {
          nav('/login');
        }
      }
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <div className="signup-page container">
      <div className="signup-split glass">
        <div className="signup-illustration">
          <div style={{padding:28, textAlign:'center'}}>
            <div className="ai-brain" aria-hidden>🧠</div>
            <h2>Join ZenAura</h2>
            <p className="muted">Join ZenAura — where balance meets brilliance 🌸</p>
            <img src="/src/assets/placeholder-waves.svg" alt="illustration" style={{maxWidth:'100%', marginTop:8}} />
          </div>
        </div>
        <div className="signup-form card-body">
          <h3>Create Your ZenAura Account</h3>
          {msg && <div className="alert error-alert">{msg}</div>}
          <form onSubmit={submit} className="signup-form-inner">
            <label className="field has-icon" htmlFor="name"><span className="icon"><FaUser /></span><input id="name" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required /></label>
            <label className="field has-icon" htmlFor="email"><span className="icon"><FaEnvelope /></span><input id="email" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
            <label className="field has-icon" htmlFor="password"><span className="icon"><FaLock /></span><input id="password" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
            <label className="field has-icon" htmlFor="confirm"><span className="icon"><FaLock /></span><input id="confirm" type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></label>
            <label className="field has-icon" htmlFor="role"><span className="icon"><FaUserGraduate /></span>
              <select id="role" value={role} onChange={e => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div style={{display:'flex',gap:10,alignItems:'center',marginTop:10}}>
              <button className="btn primary signup-cta full-width" type="submit" disabled={success}><FaMagic style={{marginRight:8}}/> Sign Up</button>
            </div>
            <div style={{marginTop:12,fontSize:'0.95rem'}}><a className="muted" href="#" onClick={(e)=>{e.preventDefault(); nav('/login')}}>Already have an account? <strong style={{color:'#6d28d9'}}>Login</strong></a></div>
          </form>
        </div>
      </div>
      <div className="signup-footer container" style={{marginTop:18,textAlign:'center'}}>
        <div className="small-quote">“Small steps every day lead to big results 🌿”</div>
      </div>
    </div>
  );
}
