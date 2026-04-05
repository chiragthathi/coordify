import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { taskRoutes } from './routes/taskRoutes.js'
import { internalServiceAuth } from './middleware/internalServiceAuth.js'
import { metricsHandler, metricsMiddleware } from './observability/metrics.js'

export const createApp = () => {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json())
  app.use(morgan('dev'))
  app.use(metricsMiddleware)

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'tasks-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/metrics', metricsHandler)

  app.use(internalServiceAuth)

  app.use('/api/v1/tasks', taskRoutes)

  return app
}
