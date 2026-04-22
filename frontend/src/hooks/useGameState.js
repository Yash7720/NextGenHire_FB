import { useState, useCallback, useEffect, useMemo } from 'react'
import * as questApi from '../services/questApi'
import * as leaderboardApi from '../services/leaderboardApi'
import * as userApi from '../services/userApi'
import * as notificationApi from '../services/notificationApi'
import { getSocket } from '../services/socket'

// ── Tiny localStorage hook ────────────────────────────────────────────────────
// Reads initial value from localStorage (falling back to `defaultValue`),
// and writes back to localStorage on every update.
function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      setValue(stored !== null ? JSON.parse(stored) : defaultValue)
    } catch {
      setValue(defaultValue)
    }
  }, [key])

  const setValueWrapped = useCallback((val) => {
    setValue(prev => {
      const newVal = typeof val === 'function' ? val(prev) : val;
      try {
        localStorage.setItem(key, JSON.stringify(newVal));
      } catch {
         // Silently ignore
      }
      return newVal;
    });
  }, [key]);

  return [value, setValueWrapped]
}

// ── Default state values ──────────────────────────────────────────────────────
const DEFAULT_COMPLETED_CHAPTERS = {
  html: [], css: [], js: [], python: [], cpp: [], react: [],
}
const DEFAULT_NOTIFICATIONS = []

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useGameState() {
  // Resolve the current user's unique ID to namespace all localStorage keys.
  // Each user gets their own isolated progress — new users always start fresh.
  const currentUser = userApi.getCurrentUser()
  const userId = currentUser?._id || currentUser?.id || 'guest'
  const ns = `ngb_${userId}` // e.g. "ngb_abc123" or "ngb_guest"

  // All persisted state — scoped per-user so different users on the same
  // browser NEVER share course progress, XP, quiz scores, etc.
  const [userXP,             setUserXP]             = useLocalStorage(`${ns}_userXP`,             0)
  const [streak,             setStreak]             = useLocalStorage(`${ns}_streak`,             1)
  const [completedChapters,  setCompletedChapters]  = useLocalStorage(`${ns}_completedChapters`,  DEFAULT_COMPLETED_CHAPTERS)
  const [enrolledCourses,    setEnrolledCourses]    = useLocalStorage(`${ns}_enrolledCourses`,    [])
  const [appliedJobsRaw,     setAppliedJobsRaw]     = useLocalStorage(`${ns}_appliedJobs`,        [])
  const [notifications,      setNotifications]      = useState(DEFAULT_NOTIFICATIONS)
  const [claimedQuests,      setClaimedQuests]      = useLocalStorage(`${ns}_claimedQuests`,      [])
  const [quizScores,         setQuizScores]         = useLocalStorage(`${ns}_quizScores`,         {})
  const [completedProjects,  setCompletedProjects]  = useLocalStorage(`${ns}_completedProjects`,  [])
  const [lastSpinDate,       setLastSpinDate]       = useLocalStorage(`${ns}_lastSpinDate`,       null)
  const [viewedLessons,      setViewedLessons]      = useLocalStorage(`${ns}_viewedLessons`,      {})

  // Logged-in user (from localStorage set by Auth)
  const [user, setUser] = useState(() => userApi.getCurrentUser())

  // Dynamic backend data
  const [dailyQuests, setDailyQuests] = useState([])
  const [weeklyChallenges, setWeeklyChallenges] = useState([])
  const [leaderboard, setLeaderboard] = useState([])

  // Transient UI state — NOT persisted
  const [showXP,   setShowXP]   = useState(false)
  const [xpAmount, setXpAmount] = useState(0)

  // On mount: sync localStorage progress → MongoDB so leaderboard is accurate
  // This handles users who completed courses before server-sync was added.
  useEffect(() => {
    const current = userApi.getCurrentUser()
    setUser(current)
    if (!current) return

    const uid = current._id || current.id
    if (!uid) return

    // Initialize/Sync local state from server object on mount
    if (current.xp !== undefined) {
      const next = Number(current.xp ?? 0)
      if (!Number.isNaN(next)) setUserXP(next)
    }
    if (current.streak !== undefined) {
      const s = Number(current.streak ?? 1)
      if (!Number.isNaN(s)) setStreak(s)
    }
    if (current.enrolledCourses && Array.isArray(current.enrolledCourses)) {
      setEnrolledCourses(prev => {
        const merged = new Set([...prev, ...current.enrolledCourses])
        return Array.from(merged)
      })
    }
    // Note: completedProjects (array) is local-first, but we sync its COUNT to server

    // 3. FETCH AUTHORITATIVE PROFILE FROM SERVER
    // This solves the 'not real-time' problem by ensuring MongoDB values
    // always override potentially stale localStorage values on mount.
    userApi.fetchUserProfile(uid).then(fresh => {
      if (fresh) {
        if (fresh.xp !== undefined) setUserXP(Number(fresh.xp))
        if (fresh.streak !== undefined) setStreak(Number(fresh.streak))
        setUser(u => ({ ...u, ...fresh }))
        
        // 4. FIRE DAILY LOGIN AUTOMATICALLY (once per day check)
        // This ensures the streak is bumped even if the user never signs out.
        userApi.dailyLogin({ userId: uid }).then(res => {
          if (res?.user && typeof res.user === 'object') {
             const u = res.user
             // Update all local stats from the authoritative server response
             if (u.streak !== undefined) setStreak(Number(u.streak))
             if (u.xp !== undefined) {
               const nextXP = Number(u.xp)
               setUserXP(nextXP)
               // Show a little welcome back notification if it was a new login
               if (!res.alreadyClaimed) {
                 addNotification(`Welcome back! Daily bonus: +50 XP and ${u.streak} day streak! 🔥`)
               }
             }
             setUser(prev => ({ ...prev, ...u }))
             userApi.setCurrentUser({ ...userApi.getCurrentUser(), ...u })
          }
        }).catch(() => {})
      }
    }).catch(() => {})

    // Sync current stats to server one-time on mount
    const projects = completedProjects || []
    const count = Array.isArray(projects) ? projects.length : 0
    const enrolled = enrolledCourses || []
    userApi.updateStats({ userId: uid, coursesCompleted: count, enrolledCourses: enrolled }).catch(() => {})

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-Sync Streak State ────────────────────────────────────────────────
  // Keeps the local state in sync with the latest 'user' state from MongoDB.
  // This ensures things like Dashboard and Quests update in real-time.
  useEffect(() => {
    if (user && user.streak !== undefined) {
      const s = Number(user.streak)
      if (!Number.isNaN(s) && s !== streak) {
        setStreak(s)
      }
    }
  }, [user, streak, setStreak])

  // ── Real-time Sync Watchers ────────────────────────────────────────────────
  // Whenever local streak or courses change, sync to MongoDB immediately
  useEffect(() => {
    const uid = user?._id || user?.id
    if (!uid || uid === 'guest') return
    
    const count = Array.isArray(completedProjects) ? completedProjects.length : 0
    const enrolled = Array.isArray(enrolledCourses) ? enrolledCourses : []
    userApi.updateStats({ userId: uid, coursesCompleted: count, enrolledCourses: enrolled }).catch(() => {})
  }, [streak, completedProjects.length, enrolledCourses.length, user])

  // ── Actions ─────────────────────────────────────────────────────────────────

  // Define fetchAndSetLeaderboard FIRST so gainXP can reference it.
  // leaderboardApi.fetchLeaderboard() always returns a plain array.
  const fetchAndSetLeaderboard = useCallback(async () => {
    try {
      const list = await leaderboardApi.fetchLeaderboard()
      setLeaderboard(Array.isArray(list) ? list : [])
    } catch (err) {
      console.warn('fetchLeaderboard error:', err?.message)
    }
  }, [])


  // gainXP: animate locally (instant) AND sync to server + refresh leaderboard
  const gainXP = useCallback((amt) => {
    // 1. Local animation — instant, no waiting
    setXpAmount(amt)
    setShowXP(true)
    setUserXP(prev => prev + amt)
    setTimeout(() => setShowXP(false), 2200)

    // 2. Push to server + refresh leaderboard so rankings are always up-to-date
    const current = userApi.getCurrentUser()
    const uid = current?._id || current?.id
    if (uid) {
      userApi.addXp({ userId: uid, amount: amt })
        .then(updated => {
          // Keep local state in sync with server's authoritative value.
          // Directly use the full user payload from the server if possible.
          if (updated && typeof updated === 'object') {
            setUser(prev => {
              const next = { ...prev, ...updated }
              userApi.setCurrentUser(next)
              return next
            })
            // If the server updated the XP, reflect it in the local XP state too
            if (updated.xp !== undefined) {
              const n = Number(updated.xp)
              if (!Number.isNaN(n)) setUserXP(n)
            }
          }
          // Refresh the leaderboard so the new XP is visible immediately
          fetchAndSetLeaderboard()
        })
        .catch(() => {}) // non-fatal — local state still correct
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUserXP, setUser, fetchAndSetLeaderboard])

  const setUserXPBoth = useCallback((nextXP_or_User) => {
    if (typeof nextXP_or_User === 'object' && nextXP_or_User !== null) {
      // Full user object provided
      setUser(prev => {
        const merged = { ...prev, ...nextXP_or_User }
        userApi.setCurrentUser(merged)
        return merged
      })
      if (nextXP_or_User.xp !== undefined) {
        const n = Number(nextXP_or_User.xp ?? 0)
        if (!Number.isNaN(n)) setUserXP(n)
      }
    } else {
      // Only XP provided
      const n = Number(nextXP_or_User ?? 0)
      if (Number.isNaN(n)) return
      setUserXP(n)
      setUser(prev => {
        const merged = prev ? { ...prev, xp: n } : { xp: n }
        userApi.setCurrentUser(merged)
        return merged
      })
    }
  }, [setUserXP])

  const refreshUserFromStorage = useCallback(() => {
    const current = userApi.getCurrentUser()
    setUser(current)
    if (current && current.xp !== undefined && current.xp !== null) {
      const next = Number(current.xp ?? 0)
      if (!Number.isNaN(next)) setUserXP(next)
    }
  }, [setUserXP])

  const addXpServer = useCallback(async (amount) => {
    try {
      const current = userApi.getCurrentUser()
      const userId = current?._id || current?.id
      if (!userId) return null

      const updatedUser = await userApi.addXp({ userId, amount })
      if (updatedUser) setUserXPBoth(updatedUser) // Full merge
      return updatedUser
    } catch (err) {
      console.log('addXpServer error', err)
      return null
    }
  }, [setUserXPBoth])

  const completeChapter = useCallback((courseId, chapId) => {
    setCompletedChapters(prev => {
      const done = prev[courseId] || []
      if (done.includes(chapId)) return prev  // already done, skip
      return { ...prev, [courseId]: [...done, chapId] }
    })
    gainXP(5)  // syncs to server inside gainXP
  }, [setCompletedChapters, gainXP])

  const enroll = useCallback((courseId) => {
    setEnrolledCourses(prev =>
      prev.includes(courseId) ? prev : [...prev, courseId]
    )
    // Sync to server
    const current = userApi.getCurrentUser()
    const uid = current?._id || current?.id
    if (uid && uid !== 'guest') {
      userApi.enrollCourse({ userId: uid, courseId }).catch(() => {})
    }
  }, [setEnrolledCourses])

  const applyJob = useCallback((jobId, skipServerSync = false) => {
    const current = userApi.getCurrentUser()
    const uid = current?._id || current?.id || 'guest'
    const entry = `${uid}::${jobId}`

    setAppliedJobsRaw(prev => {
      const list = Array.isArray(prev) ? prev : []
      if (list.includes(entry)) return list  // already applied
      return [...list, entry]
    })
    gainXP(20)  // syncs to server inside gainXP

    // Push to actual profile database — skip if already handled (e.g. by applicationApi)
    if (uid !== 'guest' && !skipServerSync) {
      import('../services/profileApi').then(({ applyJobProfile }) => {
        applyJobProfile(uid, jobId).catch(() => {})
      })
    }
  }, [setAppliedJobsRaw, gainXP])

  const markNotifRead = useCallback(async () => {
    try {
      await notificationApi.markNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    } catch (err) {
      console.error('Failed to mark read', err)
    }
  }, [setNotifications])

  const claimQuest = useCallback((questKey, xp) => {
    setClaimedQuests(prev =>
      prev.includes(questKey) ? prev : [...prev, questKey]
    )
    gainXP(xp)  // syncs to server inside gainXP
  }, [setClaimedQuests, gainXP])

  const saveQuizScore = useCallback((courseId, score) => {
    setQuizScores(prev => ({ ...prev, [courseId]: score }))
    gainXP(50)  // syncs to server inside gainXP
  }, [setQuizScores, gainXP])

  const markLessonAsViewed = useCallback((courseId, chapterId, lessonTitle) => {
    setViewedLessons(prev => {
      const courseData = prev[courseId] || {}
      const chapterData = courseData[chapterId] || []
      if (chapterData.includes(lessonTitle)) return prev
      return {
        ...prev,
        [courseId]: {
          ...courseData,
          [chapterId]: [...chapterData, lessonTitle]
        }
      }
    })
  }, [setViewedLessons])

  const completeProject = useCallback((courseId) => {
    setCompletedProjects(prev => {
      if (prev.includes(courseId)) return prev  // already done — no-op

      const next = [...prev, courseId]

      // Call the dedicated endpoint: atomically does +200 XP, +1 course, +1 streak
      const current = userApi.getCurrentUser()
      const uid = current?._id || current?.id
      if (uid) {
        userApi.completeCourse({ userId: uid })
          .then(updated => {
            if (updated?.xp !== undefined) {
              const n = Number(updated.xp)
              if (!Number.isNaN(n)) {
                setUserXP(n)
                setUser(u => {
                  const merged = u ? { ...u, ...updated } : updated
                  userApi.setCurrentUser(merged)
                  return merged
                })
              }
            }
            fetchAndSetLeaderboard()
          })
          .catch(() => {})
      }
      return next
    })
    gainXP(200)  // instant local animation; server updates asynchronously
  }, [setCompletedProjects, gainXP, setUserXP, setUser, fetchAndSetLeaderboard])

  const spinWheel = useCallback(async (xpWon) => {
    setLastSpinDate(new Date().toDateString())
    try {
      // addXpServer already uses setUserXPBoth(updatedUser) which handles merging now
      const updatedUser = await addXpServer(xpWon)
      
      // Still show the local visual animation
      setXpAmount(xpWon)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2200)

      if (updatedUser) {
        // Refresh leaderboard to catch rank changes after spin
        fetchAndSetLeaderboard()
      }
    } catch (err) {
      console.log('spinWheel error', err)
      gainXP(xpWon)
    }
  }, [setLastSpinDate, addXpServer, gainXP, fetchAndSetLeaderboard])

  const addNotification = useCallback((text) => {
    setNotifications(prev => [
      { id: Date.now(), text, time: 'just now', unread: true },
      ...prev.slice(0, 9), // keep latest 10
    ])
  }, [setNotifications])

  const fetchAndSetQuests = useCallback(async () => {
    try {
      const data = await questApi.fetchQuests()
      const list = Array.isArray(data) ? data : (data?.quests || [])
      
      const daily  = []
      const weekly = []
      
      list.forEach(q => {
        const type = (q.type || '').toLowerCase()
        if (type === 'daily') {
          daily.push(q)
        } else if (type === 'weekly') {
          weekly.push(q)
        } else {
          // fallback
          daily.push(q)
        }
      });

      setDailyQuests(daily)
      setWeeklyChallenges(weekly)
    } catch (err) {
      console.log('fetchQuests error', err)
    }
  }, [])



  const fetchAndSetNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.fetchNotifications()
      if (data && Array.isArray(data)) {
        const formatTime = (dateStr) => {
          if (!dateStr) return 'just now'
          const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
          if (diff < 1) return 'just now'
          if (diff < 60) return `${diff}m ago`
          const hrs = Math.floor(diff / 60)
          if (hrs < 24) return `${hrs}h ago`
          return `${Math.floor(hrs / 24)}d ago`
        }
        
        const formatted = data.map(n => ({
          id: n._id,
          text: n.text,
          unread: n.unread,
          time: formatTime(n.createdAt),
          type: n.type
        }))
        setNotifications(formatted)
      } else {
        setNotifications([])
      }
    } catch (err) {
      console.log('fetchNotifications error', err)
      setNotifications([])
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchAndSetQuests()
    fetchAndSetLeaderboard()
    fetchAndSetNotifications()
  }, [fetchAndSetQuests, fetchAndSetLeaderboard, fetchAndSetNotifications])

  // Real-time leaderboard updates via Socket.IO
  // Always re-fetch from the /api/leaderboard endpoint so composite scores
  // and badges are computed correctly (raw socket payload is unranked).
  useEffect(() => {
    const s = getSocket()
    
    // Join private room once userId exists
    const join = () => {
       if (userId && userId !== 'guest') {
         s.emit('join-room', userId)
         console.log(`[socket] join-room emitted for user: ${userId}`)
       }
    }

    if (s.connected) join()
    s.on('connect', () => {
      console.log(`[socket] Connected successfully! ID: ${s.id}`)
      join()
    })
    s.on('disconnect', (reason) => {
      console.warn(`[socket] Disconnected: ${reason}`)
    })
    s.on('connect_error', (err) => {
      console.error(`[socket] Connection error: ${err.message}`)
    })

    const onUpdate = () => {
      console.log('[socket] leaderboardUpdate received!')
      fetchAndSetLeaderboard()
      fetchAndSetQuests() // Fallback quest update
    }
    const onQuestsUpdate = (payload) => {
      console.log('[socket] questsUpdated received!', payload)
      fetchAndSetQuests() 
    }

    s.on('leaderboardUpdate', onUpdate)
    s.on('questsUpdated', onQuestsUpdate)

    return () => {
      s.off('leaderboardUpdate', onUpdate)
      s.off('questsUpdated', onQuestsUpdate)
    }
  }, [fetchAndSetLeaderboard, fetchAndSetQuests, userId])

  // Polling fallback: refresh leaderboard every 10 s in case socket is missed
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAndSetLeaderboard()
      fetchAndSetNotifications()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchAndSetLeaderboard, fetchAndSetNotifications])

  const claimQuestServer = useCallback(async (quest) => {
    try {
      const current = userApi.getCurrentUser()
      const userId = current?._id || current?.id
      const questId = quest?._id || quest?.id
      if (!userId || !questId) {
        console.log('claimQuestServer: missing userId/questId')
        return null
      }

      const res = await questApi.claimQuest({ userId, questId })
      const updatedUser = res?.user ?? res?.updatedUser
      const xpGained = Number(res?.xpGained ?? quest?.xp ?? 0)

      // Mark claimed locally so UI immediately reflects claimed state
      const key = quest?.key || quest?.questKey || questId
      setClaimedQuests(prev => (prev.includes(key) ? prev : [...prev, key]))

      if (updatedUser?.xp !== undefined) setUserXPBoth(updatedUser.xp)
      else if (xpGained) await addXpServer(xpGained)

      // Keep existing XP animation (same timing), but don't double-add if server already updated xp
      setXpAmount(xpGained)
      setShowXP(true)
      setTimeout(() => setShowXP(false), 2200)

      // Refresh quests so progress/claim status matches backend
      fetchAndSetQuests()
      return res
    } catch (err) {
      console.log('claimQuest error', err)
      return null
    }
  }, [setClaimedQuests, setUserXPBoth, fetchAndSetQuests])

  // ── Derived ──────────────────────────────────────────────────────────────────
  const level       = Math.floor(userXP / 500) + 1
  const levelXP     = userXP % 500
  const unreadCount = notifications.filter(n => n.unread).length
  const canSpinToday = lastSpinDate !== new Date().toDateString()

  const appliedJobs = useMemo(() => {
    const current = userApi.getCurrentUser()
    const userId = current?._id || current?.id || 'guest'
    const list = Array.isArray(appliedJobsRaw) ? appliedJobsRaw : []

    // New format: "userId::jobId" (per-user scoped)
    const scoped = list
      .filter((v) => typeof v === 'string' && v.startsWith(`${userId}::`))
      .map((v) => {
        const rawJobId = v.split('::')[1]
        const n = Number(rawJobId)
        return Number.isNaN(n) ? rawJobId : n
      })

    // Backward compatibility: keep legacy numeric IDs only for guest mode.
    if (scoped.length === 0 && userId === 'guest') {
      return list.filter((v) => typeof v === 'number' || typeof v === 'string')
    }

    return scoped
  }, [appliedJobsRaw])

  // ── Badge helper (mirrors server logic) ──────────────────────────────────────
  const getBadgeLocal = (score) => {
    if (score >= 5000) return '🏆 Legend'
    if (score >= 2500) return '💎 Master'
    if (score >= 1000) return '⚡ Pro'
    if (score >= 300)  return '🔥 Warrior'
    return '🎯 Recruit'
  }

  const leaderboardComputed = useMemo(() => {
    const current = userApi.getCurrentUser()
    const meId = current?._id || current?.id
    const meEmail = current?.email

    const normalized = (Array.isArray(leaderboard) ? leaderboard : []).map((u) => {
      const id  = u?._id || u?.id
      const xp  = Number(u?.xp ?? 0)
      // courses: use DB value first; fall back to local completedProjects for current user
      const dbCourses    = Number(u?.coursesCompleted ?? u?.courses ?? 0)
      const isYouCheck   = (!!meId && id === meId) || (!!meEmail && u?.email === meEmail)
      const localCourses = isYouCheck ? completedProjects.length : 0
      const courses      = dbCourses > 0 ? dbCourses : localCourses
      const strk         = Number(u?.streak ?? 0)
      const score        = xp + courses * 200 + strk * 50
      const createdAt    = u?.createdAt ? new Date(u.createdAt).getTime() : Number.MAX_SAFE_INTEGER
      return {
        ...u,
        xp,
        courses,
        streak: strk,
        score,
        badge:  u?.badge ?? getBadgeLocal(score),
        createdAt,
        isYou:  isYouCheck,
      }
    })

    // Sort: score DESC, createdAt ASC (tie-break), then stable index
    const withIndex = normalized.map((x, i) => ({ ...x, _stableIndex: i }))
    withIndex.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt
      return a._stableIndex - b._stableIndex
    })

    // Assign competition ranks (same score → same rank)
    let lastScore = null
    let lastRank  = 0
    for (let i = 0; i < withIndex.length; i++) {
      const sc = withIndex[i].score
      if (lastScore === null || sc !== lastScore) {
        lastRank  = i + 1
        lastScore = sc
      }
      withIndex[i].rank = lastRank
    }

    return withIndex
  }, [leaderboard, completedProjects])

  // Priority for REAL-TIME sync: 
  // 1. Fresh user state (returned from addXp/completes)
  // 2. Local persisted state (last resort / while loading)
  // 3. Leaderboard data (cached/asynchronous)
  const liveStreak = user?.streak ?? streak ?? leaderboardComputed.find(u => u.isYou)?.streak ?? 0;

  // ── Sync skills to backend silently ───────────────────────────────────────────
  const chaptersStr = JSON.stringify(completedChapters);
  useEffect(() => {
    const current = userApi.getCurrentUser()
    const uid = current?._id || current?.id
    if (!uid || uid === 'guest') return;

    // Mini static map representing our courses to calculate skill scores
    const COURSE_SKILL_MAP = [
      { courseId: 'html',   name: 'HTML',   color: '#e34c26', chapters: 5 },
      { courseId: 'css',    name: 'CSS',    color: '#264de4', chapters: 5 },
      { courseId: 'js',     name: 'JS',     color: '#f7df1e', chapters: 5 },
      { courseId: 'python', name: 'Python', color: '#3776ab', chapters: 5 },
      { courseId: 'cpp',    name: 'C++',    color: '#00599c', chapters: 5 },
      { courseId: 'react',  name: 'React',  color: '#61dafb', chapters: 5 },
    ]

    try {
      const parsed = JSON.parse(chaptersStr)
      const skillsToSync = COURSE_SKILL_MAP.map(c => {
        const done = (parsed[c.courseId] || []).length
        const score = Math.round((done / c.chapters) * 100)
        return { name: c.name, score, color: c.color }
      }).filter(s => s.score > 0)

      if (skillsToSync.length > 0) {
        import('../services/profileApi').then(({ updateSkills }) => {
          updateSkills(uid, skillsToSync).catch(() => {})
        })
      }
    } catch {}
  }, [chaptersStr])

  // ── Sync local applied jobs to backend silently ─────────────────────────────
  // REFACTORED: Background sync removed. Profile updates now happen directly 
  // via applicationController.applyJob or manual applyJob calls to avoid duplication.


  const liveCourses = leaderboardComputed.find(u => u.isYou)?.courses ?? user?.coursesCompleted ?? completedProjects?.length ?? 0;

  return {
    // State
    userXP, level, levelXP, streak: liveStreak, liveCourses,
    showXP, xpAmount,
    completedChapters, enrolledCourses, appliedJobs,
    notifications, unreadCount,
    claimedQuests, quizScores, completedProjects, viewedLessons,
    canSpinToday,
    user,
    dailyQuests,
    weeklyChallenges,
    leaderboard: leaderboardComputed,
    // Actions
    gainXP, completeChapter, enroll, applyJob,
    markNotifRead,
    markLessonAsViewed,
    claimQuest, // legacy local claim
    claimQuestServer,
    saveQuizScore,
    completeProject,
    spinWheel,
    addNotification,
    refreshUserFromStorage,
    fetchAndSetLeaderboard,
    refreshNotifications: fetchAndSetNotifications,
  }
}
