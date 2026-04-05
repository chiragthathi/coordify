import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const teamService = {
  inviteMember: async (email, role = 'member') => {
    const response = await httpClient.post(buildApiPath('/team/invite'), { email, role })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  removeMember: async (userId) => {
    await httpClient.delete(buildApiPath(`/team/${userId}`))
    return successResponse({ userId })
  },

  updateRole: async (userId, newRole) => {
    const response = await httpClient.patch(buildApiPath(`/team/${userId}/role`), { role: newRole })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  acceptInvitation: async (token) => {
    const response = await httpClient.post(buildApiPath('/team/invitations/accept'), { token })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  acceptInvitationByEmail: async (email) => {
    const response = await httpClient.post(buildApiPath('/team/invitations/accept-email'), { email })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  getMembers: async ({ role } = {}, { signal } = {}) => {
    const response = await httpClient.get(buildApiPath('/team'), { params: { role }, signal })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
