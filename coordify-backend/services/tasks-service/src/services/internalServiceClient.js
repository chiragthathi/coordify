import { env } from '../config/env.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const callInternalService = async ({
  method,
  url,
  body,
  headers = {},
  timeoutMs = env.internalRequestTimeoutMs,
  retries = env.internalRequestRetries,
}) => {
  let lastError = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          'x-service-token': env.internalServiceToken,
          'x-internal-service': env.serviceName,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeout)
      return response
    } catch (error) {
      clearTimeout(timeout)
      lastError = error

      if (attempt < retries) {
        await sleep(150 * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('Internal service call failed')
}
