import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { notificationStore } from '../store/notificationStore.js'

const createSchema = z.object({
  userId: z.string().min(3),
  type: z.string().min(3),
  title: z.string().min(2),
  message: z.string().min(3),
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
  const userId = (req.query.userId || '').toString()
  const unreadOnly = (req.query.unreadOnly || '').toString() === 'true'

  let items = await notificationStore.all()

  if (userId) {
    items = items.filter((item) => item.userId === userId)
  }

  if (unreadOnly) {
    items = items.filter((item) => !item.read)
  }

  return res.json({ success: true, data: items })
})

router.post('/', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid notification payload' })
  }

  const payload = parsed.data
  const notification = {
    id: 'notif_' + randomUUID().slice(0, 8),
    ...payload,
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await notificationStore.create(notification)
  return res.status(201).json({ success: true, data: notification })
})

router.patch('/:notificationId/read', async (req, res) => {
  const updated = await notificationStore.update(req.params.notificationId, { read: true })
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Notification not found' })
  }

  return res.json({ success: true, data: updated })
})

router.patch('/read-all', async (req, res) => {
  const userId = (req.body?.userId || '').toString()
  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' })
  }

  const allItems = await notificationStore.all()
  const updated = allItems
    .filter((item) => item.userId === userId)
  const updatedItems = []
  for (const item of updated) {
    updatedItems.push(await notificationStore.update(item.id, { read: true }))
  }

  return res.json({ success: true, data: updatedItems })
})

router.delete('/:notificationId', async (req, res) => {
  const removed = await notificationStore.remove(req.params.notificationId)
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Notification not found' })
  }

  return res.status(204).send()
})

export const notificationRoutes = router
