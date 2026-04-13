import { useState } from 'react'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/app/dashboard':   ['🎮', 'DASHBOARD'],
  '/app/courses':     ['📚', 'COURSES'],
  '/app/quests':      ['⚔️', 'DAILY QUESTS'],
  '/app/leaderboard': ['🏆', 'LEADERBOARD'],
  '/app/jobs':        ['💼', 'JOB BOARD'],
  '/app/profile':     ['👤', 'PROFILE'],
}

export default function TopBar({ userXP, streak, notifications, markNotifRead, refreshNotifications }) {
  const [showNotif, setShowNotif] = useState(false)
  const location = useLocation()
  const [icon, title] = PAGE_TITLES[location.pathname] ?? ['⚡', 'NEXTGENHIRE']
  const unread = notifications.filter(n => n.unread).length

  const toggle = () => {
    if (!showNotif) {
      refreshNotifications()
      markNotifRead()
    }
    setShowNotif(p => !p)
  }

  return (
    <header className="glass sticky top-0 z-40 px-6 py-3 flex items-center justify-between border-b border-border">
      <div className="font-orbitron text-sm text-slate-200 tracking-widest">
        {icon} {title}
      </div>

      <div className="flex items-center gap-3">
        <span className="chip chip-orange">🔥 {streak} Day Streak</span>
        <span className="chip chip-cyan">⚡ {userXP} XP</span>

        {/* Notifications */}
        <div className="relative cursor-pointer" onClick={toggle}>
          <span className="text-xl">🔔</span>
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-neon-pink flex items-center justify-center font-orbitron text-[9px] text-white">
              {unread}
            </span>
          )}

          {showNotif && (
            <div className="glass absolute top-[110%] right-0 w-72 rounded-xl overflow-hidden z-50 shadow-2xl">
              <div className="px-4 py-2 border-b border-border font-orbitron text-[10px] text-slate-400 tracking-widest">
                NOTIFICATIONS
              </div>
              {notifications.map(n => (
                <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-border/60 last:border-0 hover:bg-panel-2/60">
                  {n.unread && <div className="w-1.5 h-1.5 rounded-full bg-cyan mt-1.5 shrink-0" />}
                  <div>
                    <p className="text-[12px] leading-snug">{n.text}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
