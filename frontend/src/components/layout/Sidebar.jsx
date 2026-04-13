import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import ProgressBar from '../ui/ProgressBar'

const NAV = [
  { to: '/app/dashboard',    icon: '🎮', label: 'DASHBOARD'  },
  { to: '/app/courses',      icon: '📚', label: 'COURSES'    },
  { to: '/app/quests',       icon: '⚔️', label: 'DAILY QUESTS' },
  { to: '/app/leaderboard',  icon: '🏆', label: 'LEADERBOARD' },
  { to: '/app/jobs',         icon: '💼', label: 'JOB BOARD'  },
  { to: '/app/profile',      icon: '👤', label: 'PROFILE'    },
]

function getStored() {
  try { return JSON.parse(localStorage.getItem('user')) } 
  catch { return null }
}

export default function Sidebar({ 
  userXP, 
  level, 
  levelXP, 
  streak, 
  dailyQuests = [], 
  weeklyChallenges = [], 
  notifications = [], 
  showXP = false 
}) {
  const [localUser, setLocalUser] = useState(getStored())

  const hasQuestNotice = [...dailyQuests, ...weeklyChallenges].some(q => q.status === 'completed')
  const hasGeneralNotice = notifications.some(n => n.unread)

  useEffect(() => {
    const handleUpdate = () => setLocalUser(getStored())
    window.addEventListener('profileUpdated', handleUpdate)
    return () => window.removeEventListener('profileUpdated', handleUpdate)
  }, [])
  
  const dName = localUser?.name || 'Player One'
  const dEmail = localUser?.email || 'player@nextgenhire.com'
  const dAvatar = localUser?.avatar || '⭐'

  return (
    <aside className="glass w-[220px] shrink-0 fixed top-0 left-0 bottom-0 flex flex-col z-50 border-r border-border">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="font-orbitron text-[15px] tracking-widest text-cyan">
          NEXTGEN<span className="text-gold">HIRE</span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Learning & Hiring Platform</div>
      </div>

      {/* Player card */}
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-cyan shrink-0"
            style={{ background: 'linear-gradient(135deg,#00f5ff,#8b5cf6)', boxShadow: '0 0 14px rgba(0,245,255,0.4)' }}
          >{dAvatar}</div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">{dName}</div>
            <div className="text-[10px] text-slate-500">{dEmail}</div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-1.5">
          <span className="font-orbitron text-[10px] text-gold">LVL {level}</span>
          <span className="text-[10px] text-slate-500">{levelXP}/500 XP</span>
        </div>
        <ProgressBar value={levelXP} max={500} color="linear-gradient(90deg,#ffd700,#ffb300)" />

        <div className="flex gap-2 mt-2.5">
          <span className="chip chip-green text-[10px]">🔥 {streak}d</span>
          <span className={`chip chip-cyan text-[10px] transition-all duration-300 ${showXP ? 'bg-gold/20 text-gold border-gold shadow-[0_0_15px_rgba(255,215,0,0.6)] scale-110' : ''}`}>
            ⚡ {userXP} XP
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV.map(({ to, icon, label }) => {
          const isQuests = label.includes('QUEST')
          const isDash   = label.includes('DASHBOARD')
          const showDot  = (isQuests && hasQuestNotice) || (isDash && hasGeneralNotice)

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-item relative ${isActive ? 'active' : ''}`
              }
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
              {showDot && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-cyan shadow-[0_0_8px_#00f5ff] animate-pulse" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }}
          className="nav-item text-neon-pink border-transparent hover:border-transparent hover:bg-neon-pink/10 px-0 w-full flex items-center gap-3"
        >
          <span className="text-base text-neon-pink">🚪</span>
          <span className="text-[10px] text-neon-pink font-semibold">LOGOUT</span>
        </button>
      </div>
    </aside>
  )
}
