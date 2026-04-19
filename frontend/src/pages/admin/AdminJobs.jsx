import { useEffect, useState, useCallback } from 'react'
import Modal from '../../components/ui/Modal'
import * as jobApi from '../../services/jobApi'
import * as adminApi from '../../services/adminApi'
import { getSocket } from '../../services/socket'

export default function AdminJobs() {
  const [jobs, setJobs] = useState([])
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({ title: '', company: '', type: 'Full-time', level: 'Mid', skills: '', salary: '', deadline: '' })

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const load = useCallback(async () => {
    try {
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
        salary: j.salary || '',
        deadline: j.deadline || '',
      }))
      setJobs(normalized)
    } catch (err) {
      console.log('AdminJobs fetchJobs error', err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Real-time socket refresh
  useEffect(() => {
    const s = getSocket()
    s.on('leaderboardUpdate', load)
    return () => s.off('leaderboardUpdate', load)
  }, [load])

  const handleDeleteJob = async (jobId, title) => {
    if (!window.confirm(`⚠️ DELETE JOB?\n\nAre you sure you want to delete "${title.toUpperCase()}"?\nThis will also remove all candidate applications for this role.`)) {
      return
    }

    try {
      // Optimistic UI update
      setJobs(prev => prev.filter(j => j.id !== jobId))
      
      const success = await adminApi.deleteJob(jobId)
      if (!success) {
        alert('Failed to delete job. Please try again.')
        load() // Rollback
      }
    } catch (err) {
      console.error('handleDeleteJob error', err)
      load() // Rollback
    }
  }

  const post = async () => {
    if (!form.title || !form.company) return
    try {
      const skillsArr = form.skills.split(',').map(s => s.trim()).filter(Boolean)
      const created = await jobApi.createJob({
        title: form.title,
        company: form.company,
        salary: form.salary,
        deadline: form.deadline,
        type: form.type,
        level: form.level,
        skills: skillsArr,
        // Backend requires these; UI doesn't collect them, so send safe defaults.
        location: 'Remote',
        description: `${form.title} at ${form.company}`,
        applicants: 0,
        logo: '🏢',
      })

      const job = {
        ...created,
        id: created?._id || created?.id,
        logo: created?.logo || '🏢',
        applicants: typeof created?.applicants === 'number' ? created.applicants : 0,
        type: created?.type || form.type,
        level: created?.level || form.level,
        skills: Array.isArray(created?.skills) ? created.skills : skillsArr,
        salary: created?.salary ?? form.salary,
        deadline: created?.deadline ?? form.deadline,
      }

      setJobs(p => [job, ...p])
      setOpen(false)
      setForm({ title: '', company: '', type: 'Full-time', level: 'Mid', skills: '', salary: '', deadline: '' })
    } catch (err) {
      console.log('AdminJobs createJob error', err)
    }
  }

  return (
    <div className="max-w-[1000px]">
      <div className="flex justify-between items-center mb-5">
        <div className="font-orbitron text-lg tracking-widest">JOB POSTINGS</div>
        <button className="btn btn-md btn-pink" onClick={() => setOpen(true)}>+ POST JOB</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => {
          const jobIdStr = String(job.id || job._id)
          return (
            <div key={jobIdStr} className="card p-5 rounded-xl group relative overflow-hidden">
              {/* Delete Button - Top Right */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteJob(jobIdStr, job.title)
                }}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-bg-3 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs z-10 scale-90 hover:scale-100"
                title="Delete Job Posting"
              >
                🗑️
              </button>

              <div className="flex gap-3 items-center mb-3">
                <div className="text-3xl">{job.logo}</div>
                <div>
                  <div className="font-semibold text-sm">{job.title}</div>
                  <div className="text-[12px] text-slate-500">{job.company}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(job.skills || []).map(s => <span key={s} className="chip chip-cyan text-[10px]">{s}</span>)}
              </div>
              <div className="flex gap-2 mb-2">
                <span className="chip chip-purple text-[10px]">{job.type}</span>
                <span className="chip chip-orange text-[10px]">{job.level}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-slate-400">{job.type}</span>
                <span className="font-orbitron text-neon-green">{job.applicants} applied</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="text-[11px] text-gold">{job.salary} · Deadline: {job.deadline}</div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)}>
        <div className="p-8">
          <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl">✕</button>
          <div className="font-orbitron text-base text-neon-pink mb-5 tracking-widest">+ POST NEW JOB</div>
          <div className="flex flex-col gap-3">
            {[['JOB TITLE','title','Frontend Developer'],['COMPANY','company','TechCorp'],['SALARY','salary','₹8–12 LPA'],['DEADLINE','deadline','Mar 30']].map(([l,k,ph]) => (
              <div key={k}>
                <label className="section-label mb-1">{l}</label>
                <input className="input" placeholder={ph} value={form[k]} onChange={set(k)} />
              </div>
            ))}
            <div>
              <label className="section-label mb-1">SKILLS (comma separated)</label>
              <input className="input" placeholder="React, CSS, JS" value={form.skills} onChange={set('skills')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['TYPE','type',['Full-time','Remote','Hybrid','On-site']],['LEVEL','level',['Junior','Mid','Senior']]].map(([l,k,opts]) => (
                <div key={k}>
                  <label className="section-label mb-1">{l}</label>
                  <select className="input cursor-pointer" value={form[k]} onChange={set(k)}>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button className="btn btn-md btn-pink flex-1" onClick={post}>POST JOB</button>
              <button className="btn btn-md btn-outline px-5" onClick={() => setOpen(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
