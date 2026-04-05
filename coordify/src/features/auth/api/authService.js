import { httpClient } from '../../../shared/api/httpClient'
import { buildApiPath } from '../../../shared/config/env'
import { successResponse } from '../../../shared/api/contract'

export const authService = {
  async login(email, password) {
    const response = await httpClient.post(buildApiPath('/auth/login'), { email, password })
    return successResponse(response.data?.data || {})
  },

  async signup({ email, name, password, role = 'member' }) {
    const response = await httpClient.post(buildApiPath('/auth/signup'), {
      email,
      name,
      password,
      role,
    })

    return successResponse(response.data?.data || {})
  },

  async verifyEmail(email, otp) {
    const response = await httpClient.post(buildApiPath('/auth/verify-email'), {
      email,
      otp,
    })

    return successResponse(response.data?.data || {})
  },

  async resendVerificationOtp(email) {
    const response = await httpClient.post(buildApiPath('/auth/resend-verification-otp'), {
      email,
    })

    return successResponse(response.data?.data || {})
  },

  async forgotPassword(email) {
    const response = await httpClient.post(buildApiPath('/auth/forgot-password'), {
      email,
    })

    return successResponse(response.data?.data || {})
  },

  async verifyResetOtp(email, otp) {
    const response = await httpClient.post(buildApiPath('/auth/verify-reset-otp'), {
      email,
      otp,
    })

    return successResponse(response.data?.data || {})
  },

  async resetPassword(email, otp, newPassword) {
    const response = await httpClient.post(buildApiPath('/auth/reset-password'), {
      email,
      otp,
      newPassword,
    })

    return successResponse(response.data?.data || {})
  },

  async me() {
    const response = await httpClient.get(buildApiPath('/auth/me'))
    return successResponse(response.data?.data || {})
  },

  async logout(refreshToken) {
    await httpClient.post(buildApiPath('/auth/logout'), { refreshToken })
    return successResponse({ ok: true })
  },
}
