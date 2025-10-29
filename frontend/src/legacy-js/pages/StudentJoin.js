import React, { useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function StudentJoin(){
  const { user } = useContext(AuthContext);
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);

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
