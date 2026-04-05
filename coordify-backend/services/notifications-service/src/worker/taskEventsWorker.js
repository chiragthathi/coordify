import { randomUUID } from 'node:crypto'
import amqp from 'amqplib'
import { env } from '../config/env.js'
import { notificationStore } from '../store/notificationStore.js'
import { logger } from '../utils/logger.js'
import { sendEmail } from '../utils/emailSender.js'

let connection = null
let channel = null

const queueBindings = [
  {
    service: 'tasks',
    queue: env.rabbitmqTaskNotificationsQueue,
    routingKey: env.rabbitmqTaskNotificationsRoutingKey,
  },
  {
    service: 'projects',
    queue: env.rabbitmqProjectNotificationsQueue,
    routingKey: env.rabbitmqProjectNotificationsRoutingKey,
  },
  {
    service: 'auth',
    queue: env.rabbitmqAuthNotificationsQueue,
    routingKey: env.rabbitmqAuthNotificationsRoutingKey,
  },
  {
    service: 'team',
    queue: env.rabbitmqTeamNotificationsQueue,
    routingKey: env.rabbitmqTeamNotificationsRoutingKey,
  },
  {
    service: 'reports',
    queue: env.rabbitmqReportsNotificationsQueue,
    routingKey: env.rabbitmqReportsNotificationsRoutingKey,
  },
  {
    service: 'settings',
    queue: env.rabbitmqSettingsNotificationsQueue,
    routingKey: env.rabbitmqSettingsNotificationsRoutingKey,
  },
]

const inferUserId = (payload = {}) => {
  return (
    payload.userId ||
    payload.changedBy ||
    payload.assignedToAuthUserId ||
    payload.assignedToUserId ||
    payload.assignedToEmail ||
    payload.invitedByUserId ||
    payload.assignedTo ||
    payload.owner ||
    payload.memberId ||
    payload.createdBy ||
    'system'
  )
}

const toTitle = (service, eventType) => {
  const normalizedType = (eventType || `${service}.event`).replaceAll('.', ' ')
  return `AI Assistant update: ${normalizedType}`
}

const toMessage = (service, payload = {}) => {
  if (service === 'tasks') {
    const taskId = payload.taskId || 'unknown-task'
    const title = payload.title || 'Task update'
    return `I noticed a task change: ${title} (${taskId}).`
  }

  if (service === 'projects') {
    const projectId = payload.projectId || 'unknown-project'
    return `I detected a project update for ${projectId}.`
  }

  if (service === 'auth') {
    return `I detected account activity for ${payload.email || payload.userId || 'user'}.`
  }

  if (service === 'team') {
    return `I detected team activity for ${payload.email || payload.memberId || 'member'}.`
  }

  if (service === 'reports') {
    return `I prepared a report update: ${payload.type || 'report'}.`
  }

  if (service === 'settings') {
    return `I detected settings updates for ${payload.userId || 'user'}.`
  }

  return 'I detected a new service notification.'
}

const buildNotificationFromEvent = (service, event) => {
  const payload = event.payload || {}

  return {
    id: 'notif_' + randomUUID().slice(0, 8),
    userId: inferUserId(payload),
    type: 'ai_generated',
    title: toTitle(service, event.eventType),
    message: toMessage(service, payload),
    read: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const sendEmailForEvent = async (service, event) => {
  const payload = event.payload || {}

  if (service === 'auth' && event.eventType === 'auth.email_otp') {
    if (!payload.email) {
      return
    }

    const purposeText = payload.purpose === 'reset_password' ? 'password reset' : 'email verification'
    const subject = 'Your OTP Code'
    const text = `Your ${purposeText} OTP is ${payload.otp}. It expires in 2 minutes.`
    const html = `<p>Your ${purposeText} OTP is <strong>${payload.otp}</strong>.</p><p>This code expires in 2 minutes.</p>`
    await sendEmail({ to: payload.email, subject, text, html })
    return
  }

  if (service === 'team' && event.eventType === 'team.invited') {
    if (!payload.email) {
      return
    }

    const inviteBy = payload.invitedBy || 'Admin'
    const inviteRole = payload.invitedByRole || 'admin'
    const invitationLink = payload.invitationLink || ''
    const subject = "You're Invited!"
    const text = `You have been invited by ${inviteBy} (${inviteRole}). Click here to join: ${invitationLink}`
    const html = `<p>You have been invited by <strong>${inviteBy}</strong> (${inviteRole}).</p><p><a href="${invitationLink}">Click here to join</a></p>`
    await sendEmail({ to: payload.email, subject, text, html })
  }
}

const consumeQueue = async (binding) => {
  await channel.assertQueue(binding.queue, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': env.rabbitmqDeadLetterExchange,
      'x-dead-letter-routing-key': env.rabbitmqDeadLetterRoutingKey,
    },
  })

  await channel.bindQueue(binding.queue, env.rabbitmqExchange, binding.routingKey)

  await channel.consume(binding.queue, async (message) => {
    if (!message) {
      return
    }

    const raw = message.content.toString('utf8')

    try {
      const event = JSON.parse(raw)
      const notification = buildNotificationFromEvent(binding.service, event)
      await notificationStore.create(notification)

      try {
        await sendEmailForEvent(binding.service, event)
      } catch (emailError) {
        await logger.error('Failed to send email for event', {
          workerId: env.workerId,
          service: binding.service,
          queue: binding.queue,
          eventId: event.eventId,
          eventType: event.eventType,
          error: emailError.message,
        })
      }

      await logger.info('Consumed service notification event', {
        workerId: env.workerId,
        service: binding.service,
        queue: binding.queue,
        routingKey: binding.routingKey,
        eventId: event.eventId,
        notificationId: notification.id,
      })

      channel.ack(message)
    } catch (error) {
      await logger.error('Failed consuming service event, moving to DLQ', {
        workerId: env.workerId,
        service: binding.service,
        queue: binding.queue,
        error: error.message,
        payload: raw,
      })

      channel.nack(message, false, false)
    }
  })
}

export const startTaskEventsWorker = async () => {
  if (!env.rabbitmqEnabled) {
    await logger.warn('RabbitMQ worker is disabled by configuration')
    return
  }

  connection = await amqp.connect(env.rabbitmqUrl)
  channel = await connection.createChannel()

  await channel.assertExchange(env.rabbitmqExchange, 'topic', { durable: true })
  await channel.assertExchange(env.rabbitmqDeadLetterExchange, 'topic', { durable: true })

  await channel.assertQueue(env.rabbitmqDeadLetterQueue, { durable: true })
  await channel.bindQueue(
    env.rabbitmqDeadLetterQueue,
    env.rabbitmqDeadLetterExchange,
    env.rabbitmqDeadLetterRoutingKey,
  )
  await channel.prefetch(env.rabbitmqPrefetch)

  for (const binding of queueBindings) {
    await consumeQueue(binding)
  }

  await logger.info('Multi-queue notifications worker started', {
    workerId: env.workerId,
    queues: queueBindings.map((item) => item.queue),
    routingKeys: queueBindings.map((item) => item.routingKey),
    dlq: env.rabbitmqDeadLetterQueue,
  })

  connection.on('close', async () => {
    channel = null
    connection = null
    await logger.warn('RabbitMQ worker connection closed')
  })
}

export const closeTaskEventsWorker = async () => {
  if (channel) {
    await channel.close()
  }

  if (connection) {
    await connection.close()
  }

  channel = null
  connection = null
}
