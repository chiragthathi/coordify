import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { reportStore } from '../src/store/reportStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('reports-service', () => {
  beforeEach(async () => {
    await initMongo()
    await reportStore.clear()
  })

  afterAll(async () => {
    await closeMongo()
  })

  it('returns health check', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('generates project report as manager', async () => {
    const app = createApp()

    const createResponse = await request(app)
      .post('/api/v1/reports/project')
      .set('x-user-role', 'manager')
      .send({ projectId: 'proj_001' })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.type).toBe('project')
  })

  it('restricts team report generation to admin', async () => {
    const app = createApp()

    const denied = await request(app)
      .post('/api/v1/reports/team')
      .set('x-user-role', 'manager')
      .send({ scope: 'all' })

    expect(denied.status).toBe(403)

    const allowed = await request(app)
      .post('/api/v1/reports/team')
      .set('x-user-role', 'admin')
      .send({ scope: 'active' })

    expect(allowed.status).toBe(201)
    expect(allowed.body.data.type).toBe('team')
  })

  it('fetches generated report by id', async () => {
    const app = createApp()

    const createResponse = await request(app)
      .post('/api/v1/reports/project')
      .set('x-user-role', 'admin')
      .send({ projectId: 'proj_002' })

    const reportId = createResponse.body.data.id
    const fetchResponse = await request(app)
      .get('/api/v1/reports/' + reportId)
      .set('x-user-role', 'manager')

    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.data.id).toBe(reportId)
  })
})
