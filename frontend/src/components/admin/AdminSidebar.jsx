import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/admin/dashboard',    icon: '📊', label: 'DASHBOARD'  },
  { to: '/admin/jobs',         icon: '💼', label: 'JOB POSTS'  },
  { to: '/admin/candidates',   icon: '👥', label: 'CANDIDATES' },
  { to: '/admin/rankings',     icon: '🏆', label: 'SKILL RANKS' },
  { to: '/admin/projects',     icon: '📁', label: 'PROJECTS'   },
]

export default function AdminSidebar() {
  return (
    <aside className="glass w-[200px] shrink-0 fixed top-0 left-0 bottom-0 flex flex-col z-50 border-r border-border">
      <div className="px-4 py-5 border-b border-border">
        <div className="font-orbitron text-[13px] tracking-widest text-neon-pink">
          ADMIN <span className="text-gold">PORTAL</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">NextGenHire Management</div>
      </div>

      <nav className="flex-1 py-2">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
          }}
          className="nav-item text-slate-500 border-transparent hover:border-transparent px-0 w-full flex items-center gap-3"
        >
          <span>🚪</span><span className="text-[10px]">EXIT ADMIN</span>
        </button>
      </div>
    </aside>
  )
}
