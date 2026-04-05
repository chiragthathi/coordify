import { env } from '../config/env.js'
import { getRedisClient } from '../cache/redisClient.js'

const refreshStore = new Map()
const revokedAccessStore = new Map()

const refreshKey = (token) => `${env.redisTokenPrefix}refresh:${token}`
const revokedAccessKey = (token) => `${env.redisTokenPrefix}blacklist:${token}`

export const tokenStore = {
  async saveRefreshToken(token, userId, ttlSeconds) {
    const client = getRedisClient()
    if (!client) {
      refreshStore.set(token, userId)
      return
    }

    await client.setEx(refreshKey(token), ttlSeconds, userId)
  },

  async hasRefreshToken(token) {
    const client = getRedisClient()
    if (!client) {
      return refreshStore.has(token)
    }

    const value = await client.get(refreshKey(token))
    return Boolean(value)
  },

  async deleteRefreshToken(token) {
    const client = getRedisClient()
    if (!client) {
      refreshStore.delete(token)
      return
    }

    await client.del(refreshKey(token))
  },

  async revokeAccessToken(token, ttlSeconds) {
    const ttl = Math.max(ttlSeconds, 1)
    const client = getRedisClient()
    if (!client) {
      revokedAccessStore.set(token, Date.now() + ttl * 1000)
      return
    }

    await client.setEx(revokedAccessKey(token), ttl, '1')
  },

  async isAccessTokenRevoked(token) {
    const client = getRedisClient()
    if (!client) {
      const expiresAt = revokedAccessStore.get(token)
      if (!expiresAt) {
        return false
      }

      if (Date.now() > expiresAt) {
        revokedAccessStore.delete(token)
        return false
      }

      return true
    }

    const value = await client.get(revokedAccessKey(token))
    return value === '1'
  },

  async clear() {
    refreshStore.clear()
    revokedAccessStore.clear()

    const client = getRedisClient()
    if (!client) {
      return
    }

    const keys = []
    for await (const key of client.scanIterator({ MATCH: `${env.redisTokenPrefix}*` })) {
      keys.push(key)
    }

    if (keys.length > 0) {
      await client.del(keys)
    }
  },
}
