import { createApp } from './app.js'
import { env } from './config/env.js'
import { initMongo } from './db/mongoClient.js'
import { closeSettingsPublisher } from './queue/settingsEventPublisher.js'

const app = createApp()

const start = async () => {
  await initMongo()

  app.listen(env.port, () => {
    console.log('settings-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeSettingsPublisher()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start settings-service')
  console.error(error)
  process.exit(1)
})
