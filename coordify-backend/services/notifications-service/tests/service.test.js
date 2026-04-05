import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { notificationStore } from '../src/store/notificationStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('notifications-service', () => {
  beforeEach(async () => {
    await initMongo()
    await notificationStore.clearAndSeed()
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

  it('blocks create for member role', async () => {
    const app = createApp()
    const createResponse = await request(app)
      .post('/api/v1/notifications')
      .set('x-user-role', 'member')
      .send({
        userId: 'user_mem_001',
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'Hello',
      })

    expect(createResponse.status).toBe(403)
  })

  it('creates and marks one notification as read', async () => {
    const app = createApp()

    const createResponse = await request(app)
      .post('/api/v1/notifications')
      .set('x-user-role', 'manager')
      .send({
        userId: 'user_mem_001',
        type: 'comment_added',
        title: 'Comment Added',
        message: 'A new comment was added',
      })

    expect(createResponse.status).toBe(201)

    const markReadResponse = await request(app)
      .patch('/api/v1/notifications/' + createResponse.body.data.id + '/read')

    expect(markReadResponse.status).toBe(200)
    expect(markReadResponse.body.data.read).toBe(true)
  })

  it('marks all notifications as read for a user', async () => {
    const app = createApp()

    const response = await request(app)
      .patch('/api/v1/notifications/read-all')
      .send({ userId: 'user_admin_001' })

    expect(response.status).toBe(200)
    expect(response.body.data.every((item) => item.read)).toBe(true)
  })
})
