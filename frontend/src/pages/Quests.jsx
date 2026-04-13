import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import ProgressBar from '../components/ui/ProgressBar'
import { RARITY_COLORS } from '../data'

export default function Quests() {
  const { streak, claimedQuests, canSpinToday, spinWheel, dailyQuests, weeklyChallenges, claimQuestServer } = useOutletContext()
  const [spinning, setSpinning] = useState(false)
  const [spinResult, setSpinResult] = useState(null)
  
  // Real-time Countdown State
  const [timeLeft, setTimeLeft] = useState('')
  const [daysUntilWeekEnd, setDaysUntilWeekEnd] = useState(0)

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // ── Countdown logic ────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Calculate time until next midnight (Daily reset)
    const updateDailyTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diffInSecs = Math.floor((tomorrow - now) / 1000);
      
      const h = Math.floor(diffInSecs / 3600).toString().padStart(2, '0');
      const m = Math.floor((diffInSecs % 3600) / 60).toString().padStart(2, '0');
      const s = (diffInSecs % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${h}:${m}:${s}`);
    };

    // 2. Calculate days until Sunday (Weekly reset)
    const updateWeeklyTimer = () => {
      const now = new Date();
      const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1 (Mon) to 7 (Sun)
      setDaysUntilWeekEnd(7 - currentDay);
    };

    const timer = setInterval(updateDailyTimer, 1000);
    updateDailyTimer();
    updateWeeklyTimer();

    return () => clearInterval(timer);
  }, []);

  const handleSpin = () => {
    if (spinning || !canSpinToday) return
    setSpinning(true)
    setSpinResult(null)
    const prizes = [10, 15, 20, 25, 30, 50, 75, 100]
    const result = prizes[Math.floor(Math.random() * prizes.length)]
    setTimeout(() => {
      setSpinResult(result)
      setSpinning(false)
      spinWheel(result)
    }, 1200)
  }

  return (
    <div className="max-w-[1000px] space-y-5 animate-fade-in">

      {/* Streak Tracker */}
      <div
        className="glass p-6 rounded-xl overflow-hidden relative"
        style={{ 
            background: 'linear-gradient(135deg,rgba(255,107,53,0.08),rgba(255,45,120,0.05))', 
            borderColor: 'rgba(255,107,53,0.3)',
            boxShadow: '0 0 40px rgba(255,107,53,0.05)'
        }}
      >
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-neon-orange animate-pulse" />
                <p className="font-orbitron text-sm text-neon-orange tracking-[0.2em] font-bold">STREAK TRACKER</p>
            </div>
            <p className="text-slate-400 text-[13px] mt-1 font-rajdhani">
              {streak > 0 
                ? `You're on a ${streak}-day hot streak! Don't let the fire die out.` 
                : "Your streak is cold. Log in today to light the fire! ❄️"}
            </p>
          </div>
          <div className="text-center bg-black/30 px-5 py-2 rounded-2xl border border-white/5 shadow-inner">
            <div className="font-orbitron text-4xl font-black text-neon-orange leading-none">{streak}</div>
            <div className="text-[10px] text-slate-500 tracking-widest font-bold">DAYS</div>
          </div>
        </div>
        
        <div className="flex gap-2.5">
          {weekDays.map((d, i) => {
            // Logic: if streak is N, we show N fires filled starting from Monday (basic behavior)
            // Or better: highlight up to the current day of the week based on streak.
            const now = new Date();
            const currentDayOfISOWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 (Mon) to 6 (Sun)
            const displayStreak = (streak % 7 === 0 && streak > 0) ? 7 : (streak % 7)
            const active = i < displayStreak
            const isToday = i === currentDayOfISOWeek

            return (
              <div key={d} className="flex-1 text-center group">
                <p className={`text-[10px] mb-2 font-orbitron tracking-tighter ${isToday ? 'text-neon-orange' : 'text-slate-500'}`}>
                    {d.toUpperCase()}
                </p>
                <div
                  className={`w-full aspect-square rounded-xl flex items-center justify-center text-xl transition-all duration-500 transform ${active ? 'scale-100' : 'scale-95 grayscale'}`}
                  style={{
                    background: active ? 'linear-gradient(135deg,#ff6b35,#ff2d78)' : 'rgba(15, 22, 40, 0.6)',
                    border: `1px solid ${active ? 'rgba(255,107,53,0.5)' : isToday ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)'}`,
                    boxShadow: active ? '0 0 20px rgba(255,107,53,0.3)' : 'none',
                  }}
                >
                  <span className={active ? 'animate-bounce-slow' : 'opacity-20'}>
                    {active ? '🔥' : '❄️'}
                  </span>
                  {isToday && !active && (
                    <div className="absolute inset-0 rounded-xl border-2 border-neon-orange/30 animate-pulse pointer-events-none" />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Quests */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <p className="font-orbitron text-xs text-slate-300 tracking-[0.1em] font-bold">DAILY QUESTS</p>
                <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" />
            </div>
            <span className="chip chip-pink text-[10px] font-orbitron font-bold">Resets in {timeLeft || '00:00:00'}</span>
          </div>
          <div className="space-y-3">
          {dailyQuests.length > 0 ? dailyQuests.map(q => {
            const done      = q.status === 'completed' || q.status === 'claimed'
            const isClaimed = q.status === 'claimed'
            const questKey  = q._id || q.id
            
            return (
              <div key={questKey} className={`quest-card transition-all duration-500 ${done ? 'border-neon-green shadow-lg shadow-neon-green/5' : 'hover:border-cyan/40 hover:bg-white/5'}`} style={{ borderLeftColor: done ? '#00ff9d' : '#00f5ff' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-black/20 ${done ? 'text-neon-green' : 'text-cyan'}`}>
                        {q.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold font-rajdhani">{q.title}</p>
                      <p className="text-[11px] text-slate-500 font-rajdhani">{q.desc || q.description}</p>
                    </div>
                  </div>
                  <span className="font-orbitron text-[11px] text-gold tracking-widest">+{q.xp} XP</span>
                </div>
                <ProgressBar value={q.progress} max={q.max} color={done ? '#00ff9d' : '#00f5ff'} height="h-1.5" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] font-orbitron text-slate-500 tracking-widest">{q.progress} / {q.max}</span>
                  {q.status === 'completed' && (
                    <button 
                        className="btn btn-sm btn-gold px-4 py-1.5 animate-bounce-slow text-[10px] font-bold tracking-widest" 
                        onClick={() => claimQuestServer(q)}
                    >
                        CLAIM ✨
                    </button>
                  )}
                  {isClaimed && <span className="text-neon-green text-[11px] font-bold tracking-widest font-orbitron">✓ CLAIMED</span>}
                  {q.status !== 'completed' && !isClaimed && (
                    <span className="text-[10px] text-cyan/50 font-orbitron uppercase tracking-widest">In Progress</span>
                  )}
                </div>
              </div>
            )
          }) : (
            <div className="p-8 text-center glass rounded-xl border-white/5 text-slate-500 font-rajdhani text-sm italic">
                No active daily quests available...
            </div>
          )}
          </div>
        </div>

        {/* Weekly Challenges */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="font-orbitron text-xs text-slate-300 tracking-[0.1em] font-bold">WEEKLY CHALLENGES</p>
            <span className="chip chip-purple text-[10px] font-orbitron font-bold">
                {daysUntilWeekEnd} {daysUntilWeekEnd === 1 ? 'DAY' : 'DAYS'} LEFT
            </span>
          </div>
          <div className="space-y-3">
          {weeklyChallenges.length > 0 ? weeklyChallenges.map(q => {
            const done      = q.progress >= q.max
            const questKey  = q.key || q.questKey || q._id || q.id
            const isClaimed = claimedQuests.includes(questKey)
            const rc        = RARITY_COLORS[q.rarity] || '#8b5cf6'
            return (
              <div key={questKey} className="quest-card hover:bg-white/5 transition-all" style={{ borderLeftColor: rc }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-black/20" style={{ color: rc }}>
                        {q.icon}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold font-rajdhani">{q.title}</p>
                      <p className="text-[11px] text-slate-500 font-rajdhani">{q.desc || q.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className="font-orbitron text-[11px] text-gold">+{q.xp} XP</span>
                    <span className="text-[9px] uppercase tracking-widest font-bold font-orbitron" style={{ color: rc }}>{q.rarity}</span>
                  </div>
                </div>
                <ProgressBar value={q.progress} max={q.max} color={rc} height="h-1.5" />
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] font-orbitron text-slate-500 tracking-widest">{q.progress} / {q.max}</span>
                  {done && !isClaimed && (
                    <button 
                        className="btn btn-sm btn-gold px-4 py-1.5 text-[10px] font-bold tracking-widest shadow-lg shadow-gold/20" 
                        onClick={() => claimQuestServer({ ...q, key: questKey })}
                    >
                        CLAIM ✨
                    </button>
                  )}
                  {isClaimed && <span className="text-neon-green text-[11px] font-bold font-orbitron tracking-widest">✓ CLAIMED</span>}
                  {!done && <span className="text-purple-400 text-[10px] font-orbitron tracking-widest opacity-50">CHALLENGE</span>}
                </div>
              </div>
            )
          }) : (
            <div className="p-8 text-center glass rounded-xl border-white/5 text-slate-500 font-rajdhani text-sm italic">
                No active weekly challenges...
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Daily Spin */}
      <div
        className="glass p-8 rounded-xl text-center relative overflow-hidden group"
        style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.06),rgba(0,245,255,0.04))', borderColor: 'rgba(139,92,246,0.2)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan/5 to-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <p className="font-orbitron text-sm text-neon-purple mb-2 tracking-[0.2em] font-bold uppercase">🎰 DAILY BONUS SPIN</p>
        <p className="text-slate-400 text-sm mb-8 font-rajdhani max-w-lg mx-auto">Spin once a day for bonus XP, rare badges, and surprise rewards from the NextGen vault!</p>

        <div className="flex items-center justify-center gap-5 mb-8 flex-wrap">
          {['🎯','⚡','💎','🔥','🌟','🚀','💰','🎁'].map((emoji, i) => (
            <div
              key={i}
              className={`text-3xl transition-all duration-300 ${spinning ? 'scale-110' : 'scale-100'}`}
              style={{ 
                  animation: spinning ? `float ${0.3 + i * 0.1}s ease-in-out infinite alternate` : 'none', 
                  opacity: spinning ? 1 : 0.3,
                  filter: spinning ? 'drop-shadow(0 0 10px rgba(139,92,246,0.5))' : 'none'
              }}
            >{emoji}</div>
          ))}
        </div>

        <div className="relative inline-block mt-2">
            {spinResult && (
              <div className="mb-6 font-orbitron text-2xl text-gold animate-bounce-in flex items-center justify-center gap-2">
                <span className="text-3xl">🎁</span>
                JACKPOT: +{spinResult} XP!
                <span className="text-3xl">🎁</span>
              </div>
            )}

            {!canSpinToday && !spinning && !spinResult && (
              <p className="text-slate-500 text-[13px] mb-6 font-orbitron tracking-widest uppercase bg-black/20 py-2 px-6 rounded-full inline-block border border-white/5">
                Next session available at midnight
              </p>
            )}

            <button
              className={`btn btn-lg px-12 py-4 rounded-xl transition-all duration-300 transform font-orbitron font-black tracking-widest text-base ${canSpinToday ? 'btn-purple hover:scale-105 active:scale-95 shadow-lg shadow-purple/20' : 'bg-white/5 border-white/10 text-slate-600 cursor-not-allowed'}`}
              onClick={handleSpin}
              disabled={spinning || !canSpinToday}
            >
              {spinning ? '🎰 NEURAL SPINNING...' : canSpinToday ? '🎰 SPIN NOW' : '✓ SPIN COMPLETE'}
            </button>
        </div>
      </div>

      {/* XP Breakdown */}
      <div className="glass p-6 rounded-xl border-white/5">
        <div className="flex items-center gap-3 mb-5">
            <p className="font-orbitron text-xs text-slate-400 tracking-[0.2em] font-bold">REWARD SYSTEMS</p>
            <div className="h-px flex-1 bg-white/5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ['📖','Chapter Complete','5 XP', '#00f5ff'],
            ['⚔️','Quiz Achievement','50 XP', '#00ff9d'],
            ['🏗️','Course Clearance','200 XP', '#ff2d78'],
            ['💼','Career Prospect','20 XP', '#8b5cf6']
          ].map(([icon, label, xp, color]) => (
            <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center group hover:bg-white/5 transition-all">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{icon}</div>
              <div className="text-[10px] text-slate-500 mb-1 font-orbitron tracking-tighter uppercase">{label}</div>
              <div className="font-orbitron font-bold text-[14px]" style={{ color }}>{xp}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
