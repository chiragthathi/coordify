import axios from 'axios'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAccessToken,
} from './tokenStorage'
import { normalizeApiError } from './errorHandler'
import { API_GATEWAY_URL, buildApiPath } from '../config/env'

export const httpClient = axios.create({
  baseURL: API_GATEWAY_URL,
  timeout: 15000,
})

const getPathname = (url = '') => {
  const raw = String(url || '')
  try {
    // Supports absolute and relative URLs.
    return new URL(raw, API_GATEWAY_URL).pathname
  } catch {
    return raw
  }
}

const isPublicAuthEndpoint = (url = '') => {
  const pathname = getPathname(url)
  return [
    '/api/v1/auth/login',
    '/api/v1/auth/signup',
    '/api/v1/auth/refresh',
    '/api/v1/auth/verify-email',
    '/api/v1/auth/resend-verification-otp',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/verify-reset-otp',
    '/api/v1/auth/reset-password',
  ].includes(pathname)
}

httpClient.interceptors.request.use((config) => {
  const isPublicAuthRequest = isPublicAuthEndpoint(config?.url)
  const token = getAccessToken()
  const user = getStoredUser()

  if (token && !isPublicAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (user?.role && !isPublicAuthRequest) {
    config.headers['x-user-role'] = user.role
  }

  if (user?.id && !isPublicAuthRequest) {
    config.headers['x-user-id'] = user.id
  }

  if (user?.email && !isPublicAuthRequest) {
    config.headers['x-user-email'] = user.email
  }

  return config
})

let isRefreshing = false
let refreshQueue = []

const flushQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }

    resolve(token)
  })

  refreshQueue = []
}

const shouldRetry = (error) => {
  const status = error?.response?.status
  return !status || status >= 500
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error?.response?.status
    const isPublicAuthRequest = isPublicAuthEndpoint(originalRequest?.url)

    if (originalRequest && shouldRetry(error)) {
      originalRequest.__retryCount = originalRequest.__retryCount || 0

      if (originalRequest.__retryCount < 2) {
        originalRequest.__retryCount += 1
        return httpClient(originalRequest)
      }
    }

    if (status !== 401 || originalRequest?._retry || isPublicAuthRequest) {
      return Promise.reject(normalizeApiError(error))
    }

    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (newToken) => {
            if (!originalRequest.headers) {
              originalRequest.headers = {}
            }

            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(httpClient(originalRequest))
          },
          reject,
        })
      }).catch((queuedError) => Promise.reject(normalizeApiError(queuedError)))
    }

    isRefreshing = true

    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        throw new Error('Missing refresh token')
      }

      const refreshResponse = await axios.post(
        `${API_GATEWAY_URL}${buildApiPath('/auth/refresh')}`,
        { refreshToken },
        { withCredentials: true }
      )

      const nextToken = refreshResponse?.data?.data?.accessToken
      if (!nextToken) throw new Error('Token refresh did not return a token')

      setAccessToken(nextToken)
      flushQueue(null, nextToken)

      if (!originalRequest.headers) {
        originalRequest.headers = {}
      }

      originalRequest.headers.Authorization = `Bearer ${nextToken}`
      return httpClient(originalRequest)
    } catch (refreshError) {
      clearTokens()
      flushQueue(refreshError)
      return Promise.reject(normalizeApiError(refreshError))
    } finally {
      isRefreshing = false
    }
  }
)
