import http from 'node:http'
import client from 'prom-client'

const register = new client.Registry()
client.collectDefaultMetrics({ register, prefix: 'coordify_load_balancer_' })

const requestCounter = new client.Counter({
  name: 'coordify_load_balancer_requests_total',
  help: 'Total requests handled by api-load-balancer',
  labelNames: ['method', 'status_code'],
  registers: [register],
})

const port = Number(process.env.PORT || 4100)
const upstreamTimeoutMs = Number(process.env.UPSTREAM_TIMEOUT_MS || 8000)
const retryAttempts = Number(process.env.UPSTREAM_RETRY_ATTEMPTS || 1)
const unhealthyCooldownMs = Number(process.env.UPSTREAM_UNHEALTHY_COOLDOWN_MS || 15000)
const upstreams = (process.env.UPSTREAMS || 'http://localhost:4000,http://localhost:4001')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => new URL(entry))

if (upstreams.length === 0) {
  throw new Error('No upstream API gateway instances configured. Set UPSTREAMS env var.')
}

let nextIndex = 0
const keepAliveAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 10000,
  maxSockets: 2048,
  maxFreeSockets: 256,
})
const upstreamFailureState = new Map(upstreams.map((upstream) => [upstream.origin, 0]))

const isHealthy = (upstream) => Date.now() >= (upstreamFailureState.get(upstream.origin) || 0)

const markUnhealthy = (upstream) => {
  upstreamFailureState.set(upstream.origin, Date.now() + unhealthyCooldownMs)
}

const getNextUpstream = () => {
  for (let attempt = 0; attempt < upstreams.length; attempt += 1) {
    const selected = upstreams[nextIndex % upstreams.length]
    nextIndex += 1

    if (isHealthy(selected)) {
      return selected
    }
  }

  const fallback = upstreams[nextIndex % upstreams.length]
  nextIndex += 1
  return fallback
}

const proxyToUpstream = ({ req, res, upstream, attemptsLeft }) => {
  const isIdempotent = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS'

  const options = {
    protocol: upstream.protocol,
    hostname: upstream.hostname,
    port: upstream.port,
    method: req.method,
    path: req.url,
    agent: keepAliveAgent,
    headers: {
      ...req.headers,
      host: upstream.host,
    },
  }

  const proxy = http.request(options, (proxyRes) => {
    clearTimeout(timeout)
    const headers = { ...proxyRes.headers }
    delete headers['content-length']

    res.writeHead(proxyRes.statusCode || 502, headers)
    requestCounter.inc({ method: req.method || 'UNKNOWN', status_code: String(proxyRes.statusCode || 502) })
    proxyRes.pipe(res)
  })

  const timeout = setTimeout(() => {
    proxy.destroy(new Error('Upstream timeout'))
  }, upstreamTimeoutMs)

  proxy.on('error', (error) => {
    clearTimeout(timeout)
    markUnhealthy(upstream)

    if (attemptsLeft > 0 && isIdempotent) {
      const retryUpstream = getNextUpstream()
      proxyToUpstream({ req, res, upstream: retryUpstream, attemptsLeft: attemptsLeft - 1 })
      return
    }

    if (!res.headersSent) {
      requestCounter.inc({ method: req.method || 'UNKNOWN', status_code: '502' })
      res.writeHead(502, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ success: false, error: 'Load balancer upstream error', detail: error.message }))
    }
  })

  req.pipe(proxy)
}

const proxyRequest = (req, res) => {
  const upstream = getNextUpstream()
  proxyToUpstream({ req, res, upstream, attemptsLeft: retryAttempts })
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        success: true,
        service: 'api-load-balancer',
        status: 'ok',
        upstreamTimeoutMs,
        retryAttempts,
        upstreams: upstreams.map((upstream) => upstream.origin),
      })
    )
    return
  }

  if (req.url === '/metrics') {
    res.writeHead(200, { 'content-type': register.contentType })
    register.metrics().then((metrics) => res.end(metrics))
    return
  }

  proxyRequest(req, res)
})

server.listen(port, () => {
  console.log(`api-load-balancer listening on port ${port}`)
  console.log(`upstreams: ${upstreams.map((upstream) => upstream.origin).join(', ')}`)
})
