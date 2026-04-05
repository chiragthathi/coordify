import { createApp } from './app.js'
import { env } from './config/env.js'
import { initMongo } from './db/mongoClient.js'
import { notificationStore } from './store/notificationStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await notificationStore.init()

  app.listen(env.port, () => {
    console.log('notifications-service listening on port ' + env.port)
  })
}

start().catch((error) => {
  console.error('Failed to start notifications-service')
  console.error(error)
  process.exit(1)
})
