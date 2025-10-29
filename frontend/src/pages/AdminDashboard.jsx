import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext.jsx';
import { FiUsers, FiHome, FiFileText, FiBook, FiBarChart2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    API.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(e => setErr(e.response?.data?.msg || 'Failed to load stats'));
  }, [user]);

  if (!user) return <div>Please login</div>;
  if (user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div className="page container">
      <h2>Admin Dashboard</h2>
      <p className="muted">Quick links and metrics for administrators.</p>

      <div className="big-icon-grid mb-4">
        <div className="big-tile" onClick={()=>navigate('/admin/users')}>
          <div className="tile-icon"><FiUsers size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Users</div>
            <div className="tile-sub">Manage users and roles</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/admin/classrooms')}>
          <div className="tile-icon"><FiHome size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Classrooms</div>
            <div className="tile-sub">View and manage classrooms</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/admin/assignments')}>
          <div className="tile-icon"><FiFileText size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Assignments</div>
            <div className="tile-sub">Review assignments and grading</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/admin/exams')}>
          <div className="tile-icon"><FiBook size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Exams</div>
            <div className="tile-sub">Manage uploaded exams and plans</div>
          </div>
        </div>
        <div className="big-tile" onClick={()=>navigate('/admin') }>
          <div className="tile-icon"><FiBarChart2 size={28} /></div>
          <div className="tile-body">
            <div className="tile-title">Analytics</div>
            <div className="tile-sub">System-wide usage & metrics</div>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      {!stats && !err && <div>Loading stats...</div>}
      {stats && (
        <div className="metric-grid">
          <div className="metric-card metric-primary">
            <div className="icon">👥</div>
            <div className="body">
              <div style={{fontSize:12,opacity:0.85}}>Total users</div>
              <div style={{fontSize:20,fontWeight:700}}>{stats.totalUsers}</div>
            </div>
          </div>
          <div className="metric-card metric-accent">
            <div className="icon">🧑‍🏫</div>
            <div className="body">
              <div style={{fontSize:12,opacity:0.85}}>Teachers</div>
              <div style={{fontSize:20,fontWeight:700}}>{stats.teachers}</div>
            </div>
          </div>
          <div className="metric-card metric-olive">
            <div className="icon">🎓</div>
            <div className="body">
              <div style={{fontSize:12,opacity:0.85}}>Students</div>
              <div style={{fontSize:20,fontWeight:700}}>{stats.students}</div>
            </div>
          </div>
          <div className="metric-card metric-warning">
            <div className="icon">🏫</div>
            <div className="body">
              <div style={{fontSize:12,opacity:0.85}}>Classrooms</div>
              <div style={{fontSize:20,fontWeight:700}}>{stats.classrooms}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
