import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const reportService = {
  list: async ({ signal } = {}) => {
    const response = await httpClient.get(buildApiPath('/reports'), { signal })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  getById: async (reportId) => {
    const response = await httpClient.get(buildApiPath(`/reports/${encodeURIComponent(reportId)}`))
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  generateProjectReport: async (projectId) => {
    const response = await httpClient.post(buildApiPath('/reports/project'), { projectId })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },

  generateTeamReport: async () => {
    const response = await httpClient.post(buildApiPath('/reports/team'), { scope: 'all' })
    return successResponse(response.data?.data || response.data, response.data?.meta || {})
  },
}
