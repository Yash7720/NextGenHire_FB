const BASE_URL = 'http://localhost:5002'

/**
 * submitProject — sends a multipart/form-data POST to /api/submit-project
 *
 * @param {object} params
 * @param {File}   params.file      — the .zip File object from the file input
 * @param {string} params.liveLink  — live preview URL
 * @param {string} params.githubLink — GitHub repository URL
 * @param {string} params.userId    — MongoDB user _id
 * @param {string} params.courseId  — course identifier (e.g. "react")
 * @returns {Promise<object>}       — parsed JSON response from backend
 */
/**
 * submitProject — sends a multipart/form-data POST to /api/submit-project
 *
 * @param {object} params
 * @param {File}   params.file         — the .zip File object
 * @param {string} params.projectTitle — project title
 * @param {string} params.description  — project description
 * @param {string} params.techStack    — tech stack (comma separated)
 * @param {string} params.studentId    — MongoDB user _id
 * @param {string} params.courseId     — course identifier
 * @param {string} params.liveLink     — live preview URL
 * @param {string} params.githubLink   — GitHub repository URL
 * @returns {Promise<object>}          — parsed JSON response
 */
export async function submitProject({ file, projectTitle, description, techStack, studentId, courseId, liveLink, githubLink }) {
  const formData = new FormData()
  formData.append('projectTitle', projectTitle)
  formData.append('description', description)
  formData.append('techStack', techStack)
  formData.append('studentId', studentId)
  formData.append('userId', studentId) // Alias for backward compatibility
  formData.append('courseId', courseId)
  if (liveLink) formData.append('liveLink', liveLink)
  formData.append('githubLink', githubLink)
  formData.append('file', file) // File added last for better streaming performance

  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}/api/projects/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Upload failed: ${res.status}`)
  }
  return data
}

/**
 * downloadProject — Admin only. Streams the ZIP file.
 */
export function downloadProject(projectId) {
  const token = localStorage.getItem('token')
  const url = `${BASE_URL}/api/projects/download/${projectId}?token=${token}`
  window.open(url, '_blank')
}

/**
 * fetchAdminProjects — fetches all project submissions (admin only)
 */
export async function fetchAdminProjects() {
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}/api/projects`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await res.json().catch(() => ({ projects: [] }))
  
  if (!res.ok) {
    throw new Error(data?.error || `Failed to fetch projects: ${res.status}`)
  }

  return Array.isArray(data.projects) ? data.projects : []
}

/**
 * deleteProjectSubmission — Admin only. Deletes a specific project.
 */
export async function deleteProjectSubmission(projectId) {
  const token = localStorage.getItem('token')

  const res = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `Delete failed: ${res.status}`)
  }
  return data
}
