import { apiRequest } from './http'

/**
 * Fetch the ranked leaderboard from the server.
 *
 * The endpoint returns:
 *   { success: true, count: N, data: [ { _id, name, xp, coursesCompleted, streak, score, badge, rank }, … ] }
 *
 * We normalise it so callers always get a plain array.
 *
 * @returns {Promise<Array>}
 */
export async function fetchLeaderboard() {
  const res = await apiRequest('/api/leaderboard')

  // Handle both the new envelope format and the legacy plain-array format
  if (Array.isArray(res))        return res         // legacy: plain array
  if (Array.isArray(res?.data))  return res.data    // new: { success, count, data }
  return []
}
