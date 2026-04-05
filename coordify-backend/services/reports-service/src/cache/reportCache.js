import { env } from '../config/env.js'
import { getRedisClient } from './redisClient.js'

const inMemoryCache = new Map()

const getListKey = () => `${env.redisCachePrefix}list`
const getByIdKey = (id) => `${env.redisCachePrefix}by-id:${id}`

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

export const readReportsListCache = async () => {
  const key = getListKey()
  const client = getRedisClient()

  if (!client) {
    const value = getInMemory(key)
    return value ? JSON.parse(value) : null
  }

  const value = await client.get(key)
  return value ? JSON.parse(value) : null
}

export const writeReportsListCache = async (payload) => {
  const key = getListKey()
  const value = JSON.stringify(payload)
  const client = getRedisClient()

  if (!client) {
    setInMemoryWithTtl(key, value)
    return
  }

  await client.setEx(key, env.redisCacheTtlSeconds, value)
}

export const readReportByIdCache = async (id) => {
  const key = getByIdKey(id)
  const client = getRedisClient()

  if (!client) {
    const value = getInMemory(key)
    return value ? JSON.parse(value) : null
  }

  const value = await client.get(key)
  return value ? JSON.parse(value) : null
}

export const writeReportByIdCache = async (id, payload) => {
  const key = getByIdKey(id)
  const value = JSON.stringify(payload)
  const client = getRedisClient()

  if (!client) {
    setInMemoryWithTtl(key, value)
    return
  }

  await client.setEx(key, env.redisCacheTtlSeconds, value)
}

export const clearReportsCache = async ({ id } = {}) => {
  inMemoryCache.clear()

  const client = getRedisClient()
  if (!client) {
    return
  }

  const keys = [getListKey()]
  if (id) {
    keys.push(getByIdKey(id))
  }

  await client.del(keys)
}
