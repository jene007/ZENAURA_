import React, { useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { useLocation } from 'react-router-dom';

export default function StudentJoin(){
  const { user } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [autoJoining, setAutoJoining] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(loc.search);
      const c = params.get('code');
      if (c) {
        setCode(c);
        // if user is present and is a student, auto-join once
        if (user && user.role === 'student' && !autoJoining) {
          setAutoJoining(true);
          (async () => {
            try {
              const res = await API.post('/classrooms/join', { code: c });
              setMsg(res.data.msg || 'Joined');
            } catch (e) {
              setMsg(e.response?.data?.msg || 'Join failed');
            } finally {
              setAutoJoining(false);
            }
          })();
        }
      }
    } catch (e) { /* ignore */ }
  }, [loc.search, user]);

  const submit = async e => {
    e.preventDefault();
    try{
      const res = await API.post('/classrooms/join', { code });
      setMsg(res.data.msg || 'Joined');
      setCode('');
    }catch(e){ setMsg(e.response?.data?.msg || 'Join failed'); }
  };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'student') return <div>Access denied</div>;

  return (
    <div>
      <h3>Join Classroom</h3>
      {msg && <div className="alert alert-info">{msg}</div>}
      <form onSubmit={submit} className="mb-3">
        <div className="input-group">
          <input className="form-control" placeholder="Enter class code" value={code} onChange={e=>setCode(e.target.value)} required />
          <button className="btn btn-primary">Join</button>
        </div>
      </form>
    </div>
  );
}

