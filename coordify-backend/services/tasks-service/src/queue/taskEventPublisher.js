import amqp from 'amqplib'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'
import { callInternalService } from '../services/internalServiceClient.js'

let connection = null
let channel = null

const fallbackCreateNotification = async (task, reason) => {
  try {
    const response = await callInternalService({
      method: 'POST',
      url: `${env.notificationsServiceUrl}/api/v1/notifications`,
      headers: {
        'x-user-role': 'manager',
      },
      body: {
        userId: task.assignedTo,
        type: 'task_assigned',
        title: `Task assigned: ${task.title}`,
        message: `You have been assigned task ${task.id}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Notification fallback failed (${response.status}): ${body}`)
    }

    await logger.warn('Used HTTP fallback for task notification', {
      taskId: task.id,
      reason,
      notificationsServiceUrl: env.notificationsServiceUrl,
    })

    return true
  } catch (error) {
    await logger.error('Failed to create notification via HTTP fallback', {
      taskId: task.id,
      reason,
      error: error.message,
    })

    return false
  }
}

const ensureChannel = async () => {
  if (!env.rabbitmqEnabled) {
    return null
  }

  if (channel) {
    return channel
  }

  try {
    connection = await amqp.connect(env.rabbitmqUrl)
    channel = await connection.createChannel()
    await channel.assertExchange(env.rabbitmqExchange, 'topic', { durable: true })
    await logger.info('RabbitMQ publisher connected', {
      exchange: env.rabbitmqExchange,
      url: env.rabbitmqUrl,
    })

    connection.on('close', async () => {
      channel = null
      connection = null
      await logger.warn('RabbitMQ publisher connection closed')
    })

    return channel
  } catch (error) {
    await logger.error('RabbitMQ publisher connection failed', { error: error.message })
    if (env.rabbitmqRequired) {
      throw error
    }

    return null
  }
}

export const publishTaskCreatedEvent = async (task) => {
  if (!env.rabbitmqEnabled) {
    return fallbackCreateNotification(task, 'rabbitmq_disabled')
  }

  const brokerChannel = await ensureChannel()
  if (!brokerChannel) {
    return fallbackCreateNotification(task, 'rabbitmq_unavailable')
  }

  const event = {
    eventId: `evt_${Date.now()}`,
    eventType: 'task.created',
    occurredAt: new Date().toISOString(),
    payload: {
      taskId: task.id,
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      createdBy: task.createdBy,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
    },
  }

  try {
    const published = brokerChannel.publish(
      env.rabbitmqExchange,
      env.rabbitmqTaskNotificationsRoutingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' },
    )

    await logger.info('Published task.created event', {
      taskId: task.id,
      eventId: event.eventId,
      routingKey: env.rabbitmqTaskNotificationsRoutingKey,
      published,
    })

    return published
  } catch (error) {
    await logger.error('Failed to publish task.created event', {
      taskId: task.id,
      error: error.message,
    })

    if (env.rabbitmqRequired) {
      throw error
    }

    return fallbackCreateNotification(task, 'rabbitmq_publish_failed')
  }
}

export const publishTaskStatusChangedEvent = async ({ task, previousStatus, changedBy }) => {
  if (!task?.id) {
    return false
  }

  if (!env.rabbitmqEnabled) {
    return fallbackCreateNotification(task, 'rabbitmq_disabled_status_change')
  }

  const brokerChannel = await ensureChannel()
  if (!brokerChannel) {
    return fallbackCreateNotification(task, 'rabbitmq_unavailable_status_change')
  }

  const event = {
    eventId: `evt_${Date.now()}`,
    eventType: 'task.status_changed',
    occurredAt: new Date().toISOString(),
    payload: {
      userId: changedBy || task.assignedTo,
      taskId: task.id,
      title: task.title,
      projectId: task.projectId,
      assignedTo: task.assignedTo,
      previousStatus: previousStatus || null,
      status: task.status,
      changedBy: changedBy || task.createdBy || 'system',
      updatedAt: task.updatedAt,
    },
  }

  try {
    const published = brokerChannel.publish(
      env.rabbitmqExchange,
      env.rabbitmqTaskNotificationsRoutingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' },
    )

    await logger.info('Published task.status_changed event', {
      taskId: task.id,
      eventId: event.eventId,
      routingKey: env.rabbitmqTaskNotificationsRoutingKey,
      published,
    })

    return published
  } catch (error) {
    await logger.error('Failed to publish task.status_changed event', {
      taskId: task.id,
      error: error.message,
    })

    if (env.rabbitmqRequired) {
      throw error
    }

    return fallbackCreateNotification(task, 'rabbitmq_publish_failed_status_change')
  }
}

export const closeTaskPublisher = async () => {
  if (channel) {
    await channel.close()
  }

  if (connection) {
    await connection.close()
  }

  channel = null
  connection = null
}
