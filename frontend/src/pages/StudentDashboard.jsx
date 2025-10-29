import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaClipboardList, FaChartLine, FaLink, FaUser, FaSchool } from 'react-icons/fa';

export default function StudentDashboard(){
  const { user } = useContext(AuthContext);
  const name = (user && user.name) || 'Student';
  const [classrooms, setClassrooms] = useState([]);

  useEffect(()=>{
    let mounted = true;
    import('../services/api').then(({default: API})=>{
      API.get('/classrooms/mine').then(res=>{ if(mounted) setClassrooms(res.data.classrooms || []); }).catch(()=>{});
    });
    return ()=>{ mounted=false };
  },[]);

  return (
    <div className="page dashboard">
      <header style={{display:'flex',flexDirection:'column',gap:6}}>
        <h2 style={{margin:0}}>Welcome back, {name} <span style={{fontSize:'1.05rem'}}>👋</span></h2>
        <p className="lead" style={{margin:0}}>Here's your study snapshot.</p>

        <nav className="student-nav" aria-label="Student quick links">
          <div className="student-nav-grid">
            <Link className="student-nav-tile" to="/student/join" title="Join classroom"><div className="tile-icon"><FaLink size={22} /></div><div className="tile-label">Join</div></Link>
            <Link className="student-nav-tile" to="/student/classrooms" title="Classroom"><div className="tile-icon"><FaSchool size={22} /></div><div className="tile-label">Classroom</div></Link>
            <Link className="student-nav-tile" to="/student/assignments" title="My assignments"><div className="tile-icon"><FaClipboardList size={22} /></div><div className="tile-label">Assignments</div></Link>
            {/* ZenBot removed */}
            <Link className="student-nav-tile" to="/student/scheduler" title="Scheduler"><div className="tile-icon"><FaCalendarAlt size={22} /></div><div className="tile-label">Scheduler</div></Link>
            <Link className="student-nav-tile" to="/student/profile" title="Profile"><div className="tile-icon"><FaUser size={22} /></div><div className="tile-label">Profile</div></Link>
          </div>
        </nav>
      </header>

      {/* Classroom list removed — the classrooms icon in the quick links is sufficient */}

      <div className="grid dashboard-grid">
        <div className="card card-highlight">
          <div className="card-head"><FaCalendarAlt className="card-icon" /><h4>Upcoming Exam</h4></div>
          <div className="card-body">
            <p className="muted">No upcoming exams found.</p>
            <Link to="/student/scheduler" className="link-btn">View exams</Link>
          </div>
        </div>

        <div className="card card-highlight">
          <div className="card-head"><FaClipboardList className="card-icon" /><h4>Pending Assignments</h4></div>
          <div className="card-body">
            <p className="muted">You have no pending assignments.</p>
            <Link to="/student/assignments" className="link-btn">View assignments</Link>
          </div>
        </div>

        <div className="card card-highlight">
          <div className="card-head"><FaChartLine className="card-icon" /><h4>Study Progress</h4></div>
          <div className="card-body">
            <p className="muted">Track your progress over time.</p>
            <Link to="/student/profile" className="link-btn">View progress</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
