import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { reportStore } from '../store/reportStore.js'
import { publishReportEvent } from '../queue/reportEventPublisher.js'
import {
  clearReportsCache,
  readReportByIdCache,
  readReportsListCache,
  writeReportByIdCache,
  writeReportsListCache,
} from '../cache/reportCache.js'
import { generateAiReport } from '../ai/reportAiService.js'

const generateProjectSchema = z.object({
  projectId: z.string().min(3),
})

const generateTeamSchema = z.object({
  scope: z.enum(['all', 'active']).optional(),
})

const roleGuard = (allowedRoles) => (req, res, next) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  return next()
}

const router = express.Router()

router.get('/', roleGuard(['admin', 'manager']), async (_req, res) => {
  const cached = await readReportsListCache()
  if (cached) {
    res.setHeader('x-cache', 'HIT')
    return res.json({ success: true, data: cached })
  }

  const reports = await reportStore.all()
  await writeReportsListCache(reports)
  res.setHeader('x-cache', 'MISS')
  return res.json({ success: true, data: reports })
})

router.post('/project', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = generateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid project report payload' })
  }

  const report = {
    id: 'rep_' + randomUUID().slice(0, 8),
    type: 'project',
    projectId: parsed.data.projectId,
    generatedAt: new Date().toISOString(),
    summary: {
      completionRate: 68,
      overdueTasks: 3,
      totalTasks: 25,
    },
  }

  report.ai = {
    ...(await generateAiReport(report)),
    generatedAt: new Date().toISOString(),
  }

  await reportStore.create(report)
  await clearReportsCache({ id: report.id })
  await publishReportEvent('reports.generated', {
    userId: (req.headers['x-user-id'] || '').toString() || 'system',
    reportId: report.id,
    type: report.type,
    projectId: report.projectId,
  })
  return res.status(201).json({ success: true, data: report })
})

router.post('/team', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = generateTeamSchema.safeParse(req.body || {})
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid team report payload' })
  }

  const report = {
    id: 'rep_' + randomUUID().slice(0, 8),
    type: 'team',
    scope: parsed.data.scope || 'all',
    generatedAt: new Date().toISOString(),
    summary: {
      activeMembers: 12,
      productivityScore: 82,
      completedTasksThisWeek: 41,
    },
  }

  report.ai = {
    ...(await generateAiReport(report)),
    generatedAt: new Date().toISOString(),
  }

  await reportStore.create(report)
  await clearReportsCache({ id: report.id })
  await publishReportEvent('reports.generated', {
    userId: (req.headers['x-user-id'] || '').toString() || 'system',
    reportId: report.id,
    type: report.type,
    scope: report.scope,
  })
  return res.status(201).json({ success: true, data: report })
})

router.get('/:reportId', roleGuard(['admin', 'manager']), async (req, res) => {
  const cached = await readReportByIdCache(req.params.reportId)
  if (cached) {
    res.setHeader('x-cache', 'HIT')
    return res.json({ success: true, data: cached })
  }

  const report = await reportStore.getById(req.params.reportId)
  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not found' })
  }

  await writeReportByIdCache(report.id, report)
  res.setHeader('x-cache', 'MISS')
  return res.json({ success: true, data: report })
})

export const reportRoutes = router
