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

    connection.on('close', () => {
      channel = null
      connection = null
    })

    return channel
  } catch (error) {
    console.error('[team-service] RabbitMQ publisher connection failed', { error: error.message })
    if (env.rabbitmqRequired) {
      throw error
    }

    return null
  }
}

export const publishTeamEvent = async (eventType, payload) => {
  if (!env.rabbitmqEnabled) {
    return false
  }

  const brokerChannel = await ensureChannel()
  if (!brokerChannel) {
    return false
  }

  const event = {
    eventId: `evt_${Date.now()}`,
    eventType,
    occurredAt: new Date().toISOString(),
    payload,
  }

  try {
    return brokerChannel.publish(
      env.rabbitmqExchange,
      env.rabbitmqTeamNotificationsRoutingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' },
    )
  } catch (error) {
    console.error('[team-service] Failed to publish team event', {
      eventType,
      error: error.message,
    })

    if (env.rabbitmqRequired) {
      throw error
    }

    return false
  }
}

export const closeTeamPublisher = async () => {
  if (channel) {
    await channel.close()
  }

  if (connection) {
    await connection.close()
  }

  channel = null
  connection = null
}
