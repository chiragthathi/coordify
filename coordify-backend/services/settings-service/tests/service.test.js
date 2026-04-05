import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { settingsStore } from '../src/store/settingsStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('settings-service', () => {
  beforeEach(async () => {
    await initMongo()
    await settingsStore.clear()
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

  it('fetches settings for a user', async () => {
    const app = createApp()
    const response = await request(app).get('/api/v1/settings/user_001')
    expect(response.status).toBe(200)
    expect(response.body.data.userId).toBe('user_001')
  })

  it('updates profile and privacy settings', async () => {
    const app = createApp()

    const updateResponse = await request(app)
      .patch('/api/v1/settings/user_002')
      .send({
        profile: { name: 'Alice' },
        privacy: { publicProfile: true },
      })

    expect(updateResponse.status).toBe(200)
    expect(updateResponse.body.data.profile.name).toBe('Alice')
    expect(updateResponse.body.data.privacy.publicProfile).toBe(true)
  })

  it('updates notification preferences', async () => {
    const app = createApp()

    const response = await request(app)
      .patch('/api/v1/settings/user_002/notifications')
      .send({ inApp: false, projectUpdate: false })

    expect(response.status).toBe(200)
    expect(response.body.data.notifications.inApp).toBe(false)
    expect(response.body.data.notifications.projectUpdate).toBe(false)
  })
})
