import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import client from 'prom-client'
import { teamRoutes } from './routes/teamRoutes.js'
import { env } from './config/env.js'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'coordify_team_' })

const httpRequestsTotal = new client.Counter({
  name: 'coordify_team_http_requests_total',
  help: 'Total HTTP requests for team-service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

const httpRequestDurationSeconds = new client.Histogram({
  name: 'coordify_team_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for team-service',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
})

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(morgan('dev'))
  app.use((req, res, next) => {
    const start = process.hrtime.bigint()
    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - start
      const route = req.route?.path || req.path || 'unknown'
      const labels = {
        method: req.method,
        route: route.toString(),
        status_code: String(res.statusCode),
      }

      httpRequestsTotal.inc(labels)
      httpRequestDurationSeconds.observe(labels, Number(durationNs) / 1_000_000_000)
    })

    next()
  })

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'team-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  })

  app.use((req, res, next) => {
    if (!env.internalServiceAuthEnabled) {
      return next()
    }

    if (req.path === '/health' || req.path === '/metrics') {
      return next()
    }

    const token = (req.headers['x-service-token'] || '').toString()
    if (!token || token !== env.internalServiceToken) {
      return res.status(401).json({ success: false, error: 'Unauthorized internal request' })
    }

    return next()
  })

  app.use('/api/v1/team', teamRoutes)

  return app
}
