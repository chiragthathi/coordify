import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'
import { getStoredUser } from '../../../shared/api/tokenStorage'

export const taskService = {
  list: async ({ page = 1, limit = 25, filters = {} } = {}, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath('/tasks'), {
      params: { page, limit, ...filters },
      signal,
    })

    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  create: async (taskData) => {
    const currentUser = getStoredUser()
    const payload = {
      ...taskData,
      createdBy: taskData.createdBy || currentUser?.id,
      assignedTo: taskData.assignedTo || currentUser?.id,
    }

    const response = await httpClient.post(buildApiPath('/tasks'), payload)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  update: async (taskId, updates, { signal } = {}) => {
    const response = await httpClient.patch(buildApiPath(`/tasks/${taskId}`), updates, { signal })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  delete: async (taskId) => {
    await httpClient.delete(buildApiPath(`/tasks/${taskId}`))
    return successResponse({ id: taskId })
  },

  assign: async (taskId, userId) => {
    const response = await httpClient.patch(buildApiPath(`/tasks/${taskId}`), { assignedTo: userId })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  updateStatus: async (taskId, status) => {
    const response = await httpClient.patch(buildApiPath(`/tasks/${taskId}/status`), { status })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  addSubtask: async (taskId, title) => {
    const response = await httpClient.post(buildApiPath(`/tasks/${taskId}/subtasks`), { title })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  updateSubtask: async (taskId, subtaskId, updates) => {
    const payload = typeof updates === 'object' && updates !== null ? updates : { completed: updates }
    const response = await httpClient.patch(buildApiPath(`/tasks/${taskId}/subtasks/${subtaskId}`), payload)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  deleteSubtask: async (taskId, subtaskId) => {
    const response = await httpClient.delete(buildApiPath(`/tasks/${taskId}/subtasks/${subtaskId}`))
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
