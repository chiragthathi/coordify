import dotenv from 'dotenv'

dotenv.config()

export const env = {
  serviceName: process.env.SERVICE_NAME || 'settings-service',
  port: Number(process.env.PORT || 4007),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGODB_DB_NAME || 'coordify_settings_service',
  mongoMaxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
  mongoMinPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 5),
  mongoMaxIdleTimeMs: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 60000),
  mongoWaitQueueTimeoutMs: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 10000),
  mongoServerSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  rabbitmqEnabled: process.env.RABBITMQ_ENABLED === 'true',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'coordify.events',
  rabbitmqSettingsNotificationsRoutingKey:
    process.env.RABBITMQ_SETTINGS_NOTIFICATIONS_ROUTING_KEY ||
    process.env.RABBITMQ_ROUTING_KEY ||
    'settings.notifications',
  rabbitmqRequired: process.env.RABBITMQ_REQUIRED === 'true',
  internalServiceAuthEnabled: process.env.INTERNAL_SERVICE_AUTH_ENABLED !== 'false',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'replace-with-strong-shared-token',
}
