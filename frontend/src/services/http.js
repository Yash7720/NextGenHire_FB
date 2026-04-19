const BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? `http://${window.location.hostname}:5002` 
    : 'http://localhost:5002');

async function parseJsonSafe(res) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function apiRequest(path, { method = 'GET', body, token, headers } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  
  // Auto-resolve token if not explicitly provided
  const activeToken = token || localStorage.getItem('token')
  
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(headers || {}),
    ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await parseJsonSafe(res)

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed: ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch {
    // ignore
  }
}

