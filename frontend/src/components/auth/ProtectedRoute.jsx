import { Navigate, Outlet } from 'react-router-dom'
import { getStoredUser } from '../../services/http'

/**
 * ProtectedRoute — prevents unauthorized access to routes.
 * 
 * @param {Object} props
 * @param {string} [props.requiredRole] - If specified, user must have this role.
 * @param {string} props.redirectTo - Where to go if not logged in.
 */
export default function ProtectedRoute({ requiredRole, redirectTo }) {
  const user  = getStoredUser()
  const token = localStorage.getItem('token')

  // 1. Not logged in at all
  if (!user || !token) {
    return <Navigate to={redirectTo || "/signin"} replace />
  }

  // 2. Logged in, but lacks required role (if any)
  if (requiredRole && user.role !== requiredRole) {
    // If they are an admin trying to access student app (role is student required? no, usually admins can view student side)
    return <Navigate to={redirectTo || "/signin"} replace />
  }

  // 3. All good — render the child route
  return <Outlet />
}
