import { apiRequest } from './http'

export async function fetchQuests() {
  return await apiRequest('/api/quests/today')
}

export async function claimQuest({ userId, questId }) {
  return await apiRequest('/api/quests/claim', {
    method: 'POST',
    body: { userId, questId },
  })
}
