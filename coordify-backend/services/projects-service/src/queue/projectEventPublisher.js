import amqp from 'amqplib'
import { env } from '../config/env.js'

let connection = null
let channel = null

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

    connection.on('close', async () => {
      channel = null
      connection = null
      console.warn('[projects-service] RabbitMQ publisher connection closed')
    })

    return channel
  } catch (error) {
    console.error('[projects-service] RabbitMQ publisher connection failed', { error: error.message })
    if (env.rabbitmqRequired) {
      throw error
    }

    return null
  }
}

export const publishProjectCreatedEvent = async (project) => {
  if (!env.rabbitmqEnabled) {
    return false
  }

  const brokerChannel = await ensureChannel()
  if (!brokerChannel) {
    return false
  }

  const event = {
    eventId: `evt_${Date.now()}`,
    eventType: 'project.created',
    occurredAt: new Date().toISOString(),
    payload: {
      projectId: project.id,
      name: project.name,
      owner: project.owner,
      status: project.status,
      priority: project.priority,
      visibility: project.visibility,
    },
  }

  try {
    return brokerChannel.publish(
      env.rabbitmqExchange,
      env.rabbitmqProjectNotificationsRoutingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' },
    )
  } catch (error) {
    console.error('[projects-service] Failed to publish project.created event', {
      projectId: project.id,
      error: error.message,
    })

    if (env.rabbitmqRequired) {
      throw error
    }

    return false
  }
}

export const closeProjectPublisher = async () => {
  if (channel) {
    await channel.close()
  }

  if (connection) {
    await connection.close()
  }

  channel = null
  connection = null
}
