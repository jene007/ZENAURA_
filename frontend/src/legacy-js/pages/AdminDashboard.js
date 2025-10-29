import React, { useEffect, useState, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) return;
    API.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(e => setErr(e.response?.data?.msg || 'Failed to load stats'));
  }, [user]);

  if (!user) return <div>Please login</div>;
  if (user.role !== 'admin') return <div>Access denied</div>;

  return (
    <div>
      <h3>Admin Dashboard</h3>
      {err && <div className="alert alert-danger">{err}</div>}
      {!stats && !err && <div>Loading stats...</div>}
      {stats && (
        <div className="row">
          <div className="col-md-4"><div className="card p-3">Total users: {stats.totalUsers}</div></div>
          <div className="col-md-4"><div className="card p-3">Teachers: {stats.teachers}</div></div>
          <div className="col-md-4"><div className="card p-3">Students: {stats.students}</div></div>
          <div className="col-md-4 mt-3"><div className="card p-3">Classrooms: {stats.classrooms}</div></div>
          <div className="col-md-4 mt-3"><div className="card p-3">Assignments: {stats.assignments}</div></div>
          <div className="col-md-4 mt-3"><div className="card p-3">Exams: {stats.exams}</div></div>
        </div>
      )}
    </div>
  );
}
