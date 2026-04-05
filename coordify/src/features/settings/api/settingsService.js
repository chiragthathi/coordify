import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const settingsService = {
  getSettings: async (userId, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath(`/settings/${userId}`), { signal })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  updateSettings: async (userId, settings) => {
    const response = await httpClient.patch(buildApiPath(`/settings/${userId}`), settings)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  updateNotificationPreferences: async (userId, preferences) => {
    const response = await httpClient.patch(buildApiPath(`/settings/${userId}/notifications`), preferences)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
