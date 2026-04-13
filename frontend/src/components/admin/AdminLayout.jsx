import { Outlet, useLocation } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

const TITLES = {
  '/admin/dashboard':  ['📊', 'DASHBOARD'],
  '/admin/jobs':       ['💼', 'JOB POSTS'],
  '/admin/candidates': ['👥', 'CANDIDATES'],
  '/admin/rankings':   ['🏆', 'SKILL RANKS'],
  '/admin/projects':   ['📁', 'PROJECT SUBMISSIONS'],
}

export default function AdminLayout() {
  const location = useLocation()
  const [icon, title] = TITLES[location.pathname] ?? ['⚡', 'ADMIN']

  return (
    <div className="flex min-h-screen bg-bg grid-bg">
      <AdminSidebar />
      <div className="ml-[200px] flex-1 flex flex-col">
        <header className="glass sticky top-0 z-40 px-6 py-3 flex items-center justify-between border-b border-border">
          <div className="font-orbitron text-sm tracking-widest">
            {icon} {title}
          </div>
          <span className="chip chip-pink text-[10px]">🔐 Admin Access</span>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
