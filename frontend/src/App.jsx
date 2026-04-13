import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import AppLayout   from './components/layout/AppLayout'
import AdminLayout from './components/admin/AdminLayout'

// Components
import ProtectedRoute from './components/auth/ProtectedRoute'

// Pages
import Landing    from './pages/Landing'
import Auth       from './pages/Auth'
import Dashboard  from './pages/Dashboard'
import Courses    from './pages/Courses'
import Quests     from './pages/Quests'
import Leaderboard from './pages/Leaderboard'
import Jobs       from './pages/Jobs'
import Profile    from './pages/Profile'
import Lesson     from './pages/Lesson'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminJobs       from './pages/admin/AdminJobs'
import AdminCandidates from './pages/admin/AdminCandidates'
import AdminRankings   from './pages/admin/AdminRankings'
import AdminProjects   from './pages/admin/AdminProjects'
import AdminAuth       from './pages/admin/AdminAuth'

// State
import { useGameState } from './hooks/useGameState'

export default function App() {
  const gameState = useGameState()

  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<Landing />} />
      <Route path="/signin"      element={<Auth mode="signin" />} />
      <Route path="/signup"      element={<Auth mode="signup" />} />
      <Route path="/admin/login" element={<AdminAuth />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* App — Protected (Require login) */}
      <Route element={<ProtectedRoute redirectTo="/signin" />}>
        <Route path="/app" element={<AppLayout gameState={gameState} />}>
          <Route index                  element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard"       element={<Dashboard />} />
          <Route path="courses"         element={<Courses />} />
          <Route path="quests"          element={<Quests />} />
          <Route path="leaderboard"     element={<Leaderboard />} />
          <Route path="jobs"            element={<Jobs />} />
          <Route path="profile"         element={<Profile />} />
          <Route path="lessons/:course/:chapter" element={<Lesson />} />
        </Route>
      </Route>

      {/* Admin — Protected (Require role="admin") */}
      <Route element={<ProtectedRoute requiredRole="admin" redirectTo="/admin/login" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index               element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard"    element={<AdminDashboard />} />
          <Route path="jobs"         element={<AdminJobs />} />
          <Route path="candidates"   element={<AdminCandidates />} />
          <Route path="rankings"     element={<AdminRankings />} />
          <Route path="projects"     element={<AdminProjects />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
