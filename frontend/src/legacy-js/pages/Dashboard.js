import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { user: me } = useContext(AuthContext);

  if (!me) return <div>Please login to view dashboard</div>;

  return (
    <div>
      <h3>Dashboard</h3>
      <p>Welcome, {me.name} ({me.role})</p>
      <div className="row">
        <div className="col-md-4">
          <div className="card p-3">Next Exam: --</div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">Pending Assignments: --</div>
        </div>
        <div className="col-md-4">
          <div className="card p-3">Wellness Index: --</div>
        </div>
      </div>
    </div>
  );
}
