import { createClient } from 'redis'
import { env } from '../config/env.js'

let redisClient = null

export const initRedis = async () => {
  if (!env.redisCacheEnabled) {
    return null
  }

  if (redisClient?.isOpen) {
    return redisClient
  }

  const client = createClient({ url: env.redisUrl })
  client.on('error', (error) => {
    console.error('Projects Redis client error')
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

    console.warn('Projects Redis unavailable, continuing without cache')
    console.warn(error.message)
    redisClient = null
    return null
  }
}

export const getRedisClient = () => {
  if (!env.redisCacheEnabled) {
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
