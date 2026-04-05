import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import client from 'prom-client'
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { createProxyMiddleware, responseInterceptor, fixRequestBody } from 'http-proxy-middleware'
import { serviceRegistryStore } from './store/serviceRegistryStore.js'
import { env } from './config/env.js'
import { pickNextInstance } from './routing/loadBalancer.js'
import { cacheProxyResponse, invalidateGatewayCacheForMutation, redisCacheMiddleware } from './cache/cacheMiddleware.js'
import { getRedisClient } from './cache/redisClient.js'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'coordify_gateway_' })

const httpRequestsTotal = new client.Counter({
  name: 'coordify_gateway_http_requests_total',
  help: 'Total HTTP requests for api-gateway',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

const httpRequestDurationSeconds = new client.Histogram({
  name: 'coordify_gateway_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for api-gateway',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
})

const createRateLimiter = () => {
  const redisClient = getRedisClient()
  const redisStore = redisClient
    ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    })
    : undefined

  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    store: redisStore,
    keyGenerator: (req) => {
      const userId = req.header('x-user-id')
      return userId || req.ip || 'anonymous'
    },
    message: {
      success: false,
      error: 'Too many requests. Please retry later.',
    },
  })
}

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

  const apiRateLimiter = createRateLimiter()

  app.use('/api/v1', apiRateLimiter)
  app.use('/api/v1', async (req, _res, next) => {
    try {
      await invalidateGatewayCacheForMutation(req)
      next()
    } catch (error) {
      next(error)
    }
  })
  app.use('/api/v1', redisCacheMiddleware)

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  })

  app.get('/api/v1/gateway', async (_req, res) => {
    const services = await serviceRegistryStore.all()
    return res.json({ success: true, data: services })
  })

  app.get('/api/v1/gateway/routes', async (_req, res) => {
    const services = await serviceRegistryStore.all()
    const routes = services.map((service) => ({
      service: service.name,
      route: service.basePath,
      target: (service.baseUrl || service.instances?.[0]) + service.basePath,
      instances: service.instances || [service.baseUrl],
    }))

    return res.json({ success: true, data: routes })
  })

  app.get('/api/v1/gateway/services/:serviceName', async (req, res) => {
    const found = await serviceRegistryStore.getByName(req.params.serviceName)
    if (!found) {
      return res.status(404).json({ success: false, error: 'Service not found' })
    }

    return res.json({ success: true, data: found })
  })

  app.get('/api/v1/gateway/health/services', async (_req, res) => {
    const services = await serviceRegistryStore.all()
    const health = await Promise.all(services.map(async (service) => {
      const instances = await Promise.all((service.instances || [service.baseUrl]).map(async (instance) => {
        const healthUrl = instance + '/health'

        try {
          const response = await fetch(healthUrl, {
            headers: {
              'x-service-token': env.internalServiceToken,
              'x-internal-service': env.serviceName,
            },
          })

          return {
            url: healthUrl,
            status: response.ok ? 'up' : 'down',
            statusCode: response.status,
          }
        } catch (error) {
          return {
            url: healthUrl,
            status: 'down',
            error: error.message,
          }
        }
      }))

      return {
        name: service.name,
        status: instances.every((instance) => instance.status === 'up') ? 'up' : 'degraded',
        instances,
      }
    }))

    return res.json({ success: true, data: health })
  })

  app.use('/api/v1', createProxyMiddleware({
    changeOrigin: true,
    xfwd: true,
    selfHandleResponse: true,
    proxyTimeout: env.proxyTimeoutMs,
    pathRewrite: (path) => `/api/v1${path}`,
    router: async (req) => {
      const services = await serviceRegistryStore.all()
      const service = services.find((entry) => req.originalUrl.startsWith(entry.basePath))
      if (!service) {
        return undefined
      }

      return pickNextInstance(service)
    },
    pathFilter: (path) => !path.startsWith('/api/v1/gateway'),
    on: {
      proxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('x-service-token', env.internalServiceToken)
        proxyReq.setHeader('x-internal-service', env.serviceName)
        fixRequestBody(proxyReq, req, res)
      },
      proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
        const responseText = responseBuffer.toString('utf8')
        await cacheProxyResponse({ req, proxyRes, responseText })
        res.setHeader('x-cache', 'MISS')
        return responseText
      }),
      error: (_err, _req, res) => {
        if (!res.headersSent) {
          res.status(502).json({ success: false, error: 'Upstream service unavailable' })
        }
      },
    },
  }))

  return app
}
