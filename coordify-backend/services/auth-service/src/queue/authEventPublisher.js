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
      console.warn('[auth-service] RabbitMQ publisher connection closed')
    })

    return channel
  } catch (error) {
    console.error('[auth-service] RabbitMQ publisher connection failed', { error: error.message })
    if (env.rabbitmqRequired) {
      throw error
    }

    return null
  }
}

export const publishAuthSignupEvent = async (user) => {
  return publishAuthEvent('auth.signup', {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
}

export const publishAuthOtpEvent = async ({ email, otp, purpose }) => {
  return publishAuthEvent('auth.email_otp', {
    email,
    otp,
    purpose,
  })
}

const publishAuthEvent = async (eventType, payload) => {
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
      env.rabbitmqAuthNotificationsRoutingKey,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' },
    )
  } catch (error) {
    console.error('[auth-service] Failed to publish auth event', {
      eventType,
      error: error.message,
    })

    if (env.rabbitmqRequired) {
      throw error
    }

    return false
  }
}

export const closeAuthPublisher = async () => {
  if (channel) {
    await channel.close()
  }

  if (connection) {
    await connection.close()
  }

  channel = null
  connection = null
}
