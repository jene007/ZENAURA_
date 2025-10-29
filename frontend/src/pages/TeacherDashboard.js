import React from 'react';
import { Link } from 'react-router-dom';

export default function TeacherDashboard() {
  return (
    <div>
      <h3>Teacher Dashboard</h3>
      <div className="row">
        <div className="col-md-3"><div className="card p-3"><Link to="/teacher/classrooms">My Classrooms</Link></div></div>
        <div className="col-md-3"><div className="card p-3"><Link to="/teacher/assignments">Assignments</Link></div></div>
        <div className="col-md-3"><div className="card p-3">Upcoming Unlocks</div></div>
        <div className="col-md-3"><div className="card p-3">Student Alerts</div></div>
      </div>
    </div>
  );
}
