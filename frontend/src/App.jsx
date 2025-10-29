import React, { useContext } from 'react';
import './styles/teacher.css';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import AuthPage from './pages/AuthPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminClassrooms from './pages/AdminClassrooms.jsx';
import AdminAssignments from './pages/AdminAssignments.jsx';
import AdminExams from './pages/AdminExams.jsx';
import AdminProfile from './pages/AdminProfile.jsx';
// Teacher home/dashboard removed - teachers go straight to classrooms
import TeacherDashboard from './pages/TeacherDashboard.jsx';
import TeacherClassrooms from './pages/TeacherClassrooms.jsx';
import TeacherAssignments from './pages/TeacherAssignments.jsx';
import TeacherClassroom from './pages/TeacherClassroom.jsx';
import TeacherAnalytics from './pages/TeacherAnalytics.jsx';
import TeacherProfile from './pages/TeacherProfile.jsx';
import StudentJoin from './pages/StudentJoin.jsx';
import StudentClassrooms from './pages/StudentClassrooms.jsx';
import StudentAssignments from './pages/StudentAssignments.jsx';
// StudentChat (ZenBot) removed
import StudentDashboard from './pages/StudentDashboard.jsx';
import StudentScheduler from './pages/StudentScheduler.jsx';
import StudentProfile from './pages/StudentProfile.jsx';
import { AuthContext } from './context/AuthContext.jsx';

function DashboardRouter() {
  // Redirect /dashboard to the correct role-specific dashboard
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
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
                {/* Home link removed from the main nav per request */}
                {!user && <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>}
                {!user && <li className="nav-item"><Link className="nav-link" to="/signup">Sign up</Link></li>}
                {user && <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>}

                {user && user.role === 'admin' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/classrooms">Classrooms</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/assignments">Assignments</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/admin/exams">Exams</Link></li>
                  </>
                )}

                {user && user.role === 'teacher' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/teacher/classrooms">My Classrooms</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/teacher/assignments">Assignments</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/teacher/analytics">Analytics</Link></li>
                  </>
                )}

                {user && user.role === 'student' && (
                  <>
                    <li className="nav-item"><Link className="nav-link" to="/student/join">Join Classroom</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/student/classrooms">Classroom</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/student/assignments">My Assignments</Link></li>
                    <li className="nav-item"><Link className="nav-link" to="/student/scheduler">Scheduler</Link></li>
                  </>
                )}

                {user && user.role === 'student' && (
                  <li className="nav-item"><Link className="nav-link" to="/student/profile">Profile</Link></li>
                )}
                {user && user.role !== 'student' && (
                  <li className="nav-item"><Link className="nav-link" to={user.role === 'teacher' ? '/teacher/profile' : user.role === 'admin' ? '/admin/profile' : '/change-password'}>Profile</Link></li>
                )}
                {user && <li className="nav-item"><button className="btn btn-sm btn-outline-secondary mt-2" onClick={logout}>Logout</button></li>}
              </ul>
            </div>
          </div>

        </div>
      </nav>

      <main className="container content">
        <TransitionGroup component={null}>
          <CSSTransition key={location.pathname} classNames="page" timeout={300}>
            <div className="route-wrap">
              <Routes location={location}>
          <Route path="/" element={
            user && user.role === 'student' ? <Navigate to="/student/dashboard" replace /> : (user && user.role === 'teacher' ? <Navigate to="/teacher/dashboard" replace /> : <Home />)
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardRouter /></RequireAuth>} />
          <Route path="/student/dashboard" element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
          <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/admin/dashboard" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route path="/admin/profile" element={<RequireRole role="admin"><AdminProfile /></RequireRole>} />
          <Route path="/admin/users" element={<RequireRole role="admin"><AdminUsers /></RequireRole>} />
          <Route path="/admin/classrooms" element={<RequireRole role="admin"><AdminClassrooms /></RequireRole>} />
          <Route path="/admin/assignments" element={<RequireRole role="admin"><AdminAssignments /></RequireRole>} />
          <Route path="/admin/exams" element={<RequireRole role="admin"><AdminExams /></RequireRole>} />
          {/* Teacher dashboard route */}
          <Route path="/teacher/dashboard" element={<RequireRole role="teacher"><TeacherDashboard /></RequireRole>} />
          <Route path="/teacher/profile" element={<RequireRole role="teacher"><TeacherProfile /></RequireRole>} />
          <Route path="/teacher/classrooms" element={<RequireRole role="teacher"><TeacherClassrooms /></RequireRole>} />
          <Route path="/teacher/classrooms/:id" element={<RequireRole role="teacher"><TeacherClassroom /></RequireRole>} />
          <Route path="/teacher/assignments" element={<RequireRole role="teacher"><TeacherAssignments /></RequireRole>} />
          <Route path="/teacher/analytics" element={<RequireRole role="teacher"><TeacherAnalytics /></RequireRole>} />
          <Route path="/student/join" element={<RequireRole role="student"><StudentJoin /></RequireRole>} />
          <Route path="/student/classrooms" element={<RequireRole role="student"><StudentClassrooms /></RequireRole>} />
          <Route path="/student/assignments" element={<RequireRole role="student"><StudentAssignments /></RequireRole>} />
          {/* /student/chat (ZenBot) removed */}
          <Route path="/student/scheduler" element={<RequireRole role="student"><StudentScheduler /></RequireRole>} />
          <Route path="/student/profile" element={<RequireRole role="student"><StudentProfile /></RequireRole>} />
              </Routes>
            </div>
          </CSSTransition>
        </TransitionGroup>
      </main>
      <footer className="text-center py-3 bg-white border-top app-footer">
        <div className="container">
          <div className="quote">“Small steps every day lead to big results 🌱”</div>
          <div>© 2025 ZenAura | Smart Learning Platform</div>
        </div>
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
