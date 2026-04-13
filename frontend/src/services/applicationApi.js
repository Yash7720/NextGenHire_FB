const BASE_URL = 'http://localhost:5002'
const BASE     = '/api/applications'

// ─────────────────────────────────────────────────────────────────────────────
// applyForJob — multipart/form-data POST (supports resume file)
//
// @param {Object} fields  — { jobId, applicantName, email, userId }
// @param {File|null} file — the resume File object (PDF or ZIP), or null
// ─────────────────────────────────────────────────────────────────────────────
export async function applyForJob(fields, file = null) {
  try {
    const formData = new FormData()

    // Append text fields
    Object.entries(fields).forEach(([key, val]) => {
      if (val !== undefined && val !== null) formData.append(key, val)
    })

    // Append file if provided
    if (file) {
      formData.append('resume', file, file.name)
    }

    const token = localStorage.getItem('token')
    const res = await fetch(`${BASE_URL}${BASE}/apply`, {
      method:  'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      // NOTE: Do NOT set Content-Type — browser sets it with the correct boundary
      body: formData,
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `Request failed: ${res.status}`)
    }

    return { ok: true, data }
  } catch (err) {
    console.error('[applicationApi] applyForJob failed:', err.message)
    return { ok: false, error: err.message }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchUserApplications — GET /api/applications/user/:userId
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchUserApplications(userId) {
  try {
    const token = localStorage.getItem('token')
    const res   = await fetch(`${BASE_URL}${BASE}/user/${userId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json().catch(() => null)
    return Array.isArray(data?.data) ? data.data : []
  } catch (err) {
    console.error('[applicationApi] fetchUserApplications failed:', err?.message)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateApplicationStatus — PATCH /api/applications/:id/status
// ─────────────────────────────────────────────────────────────────────────────
export async function updateApplicationStatus(applicationId, status) {
  try {
    const token = localStorage.getItem('token')
    const res   = await fetch(`${BASE_URL}${BASE}/${applicationId}/status`, {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status })
    })
    const data = await res.json().catch(() => null)
    return data?.data ?? null
  } catch (err) {
    console.warn('[applicationApi] updateApplicationStatus failed:', err?.message)
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// downloadResume — opens download in a new tab using application _id
// The backend streams the file directly from GridFS.
// ─────────────────────────────────────────────────────────────────────────────
export function downloadResume(applicationId) {
  const token = localStorage.getItem('token')
  // Open in new tab; token appended as query param so the browser can follow the stream
  const url = token
    ? `${BASE_URL}${BASE}/download/${applicationId}?token=${token}`
    : `${BASE_URL}${BASE}/download/${applicationId}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─────────────────────────────────────────────────────────────────────────────
// deleteApplication — DELETE /api/applications/application/:id
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteApplication(applicationId) {
  try {
    const token = localStorage.getItem('token')
    const res   = await fetch(`${BASE_URL}${BASE}/application/${applicationId}`, {
      method:  'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    const data = await res.json().catch(() => null)
    return { ok: res.ok, data }
  } catch (err) {
    console.warn('[applicationApi] deleteApplication failed:', err?.message)
    return { ok: false, error: err.message }
  }
}
