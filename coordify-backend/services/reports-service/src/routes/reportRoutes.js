import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { env } from '../config/env.js'
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

const normalizeTaskStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (normalized === 'to_do' || normalized === 'todo') return 'todo'
  if (normalized === 'inprogress') return 'in_progress'
  if (normalized === 'inreview' || normalized === 'review') return 'in_review'
  if (normalized === 'done' || normalized === 'complete') return 'completed'

  return normalized
}

const getCompletionTimestamp = (task = {}) => {
  return task.completedAt || task.statusUpdatedAt || task.updatedAt || task.createdAt || null
}

const getStartOfWeek = (date) => {
  const start = new Date(date)
  const day = start.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)
  return start
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const callInternal = async (url) => {
  let lastError = null

  for (let attempt = 0; attempt <= env.internalRequestRetries; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), env.internalRequestTimeoutMs)

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-service-token': env.internalServiceToken,
          'x-internal-service': env.serviceName,
          'x-user-role': 'admin',
          'x-user-id': 'reports-service',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error
      if (attempt < env.internalRequestRetries) {
        await sleep(120 * (attempt + 1))
      }
    }
  }

  if (lastError) {
    throw lastError
  }

  return null
}

const getData = async (url) => {
  try {
    const body = await callInternal(url)
    return body?.data || null
  } catch {
    return null
  }
}

const getTasksForProject = async (projectId) => {
  const encoded = encodeURIComponent(projectId)
  const data = await getData(`${env.tasksServiceUrl}/api/v1/tasks?page=1&limit=500&projectId=${encoded}`)
  return Array.isArray(data) ? data : []
}

const getAllTasks = async () => {
  const data = await getData(`${env.tasksServiceUrl}/api/v1/tasks?page=1&limit=500`)
  return Array.isArray(data) ? data : []
}

const getAllTeamMembers = async () => {
  const data = await getData(`${env.teamServiceUrl}/api/v1/team`)
  return Array.isArray(data) ? data : []
}

const getProjectById = async (projectId) => {
  const encoded = encodeURIComponent(projectId)
  return getData(`${env.projectsServiceUrl}/api/v1/projects/${encoded}`)
}

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

  const [project, projectTasks] = await Promise.all([
    getProjectById(parsed.data.projectId),
    getTasksForProject(parsed.data.projectId),
  ])

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  const totalTasks = projectTasks.length
  const completedTasks = projectTasks.filter((task) => normalizeTaskStatus(task.status) === 'completed').length
  const inProgressTasks = projectTasks.filter((task) => normalizeTaskStatus(task.status) === 'in_progress').length
  const inReviewTasks = projectTasks.filter((task) => normalizeTaskStatus(task.status) === 'in_review').length
  const todoTasks = projectTasks.filter((task) => normalizeTaskStatus(task.status) === 'todo').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const overdueTasks = projectTasks.filter((task) => {
    if (!task?.dueDate) return false
    if (normalizeTaskStatus(task.status) === 'completed') return false
    return new Date(task.dueDate).getTime() < Date.now()
  }).length

  const report = {
    id: 'rep_' + randomUUID().slice(0, 8),
    type: 'project',
    projectId: parsed.data.projectId,
    generatedAt: new Date().toISOString(),
    summary: {
      completionRate,
      overdueTasks,
      totalTasks,
      completedTasks,
      inProgressTasks,
      inReviewTasks,
      todoTasks,
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

  const [members, tasks] = await Promise.all([
    getAllTeamMembers(),
    getAllTasks(),
  ])

  const totalMembers = members.length
  const activeMembers = members.filter((member) => {
    const status = String(member?.status || '').toLowerCase()
    return status === 'active' || status === 'joined'
  }).length

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === 'completed').length
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const weekStart = getStartOfWeek(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const completedTasksThisWeek = tasks.filter((task) => {
    if (normalizeTaskStatus(task.status) !== 'completed') return false
    const completedAt = getCompletionTimestamp(task)
    if (!completedAt) return false
    const completedDate = new Date(completedAt)
    if (Number.isNaN(completedDate.getTime())) return false
    return completedDate >= weekStart && completedDate < weekEnd
  }).length

  const report = {
    id: 'rep_' + randomUUID().slice(0, 8),
    type: 'team',
    scope: parsed.data.scope || 'all',
    generatedAt: new Date().toISOString(),
    summary: {
      totalMembers,
      activeMembers,
      productivityScore,
      totalTasks,
      completedTasks,
      completedTasksThisWeek,
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
