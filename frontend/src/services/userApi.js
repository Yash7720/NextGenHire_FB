import { apiRequest, getStoredUser, setStoredUser } from './http'

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export function getCurrentUser()       { return getStoredUser() }
export function setCurrentUser(user)   { setStoredUser(user) }

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────

export async function login({ email, password }) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  const user = data?.user ?? data
  if (!user) throw new Error('Login response missing user')

  const normalized = { ...user, token: data.token || user.token, xp: Number(user.xp ?? 0) }
  if (data.token) localStorage.setItem('token', data.token)
  setStoredUser(normalized)
  return normalized
}

export async function register({ name, email, password, age, degree }) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: { name, email, password, age, degree },
  })

  const user = data?.user
  if (user) {
    const normalized = { ...user, token: data.token || user.token, xp: Number(user.xp ?? 0) }
    if (data.token) localStorage.setItem('token', data.token)
    setStoredUser(normalized)
    return normalized
  }
  return data
}

export async function firebaseLogin({ name, email, firebaseUid, profilePic }) {
  const data = await apiRequest('/api/auth/firebase-login', {
    method: 'POST',
    body: { name, email, firebaseUid, profilePic },
  })

  const user = data?.user
  if (user) {
    const normalized = { ...user, token: data.token || user.token, xp: Number(user.xp ?? 0) }
    if (data.token) localStorage.setItem('token', data.token)
    setStoredUser(normalized)
    return normalized
  }
  return data
}

export async function forgotPassword(email) {
  return await apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(token, password) {
  return await apiRequest(`/api/auth/reset-password/${token}`, {
    method: 'PUT',
    body: { password },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// XP & STATS — all mutations go through the server so MongoDB stays in sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Award arbitrary XP (chapter complete, quest, job apply, spin wheel, etc.)
 * POST /api/user/add-xp
 */
export async function addXp({ userId, amount, source }) {
  const data = await apiRequest('/api/user/add-xp', {
    method: 'POST',
    body: { userId, amount, source },
  })

  const user = data?.user ?? data?.updatedUser ?? data
  if (user && typeof user === 'object') {
    const stored     = getStoredUser()
    const merged     = stored ? { ...stored, ...user } : user
    const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
    setStoredUser(normalized)
    return normalized
  }
  return null
}

/**
 * Complete a course — awards +200 XP, +1 course, +1 streak on the server.
 * POST /api/user/complete-course
 */
export async function completeCourse({ userId }) {
  try {
    const data = await apiRequest('/api/user/complete-course', {
      method: 'POST',
      body: { userId },
    })

    const user = data?.user
    if (user && typeof user === 'object') {
      const stored     = getStoredUser()
      const merged     = stored ? { ...stored, ...user } : user
      const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
      setStoredUser(normalized)
      return normalized
    }
    return null
  } catch (err) {
    console.warn('completeCourse failed (non-fatal):', err?.message)
    return null
  }
}

/**
 * Enroll in a course on the server.
 * POST /api/user/enroll
 */
export async function enrollCourse({ userId, courseId }) {
  try {
    const data = await apiRequest('/api/user/enroll', {
      method: 'POST',
      body: { userId, courseId },
    })
    const user = data?.user
    if (user && typeof user === 'object') {
      const stored     = getStoredUser()
      const merged     = stored ? { ...stored, ...user } : user
      const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
      setStoredUser(normalized)
      return normalized
    }
    return null
  } catch (err) {
    console.warn('enrollCourse failed (non-fatal):', err?.message)
    return null
  }
}

/**
 * Daily login bonus — awards +50 XP, +1 streak (once per calendar day).
 * POST /api/user/daily-login
 */
export async function dailyLogin({ userId }) {
  try {
    const data = await apiRequest('/api/user/daily-login', {
      method: 'POST',
      body: { userId },
    })

    const user = data?.user
    if (user && typeof user === 'object') {
      const stored     = getStoredUser()
      const merged     = stored ? { ...stored, ...user } : user
      const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
      setStoredUser(normalized)
    }

    return {
      alreadyClaimed: data?.alreadyClaimed ?? false,
      message:        data?.message ?? '',
      user:           data?.user ?? null,
    }
  } catch (err) {
    console.warn('dailyLogin failed (non-fatal):', err?.message)
    return { alreadyClaimed: true, message: '', user: null }
  }
}

/**
 * Sync streak, coursesCompleted, and enrolledCourses from localStorage → server.
 * PATCH /api/user/update-stats
 */
export async function updateStats({ userId, streak, coursesCompleted, enrolledCourses }) {
  try {
    const data = await apiRequest('/api/user/update-stats', {
      method: 'PATCH',
      body: { userId, streak, coursesCompleted, enrolledCourses },
    })
    const user = data?.user
    if (user && typeof user === 'object') {
      const stored     = getStoredUser()
      const merged     = stored ? { ...stored, ...user } : user
      const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
      setStoredUser(normalized)
      return normalized
    }
    return null
  } catch (err) {
    console.warn('updateStats failed (non-fatal):', err?.message)
    return null
  }
}
/**
 * Fetch a single user's detailed profile (clean payload).
 * GET /api/user/:userId
 */
export async function fetchUserProfile(userId) {
  try {
    const data = await apiRequest(`/api/user/${userId}`, { method: 'GET' })
    const user = data?.user
    if (user && typeof user === 'object') {
      const stored = getStoredUser()
      const merged = stored ? { ...stored, ...user } : user
      const normalized = { ...merged, xp: Number(merged.xp ?? 0) }
      setStoredUser(normalized)
      return normalized
    }
    return null
  } catch (err) {
    console.warn('fetchUserProfile failed (non-fatal):', err?.message)
    return null
  }
}
