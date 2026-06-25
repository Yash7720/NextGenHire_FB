import { useEffect, useState } from 'react'
import { fetchAdminProjects, downloadProject, deleteProjectSubmission } from '../../services/projectApi'
import { getSocket } from '../../services/socket'
import Modal from '../../components/ui/Modal'

import { BASE_URL } from '../../services/http'

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Invalid Date'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let res = bytes
  let unitIdx = 0
  while (res >= 1024 && unitIdx < units.length - 1) {
    res /= 1024
    unitIdx++
  }
  return `${res.toFixed(1)} ${units[unitIdx]}`
}

// ── Admin Projects Page ───────────────────────────────────────────────────────
export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState(null)

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the project: "${title}"?\nThis action cannot be undone.`)) return
    
    try {
      setRefreshing(true)
      await deleteProjectSubmission(id)
      setProjects(prev => prev.filter(p => p._id !== id))
      if (selected?._id === id) setSelected(null)
    } catch (err) {
      alert(err.message || 'Delete failed')
    } finally {
      setRefreshing(false)
    }
  }

  const load = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true)
      else setLoading(true)
      const data = await fetchAdminProjects()
      setProjects(data)
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    
    // Connect to real-time socket
    const s = getSocket()
    
    // Listen for project updates from students
    const onProjectUpdate = (payload) => {
      console.log('[socket] New project submission detected!', payload)
      load(true) // Silent refresh
    }

    s.on('projectUpdate', onProjectUpdate)
    
    // Backup: Auto-refresh every 60s
    const interval = setInterval(() => load(true), 60000)
    
    return () => {
      s.off('projectUpdate', onProjectUpdate)
      clearInterval(interval)
    }
  }, [])

  // Filter by user name, email, or project title
  const q = (search || "").trim().toLowerCase();
  const filtered = !q 
    ? (Array.isArray(projects) ? projects : [])
    : (projects || []).filter(p => {
        try {
          const name = String(p.studentId?.name || "").toLowerCase();
          const email = String(p.studentId?.email || "").toLowerCase();
          const title = String(p.projectTitle || "").toLowerCase();
          const course = String(p.courseId || "").toLowerCase();
          const tech = Array.isArray(p.techStack) ? p.techStack.join(" ").toLowerCase() : "";

          return name.includes(q) || email.includes(q) || title.includes(q) || course.includes(q) || tech.includes(q);
        } catch (e) {
          return true;
        }
      });

  return (
    <div className="max-w-[1280px]">
      {/* Header row */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="relative">
          <div className="font-orbitron text-xl tracking-[0.2em] text-cyan text-shadow-glow">📁 PROJECT SUBMISSIONS</div>
          <div className="text-slate-400 text-xs mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
            Total Submissions: <span className="text-white font-mono">{projects.length}</span>
            <span className="text-[10px] text-slate-600 ml-4 font-mono">
              (Showing {filtered.length} of {projects.length})
              {search && <span className="text-cyan/50 ml-1 italic font-bold">- SEARCH ACTIVE: "{search}"</span>}
            </span>
            {refreshing && <span className="text-[10px] text-cyan/70 ml-2 animate-pulse">(Updating...)</span>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => load(true)}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-colors text-white"
            title="Refresh List"
          >
            🔄
          </button>
          {/* Search */}
          <div className="relative group">
            <input
              id="admin-projects-search"
              type="text"
              placeholder="Search by student, title, stack..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-900/80 border border-slate-700/50 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/20 outline-none w-[320px] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Loading / Error states */}
      {loading && (
        <div className="glass p-10 rounded-xl text-center">
          <div className="text-4xl mb-3 animate-pulse">📦</div>
          <div className="font-orbitron text-cyan text-sm tracking-widest">LOADING SUBMISSIONS…</div>
        </div>
      )}

      {!loading && error && (
        <div className="glass p-8 rounded-xl border border-red-500/20 text-center max-w-2xl mx-auto my-10">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-red-400 font-orbitron text-sm tracking-widest mb-2 uppercase">Server Sync Failed</div>
          <div className="text-slate-400 text-xs mb-6 font-mono">{error}</div>
          <button 
            onClick={() => load()} 
            className="px-6 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-cyan hover:text-black transition-all font-orbitron text-[10px] tracking-widest"
          >
            RETRY CONNECTION
          </button>
        </div>
      )}

      {/* Table - Show if projects exist */}
      {projects.length > 0 ? (
        <div className="glass rounded-xl overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_1fr_1.2fr_0.8fr] gap-4 px-6 py-4 bg-slate-900/50 border-b border-white/5 text-[10px] font-orbitron tracking-widest text-slate-500 uppercase"
          >
            <span>Student</span>
            <span>Project Details</span>
            <span>Tech Stack</span>
            <span>Links</span>
            <span>Course</span>
            <span>Submission Date</span>
            <span className="text-right">Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/5">
            {(filtered.length > 0 ? filtered : projects).map((p, i) => (
              <div
                key={p._id || i}
                onClick={() => setSelected(p)}
                className="grid grid-cols-[1.4fr_1.6fr_1fr_1fr_1fr_1.2fr_0.8fr] gap-4 px-6 py-6 items-center hover:bg-white/[0.04] active:bg-white/[0.08] transition-all cursor-pointer group"
              >
                {/* Student */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-xl shadow-inner">
                    {p.studentId?.avatar || '👤'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate group-hover:text-cyan transition-colors">
                      {p.studentId?.name || (p.userId ? `User ${String(p.userId).slice(-4)}` : 'Unknown Student')}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">
                      {p.studentId?.email || 'No email provided'}
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-cyan leading-tight truncate" title={p.projectTitle}>
                    {p.projectTitle || 'Untitled Submission'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed italic" title={p.description}>
                    {p.description || 'No description provided.'}
                  </div>
                </div>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1.5">
                  {(Array.isArray(p.techStack) ? p.techStack : []).length > 0 ? (
                    p.techStack.slice(0, 4).map((tag, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/20 text-cyan/80 font-medium">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] text-slate-600 italic">No tags</span>
                  )}
                </div>

                {/* Links */}
                <div onClick={e => e.stopPropagation()} className="flex flex-col gap-1.5 items-start">
                  {p.githubLink ? (
                    <a href={p.githubLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-white text-[10px] font-bold hover:bg-white hover:text-black transition-all">
                      <span className="text-xs">🐙</span> GITHUB
                    </a>
                  ) : (
                    <span className="text-[9px] text-slate-600 italic">No GitHub</span>
                  )}
                  {p.liveLink && (
                    <a href={p.liveLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-bold hover:bg-cyan hover:text-black transition-all">
                      🔗 VIEW LIVE
                    </a>
                  )}
                </div>

                {/* Course */}
                <div>
                  <div className="inline-block px-2.5 py-1 rounded border border-purple-500/30 bg-purple-500/5 text-purple-400 text-[10px] font-orbitron uppercase tracking-widest">
                    {p.courseId}
                  </div>
                </div>

                {/* Date */}
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatDate(p.uploadedAt || p.createdAt)}
                </div>

                {/* Action */}
                <div className="text-right flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => downloadProject(p._id)} 
                    className="p-2 bg-slate-800/80 hover:bg-cyan hover:text-black rounded-lg transition-all text-xs group/btn"
                    title="Download ZIP"
                  >
                    ⬇
                  </button>
                  <button 
                    onClick={() => handleDelete(p._id, p.projectTitle)} 
                    className="p-2 bg-slate-800/80 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-xs border border-transparent hover:border-red-500/30"
                    title="Delete Submission"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-20 rounded-xl text-center">
          <div className="text-4xl mb-4">📂</div>
          <div className="text-slate-400 font-orbitron">No submissions found in database.</div>
        </div>
      )}
      {/* Detailed Project View Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-3xl">
        {selected && (
          <div className="p-8 relative">
            <button 
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
            >✕</button>

            <div className="mb-8">
              <div className="flex items-center gap-2 text-[10px] font-orbitron text-cyan/70 tracking-widest uppercase mb-2">
                <span>📁 PROJECT SUBMISSION</span>
                <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                <span>{selected.courseId}</span>
              </div>
              <h2 className="text-2xl font-orbitron text-white tracking-wider leading-tight">
                {selected.projectTitle || 'Untitled Project'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mb-3">Description</h3>
                  <div className="bg-slate-900/40 border border-white/5 p-4 rounded-xl text-slate-300 text-sm leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto custom-scrollbar italic">
                    {selected.description || 'No description provided.'}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mb-3 text-shadow-glow-cyan">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selected.techStack) ? selected.techStack : []).map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan text-xs font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mb-3">Submitted By</h3>
                  <div className="glass p-4 rounded-xl border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{selected.studentId?.avatar || '👤'}</div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">{selected.studentId?.name || 'Unknown User'}</div>
                        <div className="text-[10px] text-slate-500 truncate font-mono">{selected.studentId?.email || 'No email'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-orbitron text-slate-500 uppercase tracking-widest mb-3">Links & Assets</h3>
                  <div className="space-y-3">
                    {selected.githubLink ? (
                      <a 
                        href={selected.githubLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-orbitron font-bold text-xs tracking-widest hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all"
                      >
                        🐙 GITHUB REPO
                      </a>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-slate-800/50 border border-white/5 text-slate-600 font-orbitron font-bold text-xs text-center tracking-widest">
                        NO GITHUB REPO
                      </div>
                    )}

                    {selected.liveLink ? (
                      <a 
                        href={selected.liveLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-cyan text-black font-orbitron font-bold text-xs tracking-widest hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all"
                      >
                        🔗 VIEW LIVE SITE
                      </a>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-slate-800/50 border border-white/5 text-slate-600 font-orbitron font-bold text-xs text-center tracking-widest">
                        NO LIVE PREVIEW
                      </div>
                    )}

                    <button
                      onClick={() => downloadProject(selected._id)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-orbitron font-bold text-xs tracking-widest hover:bg-slate-700 transition-all font-mono"
                    >
                      ⬇ DOWNLOAD ZIP
                    </button>
                    
                    <button
                      onClick={() => handleDelete(selected._id, selected.projectTitle)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-orbitron font-bold text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all uppercase"
                    >
                      🗑️ Delete Submission
                    </button>

                    <div className="text-center text-[9px] text-slate-600 font-mono italic">
                      {selected.filename} ({formatSize(selected.fileSize)})
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>REF ID: {selected._id}</span>
              <span>SUBMITTED: {formatDate(selected.uploadedAt || selected.createdAt)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

