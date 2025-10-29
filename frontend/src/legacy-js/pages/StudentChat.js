import React, { useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function StudentChat(){
  const { user } = useContext(AuthContext);
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async e => {
    e.preventDefault();
    if(!msg) return;
    try{
      setLoading(true);
      const res = await API.post('/chat', { message: msg });
      setReply(res.data.reply);
      setMsg('');
    }catch(e){ setReply('Chat failed'); }
    finally{ setLoading(false); }
  };

  if(!user) return <div>Please login</div>;
  if(user.role !== 'student') return <div>Access denied</div>;

  return (
    <div>
      <h3>ZenBot</h3>
      <form onSubmit={send} className="mb-3">
        <div className="input-group">
          <input className="form-control" value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ask ZenBot about studying or your wellness" />
          <button className="btn btn-primary" disabled={loading}>Send</button>
        </div>
      </form>
      {reply && <div className="card p-3"><strong>ZenBot:</strong><div className="mt-2">{reply}</div></div>}
    </div>
  );
}
