import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { projectStore } from '../src/store/projectStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('projects-service', () => {
  beforeEach(async () => {
    await initMongo()
    await projectStore.clearAndSeed()
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

  it('lists projects with pagination metadata', async () => {
    const app = createApp()
    const response = await request(app)
      .get('/api/v1/projects?page=1&limit=1')

    expect(response.status).toBe(200)
    expect(response.body.meta.total).toBeGreaterThanOrEqual(2)
    expect(response.body.meta.limit).toBe(1)
    expect(Array.isArray(response.body.data)).toBe(true)
    expect(response.body.data.length).toBe(1)
  })

  it('restricts create endpoint for non-manager roles', async () => {
    const app = createApp()
    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('x-user-role', 'member')
      .send({
        name: 'Blocked Project',
        description: 'Should be blocked',
        owner: 'user_mem_001',
      })

    expect(createResponse.status).toBe(403)
  })

  it('creates and fetches a project with manager role', async () => {
    const app = createApp()

    const createResponse = await request(app)
      .post('/api/v1/projects')
      .set('x-user-role', 'manager')
      .send({
        name: 'New Platform Revamp',
        description: 'Project created during test',
        owner: 'user_manager_001',
        status: 'planning',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.name).toBe('New Platform Revamp')

    const id = createResponse.body.data.id
    const fetchResponse = await request(app)
      .get('/api/v1/projects/' + id)

    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.data.id).toBe(id)
  })

  it('allows only admin to delete a project', async () => {
    const app = createApp()

    const managerDelete = await request(app)
      .delete('/api/v1/projects/proj_001')
      .set('x-user-role', 'manager')

    expect(managerDelete.status).toBe(403)

    const adminDelete = await request(app)
      .delete('/api/v1/projects/proj_001')
      .set('x-user-role', 'admin')

    expect(adminDelete.status).toBe(204)
  })

  it('adds and removes members on a project', async () => {
    const app = createApp()

    const addResponse = await request(app)
      .post('/api/v1/projects/proj_002/members')
      .set('x-user-role', 'manager')
      .send({ memberId: 'user_mem_001' })

    expect(addResponse.status).toBe(200)
    expect(addResponse.body.data.memberIds.includes('user_mem_001')).toBe(true)

    const removeResponse = await request(app)
      .delete('/api/v1/projects/proj_002/members/user_mem_001')
      .set('x-user-role', 'manager')

    expect(removeResponse.status).toBe(200)
    expect(removeResponse.body.data.memberIds.includes('user_mem_001')).toBe(false)
  })
})
