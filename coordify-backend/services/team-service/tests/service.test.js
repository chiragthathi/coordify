import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { memberStore } from '../src/store/memberStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('team-service', () => {
  beforeEach(async () => {
    await initMongo()
    await memberStore.clearAndSeed()
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

  it('lists team members', async () => {
    const app = createApp()
    const response = await request(app).get('/api/v1/team')
    expect(response.status).toBe(200)
    expect(response.body.data.length).toBeGreaterThanOrEqual(2)
  })

  it('invites a member as manager', async () => {
    const app = createApp()
    const inviteResponse = await request(app)
      .post('/api/v1/team/invite')
      .set('x-user-role', 'manager')
      .send({ email: 'new.member@example.com', role: 'member' })

    expect(inviteResponse.status).toBe(201)
    expect(inviteResponse.body.data.email).toBe('new.member@example.com')
  })

  it('restricts role updates to admin', async () => {
    const app = createApp()

    const inviteResponse = await request(app)
      .post('/api/v1/team/invite')
      .set('x-user-role', 'manager')
      .send({ email: 'role.test@example.com', role: 'member' })

    const memberId = inviteResponse.body.data.id

    const managerAttempt = await request(app)
      .patch('/api/v1/team/' + memberId + '/role')
      .set('x-user-role', 'manager')
      .send({ role: 'viewer' })

    expect(managerAttempt.status).toBe(403)

    const adminAttempt = await request(app)
      .patch('/api/v1/team/' + memberId + '/role')
      .set('x-user-role', 'admin')
      .send({ role: 'viewer' })

    expect(adminAttempt.status).toBe(200)
    expect(adminAttempt.body.data.role).toBe('viewer')
  })

  it('removes a member as admin', async () => {
    const app = createApp()

    const inviteResponse = await request(app)
      .post('/api/v1/team/invite')
      .set('x-user-role', 'admin')
      .send({ email: 'remove.me@example.com', role: 'member' })

    const memberId = inviteResponse.body.data.id

    const deleteResponse = await request(app)
      .delete('/api/v1/team/' + memberId)
      .set('x-user-role', 'admin')

    expect(deleteResponse.status).toBe(204)
  })
})
