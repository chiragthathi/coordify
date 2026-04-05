import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'
import { serviceRegistryStore } from '../src/store/serviceRegistryStore.js'

beforeEach(async () => {
  await initMongo()
  await serviceRegistryStore.clearAndSeed()
})

afterAll(async () => {
  await closeMongo()
})

describe('api-gateway', () => {
  it('returns health check', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('returns service registry', async () => {
    const app = createApp()
    const response = await request(app).get('/api/v1/gateway')

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBeGreaterThanOrEqual(7)
  })

  it('returns routes and a specific service', async () => {
    const app = createApp()
    const routesResponse = await request(app).get('/api/v1/gateway/routes')

    expect(routesResponse.status).toBe(200)
    expect(routesResponse.body.data.some((entry) => entry.service === 'projects-service')).toBe(true)

    const serviceResponse = await request(app)
      .get('/api/v1/gateway/services/projects-service')

    expect(serviceResponse.status).toBe(200)
    expect(serviceResponse.body.data.basePath).toBe('/api/v1/projects')
  })

  it('returns logical health map for backend services', async () => {
    const app = createApp()
    const response = await request(app).get('/api/v1/gateway/health/services')

    expect(response.status).toBe(200)
    expect(response.body.data.every((entry) => Array.isArray(entry.instances))).toBe(true)
    expect(
      response.body.data.every((entry) => entry.instances.every((instance) => instance.url.endsWith('/health'))),
    ).toBe(true)
  })

  it('enforces rate limiting on api routes', async () => {
    const previousWindowMs = env.rateLimitWindowMs
    const previousMax = env.rateLimitMax
    env.rateLimitWindowMs = 60_000
    env.rateLimitMax = 2

    const app = createApp()
    const first = await request(app).get('/api/v1/gateway')
    const second = await request(app).get('/api/v1/gateway')
    const third = await request(app).get('/api/v1/gateway')

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(third.status).toBe(429)

    env.rateLimitWindowMs = previousWindowMs
    env.rateLimitMax = previousMax
  })
})
