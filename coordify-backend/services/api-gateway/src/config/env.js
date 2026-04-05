import dotenv from 'dotenv'

dotenv.config()

export const env = {
  serviceName: process.env.SERVICE_NAME || 'api-gateway',
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGODB_DB_NAME || 'coordify_api_gateway_service',
  mongoMaxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
  mongoMinPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 5),
  mongoMaxIdleTimeMs: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 60000),
  mongoWaitQueueTimeoutMs: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 10000),
  mongoServerSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 100),
  proxyTimeoutMs: Number(process.env.PROXY_TIMEOUT_MS || 10000),
  gatewayWorkers: Number(process.env.GATEWAY_WORKERS || 1),
  redisCacheEnabled: process.env.REDIS_CACHE_ENABLED === 'true',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  redisCacheTtlSeconds: Number(process.env.REDIS_CACHE_TTL_SECONDS || 30),
  redisCachePrefix: process.env.REDIS_CACHE_PREFIX || 'coordify:gateway:',
  redisCacheRoutes: (process.env.REDIS_CACHE_ROUTES || '/api/v1/projects,/api/v1/tasks,/api/v1/dashboard')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean),
  redisRequired: process.env.REDIS_REQUIRED === 'true',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'replace-with-strong-shared-token',
}
