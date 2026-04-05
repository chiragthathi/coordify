import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'
import { getStoredUser } from '../../../shared/api/tokenStorage'

export const projectService = {
  list: async ({ page = 1, limit = 10, filters = {} } = {}, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath('/projects'), {
      params: { page, limit, ...filters },
      signal,
    })

    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  create: async (projectData) => {
    const currentUser = getStoredUser()
    const payload = {
      ...projectData,
      owner: projectData.owner || currentUser?.id,
      visibility: projectData.visibility === 'internal' ? 'private' : (projectData.visibility || 'private'),
    }

    const response = await httpClient.post(buildApiPath('/projects'), payload)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  update: async (projectId, updates) => {
    const response = await httpClient.patch(buildApiPath(`/projects/${projectId}`), updates)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  delete: async (projectId) => {
    await httpClient.delete(buildApiPath(`/projects/${projectId}`))
    return successResponse({ id: projectId }, { message: `Project ${projectId} deleted successfully` })
  },

  getById: async (projectId) => {
    const response = await httpClient.get(buildApiPath(`/projects/${projectId}`))
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  addMember: async (projectId, member) => {
    const payload = typeof member === 'string'
      ? { memberId: member }
      : {
        memberId: member?.memberId || member?.id || '',
        memberEmail: member?.memberEmail || member?.email || '',
      }

    const response = await httpClient.post(buildApiPath(`/projects/${projectId}/members`), payload)
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  removeMember: async (projectId, memberId, memberEmail = '') => {
    const response = await httpClient.delete(buildApiPath(`/projects/${projectId}/members/${memberId}`), {
      params: memberEmail ? { memberEmail } : undefined,
    })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
