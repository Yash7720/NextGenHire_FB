import { apiRequest } from './http'

const BASE = '/api/admin'

// ─────────────────────────────────────────────────────────────────────────────
// CANDIDATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all candidates (enriched users) from the DB.
 * @param {{ status?: string, search?: string, sort?: string }} params
 * @returns {Promise<Array>}
 */
export async function fetchCandidates({ status = 'all', search = '', sort = 'score' } = {}) {
  try {
    const params = new URLSearchParams()
    if (status && status !== 'all') params.set('status', status)
    if (search)  params.set('search', search)
    if (sort)    params.set('sort',   sort)

    const qs   = params.toString()
    const data = await apiRequest(`${BASE}/candidates${qs ? `?${qs}` : ''}`)
    return { ok: true, data: Array.isArray(data?.data) ? data.data : [] }
  } catch (err) {
    console.error('[adminApi] fetchCandidates failed:', err?.message, '| status:', err?.status)
    return { ok: false, data: [], error: err?.message || 'Failed to fetch candidates' }
  }
}

/**
 * Update a candidate's recruitment status.
 * @param {string} userId
 * @param {string} status  — "pending"|"shortlisted"|"interview"|"rejected"
 * @returns {Promise<{ _id, status } | null>}
 */
export async function updateCandidateStatus(userId, status) {
  try {
    const data = await apiRequest(`${BASE}/candidates/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    })
    return data?.data ?? null
  } catch (err) {
    console.warn('[adminApi] updateCandidateStatus failed:', err?.message)
    return null
  }
}

/**
 * Delete a candidate and all their data permanently.
 * @param {string} userId
 */
export async function deleteCandidate(userId) {
  try {
    const res = await apiRequest(`${BASE}/users/${userId}`, { method: 'DELETE' })
    return res?.success ?? false
  } catch (err) {
    console.error('[adminApi] deleteCandidate failed:', err?.message)
    return false
  }
}

/**
 * Delete a job posting and all its applications.
 * @param {string} jobId
 */
export async function deleteJob(jobId) {
  try {
    const res = await apiRequest(`${BASE}/jobs/${jobId}`, { method: 'DELETE' })
    return res?.success ?? false
  } catch (err) {
    console.error('[adminApi] deleteJob failed:', err?.message)
    return false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL RANKINGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the ranked leaderboard enriched with per-user skill data.
 * @returns {Promise<Array>}
 */
export async function fetchSkillRankings() {
  try {
    const data = await apiRequest(`${BASE}/skill-rankings`)
    return Array.isArray(data?.data) ? data.data : []
  } catch (err) {
    console.warn('[adminApi] fetchSkillRankings failed:', err?.message)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch aggregated dashboard statistics.
 * @returns {Promise<Object|null>}
 */
export async function fetchDashboardStats() {
  try {
    const res = await apiRequest(`${BASE}/dashboard-stats`)
    return res?.success ? res.stats : null
  } catch (err) {
    console.error('[adminApi] fetchDashboardStats failed:', err?.message)
    return null
  }
}
