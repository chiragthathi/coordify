import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'members'

const seedMembers = []

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ id: 1 }, { unique: true })
  await collection.createIndex({ email: 1 }, { unique: true })

  return collection
}

const seed = async () => {
  const collection = await getCollection()
  const count = await collection.countDocuments({})
  if (count > 0) {
    return
  }

  if (seedMembers.length > 0) {
    const now = new Date().toISOString()
    await collection.insertMany(
      seedMembers.map((member) => ({
        ...member,
        createdAt: now,
        updatedAt: now,
      }))
    )
  }
}

export const memberStore = {
  async init() {
    await seed()
  },
  async all() {
    const collection = await getCollection()
    return collection.find({}).toArray()
  },
  async getById(id) {
    const collection = await getCollection()
    return collection.findOne({ id })
  },
  async getByEmail(email) {
    const collection = await getCollection()
    return collection.findOne({ email: email.toLowerCase() })
  },
  async upsert(member) {
    const collection = await getCollection()
    await collection.updateOne(
      { id: member.id },
      { $set: member },
      { upsert: true }
    )

    return member
  },
  async remove(id) {
    const collection = await getCollection()
    const result = await collection.deleteOne({ id })
    return result.deletedCount > 0
  },
  async clearAndSeed() {
    const collection = await getCollection()
    await collection.deleteMany({})
    if (seedMembers.length > 0) {
      const now = new Date().toISOString()
      await collection.insertMany(
        seedMembers.map((member) => ({
          ...member,
          createdAt: now,
          updatedAt: now,
        }))
      )
    }
  },
}
