import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// DebugGo was a development-only floating helper. It's intentionally left here as
// a commented-out reference in case developers want to re-enable it.
// To re-enable, uncomment imports in App.jsx and below component body.

/*
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DebugGo(){
  const [role, setRole] = useState('student');
  const nav = useNavigate();
  useEffect(() => { try { console.info('DebugGo mounted'); } catch(e){} }, []);
  const go = () => {
    if (role === 'admin') nav('/admin/dashboard');
    else if (role === 'teacher') nav('/teacher/dashboard');
    else nav('/student/dashboard');
  };
  return (
    <div id="debug-floating" aria-hidden="false" style={{background:'linear-gradient(90deg,#00bfa5,#00e676)',color:'#042',fontWeight:700}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <select id="debug-role-select" value={role} onChange={e => setRole(e.target.value)} aria-label="Debug role select">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button id="debug-floating-proceed" className="btn primary" onClick={go}>🚀 Go to {role} dashboard</button>
      </div>
    </div>
  );
}
*/

export default null;
