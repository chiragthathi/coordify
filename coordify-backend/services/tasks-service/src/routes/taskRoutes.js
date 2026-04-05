import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { taskStore } from '../store/taskStore.js'
import { clearTasksCache, readTasksCache, writeTasksCache } from '../cache/taskCache.js'
import { publishTaskCreatedEvent, publishTaskStatusChangedEvent } from '../queue/taskEventPublisher.js'

const statusSchema = z.enum(['todo', 'in_progress', 'in_review', 'completed'])
const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

const createTaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(3),
  projectId: z.string().min(3),
  assignedTo: z.string().min(3),
  createdBy: z.string().min(3),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: z.string().optional(),
})

const updateTaskSchema = createTaskSchema.partial()

const updateStatusSchema = z.object({
  status: statusSchema,
})

const createSubtaskSchema = z.object({
  title: z.string().min(2),
})

const updateSubtaskSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(2).optional(),
}).refine((value) => value.completed !== undefined || value.title !== undefined, {
  message: 'At least one field is required',
})

const createCommentSchema = z.object({
  content: z.string().min(1),
})

const updateCommentSchema = z.object({
  content: z.string().min(1),
})

const roleGuard = (allowedRoles) => (req, res, next) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  return next()
}

const router = express.Router()

router.get('/', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  const userId = (req.headers['x-user-id'] || '').toString()
  const queryString = req.originalUrl.split('?')[1] || ''

  const cached = await readTasksCache({ role, userId, queryString })
  if (cached) {
    res.setHeader('x-cache', 'HIT')
    return res.json(cached)
  }

  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 500)

  const status = (req.query.status || '').toString()
  const priority = (req.query.priority || '').toString()
  const projectId = (req.query.projectId || '').toString()
  const assignedTo = (req.query.assignedTo || '').toString()

  let tasks = await taskStore.all()

  if (status && status !== 'all') {
    tasks = tasks.filter((task) => task.status === status)
  }

  if (priority && priority !== 'all') {
    tasks = tasks.filter((task) => task.priority === priority)
  }

  if (projectId) {
    tasks = tasks.filter((task) => task.projectId === projectId)
  }

  if (assignedTo) {
    tasks = tasks.filter((task) => task.assignedTo === assignedTo)
  }

  tasks = tasks.sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })

  const start = (page - 1) * limit
  const end = start + limit

  const payload = {
    success: true,
    data: tasks.slice(start, end),
    meta: {
      page,
      limit,
      total: tasks.length,
      hasNextPage: end < tasks.length,
    },
  }

  await writeTasksCache({ role, userId, queryString }, payload)
  res.setHeader('x-cache', 'MISS')
  return res.json(payload)
})

router.get('/:taskId', async (req, res) => {
  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  return res.json({ success: true, data: task })
})

router.post('/', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = createTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid task payload' })
  }

  const payload = parsed.data
  const task = {
    id: 'task_' + randomUUID().slice(0, 8),
    title: payload.title,
    description: payload.description,
    projectId: payload.projectId,
    assignedTo: payload.assignedTo,
    createdBy: payload.createdBy,
    status: payload.status || 'todo',
    priority: payload.priority || 'medium',
    dueDate: payload.dueDate || null,
    subtasks: [],
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await taskStore.create(task)
  await publishTaskCreatedEvent(task)
  await clearTasksCache()
  return res.status(201).json({ success: true, data: task })
})

router.patch('/:taskId', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = updateTaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid task update payload' })
  }

  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  if (role === 'member' && parsed.data.priority !== undefined) {
    return res.status(403).json({ success: false, error: 'Members cannot edit task priority' })
  }

  const existingTask = await taskStore.getById(req.params.taskId)
  if (!existingTask) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const previousStatus = existingTask.status
  const updated = await taskStore.update(req.params.taskId, parsed.data)
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  if (parsed.data.status !== undefined && updated.status !== previousStatus) {
    const changedBy = (req.headers['x-user-id'] || '').toString() || existingTask.createdBy || 'system'
    await publishTaskStatusChangedEvent({ task: updated, previousStatus, changedBy })
  }

  await clearTasksCache()
  return res.json({ success: true, data: updated })
})

router.delete('/:taskId', roleGuard(['admin', 'manager']), async (req, res) => {
  const removed = await taskStore.remove(req.params.taskId)
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  await clearTasksCache()
  return res.status(204).send()
})

router.patch('/:taskId/status', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = updateStatusSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid status payload' })
  }

  const existingTask = await taskStore.getById(req.params.taskId)
  if (!existingTask) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const previousStatus = existingTask.status
  const updated = await taskStore.update(req.params.taskId, { status: parsed.data.status })
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  if (updated.status !== previousStatus) {
    const changedBy = (req.headers['x-user-id'] || '').toString() || existingTask.createdBy || 'system'
    await publishTaskStatusChangedEvent({ task: updated, previousStatus, changedBy })
  }

  await clearTasksCache()
  return res.json({ success: true, data: updated })
})

router.post('/:taskId/subtasks', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = createSubtaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid subtask payload' })
  }

  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const nextSubtask = {
    id: 'sub_' + randomUUID().slice(0, 8),
    title: parsed.data.title,
    completed: false,
  }

  const updated = await taskStore.update(task.id, { subtasks: [...task.subtasks, nextSubtask] })
  await clearTasksCache()
  return res.status(201).json({ success: true, data: updated })
})

router.patch('/:taskId/subtasks/:subtaskId', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = updateSubtaskSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid subtask update payload' })
  }

  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const foundSubtask = task.subtasks.find((subtask) => subtask.id === req.params.subtaskId)
  if (!foundSubtask) {
    return res.status(404).json({ success: false, error: 'Subtask not found' })
  }

  const subtasks = task.subtasks.map((subtask) => {
    if (subtask.id === req.params.subtaskId) {
      return {
        ...subtask,
        ...(parsed.data.completed !== undefined ? { completed: parsed.data.completed } : {}),
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      }
    }

    return subtask
  })

  const updated = await taskStore.update(task.id, { subtasks })
  await clearTasksCache()
  return res.json({ success: true, data: updated })
})

router.delete('/:taskId/subtasks/:subtaskId', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const subtasks = (task.subtasks || []).filter((subtask) => subtask.id !== req.params.subtaskId)
  if (subtasks.length === (task.subtasks || []).length) {
    return res.status(404).json({ success: false, error: 'Subtask not found' })
  }

  const updated = await taskStore.update(task.id, { subtasks })
  await clearTasksCache()
  return res.json({ success: true, data: updated })
})

router.get('/:taskId/comments', async (req, res) => {
  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  return res.json({ success: true, data: task.comments || [] })
})

router.post('/:taskId/comments', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = createCommentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid comment payload' })
  }

  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const authorId = (req.headers['x-user-id'] || '').toString() || task.createdBy
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase() || 'member'

  const comment = {
    id: 'cmt_' + randomUUID().slice(0, 8),
    authorId,
    author: role,
    content: parsed.data.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const comments = [...(task.comments || []), comment]
  const updated = await taskStore.update(task.id, { comments })
  await clearTasksCache()
  return res.status(201).json({ success: true, data: updated?.comments || comments })
})

router.patch('/:taskId/comments/:commentId', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const parsed = updateCommentSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid comment update payload' })
  }

  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const comments = (task.comments || []).map((comment) => {
    if (comment.id !== req.params.commentId) return comment
    return {
      ...comment,
      content: parsed.data.content,
      updatedAt: new Date().toISOString(),
    }
  })

  const found = comments.some((comment) => comment.id === req.params.commentId)
  if (!found) {
    return res.status(404).json({ success: false, error: 'Comment not found' })
  }

  const updated = await taskStore.update(task.id, { comments })
  await clearTasksCache()
  return res.json({ success: true, data: updated?.comments || comments })
})

router.delete('/:taskId/comments/:commentId', roleGuard(['admin', 'manager', 'member']), async (req, res) => {
  const task = await taskStore.getById(req.params.taskId)
  if (!task) {
    return res.status(404).json({ success: false, error: 'Task not found' })
  }

  const comments = (task.comments || []).filter((comment) => comment.id !== req.params.commentId)
  if (comments.length === (task.comments || []).length) {
    return res.status(404).json({ success: false, error: 'Comment not found' })
  }

  await taskStore.update(task.id, { comments })
  await clearTasksCache()
  return res.status(204).send()
})

export const taskRoutes = router
