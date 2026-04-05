import { createApp } from './app.js'
import { env } from './config/env.js'
import { closeRedis, initRedis } from './cache/redisClient.js'
import { initMongo } from './db/mongoClient.js'
import { closeAuthPublisher } from './queue/authEventPublisher.js'
import { userStore } from './store/userStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await initRedis()
  await userStore.init()

  app.listen(env.port, () => {
    console.log('auth-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeAuthPublisher()
    await closeRedis()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start auth-service')
  console.error(error)
  process.exit(1)
})
