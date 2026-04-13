import { apiRequest, getStoredUser } from './http'

const BASE = '/api/profile'

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile/:userId
// Returns full profile including skills, xpHistory, earnedBadges, appliedJobs.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchProfile(userId) {
  try {
    const data = await apiRequest(`${BASE}/${userId}`)
    return data?.data ?? null
  } catch (err) {
    console.warn('[profileApi] fetchProfile failed:', err?.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/:userId
// Update name, bio, age, degree, avatar.  Requires auth token.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateProfile(userId, { name, bio, age, degree, avatar } = {}) {
  const stored = getStoredUser()
  const token  = stored?.token ?? localStorage.getItem('token') ?? ''

  const data = await apiRequest(`${BASE}/${userId}`, {
    method: 'PATCH',
    token,
    body: { name, bio, age, degree, avatar },
  })
  return data?.data ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/:userId/skills
// Upsert skill list: [{ name, score, color }].  Requires auth token.
// ─────────────────────────────────────────────────────────────────────────────
export async function updateSkills(userId, skills = []) {
  const stored = getStoredUser()
  const token  = stored?.token ?? localStorage.getItem('token') ?? ''

  const data = await apiRequest(`${BASE}/${userId}/skills`, {
    method: 'PATCH',
    token,
    body: { skills },
  })
  return data?.data ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/badges
// Award a badge by ID (no auth gate — called internally after quest/course).
// ─────────────────────────────────────────────────────────────────────────────
export async function awardBadge(userId, badgeId) {
  try {
    const data = await apiRequest(`${BASE}/${userId}/badges`, {
      method: 'POST',
      body: { badgeId },
    })
    return data?.data ?? null
  } catch (err) {
    console.warn('[profileApi] awardBadge failed:', err?.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/xp-history
// Append or overwrite a month's XP entry: { month: "Jan", year: 2025, xp: 120 }
// ─────────────────────────────────────────────────────────────────────────────
export async function appendXpHistory(userId, { month, year, xp }) {
  try {
    const data = await apiRequest(`${BASE}/${userId}/xp-history`, {
      method: 'POST',
      body: { month, year, xp },
    })
    return data?.data ?? null
  } catch (err) {
    console.warn('[profileApi] appendXpHistory failed:', err?.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/profile/:userId/apply-job
// Record a job application on the profile.
// ─────────────────────────────────────────────────────────────────────────────
export async function applyJobProfile(userId, jobId) {
  try {
    const data = await apiRequest(`${BASE}/${userId}/apply-job`, {
      method: 'POST',
      body: { jobId },
    })
    return data?.data ?? null
  } catch (err) {
    console.warn('[profileApi] applyJob failed:', err?.message)
    return null
  }
}
