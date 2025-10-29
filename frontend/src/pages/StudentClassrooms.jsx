import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { FaSchool } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

export default function StudentClassrooms(){
  const { user } = useContext(AuthContext);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    let mounted = true;
    async function load(){
      setLoading(true);
      try{
        const res = await API.get('/classrooms/mine');
        if(mounted) setClassrooms(res.data.classrooms || []);
      }catch(e){ console.warn('Failed to load classrooms', e); }
      finally{ if(mounted) setLoading(false); }
    }
    load();
    return ()=>{ mounted = false };
  },[]);

  if(!user) return <div>Please login</div>;

  return (
    <div className="page container">
      <h3>Your Classrooms</h3>
      {loading && <div className="muted">Loading…</div>}
      {(!classrooms || classrooms.length === 0) && !loading && (
        <div className="alert alert-info">You haven't joined any classrooms yet. Use Join Classroom to add one.</div>
      )}

      <nav className="student-nav" aria-label="Your classrooms">
        <div className="student-nav-grid" style={{marginTop:12}}>
          {classrooms.map(c => (
            <Link key={c._id || c.id} className="student-nav-tile" to={`/student/assignments?classroom=${c._id || c.id}`} title={c.name}>
              <div className="tile-icon" style={{background:'#eef2ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}><FaSchool size={20} color="#3b82f6" /></div>
              <div className="tile-label" style={{fontSize:13}}>{c.name}</div>
              <div style={{fontSize:11,color:'#666'}}>{c.teacher? c.teacher.name : ''}</div>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
