const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'

const databaseNames = [
  'coordify_auth_service',
  'coordify_projects_service',
  'coordify_tasks_service',
  'coordify_team_service',
  'coordify_notifications_service',
  'coordify_reports_service',
  'coordify_settings_service',
  'coordify_api_gateway_service',
]

async function ensureDatabase(client, dbName) {
  const db = client.db(dbName)

  // MongoDB creates a database when a collection is created/written.
  await db.createCollection('service_meta').catch(async (error) => {
    // NamespaceExists is fine when script is rerun.
    if (!String(error.message).includes('already exists')) {
      throw error
    }
  })

  await db.collection('service_meta').updateOne(
    { key: 'initialized' },
    {
      $set: {
        key: 'initialized',
        serviceDatabase: dbName,
        initializedAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  )

  return dbName
}

async function run() {
  const client = new MongoClient(uri)

  try {
    await client.connect()

    const created = []
    for (const dbName of databaseNames) {
      await ensureDatabase(client, dbName)
      created.push(dbName)
      console.log('Initialized database:', dbName)
    }

    console.log('\nDone. Independent service databases are ready:')
    created.forEach((name) => console.log('-', name))
  } finally {
    await client.close()
  }
}

run().catch((error) => {
  console.error('Failed to initialize service databases.')
  console.error(error.message)
  process.exit(1)
})
