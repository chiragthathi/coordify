import express from 'express'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { env } from '../config/env.js'
import { memberStore } from '../store/memberStore.js'
import { publishTeamEvent } from '../queue/teamEventPublisher.js'

const roleSchema = z.enum(['admin', 'manager', 'member', 'viewer'])

const inviteSchema = z.object({
  email: z.string().email(),
  role: roleSchema.optional(),
  name: z.string().min(2).optional(),
})

const updateRoleSchema = z.object({
  role: roleSchema,
})

const acceptInviteSchema = z.object({
  token: z.string().min(6),
})

const acceptInviteByEmailSchema = z.object({
  email: z.string().email(),
})

const roleGuard = (allowedRoles) => (req, res, next) => {
  const role = (req.headers['x-user-role'] || '').toString().toLowerCase()
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  return next()
}

const router = express.Router()

const isServiceLookupRequest = (req) => {
  const caller = (req.headers['x-internal-service'] || '').toString().toLowerCase()
  return Boolean(caller) && caller !== 'api-gateway'
}

router.get('/', async (req, res) => {
  const roleFilter = (req.query.role || '').toString()

  let members = await memberStore.all()
  if (roleFilter) {
    members = members.filter((member) => member.role === roleFilter)
  }

  return res.json({ success: true, data: members })
})

router.get('/lookup/by-id/:memberId', async (req, res) => {
  if (!isServiceLookupRequest(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const member = await memberStore.getById(req.params.memberId)
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' })
  }

  return res.json({ success: true, data: member })
})

router.get('/lookup/by-email', async (req, res) => {
  if (!isServiceLookupRequest(req)) {
    return res.status(403).json({ success: false, error: 'Forbidden' })
  }

  const email = (req.query.email || '').toString().toLowerCase().trim()
  if (!email) {
    return res.status(400).json({ success: false, error: 'email is required' })
  }

  const member = await memberStore.getByEmail(email)
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' })
  }

  return res.json({ success: true, data: member })
})

router.post('/invite', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid invite payload' })
  }

  const payload = parsed.data
  const existing = await memberStore.getByEmail(payload.email)
  if (existing && existing.status === 'active') {
    return res.status(409).json({ success: false, error: 'Member already exists' })
  }

  const invitationToken = randomUUID().replace(/-/g, '')
  const invitationLink = `${env.frontendAppUrl}/invite?token=${invitationToken}`
  const inviterUserId = (req.headers['x-user-id'] || '').toString().trim() || 'system'
  const inviterName = (req.headers['x-user-name'] || '').toString().trim() || 'Admin'
  const inviterRole = (req.headers['x-user-role'] || '').toString().trim() || 'admin'

  if (existing && existing.status !== 'active') {
    const refreshedInvite = {
      ...existing,
      role: payload.role || existing.role || 'member',
      status: 'requested',
      invitedAt: new Date().toISOString(),
      invitationToken,
      invitationAcceptedAt: null,
      updatedAt: new Date().toISOString(),
    }

    await memberStore.upsert(refreshedInvite)
    await publishTeamEvent('team.invited', {
      memberId: refreshedInvite.id,
      email: refreshedInvite.email,
      role: refreshedInvite.role,
      status: refreshedInvite.status,
      invitationToken,
      invitationLink,
      invitedByUserId: inviterUserId,
      invitedBy: inviterName,
      invitedByRole: inviterRole,
    })
    console.log(`[team-service] Invitation confirmation link for ${refreshedInvite.email}: ${invitationLink}`)

    return res.status(200).json({
      success: true,
      data: refreshedInvite,
      meta: { message: 'Invitation confirmation sent' },
    })
  }

  const member = {
    id: 'user_' + randomUUID().slice(0, 8),
    name: payload.name || payload.email.split('@')[0],
    email: payload.email.toLowerCase(),
    role: payload.role || 'member',
    status: 'requested',
    invitedAt: new Date().toISOString(),
    invitationToken,
    invitationAcceptedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await memberStore.upsert(member)
  await publishTeamEvent('team.invited', {
    memberId: member.id,
    email: member.email,
    role: member.role,
    status: member.status,
    invitationToken,
    invitationLink,
    invitedByUserId: inviterUserId,
    invitedBy: inviterName,
    invitedByRole: inviterRole,
  })
  console.log(`[team-service] Invitation confirmation link for ${member.email}: ${invitationLink}`)

  return res.status(201).json({
    success: true,
    data: member,
    meta: { message: 'Invitation confirmation sent' },
  })
})

router.post('/invitations/accept', async (req, res) => {
  const parsed = acceptInviteSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid invitation acceptance payload' })
  }

  const members = await memberStore.all()
  const invitedMember = members.find((member) => member.invitationToken === parsed.data.token)

  if (!invitedMember) {
    return res.status(404).json({ success: false, error: 'Invitation not found or expired' })
  }

  const accepted = await memberStore.upsert({
    ...invitedMember,
    status: 'active',
    invitationAcceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await publishTeamEvent('team.member_activated', {
    memberId: accepted.id,
    email: accepted.email,
    role: accepted.role,
    status: accepted.status,
  })

  return res.json({
    success: true,
    data: accepted,
    meta: { message: 'Invitation accepted. Member joined.' },
  })
})

router.post('/invitations/accept-email', async (req, res) => {
  const parsed = acceptInviteByEmailSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid invitation acceptance payload' })
  }

  const email = parsed.data.email.toLowerCase()
  const members = await memberStore.all()
  const invitedMember = members.find((member) => member.email?.toLowerCase() === email)

  if (!invitedMember) {
    return res.status(404).json({ success: false, error: 'Invitation not found' })
  }

  if (invitedMember.status === 'active') {
    return res.status(200).json({
      success: true,
      data: invitedMember,
      meta: { message: 'Invitation already accepted.' },
    })
  }

  const accepted = await memberStore.upsert({
    ...invitedMember,
    status: 'active',
    invitationAcceptedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  await publishTeamEvent('team.member_activated', {
    memberId: accepted.id,
    email: accepted.email,
    role: accepted.role,
    status: accepted.status,
  })

  return res.json({
    success: true,
    data: accepted,
    meta: { message: 'Invitation accepted. Member joined.' },
  })
})

router.patch('/:memberId/role', roleGuard(['admin', 'manager']), async (req, res) => {
  const parsed = updateRoleSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: 'Invalid role payload' })
  }

  const existing = await memberStore.getById(req.params.memberId)
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Member not found' })
  }

  const updated = await memberStore.upsert({
    ...existing,
    role: parsed.data.role,
    updatedAt: new Date().toISOString(),
  })

  return res.json({ success: true, data: updated })
})

router.delete('/:memberId', roleGuard(['admin', 'manager']), async (req, res) => {
  const removed = await memberStore.remove(req.params.memberId)
  if (!removed) {
    return res.status(404).json({ success: false, error: 'Member not found' })
  }

  return res.status(204).send()
})

export const teamRoutes = router
