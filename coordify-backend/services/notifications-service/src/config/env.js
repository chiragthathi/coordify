import dotenv from 'dotenv'

dotenv.config()

export const env = {
  serviceName: process.env.SERVICE_NAME || 'notifications-service',
  port: Number(process.env.PORT || 4005),
  nodeEnv: process.env.NODE_ENV || 'development',
  workerId: process.env.WORKER_ID || 'worker-1',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongoDbName: process.env.MONGODB_DB_NAME || 'coordify_notifications_service',
  mongoMaxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 20),
  mongoMinPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE || 5),
  mongoMaxIdleTimeMs: Number(process.env.MONGODB_MAX_IDLE_TIME_MS || 60000),
  mongoWaitQueueTimeoutMs: Number(process.env.MONGODB_WAIT_QUEUE_TIMEOUT_MS || 10000),
  mongoServerSelectionTimeoutMs: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000),
  rabbitmqEnabled: process.env.RABBITMQ_ENABLED === 'true',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'coordify.events',
  rabbitmqTaskNotificationsRoutingKey:
    process.env.RABBITMQ_TASK_NOTIFICATIONS_ROUTING_KEY ||
    process.env.RABBITMQ_ROUTING_KEY ||
    'task.notifications',
  rabbitmqProjectNotificationsRoutingKey:
    process.env.RABBITMQ_PROJECT_NOTIFICATIONS_ROUTING_KEY || 'project.notifications',
  rabbitmqAuthNotificationsRoutingKey:
    process.env.RABBITMQ_AUTH_NOTIFICATIONS_ROUTING_KEY || 'auth.notifications',
  rabbitmqTeamNotificationsRoutingKey:
    process.env.RABBITMQ_TEAM_NOTIFICATIONS_ROUTING_KEY || 'team.notifications',
  rabbitmqReportsNotificationsRoutingKey:
    process.env.RABBITMQ_REPORTS_NOTIFICATIONS_ROUTING_KEY || 'reports.notifications',
  rabbitmqSettingsNotificationsRoutingKey:
    process.env.RABBITMQ_SETTINGS_NOTIFICATIONS_ROUTING_KEY || 'settings.notifications',
  rabbitmqTaskNotificationsQueue:
    process.env.RABBITMQ_TASK_NOTIFICATIONS_QUEUE ||
    process.env.RABBITMQ_TASK_EVENTS_QUEUE ||
    'coordify.task.notifications.q',
  rabbitmqProjectNotificationsQueue:
    process.env.RABBITMQ_PROJECT_NOTIFICATIONS_QUEUE || 'coordify.project.notifications.q',
  rabbitmqAuthNotificationsQueue:
    process.env.RABBITMQ_AUTH_NOTIFICATIONS_QUEUE || 'coordify.auth.notifications.q',
  rabbitmqTeamNotificationsQueue:
    process.env.RABBITMQ_TEAM_NOTIFICATIONS_QUEUE || 'coordify.team.notifications.q',
  rabbitmqReportsNotificationsQueue:
    process.env.RABBITMQ_REPORTS_NOTIFICATIONS_QUEUE || 'coordify.reports.notifications.q',
  rabbitmqSettingsNotificationsQueue:
    process.env.RABBITMQ_SETTINGS_NOTIFICATIONS_QUEUE || 'coordify.settings.notifications.q',
  rabbitmqDeadLetterExchange: process.env.RABBITMQ_DLX || 'coordify.events.dlx',
  rabbitmqDeadLetterQueue: process.env.RABBITMQ_DLQ || 'coordify.task.events.dlq',
  rabbitmqDeadLetterRoutingKey: process.env.RABBITMQ_DLQ_ROUTING_KEY || 'task.created.dead',
  rabbitmqPrefetch: Number(process.env.RABBITMQ_PREFETCH || 10),
  mailTransport: process.env.MAIL_TRANSPORT || 'log',
  mailFrom: process.env.MAIL_FROM || 'no-reply@coordify.local',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  internalServiceAuthEnabled: process.env.INTERNAL_SERVICE_AUTH_ENABLED !== 'false',
  internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'replace-with-strong-shared-token',
}
