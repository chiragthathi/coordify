import { createClient } from 'redis'
import { env } from '../config/env.js'

let redisClient = null

export const initRedis = async () => {
  if (!env.redisTokenStoreEnabled) {
    return null
  }

  if (redisClient?.isOpen) {
    return redisClient
  }

  const client = createClient({ url: env.redisUrl })
  client.on('error', (error) => {
    console.error('Auth Redis client error')
    console.error(error)
  })

  try {
    await client.connect()
    redisClient = client
    return redisClient
  } catch (error) {
    if (env.redisRequired) {
      throw error
    }

    console.warn('Auth Redis unavailable, falling back to in-memory token store')
    console.warn(error.message)
    redisClient = null
    return null
  }
}

export const getRedisClient = () => {
  if (!env.redisTokenStoreEnabled) {
    return null
  }

  if (!redisClient?.isOpen) {
    return null
  }

  return redisClient
}

export const closeRedis = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit()
  }

  redisClient = null
}
