import React, { useState, useContext, useEffect } from 'react';
import { FaSignInAlt, FaEnvelope, FaLock, FaUserGraduate } from 'react-icons/fa';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import '../index.css';
import { useLocation } from 'react-router-dom';

const QUOTES = [
  'Success is the sum of small efforts repeated daily 🌼',
  'Small steps every day lead to big results 🌱',
  'Learn a little. Reflect a little. Grow a lot. 🌸'
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [remember, setRemember] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [greeting, setGreeting] = useState('Welcome Back to ZenAura 🌸');
  const [quote, setQuote] = useState('');

  const nav = useNavigate();
  const { login } = useContext(AuthContext);
  const location = useLocation();

  useEffect(() => {
    // show success message from signup redirect if present
    if (location && location.state && location.state.msg) {
      setMsg(location.state.msg);
      // clear state message so it doesn't persist on navigation
      window.history.replaceState({}, document.title);
    }

    // time-based greeting
    const h = new Date().getHours();
    if (h < 12) setGreeting('Good morning, ready to plan your study goals?');
    else if (h < 18) setGreeting('Good afternoon, let\'s keep the momentum going!');
    else setGreeting('Good evening, let\'s wrap up your day strong!');

    // AI quote of the day (pick by day)
    const day = new Date().getDate();
    setQuote(QUOTES[day % QUOTES.length]);
  }, []);


  const submit = async e => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    console.debug('Login submit', { email, role });
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;
      // persist token if remember checked
      if (remember) localStorage.setItem('zenaura_token', token);
      await login(token);
  // route by role from server response
  const r = user?.role || role || 'student';
  if (r === 'admin') nav('/admin/dashboard');
  else if (r === 'teacher') nav('/teacher/dashboard');
  else nav('/student/dashboard');
    } catch (err) {
      setMsg(err.response?.data?.msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-animations" aria-hidden="true"></div>

      <div className="auth-card glass">
        <div className="top-controls">
          <div className="brand">
            <div className="logo">🌸</div>
            <div className="tag">ZenAura <small className="tagline">Balance. Learn. Grow.</small></div>
          </div>
        </div>

        {/* quick-proceed toolbar moved down into the form so it appears above the Login button */}

        <div className="card-body">
          <div className="auth-header" style={{ textAlign: 'center', marginBottom: 12 }}>
            <h2 className="welcome">Login to ZenAura</h2>
            <p className="sub">Sign in to continue your smart learning journey.</p>
          </div>

          {msg && <div className="alert error-alert">{msg}</div>}

          <form onSubmit={submit} className="login-form">
            <label className="field has-icon" htmlFor="login-email">
              <span className="icon"><FaEnvelope /></span>
              <input id="login-email" name="email" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
            </label>

            <label className="field has-icon" htmlFor="login-password">
              <span className="icon"><FaLock /></span>
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="eye" onClick={() => setShowPassword(s => !s)} aria-label="Toggle password">{showPassword ? '🙈' : '👁️'}</button>
            </label>

            <label className="field has-icon" htmlFor="login-role">
              <span className="icon"><FaUserGraduate /></span>
              <select id="login-role" name="role" value={role} onChange={e => setRole(e.target.value)} aria-label="Role">
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <div className="row extras">
              <label className="remember" htmlFor="remember"><input id="remember" name="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> <span>💾 Remember me</span></label>
            </div>

            {/* Visible quick role proceed toolbar (moved to sit above the login button) */}
            <div className="login-quick-proceed" style={{display:'flex',alignItems:'center',gap:12,padding:'0.5rem',justifyContent:'flex-start',width:'100%'}}>
              <label style={{display:'flex',alignItems:'center',gap:8}}>
                <strong style={{fontSize:14}}>Proceed as</strong>
                <select id="login-quick-role" value={role} onChange={e => setRole(e.target.value)} style={{padding:'6px 10px',borderRadius:8}}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button id="login-top-proceed" className="btn primary" onClick={() => {
                const r = role || 'student';
                if (r === 'admin') nav('/admin/dashboard');
                else if (r === 'teacher') nav('/teacher/dashboard');
                else nav('/student/dashboard');
              }}>🚀 Proceed as <span id="login-top-proceed-role">{role}</span></button>
            </div>

            <div className="actions">
              <button className="btn primary login-btn full-width" type="submit" disabled={loading}>
                {loading ? 'Authenticating...' : <><FaSignInAlt style={{marginRight:8}} /> Login</>}
              </button>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,marginTop:12}} className="below-links">
                <a className="muted" href="#" onClick={(e)=>{e.preventDefault(); nav('/signup');}}>Don't have an account? <strong>Sign Up</strong></a>
                <a className="muted" href="#" onClick={(e)=>{e.preventDefault(); /* TODO: route to forgot password page when available */ }}>Forgot password?</a>
              </div>
            </div>
          </form>

          <div className="quote">{quote}</div>
        </div>

        <footer className="auth-footer">© 2025 ZenAura | Smart Academic Scheduler
          <div className="socials"> <a href="#">🔗</a> <a href="#">🐙</a> <a href="#">✉️</a> </div>
        </footer>
      </div>
    </div>
  );
}
