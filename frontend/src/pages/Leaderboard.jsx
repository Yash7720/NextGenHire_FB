import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import ProgressBar from '../components/ui/ProgressBar'

// ── Rank tier colours & labels ────────────────────────────────────────────────
const TIER_META = {
  '🏆 Legend': { color: '#ff6b35', glow: 'rgba(255,107,53,0.4)',  bg: 'rgba(255,107,53,0.08)'  },
  '💎 Master':  { color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)', bg: 'rgba(139,92,246,0.08)' },
  '⚡ Pro':     { color: '#00f5ff', glow: 'rgba(0,245,255,0.35)', bg: 'rgba(0,245,255,0.06)'  },
  '🔥 Warrior': { color: '#ffd700', glow: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.06)'  },
  '🎯 Recruit': { color: '#64748b', glow: 'none',                  bg: 'transparent'            },
}

function tierMeta(badge) {
  for (const key of Object.keys(TIER_META)) {
    if ((badge || '').includes(key.split(' ')[1])) return TIER_META[key]
  }
  return TIER_META['🎯 Recruit']
}

// ── Podium card ───────────────────────────────────────────────────────────────
function PodiumCard({ player, height, rankColor, rankNum }) {
  if (!player) return <div style={{ width: 90 }} />
  return (
    <div className="flex flex-col items-center" style={{ width: 110 }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>
        {player.avatar || (rankNum === 1 ? '👑' : '⭐')}
      </div>
      <div
        className="font-orbitron text-[11px] text-center mb-0.5 truncate max-w-[100px]"
        style={{ color: rankColor }}
      >
        {player.name}
      </div>
      <div className="font-orbitron text-[10px] text-slate-500 mb-0.5">⚡{player.xp} XP</div>
      <div className="text-[10px] text-slate-500 mb-1.5">
        📚{player.courses ?? 0} · 🔥{player.streak ?? 0}d
      </div>
      <div
        className="w-full flex items-start justify-center pt-2 rounded-t-lg"
        style={{
          height,
          background: `linear-gradient(180deg,${rankColor}44,${rankColor}11)`,
          border: `1px solid ${rankColor}`,
          boxShadow: `0 0 24px ${rankColor}33`,
        }}
      >
        <span className="font-orbitron text-xl font-black" style={{ color: rankColor }}>
          #{rankNum}
        </span>
      </div>
    </div>
  )
}

// ── Main Leaderboard page ─────────────────────────────────────────────────────
export default function Leaderboard() {
  const {
    userXP, leaderboard, completedProjects, liveCourses, streak, fetchAndSetLeaderboard,
  } = useOutletContext()

  const [period, setPeriod]         = useState('alltime')



  // Page-level 5 s auto-refresh (global hook also polls every 10 s)
  useEffect(() => {
    const t = setInterval(() => fetchAndSetLeaderboard(), 5000)
    return () => clearInterval(t)
  }, [fetchAndSetLeaderboard])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const list = leaderboard || []
  const top3 = list.slice(0, 3)

  // Podium: 2nd | 1st | 3rd
  const podiumOrder  = [top3[1], top3[0], top3[2]].filter(Boolean)
  const podiumH      = [130, 175, 110]
  const podiumColors = ['#c0c0c0', '#ffd700', '#cd7f32']
  const podiumRanks  = podiumOrder.map(p => p?.rank)

  const me        = list.find(p => p.isYou) || null
  const myRank    = me?.rank ?? 0
  const aboveMe   = myRank > 1 ? list.find(p => p.rank === myRank - 1) : null
  const myScore   = me?.score ?? 0
  const nextScore = aboveMe?.score ?? myScore
  const needMore  = Math.max(0, nextScore - myScore)
  const myBadge   = me?.badge ?? '🎯 Recruit'
  const myMeta    = tierMeta(myBadge)

  return (
    <div className="max-w-[960px]">

      {/* Keyframes */}
      <style>{`
        @keyframes lb-spin  { to { transform: rotate(360deg); } }
        @keyframes lb-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        {/* Title */}
        <div>
          <p className="font-orbitron text-xs text-neon-orange tracking-[0.2em] font-bold mb-2 uppercase">PLATFORM RANKINGS</p>
          <h1 className="text-4xl font-black font-orbitron tracking-tighter bg-gradient-to-r from-gold via-[#fff1a8] to-gold bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            GLOBAL LEADERBOARD
          </h1>
          <p className="text-[11px] text-slate-500 font-rajdhani mt-1 italic opacity-60">
            Top performers across the NextGen network.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {['daily', 'weekly', 'alltime'].map(p => (
            <button
              key={p}
              className={`tab-btn ${period === p ? 'tab-active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Podium ── */}
      <div
        className="glass p-6 rounded-xl mb-5"
        style={{ background: 'linear-gradient(135deg,rgba(255,215,0,0.04),rgba(0,245,255,0.04))' }}
      >
        <div className="font-orbitron text-[10px] text-slate-600 text-center tracking-widest mb-4">
          TOP WARRIORS
        </div>
        <div className="flex justify-center items-end gap-4">
          {podiumOrder.map((p, i) => (
            <PodiumCard
              key={p._id || p.id || i}
              player={p}
              height={podiumH[i]}
              rankColor={podiumColors[i]}
              rankNum={podiumRanks[i]}
            />
          ))}
        </div>
      </div>

      {/* ── Tier legend ── */}
      <div className="glass rounded-xl p-4 mb-5">
        <div className="font-orbitron text-[10px] text-slate-500 tracking-widest mb-3">RANK TIERS</div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(TIER_META).map(([label, meta]) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
              style={{ background: meta.bg, border: `1px solid ${meta.color}44`, color: meta.color }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Full rankings table ── */}
      <div className="glass rounded-xl overflow-hidden mb-5">

        {/* Table header */}
        <div
          className="px-5 py-3 border-b border-border font-orbitron text-[10px] text-slate-500 tracking-widest"
          style={{ display: 'grid', gridTemplateColumns: '48px 1fr 90px 90px 80px 110px' }}
        >
          <span>RANK</span>
          <span>PLAYER</span>
          <span>TOTAL XP</span>
          <span>COURSES</span>
          <span>STREAK</span>
          <span>BADGE</span>
        </div>

        {/* Rows */}
        {list.map((p, idx) => {
          const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']
          const rc         = p.rank <= 3 ? rankColors[p.rank - 1] : '#64748b'
          const meta       = tierMeta(p.badge)

          return (
            <div
              key={p._id || p.id || `${p.rank}-${idx}`}
              className="border-b border-border/60 last:border-0 transition-all"
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 90px 90px 80px 110px',
                alignItems: 'center',
                padding: '12px 20px',
                background: p.isYou ? 'rgba(0,245,255,0.05)' : 'transparent',
                borderLeft: p.isYou ? '2px solid rgba(0,245,255,0.4)' : '2px solid transparent',
              }}
            >
              {/* Rank */}
              <span className="font-orbitron text-base font-black" style={{ color: rc }}>
                #{p.rank}
              </span>

              {/* Player */}
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {p.avatar || (p.rank === 1 ? '👑' : '⭐')}
                </span>
                <div>
                  <div className="font-semibold text-sm leading-tight">
                    {p.name}
                    {p.isYou && (
                      <span className="ml-2 font-orbitron text-[9px] text-cyan bg-cyan/10 px-1.5 py-0.5 rounded">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Score: {p.score?.toLocaleString() ?? 0}
                  </div>
                </div>
              </div>

              {/* XP */}
              <div className="font-orbitron text-[12px] text-gold">
                ⚡ {(p.xp || 0).toLocaleString()}
              </div>

              {/* Courses */}
              <div>
                <div className="text-sm text-slate-300">📚 {p.courses ?? 0}</div>
                <div className="text-[10px] text-slate-600">completed</div>
              </div>

              {/* Streak */}
              <div className="text-sm" style={{ color: p.streak > 0 ? '#ff6b35' : '#64748b' }}>
                🔥 {p.streak ?? 0}d
              </div>

              {/* Badge */}
              <div
                className="text-[10px] font-semibold px-2 py-1 rounded-lg text-center"
                style={{
                  background: meta.bg,
                  border: `1px solid ${meta.color}55`,
                  color: meta.color,
                  boxShadow: p.rank <= 3 ? `0 0 8px ${meta.glow}` : 'none',
                }}
              >
                {p.badge ?? '🎯 Recruit'}
              </div>
            </div>
          )
        })}

        {list.length === 0 && (
          <div className="px-5 py-10 text-center text-slate-500 text-sm">
            No warriors yet — earn XP to appear on the board! ⚡
          </div>
        )}
      </div>

      {/* ── Ranking Info ── */}
      <div className="mt-8 mb-5 glass p-6 rounded-2xl border-white/5 text-center">
        <p className="text-slate-500 text-xs font-orbitron tracking-widest uppercase mb-2 opacity-50">Ranking System</p>
        <p className="text-slate-400 text-[11px] font-rajdhani max-w-lg mx-auto italic leading-relaxed">
          The global leaderboard balances raw knowledge (XP), course completions, and daily consistency.
          Maintain your streak and finish courses to climb to the top!
        </p>
      </div>

      {/* ── Your rank card ── */}
      <div
        className="glass p-5 rounded-xl flex items-center gap-5 flex-wrap"
        style={{ borderColor: myMeta.color + '44' }}
      >
        <div className="font-orbitron text-4xl font-black" style={{ color: myMeta.color }}>
          #{myRank || '—'}
        </div>

        <div className="flex-1 min-w-[180px]">
          <p className="font-semibold mb-0.5">Your Current Position</p>
          <p className="text-[12px] text-slate-400 mb-2">
            {needMore > 0
              ? <><span className="text-gold font-bold">{needMore} more score pts</span> to beat rank #{Math.max(1, (myRank || 1) - 1)}</>
              : myRank === 1
                ? '🏆 You are #1 on the leaderboard!'
                : 'Keep earning XP & completing courses!'}
          </p>
          <ProgressBar
            value={myScore}
            max={nextScore || myScore || 1}
            color="linear-gradient(90deg,#00f5ff,#8b5cf6)"
            height="h-2"
          />
        </div>

        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="flex gap-3 text-sm">
            <div className="text-center">
              <div className="font-orbitron text-gold text-base">⚡{(me?.xp ?? userXP).toLocaleString()}</div>
              <div className="text-[10px] text-slate-500">Total XP</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-neon-green text-base">📚{liveCourses}</div>
              <div className="text-[10px] text-slate-500">Courses</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-neon-orange text-base">🔥{streak}</div>
              <div className="text-[10px] text-slate-500">Streak</div>
            </div>
          </div>
          <div
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg text-center"
            style={{ background: myMeta.bg, border: `1px solid ${myMeta.color}55`, color: myMeta.color }}
          >
            {myBadge}
          </div>
        </div>
      </div>

    </div>
  )
}
