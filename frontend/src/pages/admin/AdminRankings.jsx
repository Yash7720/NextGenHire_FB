import { useState, useEffect, useCallback } from 'react'
import ProgressBar from '../../components/ui/ProgressBar'
import { fetchSkillRankings } from '../../services/adminApi'
import { getSocket } from '../../services/socket'

export default function AdminRankings() {
  const [rankings, setRankings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  // ── Load from API ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSkillRankings()
      setRankings(data)
    } catch (err) {
      setError(err?.message || 'Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Real-time updates via Socket.IO ────────────────────────────────────────
  useEffect(() => {
    const s = getSocket()
    s.on('leaderboardUpdate', load)
    return () => s.off('leaderboardUpdate', load)
  }, [load])

  // ── Top 3 + full list ───────────────────────────────────────────────────────
  const top3 = rankings.slice(0, 3)
  const colors = ['#ffd700', '#c0c0c0', '#cd7f32']
  const labels = ['1st', '2nd', '3rd']

  return (
    <div className="max-w-[800px]">
      <div className="font-orbitron text-lg tracking-widest mb-5">SKILL SCORE LEADERBOARD</div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.3)', color: '#ff2d78' }}
        >
          <span>⚠️</span>
          <span>API Error: {error} — please restart the backend server.</span>
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-10 text-center font-orbitron text-[11px] text-slate-500 tracking-widest animate-pulse">
          LOADING RANKINGS...
        </div>
      )}

      {/* Top 3 highlight */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          {top3.map((p, i) => {
            const c = colors[i]
            return (
              <div key={p._id} className="glass p-5 rounded-xl text-center" style={{ borderColor: `${c}33` }}>
                <div className="text-3xl mb-1">{p.avatar || '⭐'}</div>
                <div className="font-orbitron text-[11px] mb-0.5" style={{ color: c }}>{p.name}</div>
                <div className="font-orbitron text-2xl font-black mb-1" style={{ color: c }}>{labels[i]}</div>
                <div className="font-orbitron text-[12px] text-gold mb-1">⚡{p.xp} XP</div>
                <div className="chip text-[10px]" style={{ color: c, background: `${c}22`, borderColor: `${c}33` }}>{p.badge}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full leaderboard */}
      {!loading && (
        <div className="glass rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border grid grid-cols-[40px_1fr_80px_80px_80px] gap-3 font-orbitron text-[10px] text-slate-500 tracking-widest">
            <span>RANK</span><span>PLAYER</span><span>XP</span><span>STREAK</span><span>BADGE</span>
          </div>
          {rankings.map(p => {
            const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32']
            const rc = p.rank <= 3 ? rankColors[p.rank - 1] : '#64748b'
            return (
              <div
                key={p._id}
                className="px-5 py-3.5 border-b border-border/60 last:border-0 grid grid-cols-[40px_1fr_80px_80px_80px] gap-3 items-center hover:bg-panel-2/40"
              >
                <span className="font-orbitron font-black text-base" style={{ color: rc }}>#{p.rank}</span>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{p.avatar || '⭐'}</span>
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="w-24 mt-0.5">
                      <ProgressBar value={p.xp} max={5000} color={rc} height="h-1" />
                    </div>
                  </div>
                </div>
                <span className="font-orbitron text-[12px] text-gold">⚡{p.xp}</span>
                <span className="text-sm text-neon-orange">🔥{p.streak}d</span>
                <span className="chip text-[9px]" style={{ color: rc, background: `${rc}22`, borderColor: `${rc}33` }}>{p.badge}</span>
              </div>
            )
          })}
          {rankings.length === 0 && !error && (
            <div className="py-12 text-center text-slate-500">No ranking data yet.</div>
          )}
        </div>
      )}
    </div>
  )
}
