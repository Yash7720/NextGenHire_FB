import { useState, useEffect, useCallback } from 'react'
import { fetchCandidates, updateCandidateStatus, deleteCandidate } from '../../services/adminApi'
import { fetchUserApplications, updateApplicationStatus as updateAppStatus, downloadResume } from '../../services/applicationApi'
import { getSocket } from '../../services/socket'
import Modal from '../../components/ui/Modal'

const STATUS_CONFIG = {
  shortlisted: { color: '#ffd700', label: 'Shortlisted' },
  interview:   { color: '#00ff9d', label: 'Interview'   },
  pending:     { color: '#94a3b8', label: 'Pending'     },
  rejected:    { color: '#ff2d78', label: 'Rejected'    },
}

export default function AdminCandidates() {
  const [candidates, setCandidates] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')
  const [selected,   setSelected]   = useState(null)
  const [userApps,   setUserApps]   = useState([])
  const [appLoading, setAppLoading] = useState(false)

  // ── Load candidates from API ────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchCandidates({ status: filter, search, sort: 'score' })
    if (result.ok) {
      setCandidates(result.data)
    } else {
      setError(result.error)
      setCandidates([])
    }
    setLoading(false)
  }, [filter, search])

  useEffect(() => { load() }, [load])

  // ── Real-time socket refresh ────────────────────────────────────────────────
  useEffect(() => {
    const s = getSocket()
    s.on('leaderboardUpdate', load)
    return () => s.off('leaderboardUpdate', load)
  }, [load])

  // ── Status update — persists to DB ──────────────────────────────────────────
  const updateStatus = async (userId, newStatus) => {
    // Optimistic UI update
    setCandidates(prev =>
      prev.map(c => c._id === userId ? { ...c, status: newStatus } : c)
    )
    // Persist to server
    await updateCandidateStatus(userId, newStatus)
  }

  // ── Application Detail — loads when user is clicked ─────────────────────────
  const openApplications = async (user) => {
    console.log('[AdminCandidates] Opening applications for user:', user._id, user.name)
    setSelected(user)
    setAppLoading(true)
    const apps = await fetchUserApplications(user._id)
    console.log('[AdminCandidates] Received apps for user:', apps)
    setUserApps(apps)
    setAppLoading(false)
  }

  const handleUpdateAppStatus = async (appId, status) => {
    // Optimistic UI
    setUserApps(prev => prev.map(a => a._id === appId ? { ...a, status } : a))
    await updateAppStatus(appId, status)
    load() // Refresh main list too
  }

  const handleDeleteCandidate = async (e, userId, name) => {
    e.stopPropagation() // Prevents opening the modal
    
    if (!window.confirm(`⚠️ ARE YOU SURE?\n\nThis will permanently DELETE "${name.toUpperCase()}" and all their associated data from the database.`)) {
      return
    }

    // Optimistic UI update
    setCandidates(prev => prev.filter(c => c._id !== userId))

    const success = await deleteCandidate(userId)
    if (!success) {
      alert("Failed to delete candidate. Please try again.")
      load() // Refresh to restore if failed
    }
  }

  // ── Filter locally (already filtered by API for status, extra client search) ─
  const filtered = candidates
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || []).some(s => s?.toLowerCase?.().includes(search.toLowerCase()))
    )

  return (
    <div className="max-w-[1000px]">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="font-orbitron text-lg tracking-widest">CANDIDATES</div>
        <div className="flex gap-2 flex-wrap">
          <input
            className="input w-48 py-2"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-1.5">
            {['all', 'shortlisted', 'interview', 'pending', 'rejected'].map(s => (
              <button
                key={s}
                className={`tab-btn ${filter === s ? 'tab-active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s.slice(0, 3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
          style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.3)', color: '#ff2d78' }}
        >
          <span>⚠️</span>
          <span>API Error: {error}</span>
          <button onClick={load} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="glass rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="px-5 py-3 border-b border-border hidden sm:grid grid-cols-[1fr_70px_120px_110px_80px_130px_45px] gap-3 font-orbitron text-[10px] text-slate-500 tracking-widest uppercase">
          <span>Candidate</span>
          <span>Score</span>
          <span>Skills</span>
          <span>Applied</span>
          <span>XP</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-10 text-center font-orbitron text-[11px] text-slate-500 tracking-widest animate-pulse">
            LOADING CANDIDATES...
          </div>
        )}

        {/* Candidate rows */}
        {!loading && filtered.map((c, i) => {
          const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending
          return (
            <div
              key={c._id || i}
              className="px-5 py-4 border-b border-border/60 last:border-0 hover:bg-panel-2/40 transition-colors sm:grid grid-cols-[1fr_70px_120px_110px_80px_130px_45px] gap-3 items-center cursor-pointer"
              onClick={() => openApplications(c)}
            >
              <div className="font-semibold text-sm truncate">{c.name}</div>
              <div
                className="font-orbitron text-sm"
                style={{ color: c.candidateScore >= 90 ? '#00ff9d' : c.candidateScore >= 80 ? '#ffd700' : '#94a3b8' }}
              >
                {c.candidateScore}%
              </div>
              <div className="flex gap-1 flex-wrap">
                {(c.skills || []).slice(0, 2).map(s => (
                  <span key={s} className="chip chip-cyan text-[9px]">{s}</span>
                ))}
              </div>
              <div className="text-[12px] text-slate-400 font-semibold">{c.appliedJobs || 0} Jobs</div>
              <div className="font-orbitron text-[11px] text-gold">⚡{c.xp}</div>
              
              <div onClick={e => e.stopPropagation()}>
                <select
                  value={c.status || 'pending'}
                  onChange={(e) => updateStatus(c._id, e.target.value)}
                  className="bg-bg-3 border border-border/40 text-[10px] font-orbitron px-2 py-1 rounded-lg focus:outline-none focus:border-cyan transition-all cursor-pointer w-full"
                  style={{ 
                    color: st.color, 
                    background: `${st.color}11`,
                    borderColor: `${st.color}33` 
                  }}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key} className="bg-bg-2 text-white">
                      {cfg.label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div onClick={e => e.stopPropagation()} className="flex justify-center">
                <button
                  onClick={(e) => handleDeleteCandidate(e, c._id, c.name)}
                  className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-sm"
                  title="Delete Candidate"
                >🗑️</button>
              </div>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && !error && (
          <div className="py-12 text-center text-slate-500">No candidates found.</div>
        )}
      </div>

      {/* Candidate applications modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <div className="p-8 min-w-[500px]">
            <button
               onClick={() => setSelected(null)}
               className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl"
            >✕</button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{selected.avatar || '⭐'}</span>
                <div className="font-orbitron text-base text-cyan">{selected.name}</div>
              </div>
              <div className="text-slate-400 text-sm">{selected.email}</div>
            </div>

            <p className="section-label mb-3 uppercase tracking-widest text-[10px] text-slate-500 font-orbitron">Applied Jobs ({userApps.length})</p>
            
            {appLoading ? (
               <div className="py-8 text-center text-slate-500 font-orbitron text-[10px] animate-pulse">FETCHING APPLICATIONS...</div>
            ) : userApps.length === 0 ? (
               <div className="py-8 text-center text-slate-500 italic">No applications found.</div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {userApps.map(app => (
                  <div key={app._id} 
                    className="bg-bg-3 border border-border p-4 rounded-xl flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{app.jobId?.title || 'Unknown Role'}</div>
                      <div className="text-[11px] text-slate-500">{app.jobId?.company || 'Unknown Company'}</div>
                      <div className="text-[10px] text-slate-600 mt-1">Applied: {new Date(app.createdAt).toLocaleDateString()}</div>

                      {/* Resume filename tag */}
                      {app.filename && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px]">📄</span>
                          <span
                            className="text-[10px] font-mono truncate max-w-[160px]"
                            style={{ color: 'rgba(0,255,157,0.7)' }}
                            title={app.filename}
                          >
                            {app.filename}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right shrink-0">
                      {/* Download Resume button */}
                      {app.resumeFileId && (
                        <button
                          onClick={() => downloadResume(app._id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-orbitron font-semibold transition-all"
                          style={{
                            background:   'rgba(0,200,255,0.08)',
                            border:       '1px solid rgba(0,200,255,0.25)',
                            color:        '#00c8ff',
                          }}
                          title={`Download ${app.filename || 'Resume'}`}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.18)'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.6)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,200,255,0.25)' }}
                        >
                          ⬇ RESUME
                        </button>
                      )}

                      <div>
                        <div className="text-[10px] text-slate-500 font-orbitron mb-2">SET STATUS</div>
                        <div className="flex gap-1 justify-end flex-wrap">
                          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => {
                            const isCurrent = app.status === k
                            return (
                              <button
                                key={k}
                                onClick={() => handleUpdateAppStatus(app._id, k)}
                                className={`px-2 py-1 rounded text-[9px] font-orbitron transition-all border ${isCurrent ? '' : 'opacity-40 hover:opacity-100'}`}
                                style={{ 
                                  color: cfg.color, 
                                  background: isCurrent ? `${cfg.color}11` : 'transparent',
                                  borderColor: isCurrent ? cfg.color : `${cfg.color}33`
                                }}
                              >
                                {k.toUpperCase()}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-600 font-orbitron">REF: {app._id.slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
              <div>
                 <div className="text-[10px] text-slate-500 font-orbitron uppercase tracking-widest mb-1">OVERALL XP</div>
                 <div className="font-orbitron text-gold">⚡ {selected.xp}</div>
              </div>
              <div className="text-right">
                 <div className="text-[10px] text-slate-500 font-orbitron uppercase tracking-widest mb-1">TOTAL JOBS</div>
                 <div className="font-orbitron text-cyan">{userApps.length}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
