import React, { useContext } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminClassrooms from './pages/AdminClassrooms';
import AdminAssignments from './pages/AdminAssignments';
import AdminExams from './pages/AdminExams';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherClassrooms from './pages/TeacherClassrooms';
import TeacherAssignments from './pages/TeacherAssignments';
import StudentJoin from './pages/StudentJoin';
import StudentAssignments from './pages/StudentAssignments';
// StudentChat (legacy) removed
import { AuthContext } from './context/AuthContext';

export default function App() {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="app-container">
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container-fluid">
          <Link className="navbar-brand brand-title" to="/">ZenAura</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu" aria-controls="offcanvasMenu">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="offcanvas offcanvas-start offcanvas-lg" tabIndex="-1" id="offcanvasMenu" aria-labelledby="offcanvasMenuLabel">
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasMenuLabel">Menu</h5>
              <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div className="offcanvas-body">
              <ul className="navbar-nav">
                <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                {!user && <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>}
                {!user && <li className="nav-item"><Link className="nav-link" to="/signup">Sign up</Link></li>}
                {user && <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>}

                {user && user.role === 'admin' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/admin">Admin</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/classrooms">Classrooms</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/assignments">Assignments</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/exams">Exams</Link></li>
                  </>
                )}

                {user && user.role === 'teacher' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/teacher">Teacher</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/teacher/classrooms">My Classrooms</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/teacher/assignments">Assignments</Link></li>
                  </>
                )}

                {user && user.role === 'student' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/student/join">Join Classroom</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/student/assignments">My Assignments</Link></li>
                  </>
                )}

                {user && <li className="nav-item"><Link className="nav-link" to="/change-password">Change password</Link></li>}
                {user && <li className="nav-item"><button className="btn btn-sm btn-outline-secondary mt-2" onClick={logout}>Logout</button></li>}
              </ul>
            </div>
          </div>

        </div>
      </nav>

      <main className="container content">
        <Routes>
        <Route path="/" element={<div>Welcome to ZenAura (Demo)</div>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole role="admin"><AdminUsers /></RequireRole>} />
        <Route path="/admin/classrooms" element={<RequireRole role="admin"><AdminClassrooms /></RequireRole>} />
        <Route path="/admin/assignments" element={<RequireRole role="admin"><AdminAssignments /></RequireRole>} />
        <Route path="/admin/exams" element={<RequireRole role="admin"><AdminExams /></RequireRole>} />
        <Route path="/teacher" element={<RequireRole role="teacher"><TeacherDashboard /></RequireRole>} />
        <Route path="/teacher/classrooms" element={<RequireRole role="teacher"><TeacherClassrooms /></RequireRole>} />
        <Route path="/teacher/assignments" element={<RequireRole role="teacher"><TeacherAssignments /></RequireRole>} />
        <Route path="/student/join" element={<RequireRole role="student"><StudentJoin /></RequireRole>} />
        <Route path="/student/assignments" element={<RequireRole role="student"><StudentAssignments /></RequireRole>} />
  {/* /student/chat (legacy) removed */}
        </Routes>
      </main>
      <footer className="text-center py-3 bg-white border-top">
        <div className="container">ZenAura — demo app</div>
      </footer>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RequireRole({ children, role }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <div className="alert alert-danger">Forbidden: requires {role}</div>;
  return children;
}
