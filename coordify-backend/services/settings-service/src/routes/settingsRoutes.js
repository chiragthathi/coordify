import express from 'express'
import { z } from 'zod'
import { settingsStore } from '../store/settingsStore.js'
import { publishSettingsEvent } from '../queue/settingsEventPublisher.js'

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
})

const notificationSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  taskAssigned: z.boolean().optional(),
  projectUpdate: z.boolean().optional(),
})

const privacySchema = z.object({
  publicProfile: z.boolean().optional(),
  showActivity: z.boolean().optional(),
})

const updateSchema = z.object({
  profile: profileSchema.optional(),
  notifications: notificationSchema.optional(),
  privacy: privacySchema.optional(),
})

const router = express.Router()

router.get('/:userId', async (req, res) => {
  return res.json({
    success: true,
    data: await settingsStore.get(req.params.userId),
  })
})

router.patch('/:userId', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid settings payload' })
  }

  const updated = await settingsStore.update(req.params.userId, parsed.data)
  await publishSettingsEvent('settings.updated', {
    userId: req.params.userId,
    section: 'all',
  })
  return res.json({ success: true, data: updated })
})

router.patch('/:userId/notifications', async (req, res) => {
  const parsed = notificationSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid notification settings payload' })
  }

  const updated = await settingsStore.update(req.params.userId, {
    notifications: parsed.data,
  })

  await publishSettingsEvent('settings.notifications_updated', {
    userId: req.params.userId,
    section: 'notifications',
  })

  return res.json({ success: true, data: updated })
})

export const settingsRoutes = router
