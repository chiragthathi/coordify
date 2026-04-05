const getEnv = (key, fallback = '') => {
  const value = import.meta.env[key]
  return typeof value === 'undefined' ? fallback : value
}

export const API_GATEWAY_URL = getEnv('VITE_API_GATEWAY_URL', 'http://localhost:4100')
export const API_PREFIX = getEnv('VITE_API_PREFIX', '/api/v1')
export const SENTRY_DSN = getEnv('VITE_SENTRY_DSN')
export const APP_ENV = getEnv('VITE_APP_ENV', 'development')
export const ENABLE_NEW_DASHBOARD = getEnv('VITE_ENABLE_NEW_DASHBOARD', 'false') === 'true'
export const NOTIFICATIONS_WS_URL = getEnv('VITE_WS_NOTIFICATIONS_URL')
export const ENABLE_ANALYTICS = getEnv('VITE_ENABLE_ANALYTICS', 'false') === 'true'

export const buildApiPath = (path) => `${API_PREFIX}${path}`
