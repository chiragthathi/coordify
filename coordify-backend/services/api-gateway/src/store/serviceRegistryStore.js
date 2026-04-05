import { getDb } from '../db/mongoClient.js'

const COLLECTION_NAME = 'service_registry'

const serviceUrl = (envName, fallback) => process.env[envName] || fallback

const defaultServices = [
  {
    name: 'auth-service',
    baseUrl: serviceUrl('AUTH_SERVICE_URL', 'http://localhost:4001'),
    basePath: '/api/v1/auth',
    instances: [serviceUrl('AUTH_SERVICE_URL', 'http://localhost:4001')],
  },
  {
    name: 'projects-service',
    baseUrl: serviceUrl('PROJECTS_SERVICE_URL', 'http://localhost:4002'),
    basePath: '/api/v1/projects',
    instances: [serviceUrl('PROJECTS_SERVICE_URL', 'http://localhost:4002')],
  },
  {
    name: 'tasks-service',
    baseUrl: serviceUrl('TASKS_SERVICE_URL', 'http://localhost:4003'),
    basePath: '/api/v1/tasks',
    instances: [serviceUrl('TASKS_SERVICE_URL', 'http://localhost:4003')],
  },
  {
    name: 'team-service',
    baseUrl: serviceUrl('TEAM_SERVICE_URL', 'http://localhost:4004'),
    basePath: '/api/v1/team',
    instances: [serviceUrl('TEAM_SERVICE_URL', 'http://localhost:4004')],
  },
  {
    name: 'notifications-service',
    baseUrl: serviceUrl('NOTIFICATIONS_SERVICE_URL', 'http://localhost:4005'),
    basePath: '/api/v1/notifications',
    instances: [serviceUrl('NOTIFICATIONS_SERVICE_URL', 'http://localhost:4005')],
  },
  {
    name: 'reports-service',
    baseUrl: serviceUrl('REPORTS_SERVICE_URL', 'http://localhost:4006'),
    basePath: '/api/v1/reports',
    instances: [serviceUrl('REPORTS_SERVICE_URL', 'http://localhost:4006')],
  },
  {
    name: 'settings-service',
    baseUrl: serviceUrl('SETTINGS_SERVICE_URL', 'http://localhost:4007'),
    basePath: '/api/v1/settings',
    instances: [serviceUrl('SETTINGS_SERVICE_URL', 'http://localhost:4007')],
  },
]

const getCollection = async () => {
  const db = await getDb()
  const collection = db.collection(COLLECTION_NAME)
  await collection.createIndex({ name: 1 }, { unique: true })

  return collection
}

const seed = async () => {
  const collection = await getCollection()
  const count = await collection.countDocuments({})
  if (count > 0) {
    return
  }

  await collection.insertMany(defaultServices)
}

export const serviceRegistryStore = {
  async init() {
    if (process.env.SERVICE_REGISTRY_RESEED === 'true') {
      await this.clearAndSeed()
      return
    }

    await seed()
  },
  async all() {
    const collection = await getCollection()
    return collection.find({}).toArray()
  },
  async getByName(name) {
    const collection = await getCollection()
    return collection.findOne({ name })
  },
  async clearAndSeed() {
    const collection = await getCollection()
    await collection.deleteMany({})
    await collection.insertMany(defaultServices)
  },
}
