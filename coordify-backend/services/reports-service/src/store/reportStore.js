import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'reports'

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ id: 1 }, { unique: true })

  return collection
}

export const reportStore = {
  async all() {
    const collection = await getCollection()
    return collection.find({}).toArray()
  },
  async getById(id) {
    const collection = await getCollection()
    return collection.findOne({ id })
  },
  async create(report) {
    const collection = await getCollection()
    await collection.insertOne(report)
    return report
  },
  async clear() {
    const collection = await getCollection()
    await collection.deleteMany({})
  },
}
