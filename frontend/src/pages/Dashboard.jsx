import { useOutletContext, useNavigate } from 'react-router-dom'
import StatBox from '../components/ui/StatBox'
import ProgressBar from '../components/ui/ProgressBar'
import { COURSES, ACHIEVEMENTS, RARITY_COLORS } from '../data'

export default function Dashboard() {
  const nav = useNavigate()
  const { user, userXP, level, levelXP, streak, enrolledCourses, completedChapters, dailyQuests, weeklyChallenges, leaderboard } = useOutletContext()
  const totalChapters = Object.values(completedChapters).reduce((a, b) => a + b.length, 0)

  return (
    <div className="max-w-[1200px] space-y-5">

      {/* Welcome banner */}
      <div
        className="glass rounded-xl px-7 py-6 relative overflow-hidden border-border-2"
        style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.05),rgba(139,92,246,0.05))' }}
      >
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[80px] opacity-[0.05] select-none">⚡</div>
        <h2 className="text-xl font-bold mb-1">
          Welcome back, <span className="text-neon-c">{user?.name || 'Player One'}</span> 👾
        </h2>
        <p className="text-slate-400 text-sm">You're on a {streak}-day streak! Keep the momentum going.</p>
        <div className="flex gap-3 mt-4">
          <button className="btn btn-md btn-cyan"    onClick={() => nav('/app/courses')}>📚 Continue Learning</button>
          <button className="btn btn-md btn-outline" onClick={() => nav('/app/quests')} >⚔️ Daily Quests</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatBox label="Total XP"     value={userXP}             icon="⚡" color="#ffd700" />
        <StatBox label="Level"        value={level}              icon="🎯" color="#00f5ff" />
        <StatBox label="Streak"       value={`${streak}d`}       icon="🔥" color="#ff6b35" />
        <StatBox label="Courses"      value={enrolledCourses.length} icon="📚" color="#8b5cf6" />
        <StatBox label="Chapters Done" value={totalChapters}     icon="✅" color="#00ff9d" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active courses */}
        <div className="glass p-5 rounded-xl">
          <p className="section-label">ACTIVE COURSES</p>
          <div className="space-y-4">
            {Array.from(new Set([
              ...enrolledCourses,
              ...Object.keys(completedChapters).filter(cid => (completedChapters[cid] || []).length > 0)
            ])).slice(0, 3).map(cid => {
              const course = COURSES.find(c => c.id === cid)
              if (!course) return null;
              
              const done   = (completedChapters[cid] || []).length
              const total  = course.chapters.length
              const pct    = Math.round((done / total) * 100)
              return (
                <div key={cid} className="animate-fade-in">
                  <div className="flex justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{course.icon}</span>
                      <span className="font-semibold text-sm">{course.title}</span>
                    </div>
                    <span className="font-mono text-[12px] text-slate-400">{pct}%</span>
                  </div>
                  <ProgressBar value={done} max={total} color={course.color} />
                </div>
              )
            })}
            
            {(enrolledCourses.length === 0 && !Object.keys(completedChapters).some(cid => (completedChapters[cid] || []).length > 0)) && (
              <div className="py-6 text-center">
                <p className="text-slate-500 text-xs italic mb-4">No active courses yet. Start your learning journey!</p>
                <button className="btn btn-sm btn-cyan" onClick={() => nav('/app/courses')}>Browse Courses</button>
              </div>
            )}
          </div>
          {(enrolledCourses.length > 0 || Object.keys(completedChapters).length > 0) && (
            <button className="btn btn-sm btn-outline mt-4 w-full" onClick={() => nav('/app/courses')}>View All Courses →</button>
          )}
        </div>

        {/* Daily & Weekly Quests combined for Dashboard */}
        <div className="glass p-5 rounded-xl">
          <p className="section-label">DAILY & WEEKLY QUESTS</p>
          {[...(dailyQuests || []), ...(weeklyChallenges || [])].map(q => {
            const isWeekly = (q.type || '').toLowerCase() === 'weekly';
            return (
              <div key={q._id || q.id || Math.random()} className={`quest-card bg-bg-3 mb-3 border-cyan/40 ${isWeekly ? 'border-purple/40' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl animate-pulse">{q.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-bold">{q.title}</p>
                        <span className={`text-[9px] px-1.5 rounded-full border ${isWeekly ? 'text-purple border-purple/30 bg-purple/5' : 'text-cyan border-cyan/30 bg-cyan/5'}`}>
                          {isWeekly ? 'WEEKLY' : 'DAILY'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{q.progress}/{q.max}</p>
                    </div>
                  </div>
                  <span className="chip chip-gold text-[10px]">+{q.xp} XP</span>
                </div>
                <ProgressBar
                  value={q.progress} max={q.max}
                  color={q.progress >= q.max ? '#00ff9d' : (isWeekly ? '#8b5cf6' : '#00f5ff')}
                />
              </div>
            );
          })}
          {dailyQuests?.length === 0 && weeklyChallenges?.length === 0 && (
            <p className="text-center text-slate-500 text-xs py-4 italic">No quests active today.</p>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="glass p-5 rounded-xl">
        <p className="section-label">RECENT ACHIEVEMENTS</p>
        <div className="flex gap-4 flex-wrap">
          {ACHIEVEMENTS.slice(0, 8).map((ach, i) => {
            const earned = i < 4
            return (
              <div
                key={ach.id}
                className="text-center transition-all duration-200"
                style={{ opacity: earned ? 1 : 0.35 }}
                title={ach.desc}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mx-auto mb-1.5"
                  style={{
                    background:  `${RARITY_COLORS[ach.rarity]}22`,
                    border:      `2px solid ${RARITY_COLORS[ach.rarity]}`,
                    boxShadow:   earned ? `0 0 14px ${RARITY_COLORS[ach.rarity]}44` : 'none',
                  }}
                >
                  {earned ? ach.icon : '🔒'}
                </div>
                <p className="text-[9px] text-slate-500 max-w-[56px]">{ach.title}</p>
              </div>
            )
          })}
          <div className="flex items-center pl-2">
            <button className="btn btn-sm btn-outline" onClick={() => nav('/app/profile')}>+{ACHIEVEMENTS.length - 8} More</button>
          </div>
        </div>
      </div>

      {/* Mini leaderboard */}
      <div className="glass p-5 rounded-xl">
        <p className="section-label">TOP PLAYERS THIS WEEK</p>
        <div className="flex flex-col gap-2">
          {(leaderboard || []).slice(0, 4).map((p, idx) => (
            <div
              key={p._id || p.id || `${p.rank}-${idx}`}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border transition-all ${
                p.isYou ? 'border-cyan/40 bg-cyan/5' : 'border-border bg-bg-3'
              }`}
            >
              <span className={`font-orbitron font-black text-base w-8 ${['rank-1','rank-2','rank-3','text-slate-500'][p.rank - 1] ?? 'text-slate-500'}`}>
                #{p.rank}
              </span>
              <span className="text-2xl">{p.avatar || '⭐'}</span>
              <span className="flex-1 font-semibold text-sm">
                {p.name}{p.isYou && <span className="text-cyan text-[10px] ml-2 font-orbitron">(YOU)</span>}
              </span>
              <span className="font-orbitron text-[12px] text-gold">⚡{p.xp}</span>
              <span className="chip chip-orange text-[10px]">🔥{p.streak ?? 0}d</span>
            </div>
          ))}
        </div>
        <button className="btn btn-sm btn-outline mt-3" onClick={() => nav('/app/leaderboard')}>Full Leaderboard →</button>
      </div>
    </div>
  )
}
