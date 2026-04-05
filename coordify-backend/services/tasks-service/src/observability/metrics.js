import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'coordify_tasks_' })

const httpRequestsTotal = new client.Counter({
  name: 'coordify_tasks_http_requests_total',
  help: 'Total HTTP requests for tasks-service',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
})

const httpRequestDurationSeconds = new client.Histogram({
  name: 'coordify_tasks_http_request_duration_seconds',
  help: 'HTTP request duration in seconds for tasks-service',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
})

export const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const durationNs = process.hrtime.bigint() - start
    const durationSeconds = Number(durationNs) / 1_000_000_000
    const route = req.route?.path || req.path || 'unknown'
    const labels = {
      method: req.method,
      route: route.toString(),
      status_code: String(res.statusCode),
    }

    httpRequestsTotal.inc(labels)
    httpRequestDurationSeconds.observe(labels, durationSeconds)
  })

  next()
}

export const metricsHandler = async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
}
