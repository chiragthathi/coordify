import { createApp } from './app.js'
import { env } from './config/env.js'
import { initMongo } from './db/mongoClient.js'
import { closeTeamPublisher } from './queue/teamEventPublisher.js'
import { memberStore } from './store/memberStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await memberStore.init()

  app.listen(env.port, () => {
    console.log('team-service listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeTeamPublisher()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

registerShutdown()

start().catch((error) => {
  console.error('Failed to start team-service')
  console.error(error)
  process.exit(1)
})
