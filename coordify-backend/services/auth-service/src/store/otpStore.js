import crypto from 'crypto'
import { env } from '../config/env.js'
import { getRedisClient } from '../cache/redisClient.js'

const otpKey = (purpose, email) => {
  return `${env.redisTokenPrefix}otp:${purpose}:${email.toLowerCase()}`
}

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex')

export const otpStore = {
  hashOtp,

  async saveOtp({ purpose, email, otp, ttlSeconds }) {
    const client = getRedisClient()
    if (!client) {
      throw new Error('Redis is unavailable for OTP storage')
    }

    const key = otpKey(purpose, email)
    const payload = {
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    }

    await client.setEx(key, Math.max(ttlSeconds, 1), JSON.stringify(payload))
    return payload
  },

  async getOtp({ purpose, email }) {
    const client = getRedisClient()
    if (!client) {
      throw new Error('Redis is unavailable for OTP verification')
    }

    const key = otpKey(purpose, email)
    const raw = await client.get(key)
    if (!raw) {
      return null
    }

    try {
      return JSON.parse(raw)
    } catch (_error) {
      return null
    }
  },

  async clearOtp({ purpose, email }) {
    const client = getRedisClient()
    if (!client) {
      return
    }

    await client.del(otpKey(purpose, email))
  },
}
