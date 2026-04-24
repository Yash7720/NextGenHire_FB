import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import ProgressBar from '../components/ui/ProgressBar'
import StatBox from '../components/ui/StatBox'
import { COURSES, ACHIEVEMENTS, RARITY_COLORS } from '../data'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { fetchProfile, updateProfile } from '../services/profileApi'
import { getCurrentUser } from '../services/userApi'
import * as jobApi from '../services/jobApi'
import { fetchUserApplications } from '../services/applicationApi'
import { getSocket } from '../services/socket'

// ─── Course → skill metadata (for real-time score computation) ───────────────
const COURSE_SKILL_MAP = [
  { courseId: 'html', name: 'HTML', color: '#e34c26', chapters: 5 },
  { courseId: 'css', name: 'CSS', color: '#264de4', chapters: 5 },
  { courseId: 'js', name: 'JS', color: '#f7df1e', chapters: 5 },
  { courseId: 'python', name: 'Python', color: '#3776ab', chapters: 5 },
  { courseId: 'cpp', name: 'C++', color: '#00599c', chapters: 5 },
  { courseId: 'react', name: 'React', color: '#61dafb', chapters: 5 },
]

/**
 * Compute skill scores from completedChapters progress.
 * Score = (chapters done / total chapters) × 100
 * Enrolled but 0 chapters done → score is still 0 (shown grayed)
 * Not enrolled → not included unless DB has that skill.
 */
function computeSkillsFromProgress(completedChapters, dbSkills = []) {
  const map = {}

  // Seed from DB skills first (for any extra skills not in COURSE_SKILL_MAP)
  dbSkills.forEach(s => { map[s.name] = { ...s } })

  // Override/fill from live chapter progress
  COURSE_SKILL_MAP.forEach(({ courseId, name, color, chapters }) => {
    const done = (completedChapters[courseId] || []).length
    const score = Math.round((done / chapters) * 100)
    map[name] = { name, score, color }
  })

  return Object.values(map)
}

/**
 * Compute which badges are earned from real-time game state.
 * Also merges with DB earnedBadges (by string id) so manually awarded badges persist.
 *
 * Badge conditions (mirrors ACHIEVEMENTS):
 * id=1  First Blood       → completed at least 1 chapter
 * id=2  Speed Runner      → 3+ chapters completed across all courses in a single session
 *                           (we simplify: total chapters >= 3)
 * id=3  Sharpshooter      → any quiz score === 100
 * id=4  Course Master     → completed at least 1 full course (completedProjects)
 * id=5  Star Student      → total XP >= 1000 (top-10 proxy)
 * id=6  Builder           → submitted at least 1 mini project (completedProjects.length >= 1)
 * id=7  Polyglot          → enrolled in 3+ courses
 * id=8  Diamond Coder     → XP >= 1000
 * id=9  7-Day Streak      → streak >= 7
 * id=10 AI Scholar        → (no direct tracking; check DB earnedBadges only)
 * id=11 Puzzle Solver     → completedProjects.length >= 5
 * id=12 Rocketeer         → applied to 3+ jobs
 */
function computeEarnedBadges({ userXP, streak, completedChapters, enrolledCourses,
  appliedJobs, quizScores, completedProjects, dbBadges = [] }) {
  const totalChapters = Object.values(completedChapters).reduce((sum, arr) => sum + arr.length, 0)
  const maxQuizScore = Object.values(quizScores).reduce((m, v) => Math.max(m, Number(v ?? 0)), 0)

  const earned = new Set(dbBadges.map(String))

  if (totalChapters >= 1) earned.add('1')   // First Blood
  if (totalChapters >= 3) earned.add('2')   // Speed Runner
  if (maxQuizScore === 100) earned.add('3')   // Sharpshooter
  if (completedProjects.length >= 1) earned.add('4')   // Course Master
  if (userXP >= 1000) earned.add('5')   // Star Student
  if (completedProjects.length >= 1) earned.add('6')   // Builder
  if (enrolledCourses.length >= 3) earned.add('7')   // Polyglot
  if (userXP >= 1000) earned.add('8')   // Diamond Coder
  if (streak >= 7) earned.add('9')   // 7-Day Streak
  // id=10 AI Scholar — only from DB
  if (completedProjects.length >= 5) earned.add('11')  // Puzzle Solver
  if (appliedJobs.length >= 3) earned.add('12')  // Rocketeer

  return earned
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-panel-2 border border-border rounded px-3 py-2 text-xs">
        <p className="text-slate-400">{label}</p>
        <p className="text-gold font-orbitron">⚡ {payload[0].value} XP</p>
      </div>
    )
  }
  return null
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    age: profile.age || '',
    degree: profile.degree || '',
    avatar: profile.avatar || '⭐',
  })

  const change = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      name: form.name,
      bio: form.bio,
      age: form.age ? Number(form.age) : undefined,
      degree: form.degree,
      avatar: form.avatar,
    })
  }

  const AVATARS = ['⭐', '🚀', '🎯', '🔥', '💎', '🏆', '🦁', '🐉', '⚡', '🌟']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass rounded-2xl p-6 w-full max-w-md"
        style={{ border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 0 40px rgba(0,245,255,0.1)' }}
      >
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-orbitron text-cyan text-lg">EDIT PROFILE</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar picker */}
          <div>
            <p className="section-label mb-2">AVATAR</p>
            <div className="flex gap-2 flex-wrap">
              {AVATARS.map(av => (
                <button
                  key={av} type="button"
                  onClick={() => change('avatar', av)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all"
                  style={{
                    background: form.avatar === av ? 'rgba(0,245,255,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `2px solid ${form.avatar === av ? '#00f5ff' : 'transparent'}`,
                    boxShadow: form.avatar === av ? '0 0 10px rgba(0,245,255,0.4)' : 'none',
                  }}
                >{av}</button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="section-label mb-1 block">DISPLAY NAME</label>
            <input
              value={form.name}
              onChange={e => change('name', e.target.value)}
              className="w-full bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none transition-colors"
              placeholder="Your name"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="section-label mb-1 block">BIO</label>
            <textarea
              value={form.bio}
              onChange={e => change('bio', e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none transition-colors resize-none"
              placeholder="Tell recruiters about yourself..."
            />
            <p className="text-[11px] text-slate-600 text-right">{form.bio.length}/300</p>
          </div>

          {/* Age & Degree */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1 block">AGE</label>
              <input
                type="number" min={10} max={100}
                value={form.age}
                onChange={e => change('age', e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none transition-colors"
                placeholder="22"
              />
            </div>
            <div>
              <label className="section-label mb-1 block">DEGREE</label>
              <input
                value={form.degree}
                onChange={e => change('degree', e.target.value)}
                className="w-full bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-white focus:border-cyan focus:outline-none transition-colors"
                placeholder="B.Tech CS"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-border text-slate-400 hover:border-slate-500 transition-colors text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3 rounded-lg font-orbitron text-sm transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#8b5cf6)', color: '#000', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 15px rgba(0,245,255,0.2)' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Profile Component ───────────────────────────────────────────────────
export default function Profile() {
  const { userXP, level, levelXP, streak, enrolledCourses, completedChapters, appliedJobs, quizScores, completedProjects } = useOutletContext()
  const [activeTab, setActiveTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [userApplications, setUserApplications] = useState([])

  const storedUser = getCurrentUser()
  const userId = storedUser?._id || storedUser?.id

  const TABS = ['overview', 'courses', 'badges', 'jobs', 'analytics']

  // ── Fetch profile & jobs on mount ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setLoading(false); return }

    const load = async () => {
      setLoading(true)
      try {
        const [profData, jobsData, appsData] = await Promise.all([
          fetchProfile(userId),
          jobApi.fetchJobs(),
          fetchUserApplications(userId)
        ])
        setProfile(profData)
        setUserApplications(appsData)
        
        const list = Array.isArray(jobsData) ? jobsData : (jobsData?.jobs || [])
        setAllJobs(list.map(j => ({ ...j, id: j._id || j.id })))
      } catch (err) {
        console.log('Profile load error', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  // ── Real-time Socket Listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const s = getSocket()
    
    const handleStatusUpdate = (payload) => {
      // payload: { applicationId, status }
      setUserApplications(prev => 
        prev.map(app => app._id === payload.applicationId ? { ...app, status: payload.status } : app)
      )
      showToast(`Application status updated to ${payload.status.toUpperCase()}!`)
    }

    s.on('applicationStatusUpdate', handleStatusUpdate)
    return () => s.off('applicationStatusUpdate', handleStatusUpdate)
  }, [userId])

  // ── Real-time derived skill scores (from completedChapters + DB) ─────────────
  const displaySkills = useMemo(
    () => computeSkillsFromProgress(completedChapters, profile?.skills || []),
    [completedChapters, profile]
  )

  // ── Real-time radar data ─────────────────────────────────────────────────────
  const radarData = useMemo(
    () => displaySkills.map(s => ({ subject: s.name, A: s.score })),
    [displaySkills]
  )

  // ── Real-time badge evaluation ────────────────────────────────────────────────
  const earnedBadgeIds = useMemo(
    () => computeEarnedBadges({
      userXP,
      streak,
      completedChapters,
      enrolledCourses,
      appliedJobs,
      quizScores,
      completedProjects,
      dbBadges: profile?.earnedBadges || [],
    }),
    [userXP, streak, completedChapters, enrolledCourses, appliedJobs,
      quizScores, completedProjects, profile]
  )

  // ── Other display values ──────────────────────────────────────────────────────
  const displayName = profile?.name || storedUser?.name || 'Player One'
  const displayEmail = profile?.email || storedUser?.email || 'player@nextgenhire.com'
  const displayAge = profile?.age ? `Age ${profile.age}` : ''
  const displayDegree = profile?.degree || ''
  const displayAvatar = profile?.avatar || '⭐'
  const displayBio = profile?.bio || ''
  const displayXpHist = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const now = new Date()
    const curMonth = MONTHS[now.getMonth()]
    const curYear = now.getFullYear()

    // If we have real history from DB, use it and ensure current month is up-to-date
    if (profile?.xpHistory?.length) {
      const hist = profile.xpHistory.map(e => ({ month: e.month, xp: e.xp }))
      // Update or add the current month's entry with live XP
      const curEntry = hist.find(e => e.month === curMonth)
      if (curEntry) {
        curEntry.xp = Math.max(curEntry.xp, userXP)
      } else {
        hist.push({ month: curMonth, xp: userXP })
      }
      return hist
    }

    // No history yet — generate last 6 months with 0 XP + current month with actual XP
    const result = []
    for (let i = 5; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      result.push({ month: MONTHS[d.getMonth()], xp: 0 })
    }
    result.push({ month: curMonth, xp: userXP })
    return result
  }, [profile?.xpHistory, userXP])

  // ── Merge local + DB applied jobs so new applications show instantly ──────────
  const mergedAppliedJobs = useMemo(() => {
    return Array.from(new Set([...(profile?.appliedJobs || []), ...(appliedJobs || [])]))
  }, [profile?.appliedJobs, appliedJobs])

  const STATUS_CONFIG = {
    shortlisted: { color: '#ffd700', label: 'Shortlisted' },
    interview:   { color: '#00ff9d', label: 'Interview'   },
    pending:     { color: '#94a3b8', label: 'Pending'     },
    rejected:    { color: '#ff2d78', label: 'Rejected'    },
  }

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // ── Save handler ────────────────────────────────────────────────────────────
  const handleSaveProfile = async (formData) => {
    if (!userId) return
    setSaving(true)
    try {
      const updated = await updateProfile(userId, formData)
      if (updated) {
        setProfile(updated)
        
        // Update local storage so other components see the new name/avatar
        if (storedUser) {
          storedUser.name = updated.name
          if (updated.avatar) storedUser.avatar = updated.avatar
          localStorage.setItem('user', JSON.stringify(storedUser))
        }
        
        // Dispatch real-time event
        window.dispatchEvent(new Event('profileUpdated'))
        
        showToast('Profile updated successfully!')
      } else {
        showToast('Update failed. Please try again.', 'error')
      }
    } catch {
      showToast('Update failed. Please try again.', 'error')
    } finally {
      setSaving(false)
      setEditOpen(false)
    }
  }

  // ── Rank chip ───────────────────────────────────────────────────────────────
  const getRankChip = (xp) => {
    if (xp >= 2000) return '🏆 Diamond'
    if (xp >= 1000) return '💎 Gold'
    if (xp >= 500) return '🥈 Silver'
    return '🥉 Bronze'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="font-orbitron text-cyan animate-pulse text-sm tracking-widest">LOADING PROFILE...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] relative">

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl transition-all"
          style={{
            background: toast.type === 'error' ? 'rgba(255,80,80,0.15)' : 'rgba(0,255,157,0.15)',
            border: `1px solid ${toast.type === 'error' ? '#ff5050' : '#00ff9d'}`,
            color: toast.type === 'error' ? '#ff5050' : '#00ff9d',
          }}
        >
          {toast.type === 'error' ? '✕ ' : '✔ '}{toast.msg}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editOpen && (
        <EditProfileModal
          profile={{ name: displayName, bio: displayBio, age: profile?.age, degree: displayDegree, avatar: displayAvatar }}
          onSave={handleSaveProfile}
          onClose={() => setEditOpen(false)}
          saving={saving}
        />
      )}

      {/* ── Profile hero ── */}
      <div
        className="glass p-6 rounded-xl mb-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.04),rgba(139,92,246,0.04))', borderColor: '#2a3f6a' }}
      >
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(0,245,255,0.06),transparent)' }} />

        {/* Edit button */}
        <button
          onClick={() => setEditOpen(true)}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-orbitron transition-all hover:scale-105"
          style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}
        >
          ✏️ EDIT
        </button>

        <div className="flex gap-5 items-center flex-wrap pr-20 sm:pr-24">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-[3px] border-cyan"
              style={{ background: 'linear-gradient(135deg,#00f5ff,#8b5cf6)', boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
            >{displayAvatar}</div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold flex items-center justify-center font-orbitron text-[11px] text-bg font-black border-2 border-bg">
              {level}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="font-orbitron text-xl mb-0.5">{displayName}</div>
            <div className="text-slate-400 text-sm mb-1">
              {displayEmail}
              {displayAge && <span className="mx-1">·</span>}{displayAge}
              {displayDegree && <span className="mx-1">·</span>}{displayDegree}
            </div>
            {displayBio && (
              <p className="text-slate-400 text-xs mb-2 max-w-sm italic">"{displayBio}"</p>
            )}
            <div className="flex gap-2 flex-wrap">
              <span className="chip chip-cyan">⚡ {userXP} XP Total</span>
              <span className="chip chip-orange">🔥 {streak} Day Streak</span>
              <span className="chip chip-purple">{getRankChip(userXP)}</span>
            </div>
          </div>

          {/* Level progress */}
          <div className="text-center min-w-[130px]">
            <div className="text-[11px] font-orbitron text-slate-500 mb-2 tracking-widest">LEVEL PROGRESS</div>
            <ProgressBar value={levelXP} max={500} color="linear-gradient(90deg,#ffd700,#ffb300)" height="h-2" />
            <div className="text-[11px] text-slate-500 mt-1.5">{levelXP}/500 to Level {level + 1}</div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {TABS.map(t => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'tab-active' : ''}`} onClick={() => setActiveTab(t)}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass p-5 rounded-xl">
            <p className="section-label">SKILL SCORES</p>
            {displaySkills.map(s => (
              <div key={s.name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold">{s.name}</span>
                  <span className="font-mono text-[12px]" style={{ color: s.color }}>{s.score}%</span>
                </div>
                <ProgressBar value={s.score} max={100} color={s.color} />
              </div>
            ))}
          </div>
          <div className="glass p-5 rounded-xl">
            <p className="section-label">QUICK STATS</p>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="XP Earned" value={userXP} icon="⚡" color="#ffd700" />
              <StatBox label="Level" value={level} icon="🎯" color="#00f5ff" />
              <StatBox label="Courses" value={enrolledCourses.length} icon="📚" color="#8b5cf6" />
              <StatBox label="Applied" value={mergedAppliedJobs.length} icon="💼" color="#00ff9d" />
            </div>
          </div>
        </div>
      )}

      {/* ── COURSES ── */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledCourses.length === 0 && (
            <p className="text-slate-500 text-sm col-span-3 text-center py-8">No courses enrolled yet.</p>
          )}
          {enrolledCourses.map(cid => {
            const course = COURSES.find(c => c.id === cid)
            if (!course) return null
            const done = (completedChapters[cid] || []).length
            const pct = Math.round((done / course.chapters.length) * 100)
            return (
              <div key={cid} className="glass p-4 rounded-xl" style={{ borderColor: `${course.color}33` }}>
                <div className="flex gap-3 items-center mb-3">
                  <span className="text-3xl">{course.icon}</span>
                  <div>
                    <div className="font-orbitron text-[12px]" style={{ color: course.color }}>{course.title}</div>
                    <div className="text-[11px] text-slate-500">{done}/{course.chapters.length} chapters</div>
                  </div>
                </div>
                <ProgressBar value={done} max={course.chapters.length} color={course.color} />
                <div className="flex justify-between mt-2">
                  <span className="font-mono text-[12px]" style={{ color: course.color }}>{pct}%</span>
                  <span className="text-[11px] text-gold">+{done * 5} XP earned</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── BADGES ── */}
      {activeTab === 'badges' && (
        <div>
          <p className="section-label">
            EARNED BADGES ({earnedBadgeIds.size}/{ACHIEVEMENTS.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map(ach => {
              const earned = earnedBadgeIds.has(String(ach.id))
              const rc = RARITY_COLORS[ach.rarity]
              return (
                <div key={ach.id} className="card p-4 rounded-xl text-center"
                  style={{ opacity: earned ? 1 : 0.4, borderColor: earned ? `${rc}44` : undefined }}>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3"
                    style={{ background: `${rc}22`, border: `2px solid ${rc}`, boxShadow: earned ? `0 0 18px ${rc}44` : 'none' }}
                  >
                    {earned ? ach.icon : '🔒'}
                  </div>
                  <div className="font-semibold text-sm mb-1">{ach.title}</div>
                  <div className="text-[11px] text-slate-500 mb-2">{ach.desc}</div>
                  <span className="chip text-[10px]" style={{ color: rc, background: `${rc}22`, borderColor: `${rc}33` }}>{ach.rarity}</span>
                  {earned && <div className="font-orbitron text-[10px] text-gold mt-1.5">+{ach.xp} XP</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── JOBS ── */}
      {activeTab === 'jobs' && (
        <div className="flex flex-col gap-3">
          {userApplications.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-8">No jobs applied yet.</p>
          )}
          {userApplications.map(app => {
            const job = app.jobId
            if (!job) return null
            const status = app.status || 'pending'
            const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
            
            return (
              <div key={app._id} className="glass flex items-center gap-4 p-4 rounded-xl">
                <span className="text-3xl">{job.logo || '🏢'}</span>
                <div className="flex-1">
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-sm text-slate-500">{job.company} · {job.type || 'Full-time'}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <span 
                    className="chip text-[10px]" 
                    style={{ color: config.color, background: `${config.color}22`, borderColor: `${config.color}33` }}
                   >
                    {config.label.toUpperCase()}
                   </span>
                   <div className="text-[10px] text-slate-600 font-orbitron">REF: {app._id.slice(-6).toUpperCase()}</div>
                </div>
                <div className="text-[12px] font-orbitron text-neon-green hidden sm:block">{job.salary}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bar chart */}
            <div className="glass p-5 rounded-xl">
              <p className="section-label">XP EARNED (LAST {displayXpHist.length} MONTHS)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={displayXpHist} barSize={24}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Share Tech Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="xp" fill="url(#cyanGrad)" radius={[3, 3, 0, 0]} />
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#00f5ff" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className="glass p-5 rounded-xl">
              <p className="section-label">SKILL RADAR</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e2d4a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="Skills" dataKey="A" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.15} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass p-5 rounded-xl">
            <p className="section-label">PERFORMANCE SUMMARY</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatBox label="Avg Score" value="76%" icon="📊" color="#00f5ff" />
              <StatBox label="Quizzes" value={Object.keys(quizScores).length} icon="📝" color="#ffd700" />
              <StatBox label="Projects" value={completedProjects.length} icon="🏗️" color="#8b5cf6" />
              <StatBox label="Badges" value={earnedBadgeIds.size} icon="🏆" color="#ff6b35" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
