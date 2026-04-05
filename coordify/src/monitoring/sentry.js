import * as Sentry from '@sentry/react'
import { APP_ENV, SENTRY_DSN } from '../shared/config/env'

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: APP_ENV,
    tracesSampleRate: APP_ENV === 'production' ? 0.1 : 1.0,
  })
}
