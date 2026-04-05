import { createApp } from './app.js'
import { env } from './config/env.js'
import { closeRedis, initRedis } from './cache/redisClient.js'
import { initMongo } from './db/mongoClient.js'
import { closeProjectPublisher } from './queue/projectEventPublisher.js'
import { projectStore } from './store/projectStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await initRedis()
  await projectStore.init()

  app.listen(env.port, () => {
    console.log('projects-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeProjectPublisher()
    await closeRedis()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start projects-service')
  console.error(error)
  process.exit(1)
})
