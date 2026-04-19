import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import StatBox from '../../components/ui/StatBox'
import ProgressBar from '../../components/ui/ProgressBar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import * as leaderboardApi from '../../services/leaderboardApi'
import * as adminApi from '../../services/adminApi'
import { getSocket } from '../../services/socket'

const CustomTooltip = ({ active, payload }) =>
  active && payload?.length ? (
    <div className="bg-panel-2 border border-border rounded px-3 py-2 text-xs">
      <p className="text-slate-400">{payload[0].payload.name}</p>
      <p className="text-cyan font-orbitron">{payload[0].value} applicants</p>
    </div>
  ) : null

export default function AdminDashboard() {
  const nav = useNavigate()
  const [leaderboard, setLeaderboard] = useState([])
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalApplied: 0,
    platformUsers: 0,
    statusData: [],
    appPerJob: []
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true)
      const [lbData, sData] = await Promise.all([
        leaderboardApi.fetchLeaderboard(),
        adminApi.fetchDashboardStats()
      ])
      
      const lbList = Array.isArray(lbData) ? lbData : (lbData?.leaderboard || lbData?.users || [])

      setLeaderboard(lbList)
      if (sData) setStats(sData)
    } catch (err) {
      console.log('AdminDashboard load error', err)
    } finally {
      if (isInitial) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(true)

    const s = getSocket()
    
    // Debug connection status
    if (s.connected) {
      console.log('[AdminDashboard] Socket already connected:', s.id)
    } else {
      console.log('[AdminDashboard] Socket not connected, waiting...')
    }

    s.on('connect', () => {
      console.log('[AdminDashboard] Socket connected:', s.id)
    })

    s.on('disconnect', (reason) => {
      console.warn('[AdminDashboard] Socket disconnected:', reason)
    })

    const onUpdate = (payload) => {
      try {
        console.log('[AdminDashboard] Received leaderboardUpdate. Refreshing stats...', payload)
        // Always trigger a full load to keep stats in sync
        load()
      } catch (err) {
        console.log('AdminDashboard leaderboardUpdate error', err)
      }
    }
    s.on('leaderboardUpdate', onUpdate)

    return () => {
      s.off('connect')
      s.off('disconnect')
      s.off('leaderboardUpdate', onUpdate)
    }
  }, [load])

  const topApplicants = useMemo(() => {
    const list = (Array.isArray(leaderboard) ? leaderboard : []).map((u) => {
      const xp = Number(u?.xp ?? 0)
      const safeXp = Number.isNaN(xp) ? 0 : xp
      const score = Math.max(55, Math.min(99, Math.round((safeXp / 5000) * 100)))
      return {
        name: u?.name || u?.username || u?.email || 'Candidate',
        applied: u?.applied || u?.title || 'Role',
        score,
        xp: safeXp,
      }
    })

    list.sort((a, b) => b.xp - a.xp)
    return list.slice(0, 4)
  }, [leaderboard])

  const appData = useMemo(() => stats.appPerJob || [], [stats])
  const statusData = useMemo(() => stats.statusData || [], [stats])
  const shortlistedCount = useMemo(() => statusData.find(d => d.name === 'Shortlisted')?.value || 0, [statusData])
  const interviewCount   = useMemo(() => statusData.find(d => d.name === 'Interview')?.value || 0, [statusData])

  return (
    <div className="max-w-[1100px] space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatBox label="Active Jobs"    value={stats.activeJobs}       icon="💼" color="#00f5ff" />
        <StatBox label="Total Applied"  value={stats.totalApplied}     icon="👥" color="#ffd700" />
        <StatBox label="Shortlisted"    value={shortlistedCount}       icon="⭐" color="#00ff9d" />
        <StatBox label="Interviews"     value={interviewCount}         icon="📞" color="#8b5cf6" />
        <StatBox label="Platform Users" value={stats.platformUsers}    icon="🌐" color="#ff2d78" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="glass p-5 rounded-xl lg:col-span-2">
          <p className="section-label">APPLICATIONS PER JOB</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={appData} barSize={28}>
               <XAxis 
                dataKey="name" 
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'Share Tech Mono' }} 
                interval={0}
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="applicants" fill="url(#adminGrad)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f5ff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.4} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass p-5 rounded-xl">
          <p className="section-label">CANDIDATE STATUS</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}`, n]} contentStyle={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {statusData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="text-slate-400 flex-1">{d.name}</span>
                <span className="font-orbitron" style={{ color: d.color }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top candidates */}
        <div className="glass p-5 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <p className="section-label mb-0">TOP APPLICANTS</p>
            <button className="btn btn-sm btn-outline py-1" onClick={() => nav('/admin/candidates')}>View All →</button>
          </div>
          {topApplicants.map((c, i) => (
            <div key={i} className="flex items-center gap-3 mb-3 p-3 bg-bg-3 rounded-lg border border-border">
              <span className={`font-orbitron font-black text-base w-7 ${['rank-1','rank-2','rank-3','text-slate-500'][i]}`}>#{i+1}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-[11px] text-slate-500">{c.applied}</div>
              </div>
              <span className="font-orbitron text-[12px]" style={{ color: c.score >= 90 ? '#00ff9d' : c.score >= 80 ? '#ffd700' : '#94a3b8' }}>{c.score}%</span>
              <span className="font-orbitron text-[11px] text-gold">⚡{c.xp}</span>
            </div>
          ))}
        </div>

        {/* Skill heatmap / recent activity */}
        <div className="glass p-5 rounded-xl">
          <p className="section-label">SKILL SCORE BREAKDOWN</p>
          {[['React/Frontend', 88], ['Python/Backend', 83], ['C++/Systems', 76], ['UI/UX Design', 71]].map(([label, val]) => (
            <div key={label} className="mb-3">
              <div className="flex justify-between mb-1 text-sm">
                <span>{label}</span>
                <span className="font-mono text-cyan">{val}%</span>
              </div>
              <ProgressBar value={val} max={100} color={`hsl(${val * 1.2},90%,55%)`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
