import { APP_ENV, ENABLE_ANALYTICS } from '../config/env'

const emit = (event, payload) => {
  if (!ENABLE_ANALYTICS) return

  // Replace with Segment/GA/Amplitude adapter as needed.
  // eslint-disable-next-line no-console
  console.info(`[analytics:${event}]`, { env: APP_ENV, ...payload })
}

export const trackPageVisit = (path) => {
  emit('page_visit', {
    path,
    timestamp: new Date().toISOString(),
  })
}

export const trackUserAction = (action, details = {}) => {
  emit('user_action', {
    action,
    details,
    timestamp: new Date().toISOString(),
  })
}
