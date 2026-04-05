import nodemailer from 'nodemailer'
import { env } from '../config/env.js'
import { logger } from './logger.js'

let transporter = null

const getTransporter = () => {
  if (env.mailTransport !== 'smtp') {
    return null
  }

  if (transporter) {
    return transporter
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser && env.smtpPass
      ? {
        user: env.smtpUser,
        pass: env.smtpPass,
      }
      : undefined,
  })

  return transporter
}

export const sendEmail = async ({ to, subject, text, html }) => {
  const activeTransport = getTransporter()

  if (!activeTransport) {
    await logger.info('Email transport is set to log mode', { to, subject, text })
    return { delivered: false, mode: 'log' }
  }

  await activeTransport.sendMail({
    from: env.mailFrom,
    to,
    subject,
    text,
    html,
  })

  await logger.info('Email sent', { to, subject })
  return { delivered: true, mode: 'smtp' }
}
