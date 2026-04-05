import { env } from '../config/env.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const callJson = async (url) => {
  let lastError = null

  for (let attempt = 0; attempt <= env.internalRequestRetries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), env.internalRequestTimeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-service-token': env.internalServiceToken,
          'x-internal-service': env.serviceName,
        },
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeout)
      lastError = error
      if (attempt < env.internalRequestRetries) {
        await sleep(150 * (attempt + 1))
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  return null
}

const getData = async (url) => {
  try {
    const body = await callJson(url)
    return body?.data || null
  } catch {
    return null
  }
}

const unique = (items) => Array.from(new Set(items.filter(Boolean)))

const authServiceBases = unique([
  env.authServiceUrl,
  'http://auth-service:4001',
  'http://localhost:4001',
])

const teamServiceBases = unique([
  env.teamServiceUrl,
  'http://team-service:4004',
  'http://localhost:4004',
])

const firstData = async (bases, pathBuilder) => {
  for (const base of bases) {
    const data = await getData(pathBuilder(base))
    if (data) {
      return data
    }
  }

  return null
}

export const getAuthUserById = async (userId) => {
  if (!userId) return null
  const encodedId = encodeURIComponent(userId)
  return firstData(authServiceBases, (base) => `${base}/api/v1/auth/users/${encodedId}`)
}

export const getAuthUserByEmail = async (email) => {
  if (!email) return null
  const encodedEmail = encodeURIComponent(email)
  return firstData(authServiceBases, (base) => `${base}/api/v1/auth/users/by-email?email=${encodedEmail}`)
}

export const getTeamMemberById = async (memberId) => {
  if (!memberId) return null
  const encodedId = encodeURIComponent(memberId)
  return firstData(teamServiceBases, (base) => `${base}/api/v1/team/lookup/by-id/${encodedId}`)
}

export const getTeamMemberByEmail = async (email) => {
  if (!email) return null
  const encodedEmail = encodeURIComponent(email)
  return firstData(teamServiceBases, (base) => `${base}/api/v1/team/lookup/by-email?email=${encodedEmail}`)
}
