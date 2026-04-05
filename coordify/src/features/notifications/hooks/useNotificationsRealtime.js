import { useEffect } from 'react'
import { createSocketClient } from '../../../shared/realtime/socketClient'
import { NOTIFICATIONS_WS_URL } from '../../../shared/config/env'

export const useNotificationsRealtime = ({ onNotification }) => {
  useEffect(() => {
    const client = createSocketClient({
      url: NOTIFICATIONS_WS_URL,
      onMessage: (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload?.type === 'notification' && typeof onNotification === 'function') {
            onNotification(payload.data)
          }
        } catch (_error) {
          // Ignore malformed event payloads from non-conforming emitters.
        }
      },
    })

    return () => client.close()
  }, [onNotification])
}
