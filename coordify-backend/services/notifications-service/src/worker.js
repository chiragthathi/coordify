import { initMongo } from './db/mongoClient.js'
import { notificationStore } from './store/notificationStore.js'
import { startTaskEventsWorker, closeTaskEventsWorker } from './worker/taskEventsWorker.js'
import { logger } from './utils/logger.js'

const registerShutdown = () => {
  const shutdown = async () => {
    await logger.info('Shutting down notifications worker')
    await closeTaskEventsWorker()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

const start = async () => {
  await initMongo()
  await notificationStore.init()
  await startTaskEventsWorker()
}

registerShutdown()

start().catch(async (error) => {
  await logger.error('Failed to start notifications worker', {
    error: error?.message || String(error),
    code: error?.code,
    stack: error?.stack,
  })
  process.exit(1)
})
