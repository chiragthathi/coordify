import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'projects'

const seedProjects = []

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ id: 1 }, { unique: true })

  return collection
}

const seed = async () => {
  const collection = await getCollection()
  const count = await collection.countDocuments({})

  if (count > 0) {
    return
  }

  if (seedProjects.length > 0) {
    await collection.insertMany(
      seedProjects.map((project) => ({
        ...project,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    )
  }
}

export const projectStore = {
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
  async create(project) {
    const collection = await getCollection()
    await collection.insertOne(project)
    return project
  },
  async update(id, updates) {
    const collection = await getCollection()
    const existing = await collection.findOne({ id })
    if (!existing) {
      return null
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await collection.updateOne({ id }, { $set: updated })
    return updated
  },
  async remove(id) {
    const collection = await getCollection()
    const result = await collection.deleteOne({ id })
    return result.deletedCount > 0
  },
  async clearAndSeed() {
    const collection = await getCollection()
    await collection.deleteMany({})
    if (seedProjects.length > 0) {
      await collection.insertMany(
        seedProjects.map((project) => ({
          ...project,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      )
    }
  },
}
