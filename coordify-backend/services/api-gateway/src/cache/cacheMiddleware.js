import { env } from '../config/env.js'
import { getRedisClient } from './redisClient.js'

const isCacheableRequest = (req) => {
  return req.method === 'GET' && env.redisCacheRoutes.some((prefix) => req.originalUrl.startsWith(prefix))
}

const buildCacheKey = (req) => {
  const userId = req.header('x-user-id') || 'anonymous'
  const role = req.header('x-user-role') || 'unknown'
  return `${env.redisCachePrefix}${req.method}:${userId}:${role}:${req.originalUrl}`
}

export const redisCacheMiddleware = async (req, res, next) => {
  if (!env.redisCacheEnabled || !isCacheableRequest(req)) {
    return next()
  }

  const client = getRedisClient()
  if (!client) {
    return next()
  }

  const key = buildCacheKey(req)
  req.cacheKey = key

  try {
    const cachedValue = await client.get(key)
    if (!cachedValue) {
      return next()
    }

    const payload = JSON.parse(cachedValue)
    res.setHeader('x-cache', 'HIT')
    return res.status(payload.statusCode || 200).json(payload.body)
  } catch (error) {
    return next(error)
  }
}

export const cacheProxyResponse = async ({ req, proxyRes, responseText }) => {
  if (!env.redisCacheEnabled || !isCacheableRequest(req)) {
    return
  }

  const client = getRedisClient()
  if (!client || !req.cacheKey) {
    return
  }

  if (proxyRes.statusCode !== 200) {
    return
  }

  const contentType = String(proxyRes.headers['content-type'] || '')
  if (!contentType.includes('application/json')) {
    return
  }

  try {
    const responseBody = JSON.parse(responseText)
    const payload = {
      statusCode: proxyRes.statusCode,
      body: responseBody,
    }

    await client.setEx(req.cacheKey, env.redisCacheTtlSeconds, JSON.stringify(payload))
  } catch {
    // Ignore non-JSON payloads and avoid breaking upstream responses.
  }
}

const removeKeysByPattern = async (client, pattern) => {
  const keys = []

  for await (const key of client.scanIterator({ MATCH: pattern })) {
    keys.push(key)
  }

  if (keys.length > 0) {
    await client.del(keys)
  }
}

export const invalidateGatewayCacheForMutation = async (req) => {
  if (!env.redisCacheEnabled || req.method === 'GET') {
    return
  }

  const client = getRedisClient()
  if (!client) {
    return
  }

  const path = String(req.originalUrl || '').split('?')[0]

  const invalidatePrefixes = []

  if (path.startsWith('/api/v1/tasks')) {
    invalidatePrefixes.push('/api/v1/tasks', '/api/v1/dashboard')
  }

  if (path.startsWith('/api/v1/projects')) {
    invalidatePrefixes.push('/api/v1/projects', '/api/v1/dashboard')
  }

  if (invalidatePrefixes.length === 0) {
    return
  }

  const uniquePrefixes = Array.from(new Set(invalidatePrefixes))

  await Promise.all(
    uniquePrefixes.map((prefix) => removeKeysByPattern(client, `${env.redisCachePrefix}GET:*:*:${prefix}*`))
  )
}
