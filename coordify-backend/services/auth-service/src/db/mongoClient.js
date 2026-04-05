import { MongoClient } from 'mongodb'
import { env } from '../config/env.js'

let client = null
let db = null

export const initMongo = async () => {
  if (db) {
    return db
  }

  client = new MongoClient(env.mongoUri, {
    maxPoolSize: env.mongoMaxPoolSize,
    minPoolSize: env.mongoMinPoolSize,
    maxIdleTimeMS: env.mongoMaxIdleTimeMs,
    waitQueueTimeoutMS: env.mongoWaitQueueTimeoutMs,
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
  })
  await client.connect()
  db = client.db(env.mongoDbName)

  return db
}

export const getDb = async () => {
  if (!db) {
    return initMongo()
  }

  return db
}

export const closeMongo = async () => {
  if (client) {
    await client.close()
  }

  client = null
  db = null
}
