import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import Modal from '../components/ui/Modal'
import * as jobApi from '../services/jobApi'
import { applyForJob } from '../services/applicationApi'
import { getStoredUser } from '../services/http'

function JobCard({ job, applied, onClick }) {
  return (
    <div className="card p-5 rounded-xl cursor-pointer" style={{ borderColor: applied ? 'rgba(0,255,157,0.3)' : undefined }} onClick={onClick}>
      <div className="flex gap-3 items-start mb-3">
        <div className="w-12 h-12 rounded-xl bg-bg-3 border border-border-2 flex items-center justify-center text-2xl shrink-0">{job.logo}</div>
        <div className="flex-1">
          <div className="font-semibold text-sm leading-tight">{job.title}</div>
          <div className="text-[12px] text-slate-500">{job.company}</div>
        </div>
        {applied && <span className="chip chip-green text-[10px] shrink-0">Applied ✓</span>}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {(job.skills || []).map(s => <span key={s} className="chip chip-cyan text-[10px]">{s}</span>)}
      </div>
      <div className="flex gap-2 mb-3">
        <span className="chip chip-purple text-[10px]">{job.type}</span>
        <span className="chip chip-orange text-[10px]">{job.level}</span>
      </div>
      <div className="flex justify-between items-center text-[12px]">
        <span className="font-orbitron text-neon-green">{job.salary}</span>
        <span className="text-slate-500">Deadline: {job.deadline}</span>
      </div>

    </div>
  )
}

export default function Jobs() {
  const { appliedJobs, applyJob } = useOutletContext()
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)
  const [jobs,     setJobs]     = useState([])
  const [loading,  setLoading]  = useState(true)

  // Resume upload state
  const [resumeFile,     setResumeFile]     = useState(null)
  const [uploading,      setUploading]      = useState(false)
  const [uploadError,    setUploadError]    = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await jobApi.fetchJobs()
        const list = Array.isArray(data) ? data : (data?.jobs || [])
        const normalized = list.map((j) => ({
          ...j,
          id: j._id || j.id,
          logo: j.logo || '🏢',
          applicants: typeof j.applicants === 'number' ? j.applicants : 0,
          type: j.type || 'Full-time',
          level: j.level || 'Mid',
          skills: Array.isArray(j.skills) ? j.skills : [],
          salary: j.salary || 'Competitive',
          deadline: j.deadline || 'Ongoing',
        }))
        setJobs(normalized)
      } catch (err) {
        console.log('Jobs fetchJobs error', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered =
    filter === 'applied' ? jobs.filter(j => appliedJobs.includes(j.id)) :
    filter === 'new'     ? jobs.filter(j => !appliedJobs.includes(j.id)) :
    jobs

  // Reset resume state when modal closes
  const handleClose = () => {
    setSelected(null)
    setResumeFile(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setUploadError(null)
    if (!file) { setResumeFile(null); return }

    // Client-side validation
    const ext  = file.name.split('.').pop().toLowerCase()
    const size  = file.size
    if (!['pdf', 'zip'].includes(ext)) {
      setUploadError('Only PDF and ZIP files are accepted.')
      setResumeFile(null)
      e.target.value = ''
      return
    }
    if (size > 10 * 1024 * 1024) {
      setUploadError('File is too large. Maximum size is 10 MB.')
      setResumeFile(null)
      e.target.value = ''
      return
    }
    setResumeFile(file)
  }

  const handleApply = async () => {
    if (!selected) return
    setUploading(true)
    setUploadError(null)

    const user = getStoredUser()

    const fields = {
      jobId:         selected.id || selected._id,
      applicantName: user?.name  || 'Anonymous',
      email:         user?.email || '',
      userId:        user?._id   || user?.id || ''
    }

    try {
      const result = await applyForJob(fields, resumeFile)

      if (!result.ok) {
        setUploadError(result.error || 'Application failed. Please try again.')
        setUploading(false)
        return
      }

      // Immediately update local applicant count for instant UI feedback
      setJobs(prev => prev.map(j =>
        j.id === selected.id ? { ...j, applicants: (j.applicants || 0) + 1 } : j
      ))

      // Update local state (XP / applied list) via the existing context function
      applyJob(selected.id, true)
      handleClose()
    } catch (err) {
      setUploadError(err.message || 'Something went wrong.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-[1000px]">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="font-orbitron text-lg tracking-widest">JOB BOARD</div>
          <p className="text-[12px] text-slate-500 mt-0.5">+20 XP for each application submitted</p>
        </div>
        <div className="flex gap-1.5">
          {['all','applied','new'].map(f => (
            <button key={f} className={`tab-btn ${filter === f ? 'tab-active' : ''}`} onClick={() => setFilter(f)}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="font-orbitron text-cyan animate-pulse text-sm tracking-widest">SCANNING FOR OPPORTUNITIES...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-orbitron text-sm">NO JOBS FOUND</div>
          ) : (
            filtered.map(job => (
              <JobCard
                key={job.id}
                job={job}
                applied={appliedJobs.includes(job.id)}
                onClick={() => { setSelected(job); setResumeFile(null); setUploadError(null) }}
              />
            ))
          )}
        </div>
      )}

      {/* ── Job detail / Apply modal ─────────────────────────────────────── */}
      <Modal open={!!selected} onClose={handleClose}>
        {selected && (
          <div className="p-8">
            <button onClick={handleClose} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl">✕</button>

            {/* Header */}
            <div className="flex gap-4 items-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-bg-3 border border-border-2 flex items-center justify-center text-3xl">{selected.logo}</div>
              <div>
                <div className="font-orbitron text-base text-cyan">{selected.title}</div>
                <div className="text-slate-400 text-sm">{selected.company}</div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[['Type',selected.type],['Level',selected.level],['Salary',selected.salary],['Deadline',selected.deadline]].map(([k,v]) => (
                <div key={k} className="bg-bg-3 border border-border rounded-lg p-3">
                  <div className="text-[10px] font-orbitron text-slate-500 tracking-widest mb-0.5">{k}</div>
                  <div className="font-semibold text-sm">{v}</div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="mb-5">
              <div className="section-label">REQUIRED SKILLS</div>
              <div className="flex gap-2 flex-wrap">
                {(selected.skills || []).map(s => <span key={s} className="chip chip-cyan">{s}</span>)}
              </div>
            </div>

            {/* XP notice */}
            <div className="p-3.5 rounded-lg border border-gold/20 bg-gold/5 mb-5 text-sm text-slate-300">
              ⚡ Applying earns you <strong className="text-gold">+20 XP</strong>! Your skill score will be visible to the employer.
            </div>

            {/* Already applied */}
            {appliedJobs.includes(selected.id) ? (
              <div className="text-center font-orbitron text-sm text-neon-green">✓ Application Submitted!</div>
            ) : (
              <>
                {/* ── Resume Upload Section ──────────────────────────────── */}
                <div className="mb-5">
                  <div className="text-[11px] font-orbitron text-slate-400 tracking-widest mb-2 uppercase">
                    Resume <span className="text-red-500 normal-case">(PDF or ZIP · max 10 MB · REQUIRED)</span>
                  </div>

                  {/* Drop zone / file input */}
                  <label
                    htmlFor="resume-upload"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                    style={{
                      borderColor:      resumeFile ? 'rgba(0,255,157,0.5)' : 'rgba(100,116,139,0.3)',
                      background:       resumeFile ? 'rgba(0,255,157,0.05)' : 'rgba(30,41,59,0.4)',
                    }}
                  >
                    <span className="text-2xl">{resumeFile ? '📄' : '📎'}</span>
                    <div className="flex-1 min-w-0">
                      {resumeFile ? (
                        <>
                          <div className="text-[12px] font-semibold text-neon-green truncate">{resumeFile.name}</div>
                          <div className="text-[10px] text-slate-500">{(resumeFile.size / 1024).toFixed(1)} KB</div>
                        </>
                      ) : (
                        <div className="text-[12px] text-slate-500">Click to attach resume…</div>
                      )}
                    </div>
                    {resumeFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                        className="text-slate-500 hover:text-red-400 transition-colors text-sm px-1"
                        title="Remove file"
                      >✕</button>
                    )}
                  </label>

                  <input
                    id="resume-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.zip"
                    className="sr-only"
                    onChange={handleFileChange}
                  />

                  {/* Validation error */}
                  {uploadError && (
                    <div className="mt-2 text-[11px] text-red-400 flex items-center gap-1.5">
                      <span>⚠️</span> {uploadError}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div title={!resumeFile ? "Please attach a resume to enable application" : ""}>
                  <button
                    className={`btn btn-lg w-full relative ${!resumeFile ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 border-slate-600' : 'btn-cyan'}`}
                    onClick={handleApply}
                    disabled={uploading || !resumeFile}
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
                        UPLOADING...
                      </span>
                    ) : (
                      <>🚀 Apply Now (+20 XP)</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
