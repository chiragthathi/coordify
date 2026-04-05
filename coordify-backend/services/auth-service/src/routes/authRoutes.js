import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { env } from '../config/env.js'
import { userStore } from '../store/userStore.js'
import { otpStore } from '../store/otpStore.js'
import { tokenStore } from '../store/tokenStore.js'
import { publishAuthSignupEvent, publishAuthOtpEvent } from '../queue/authEventPublisher.js'

const router = express.Router()

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const verifyEmailSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

const resendOtpSchema = z.object({
  email: z.string().email(),
})

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
})

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(6),
})

const OTP_LENGTH = 6
const OTP_EXPIRY_SECONDS = env.otpTtlSeconds

const generateOtp = () => {
  const min = 10 ** (OTP_LENGTH - 1)
  const max = (10 ** OTP_LENGTH) - 1
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

const issueAndPersistOtp = async (email, purpose = 'verify_email') => {
  const otp = generateOtp()
  await otpStore.saveOtp({
    purpose,
    email,
    otp,
    ttlSeconds: OTP_EXPIRY_SECONDS,
  })

  await publishAuthOtpEvent({ email, otp, purpose })

  return otp
}

const issueAndPersistResetOtp = async (email) => {
  return issueAndPersistOtp(email, 'reset_password')
}

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  emailVerified: Boolean(user.emailVerified),
  createdAt: user.createdAt,
})

const isServiceLookupRequest = (req) => {
  const caller = (req.headers['x-internal-service'] || '').toString().toLowerCase()
  return Boolean(caller) && caller !== 'api-gateway'
}

const issueTokens = async (user) => {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: env.tokenTtl }
  )

  const refreshToken = jwt.sign(
    { sub: user.id, type: 'refresh' },
    env.jwtSecret,
    { expiresIn: '7d' }
  )

  await tokenStore.saveRefreshToken(refreshToken, user.id, 7 * 24 * 60 * 60)

  return { accessToken, refreshToken }
}

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing bearer token' })
  }

  try {
    if (await tokenStore.isAccessTokenRevoked(token)) {
      return res.status(401).json({ success: false, error: 'Token has been revoked' })
    }

    req.auth = jwt.verify(token, env.jwtSecret)
    return next()
  } catch (_err) {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid signup payload' })
  }

  const { email, name, password, role } = parsed.data

  if (await userStore.exists(email)) {
    return res.status(409).json({ success: false, error: 'Email already exists' })
  }

  const user = {
    id: 'user_' + Date.now(),
    email: email.toLowerCase(),
    name,
    role: role || 'member',
    emailVerified: false,
    verificationOtpHash: null,
    verificationOtpExpiresAt: null,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  }

  await userStore.add(user)
  await publishAuthSignupEvent(user)
  const otp = await issueAndPersistOtp(user.email)

  return res.status(201).json({
    success: true,
    data: {
      user: sanitizeUser(user),
      verificationRequired: true,
      ...(env.nodeEnv !== 'production' ? { devOtp: otp } : {}),
    },
  })
})

router.post('/verify-email', async (req, res) => {
  const parsed = verifyEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid email verification payload' })
  }

  const { email, otp } = parsed.data
  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' })
  }

  if (user.emailVerified) {
    return res.status(200).json({ success: true, data: { emailVerified: true } })
  }

  const storedOtp = await otpStore.getOtp({ purpose: 'verify_email', email })
  if (!storedOtp?.otpHash || !storedOtp?.expiresAt) {
    return res.status(400).json({ success: false, error: 'No verification code found. Please request a new OTP.' })
  }

  if (new Date(storedOtp.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, error: 'OTP expired. Please request a new OTP.' })
  }

  if (otpStore.hashOtp(otp) !== storedOtp.otpHash) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' })
  }

  await userStore.markEmailVerified(email)
  await otpStore.clearOtp({ purpose: 'verify_email', email })

  return res.status(200).json({
    success: true,
    data: {
      emailVerified: true,
      message: 'Email verified. Please sign in.',
    },
  })
})

router.post('/resend-verification-otp', async (req, res) => {
  const parsed = resendOtpSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid resend payload' })
  }

  const { email } = parsed.data
  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' })
  }

  if (user.emailVerified) {
    return res.status(200).json({ success: true, data: { emailVerified: true } })
  }

  const otp = await issueAndPersistOtp(user.email)
  return res.status(200).json({
    success: true,
    data: {
      otpSent: true,
      ...(env.nodeEnv !== 'production' ? { devOtp: otp } : {}),
    },
  })
})

router.post('/forgot-password', async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid forgot password payload' })
  }

  const { email } = parsed.data
  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' })
  }

  const otp = await issueAndPersistResetOtp(user.email)
  return res.status(200).json({
    success: true,
    data: {
      otpSent: true,
      ...(env.nodeEnv !== 'production' ? { devOtp: otp } : {}),
    },
  })
})

router.post('/verify-reset-otp', async (req, res) => {
  const parsed = verifyResetOtpSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid OTP verification payload' })
  }

  const { email, otp } = parsed.data
  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' })
  }

  const storedOtp = await otpStore.getOtp({ purpose: 'reset_password', email })
  if (!storedOtp?.otpHash || !storedOtp?.expiresAt) {
    return res.status(400).json({ success: false, error: 'No reset OTP found. Request a new code.' })
  }

  if (new Date(storedOtp.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, error: 'OTP expired. Request a new code.' })
  }

  if (otpStore.hashOtp(otp) !== storedOtp.otpHash) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' })
  }

  return res.status(200).json({ success: true, data: { otpValid: true } })
})

router.post('/reset-password', async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid reset password payload' })
  }

  const { email, otp, newPassword } = parsed.data
  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'Account not found' })
  }

  const storedOtp = await otpStore.getOtp({ purpose: 'reset_password', email })
  if (!storedOtp?.otpHash || !storedOtp?.expiresAt) {
    return res.status(400).json({ success: false, error: 'No reset OTP found. Request a new code.' })
  }

  if (new Date(storedOtp.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, error: 'OTP expired. Request a new code.' })
  }

  if (otpStore.hashOtp(otp) !== storedOtp.otpHash) {
    return res.status(400).json({ success: false, error: 'Invalid OTP' })
  }

  await userStore.updatePasswordByEmail(email, await bcrypt.hash(newPassword, 10))
  await userStore.clearPasswordResetOtp(email)
  await otpStore.clearOtp({ purpose: 'reset_password', email })

  return res.status(200).json({
    success: true,
    data: { message: 'Password reset successful. Please sign in.' },
  })
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid login payload' })
  }

  const { email, password } = parsed.data
  const user = await userStore.getByEmail(email)

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' })
  }

  if (!user.emailVerified) {
    return res.status(403).json({ success: false, error: 'Please verify your email with OTP before signing in' })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' })
  }

  const tokens = await issueTokens(user)

  return res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      ...tokens,
    },
  })
})

router.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid refresh payload' })
  }

  const { refreshToken } = parsed.data

  if (!await tokenStore.hasRefreshToken(refreshToken)) {
    return res.status(401).json({ success: false, error: 'Unknown refresh token' })
  }

  try {
    const decoded = jwt.verify(refreshToken, env.jwtSecret)
    const userId = decoded.sub
    const user = await userStore.getById(userId)

    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' })
    }

    const tokens = await issueTokens(user)
    await tokenStore.deleteRefreshToken(refreshToken)

    return res.json({ success: true, data: tokens })
  } catch (_err) {
    return res.status(401).json({ success: false, error: 'Invalid refresh token' })
  }
})

router.post('/logout', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid logout payload' })
  }

  await tokenStore.deleteRefreshToken(parsed.data.refreshToken)

  const header = req.headers.authorization || ''
  const accessToken = header.startsWith('Bearer ') ? header.slice(7) : null
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, env.jwtSecret)
      const ttlSeconds = Math.max((decoded.exp || 0) - Math.floor(Date.now() / 1000), 1)
      await tokenStore.revokeAccessToken(accessToken, ttlSeconds)
    } catch (_err) {
      // Ignore invalid access token during logout and continue revoking refresh token.
    }
  }

  return res.status(204).send()
})

router.get('/me', authMiddleware, async (req, res) => {
  const user = await userStore.getById(req.auth.sub)

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }

  return res.json({ success: true, data: sanitizeUser(user) })
})

router.get('/users/by-email', async (req, res) => {
  if (!isServiceLookupRequest(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const email = (req.query.email || '').toString().toLowerCase().trim()
  if (!email) {
    return res.status(400).json({ success: false, error: 'email is required' })
  }

  const user = await userStore.getByEmail(email)
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }

  return res.json({ success: true, data: sanitizeUser(user) })
})

router.get('/users/:userId', async (req, res) => {
  if (!isServiceLookupRequest(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const user = await userStore.getById(req.params.userId)
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' })
  }

  return res.json({ success: true, data: sanitizeUser(user) })
})

export const authRoutes = router
