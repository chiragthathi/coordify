import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'tasks'

const seedTasks = []

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

  if (seedTasks.length > 0) {
    await collection.insertMany(
      seedTasks.map((task) => ({
        ...task,
        subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))
    )
  }
}

export const taskStore = {
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
  async create(task) {
    const collection = await getCollection()
    await collection.insertOne(task)
    return task
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
    if (seedTasks.length > 0) {
      await collection.insertMany(
        seedTasks.map((task) => ({
          ...task,
          subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      )
    }
  },
}
