import request from 'supertest'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { taskStore } from '../src/store/taskStore.js'
import { closeMongo, initMongo } from '../src/db/mongoClient.js'

describe('tasks-service', () => {
  beforeEach(async () => {
    await initMongo()
    await taskStore.clearAndSeed()
  })

  afterAll(async () => {
    await closeMongo()
  })

  it('returns health check', async () => {
    const app = createApp()
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('lists tasks with status filter', async () => {
    const app = createApp()
    const response = await request(app)
      .get('/api/v1/tasks?status=todo')

    expect(response.status).toBe(200)
    expect(response.body.data.every((task) => task.status === 'todo')).toBe(true)
  })

  it('creates and fetches a task with manager role', async () => {
    const app = createApp()
    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set('x-user-role', 'manager')
      .send({
        title: 'Ship onboarding flow',
        description: 'Finalize signup and onboarding',
        projectId: 'proj_002',
        assignedTo: 'user_dev_002',
        createdBy: 'user_manager_001',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.data.status).toBe('todo')

    const id = createResponse.body.data.id
    const fetchResponse = await request(app)
      .get('/api/v1/tasks/' + id)

    expect(fetchResponse.status).toBe(200)
    expect(fetchResponse.body.data.id).toBe(id)
  })

  it('blocks member from setting non-completed status', async () => {
    const app = createApp()

    const response = await request(app)
      .patch('/api/v1/tasks/task_001/status')
      .set('x-user-role', 'member')
      .send({ status: 'in_review' })

    expect(response.status).toBe(403)
  })

  it('allows member to mark task completed', async () => {
    const app = createApp()

    const response = await request(app)
      .patch('/api/v1/tasks/task_002/status')
      .set('x-user-role', 'member')
      .send({ status: 'completed' })

    expect(response.status).toBe(200)
    expect(response.body.data.status).toBe('completed')
  })

  it('adds and updates a subtask', async () => {
    const app = createApp()

    const addResponse = await request(app)
      .post('/api/v1/tasks/task_002/subtasks')
      .set('x-user-role', 'manager')
      .send({ title: 'Write integration tests' })

    expect(addResponse.status).toBe(201)

    const subtaskId = addResponse.body.data.subtasks[0].id
    const updateResponse = await request(app)
      .patch('/api/v1/tasks/task_002/subtasks/' + subtaskId)
      .set('x-user-role', 'member')
      .send({ completed: true })

    expect(updateResponse.status).toBe(200)
    const updatedSubtask = updateResponse.body.data.subtasks.find((item) => item.id === subtaskId)
    expect(updatedSubtask.completed).toBe(true)
  })
})
