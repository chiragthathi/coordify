const ACCESS_TOKEN_KEY = 'coordify_access_token'
const REFRESH_TOKEN_KEY = 'coordify_refresh_token'
const USER_KEY = 'coordify_user'

const LEGACY_ACCESS_TOKEN_KEY = 'projecthub_access_token'
const LEGACY_REFRESH_TOKEN_KEY = 'projecthub_refresh_token'
const LEGACY_USER_KEY = 'projecthub_user'

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY)
}

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY)
}

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const setAccessToken = (token) => {
  if (!token) return
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const setRefreshToken = (token) => {
  if (!token) return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const setStoredUser = (user) => {
  if (!user) return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY)
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_USER_KEY)
}
