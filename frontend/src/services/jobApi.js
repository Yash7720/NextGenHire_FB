import { apiRequest } from './http'

export async function fetchJobs() {
  return await apiRequest('/api/jobs')
}

export async function createJob(job) {
  return await apiRequest('/api/jobs/create', {
    method: 'POST',
    body: job,
  })
}

