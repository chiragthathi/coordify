import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'settings'

const defaultSettings = (userId) => ({
  userId,
  profile: {
    name: '',
    email: '',
  },
  notifications: {
    email: true,
    inApp: true,
    taskAssigned: true,
    projectUpdate: true,
  },
  privacy: {
    publicProfile: false,
    showActivity: true,
  },
  updatedAt: new Date().toISOString(),
})

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ userId: 1 }, { unique: true })

  return collection
}

export const settingsStore = {
  async get(userId) {
    const collection = await getCollection()
    const existing = await collection.findOne({ userId })
    if (existing) {
      return existing
    }

    const seeded = defaultSettings(userId)
    await collection.insertOne(seeded)
    return seeded
  },
  async update(userId, patch) {
    const collection = await getCollection()
    const existing = await settingsStore.get(userId)
    const updated = {
      ...existing,
      ...patch,
      profile: {
        ...existing.profile,
        ...(patch.profile || {}),
      },
      notifications: {
        ...existing.notifications,
        ...(patch.notifications || {}),
      },
      privacy: {
        ...existing.privacy,
        ...(patch.privacy || {}),
      },
      updatedAt: new Date().toISOString(),
    }

    await collection.updateOne({ userId }, { $set: updated }, { upsert: true })
    return updated
  },
  async clear() {
    const collection = await getCollection()
    await collection.deleteMany({})
  },
}
