import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { projectStore } from '../store/projectStore.js'
import { clearProjectsCache, readProjectsCache, writeProjectsCache } from '../cache/projectCache.js'
import { publishProjectCreatedEvent } from '../queue/projectEventPublisher.js'
import {
  getAuthUserByEmail,
  getAuthUserById,
  getTeamMemberByEmail,
  getTeamMemberById,
} from '../services/internalDirectoryClient.js'

const projectStatusSchema = z.enum(['planning', 'in_progress', 'in_review', 'on_hold', 'completed'])
const prioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(3),
  status: projectStatusSchema.optional(),
  priority: prioritySchema.optional(),
  owner: z.string().min(3),
  memberIds: z.array(z.string()).optional(),
  memberEmails: z.array(z.string().email()).optional(),
  dueDate: z.string().optional(),
  budget: z.number().nonnegative().optional(),
  spent: z.number().nonnegative().optional(),
  visibility: z.enum(['private', 'public']).optional(),
})

const updateProjectSchema = createProjectSchema.partial()

const roleGuard = (allowedRoles) => (req, res, next) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  return next()
}

const router = express.Router()

const resolveAuthUserId = async ({ memberId, memberEmail }) => {
  const normalizedEmail = (memberEmail || '').toString().toLowerCase().trim()

  if (memberId) {
    const authUser = await getAuthUserById(memberId)
    if (authUser?.id) {
      return authUser.id
    }

    const teamMember = await getTeamMemberById(memberId)
    const teamEmail = (teamMember?.email || '').toString().toLowerCase().trim()
    if (teamEmail) {
      const resolvedAuthUser = await getAuthUserByEmail(teamEmail)
      if (resolvedAuthUser?.id) {
        return resolvedAuthUser.id
      }
    }
  }

  if (normalizedEmail) {
    const authUser = await getAuthUserByEmail(normalizedEmail)
    if (authUser?.id) {
      return authUser.id
    }
  }

  if (memberId) {
    return memberId
  }

  return null
}

const resolveLegacyTeamMemberIdByEmail = async (email) => {
  const normalizedEmail = (email || '').toString().toLowerCase().trim()
  if (!normalizedEmail) return null

  const teamMember = await getTeamMemberByEmail(normalizedEmail)
  return teamMember?.id || null
}

const resolvePreferredEmail = async ({ memberId, memberEmail }) => {
  const normalizedEmail = (memberEmail || '').toString().toLowerCase().trim()
  if (normalizedEmail) return normalizedEmail

  const authUser = memberId ? await getAuthUserById(memberId) : null
  const authEmail = (authUser?.email || '').toString().toLowerCase().trim()
  if (authEmail) return authEmail

  const teamMember = memberId ? await getTeamMemberById(memberId) : null
  const teamEmail = (teamMember?.email || '').toString().toLowerCase().trim()
  if (teamEmail) return teamEmail

  return ''
}

router.get('/', async (req, res) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  const userId = (req.headers['x-user-id'] || '').toString()
  const userEmail = (req.headers['x-user-email'] || '').toString().toLowerCase().trim()
  const queryString = req.originalUrl.split('?')[1] || ''

  const cached = await readProjectsCache({ role, userId, queryString })
  if (cached) {
    res.setHeader('x-cache', 'HIT')
    return res.json(cached)
  }

  const page = Math.max(Number(req.query.page || 1), 1)
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 100)
  const status = (req.query.status || '').toString()
  const search = (req.query.search || '').toString().toLowerCase()

  let projects = await projectStore.all()

  if (role === 'member' || role === 'viewer') {
    if (!userId) {
      return res.status(400).json({ success: false, error: 'x-user-id is required for member/viewer role' })
    }

    const legacyTeamMemberId = await resolveLegacyTeamMemberIdByEmail(userEmail)

    projects = projects.filter((project) => {
      if (!Array.isArray(project.memberIds)) {
        return false
      }

      if (project.memberIds.includes(userId)) {
        return true
      }

      if (legacyTeamMemberId && project.memberIds.includes(legacyTeamMemberId)) {
        return true
      }

      return false
    })
  }


  if (status && status !== 'all') {
    projects = projects.filter((project) => project.status === status)
  }

  if (search) {
    projects = projects.filter((project) => {
      return project.name.toLowerCase().includes(search) || project.description.toLowerCase().includes(search)
    })
  }

  projects = projects.sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })

  const start = (page - 1) * limit
  const end = start + limit
  const items = projects.slice(start, end)

  const payload = {
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total: projects.length,
      hasNextPage: end < projects.length,
    },
  }

  await writeProjectsCache({ role, userId, queryString }, payload)
  res.setHeader('x-cache', 'MISS')
  return res.json(payload)
})

router.get('/:projectId', async (req, res) => {
  const project = await projectStore.getById(req.params.projectId)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  return res.json({ success: true, data: project })
})

router.post('/', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid project payload' })
  }

  const payload = parsed.data
  const incomingMembers = Array.isArray(payload.memberIds) ? payload.memberIds : []
  const incomingMemberEmails = Array.isArray(payload.memberEmails) ? payload.memberEmails : []

  const resolvedIncomingMembers = await Promise.all(
    incomingMembers.map(async (memberId) => {
      return resolveAuthUserId({ memberId })
    })
  )

  const resolvedIncomingEmails = await Promise.all(
    incomingMemberEmails.map(async (memberEmail) => {
      return resolveAuthUserId({ memberEmail })
    })
  )

  const memberIds = Array.from(new Set([
    payload.owner,
    ...resolvedIncomingMembers,
    ...resolvedIncomingEmails,
  ].filter(Boolean)))

  const memberEmails = Array.from(new Set(
    incomingMemberEmails
      .map((email) => (email || '').toString().toLowerCase().trim())
      .filter(Boolean)
  ))

  const project = {
    id: 'proj_' + randomUUID().slice(0, 8),
    name: payload.name,
    description: payload.description,
    status: payload.status || 'planning',
    priority: payload.priority || 'medium',
    owner: payload.owner,
    memberIds,
    memberEmails,
    dueDate: payload.dueDate || null,
    budget: payload.budget ?? 0,
    spent: payload.spent ?? 0,
    visibility: payload.visibility || 'private',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await projectStore.create(project)
  await publishProjectCreatedEvent(project)
  await clearProjectsCache()
  return res.status(201).json({ success: true, data: project })
})

router.patch('/:projectId', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = updateProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid project update payload' })
  }

  const updated = await projectStore.update(req.params.projectId, parsed.data)
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  await clearProjectsCache()
  return res.json({ success: true, data: updated })
})

router.delete('/:projectId', roleGuard(['admin']), async (req, res) => {
  const removed = await projectStore.remove(req.params.projectId)
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  await clearProjectsCache()
  return res.status(204).send()
})

router.post('/:projectId/members', roleGuard(['admin', 'manager']), async (req, res) => {
  const memberId = (req.body?.memberId || '').toString()
  const memberEmail = (req.body?.memberEmail || '').toString().toLowerCase().trim()

  if (!memberId && !memberEmail) {
    return res.status(400).json({ success: false, error: 'memberId or memberEmail is required' })
  }

  const project = await projectStore.getById(req.params.projectId)
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  const resolvedMemberId = await resolveAuthUserId({ memberId, memberEmail })
  const resolvedMemberEmail = await resolvePreferredEmail({ memberId, memberEmail })
  if (!resolvedMemberId) {
    return res.status(404).json({ success: false, error: 'Unable to resolve member to an authenticated user account' })
  }

  if (!project.memberIds.includes(resolvedMemberId)) {
    project.memberIds.push(resolvedMemberId)
  }

  const projectMemberEmails = Array.isArray(project.memberEmails) ? project.memberEmails : []
  if (resolvedMemberEmail && !projectMemberEmails.includes(resolvedMemberEmail)) {
    projectMemberEmails.push(resolvedMemberEmail)
  }

  const updated = await projectStore.update(project.id, {
    memberIds: project.memberIds,
    memberEmails: projectMemberEmails,
  })
  await clearProjectsCache()
  return res.json({ success: true, data: updated })
})

router.delete('/:projectId/members/:memberId', roleGuard(['admin', 'manager']), async (req, res) => {
  const { projectId, memberId } = req.params
  const memberEmail = (req.query?.memberEmail || '').toString().toLowerCase().trim()
  const project = await projectStore.getById(projectId)

  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' })
  }

  const resolvedMemberId = await resolveAuthUserId({ memberId, memberEmail })
  const resolvedMemberEmail = await resolvePreferredEmail({ memberId, memberEmail })

  const updatedMembers = (Array.isArray(project.memberIds) ? project.memberIds : []).filter((id) => {
    return id !== memberId && id !== resolvedMemberId
  })

  const updatedMemberEmails = (Array.isArray(project.memberEmails) ? project.memberEmails : []).filter((email) => {
    const normalized = (email || '').toString().toLowerCase().trim()
    return normalized !== memberEmail && normalized !== resolvedMemberEmail
  })

  const updated = await projectStore.update(project.id, {
    memberIds: updatedMembers,
    memberEmails: updatedMemberEmails,
  })

  await clearProjectsCache()
  return res.json({ success: true, data: updated })
})

export const projectRoutes = router
