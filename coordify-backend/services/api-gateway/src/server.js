import cluster from 'node:cluster'
import os from 'node:os'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { initMongo } from './db/mongoClient.js'
import { closeRedis, initRedis } from './cache/redisClient.js'
import { serviceRegistryStore } from './store/serviceRegistryStore.js'

const app = createApp()

const start = async () => {
  await initMongo()
  await initRedis()
  await serviceRegistryStore.init()

  app.listen(env.port, () => {
    console.log('api-gateway worker ' + process.pid + ' listening on port ' + env.port)
  })
}

const registerShutdown = () => {
  const shutdown = async () => {
    await closeRedis()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

const startWorkerPool = async () => {
  const workers = Math.min(env.gatewayWorkers, os.cpus().length)

  if (workers <= 1 || cluster.isWorker) {
    registerShutdown()
    await start()
    return
  }

  if (cluster.isPrimary) {
    console.log('api-gateway primary ' + process.pid + ' starting ' + workers + ' workers')
    for (let i = 0; i < workers; i += 1) {
      cluster.fork()
    }

    cluster.on('exit', (worker) => {
      console.error('worker ' + worker.process.pid + ' exited, restarting')
      cluster.fork()
    })
  }
}

startWorkerPool().catch((error) => {
  console.error('Failed to start api-gateway')
  console.error(error)
  process.exit(1)
})
