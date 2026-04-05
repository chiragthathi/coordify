import { env } from '../config/env.js'

const openPaths = new Set(['/health', '/metrics'])

export const internalServiceAuth = (req, res, next) => {
  if (!env.internalServiceAuthEnabled) {
    return next()
  }

  if (openPaths.has(req.path)) {
    return next()
  }

  const token = (req.headers['x-service-token'] || '').toString()
  if (!token || token !== env.internalServiceToken) {
    return res.status(401).json({ success: false, error: 'Unauthorized internal request' })
  }

  return next()
}
