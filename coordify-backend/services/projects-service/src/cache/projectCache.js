import { env } from '../config/env.js'
import { getRedisClient } from './redisClient.js'

const inMemoryCache = new Map()

const getPrefix = () => `${env.redisCachePrefix}projects:list:`

const getKey = ({ role, userId, queryString }) => {
  return `${getPrefix()}${role || 'anonymous'}:${userId || 'none'}:${queryString || 'noquery'}`
}

const setInMemoryWithTtl = (key, value) => {
  inMemoryCache.set(key, {
    value,
    expiresAt: Date.now() + env.redisCacheTtlSeconds * 1000,
  })
}

const getInMemory = (key) => {
  const cached = inMemoryCache.get(key)
  if (!cached) {
    return null
  }

  if (cached.expiresAt <= Date.now()) {
    inMemoryCache.delete(key)
    return null
  }

  return cached.value
}

export const readProjectsCache = async (params) => {
  const key = getKey(params)
  const client = getRedisClient()

  if (!client) {
    const value = getInMemory(key)
    return value ? JSON.parse(value) : null
  }

  const value = await client.get(key)
  return value ? JSON.parse(value) : null
}

export const writeProjectsCache = async (params, payload) => {
  const key = getKey(params)
  const value = JSON.stringify(payload)
  const client = getRedisClient()

  if (!client) {
    setInMemoryWithTtl(key, value)
    return
  }

  await client.setEx(key, env.redisCacheTtlSeconds, value)
}

export const clearProjectsCache = async () => {
  const prefix = getPrefix()
  inMemoryCache.clear()

  const client = getRedisClient()
  if (!client) {
    return
  }

  const keys = []
  for await (const key of client.scanIterator({ MATCH: `${prefix}*` })) {
    keys.push(key)
  }

  if (keys.length > 0) {
    await client.del(keys)
  }
}
