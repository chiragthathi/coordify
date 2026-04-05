import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { userStore } from '../src/store/userStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('auth-service', () => {
  beforeEach(async () => {
    await initMongo()
    await userStore.clear()
  })

  afterAll(async () => {
    await closeMongo()
  })

  it('returns health status', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('logs in seeded admin account', async () => {
    const app = createApp()
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123',
    })

    expect(response.status).toBe(200)
    expect(response.body.data.accessToken).toBeTruthy()
    expect(response.body.data.refreshToken).toBeTruthy()
  })

  it('signs up a new member account', async () => {
    const app = createApp()
    const response = await request(app).post('/api/v1/auth/signup').send({
      email: 'new.user@example.com',
      name: 'New User',
      password: 'pass1234',
      role: 'member',
    })

    expect(response.status).toBe(201)
    expect(response.body.data.user.email).toBe('new.user@example.com')
    expect(response.body.data.verificationRequired).toBe(true)
    expect(response.body.data.accessToken).toBeFalsy()
  })

  it('requires email verification before login', async () => {
    const app = createApp()

    await request(app).post('/api/v1/auth/signup').send({
      email: 'unverified.user@example.com',
      name: 'Unverified User',
      password: 'pass1234',
      role: 'member',
    })

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'unverified.user@example.com',
      password: 'pass1234',
    })

    expect(loginResponse.status).toBe(403)
    expect(loginResponse.body.error).toContain('verify')
  })

  it('verifies email with OTP and then allows login', async () => {
    const app = createApp()

    const signupResponse = await request(app).post('/api/v1/auth/signup').send({
      email: 'verify.user@example.com',
      name: 'Verify User',
      password: 'pass1234',
      role: 'member',
    })

    const otp = signupResponse.body?.data?.devOtp
    expect(otp).toBeTruthy()

    const verifyResponse = await request(app).post('/api/v1/auth/verify-email').send({
      email: 'verify.user@example.com',
      otp,
    })

    expect(verifyResponse.status).toBe(200)
    expect(verifyResponse.body.data.emailVerified).toBe(true)

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: 'verify.user@example.com',
      password: 'pass1234',
    })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.data.accessToken).toBeTruthy()
  })
})
