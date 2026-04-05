import { createApp } from './app.js'
import { env } from './config/env.js'
import { initMongo } from './db/mongoClient.js'
import { closeReportPublisher } from './queue/reportEventPublisher.js'
import { closeRedis, initRedis } from './cache/redisClient.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await initRedis()

  app.listen(env.port, () => {
    console.log('reports-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeReportPublisher()
    await closeRedis()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start reports-service')
  console.error(error)
  process.exit(1)
})
