import { createApp } from './app.js'
import { env } from './config/env.js'
import { closeRedis, initRedis } from './cache/redisClient.js'
import { initMongo } from './db/mongoClient.js'
import { closeTaskPublisher } from './queue/taskEventPublisher.js'
import { taskStore } from './store/taskStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await initRedis()
  await taskStore.init()

  app.listen(env.port, () => {
    console.log('tasks-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeTaskPublisher()
    await closeRedis()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start tasks-service')
  console.error(error)
  process.exit(1)
})
