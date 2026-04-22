const rawBase = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
    ? `http://${window.location.hostname}:5002` 
    : 'http://localhost:5002');

const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

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
      if (res.status === 401) {
        err.message = 'Invalid or expired token'
        
        // 1. Only clear and redirect if we actually attempted to use a token
        if (activeToken) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')

          // 2. Prevent infinite loops if already on login pages
          const cur = window.location.pathname
          if (cur !== '/signin' && cur !== '/admin/login') {
            setTimeout(() => {
              const isAdminPath = path.startsWith('/api/admin')
              window.location.href = isAdminPath ? '/admin/login' : '/signin'
            }, 100)
          }
        }
      }
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

