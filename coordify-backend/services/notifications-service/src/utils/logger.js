import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const logsDir = path.join(process.cwd(), 'logs')
const logFile = path.join(logsDir, 'notifications-service.log')

const writeLog = async (level, message, meta = {}) => {
  try {
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'notifications-service',
      level,
      message,
      ...meta,
    })

    await mkdir(logsDir, { recursive: true })
    await appendFile(logFile, line + '\n', 'utf8')

    const output = `[notifications-service] ${level.toUpperCase()} ${message}`
    if (level === 'error') {
      console.error(output, meta)
      return
    }

    console.log(output, meta)
  } catch (error) {
    console.error('[notifications-service] LOGGING_FAILED', { error: error.message, level, message })
  }
}

export const logger = {
  info(message, meta) {
    return writeLog('info', message, meta)
  },
  warn(message, meta) {
    return writeLog('warn', message, meta)
  },
  error(message, meta) {
    return writeLog('error', message, meta)
  },
}
