import bcrypt from 'bcryptjs'
import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'users'
const ADMIN_EMAIL = 'admin@example.com'

const normalizeEmail = (email) => email.toLowerCase()

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)

  await collection.createIndex({ email: 1 }, { unique: true })

  return collection
}

const seedAdmin = async () => {
  const collection = await getCollection()
  const existing = await collection.findOne({ email: ADMIN_EMAIL })

  if (existing) {
    return
  }

  await collection.insertOne({
    id: 'user_admin_001',
    email: normalizeEmail(ADMIN_EMAIL),
    name: 'Admin User',
    role: 'admin',
    emailVerified: true,
    verificationOtpHash: null,
    verificationOtpExpiresAt: null,
    passwordResetOtpHash: null,
    passwordResetOtpExpiresAt: null,
    passwordHash: bcrypt.hashSync('admin123', 10),
    createdAt: new Date().toISOString(),
  })
}

export const userStore = {
  async init() {
    await seedAdmin()
  },
  async getByEmail(email) {
    const collection = await getCollection()
    return collection.findOne({ email: normalizeEmail(email) })
  },
  async getAll() {
    const collection = await getCollection()
    return collection.find({}).toArray()
  },
  async getById(id) {
    const collection = await getCollection()
    return collection.findOne({ id })
  },
  async add(user) {
    const collection = await getCollection()
    await collection.insertOne(user)
    return user
  },
  async exists(email) {
    const collection = await getCollection()
    const count = await collection.countDocuments({ email: normalizeEmail(email) }, { limit: 1 })
    return count > 0
  },
  async saveVerificationOtp(email, { otpHash, expiresAt }) {
    const collection = await getCollection()
    await collection.updateOne(
      { email: normalizeEmail(email) },
      {
        $set: {
          verificationOtpHash: otpHash,
          verificationOtpExpiresAt: expiresAt,
          emailVerified: false,
        },
      }
    )
  },
  async savePasswordResetOtp(email, { otpHash, expiresAt }) {
    const collection = await getCollection()
    await collection.updateOne(
      { email: normalizeEmail(email) },
      {
        $set: {
          passwordResetOtpHash: otpHash,
          passwordResetOtpExpiresAt: expiresAt,
        },
      }
    )
  },
  async clearPasswordResetOtp(email) {
    const collection = await getCollection()
    await collection.updateOne(
      { email: normalizeEmail(email) },
      {
        $unset: {
          passwordResetOtpHash: '',
          passwordResetOtpExpiresAt: '',
        },
      }
    )
  },
  async updatePasswordByEmail(email, passwordHash) {
    const collection = await getCollection()
    await collection.updateOne(
      { email: normalizeEmail(email) },
      {
        $set: {
          passwordHash,
        },
      }
    )
  },
  async markEmailVerified(email) {
    const collection = await getCollection()
    await collection.updateOne(
      { email: normalizeEmail(email) },
      {
        $set: { emailVerified: true },
        $unset: {
          verificationOtpHash: '',
          verificationOtpExpiresAt: '',
        },
      }
    )
  },
  async clear() {
    const collection = await getCollection()
    await collection.deleteMany({})
    await seedAdmin()
  },
}
