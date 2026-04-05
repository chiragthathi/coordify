import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const commentService = {
  listByTask: async (taskId, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath(`/tasks/${taskId}/comments`), { signal })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  create: async (taskId, content) => {
    const response = await httpClient.post(buildApiPath(`/tasks/${taskId}/comments`), { content })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  delete: async (taskId, commentId) => {
    await httpClient.delete(buildApiPath(`/tasks/${taskId}/comments/${commentId}`))
    return successResponse({ commentId, taskId })
  },

  update: async (taskId, commentId, content) => {
    const response = await httpClient.patch(buildApiPath(`/tasks/${taskId}/comments/${commentId}`), { content })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
