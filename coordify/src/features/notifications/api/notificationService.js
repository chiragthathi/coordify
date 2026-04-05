import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const notificationService = {
  list: async ({ userId, unreadOnly = false } = {}, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath('/notifications'), {
      // Add a cache buster so browser/proxy 304 responses don't hide updates in the UI.
      params: { userId, unreadOnly, _t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      signal,
    })

    const data = response?.data?.data || response?.data || []
    return successResponse(Array.isArray(data) ? data : [], response.data?.meta || {})
  },

  markAsRead: async (notificationId) => {
    const response = await httpClient.patch(buildApiPath(`/notifications/${notificationId}/read`))
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  markAllAsRead: async (userId) => {
    const response = await httpClient.patch(buildApiPath('/notifications/read-all'), { userId })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  delete: async (notificationId) => {
    await httpClient.delete(buildApiPath(`/notifications/${notificationId}`))
    return successResponse({ notificationId })
  },
}
