import React, { useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info, MessageSquare, Bot } from 'lucide-react'
import { PageHeader, EmptyState } from '../components/Common'
import { useNotificationsRealtime } from '../features/notifications/hooks/useNotificationsRealtime'
import { trackUserAction } from '../shared/analytics/tracker'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../services/api'

const notificationIcons = {
  task_assigned: AlertCircle,
  project_updated: Info,
  comment_added: MessageSquare,
  team_member_added: CheckCircle,
  ai_generated: Bot,
}

const notificationColors = {
  task_assigned: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  project_updated: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  comment_added: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  team_member_added: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  ai_generated: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
}

export const Notifications = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  React.useEffect(() => {
    let isMounted = true

    const loadNotifications = async () => {
      if (!user?.id) return

      try {
        const response = await notificationService.list({ userId: user.id })
        if (response?.success && Array.isArray(response.data)) {
          const normalized = response.data.map((item) => ({
            ...item,
            title: item.title?.startsWith('AI Assistant') ? item.title : `AI Assistant: ${item.title || 'Notification'}`,
            type: item.type || 'ai_generated',
            aiGenerated: item.type === 'ai_generated' || item.title?.toLowerCase().includes('ai assistant'),
            timestamp: item.timestamp || item.createdAt,
          }))
          if (isMounted) setNotifications(normalized)
        }
      } catch (error) {
        console.warn('Failed to load notifications from backend:', error)
      }
    }

    loadNotifications()

    const intervalId = setInterval(loadNotifications, 10000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [user?.id])

  useNotificationsRealtime({
    onNotification: (incoming) => {
      if (!incoming?.id) return

      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === incoming.id)
        if (exists) return prev
        return [{
          ...incoming,
          title: incoming.title?.startsWith('AI Assistant') ? incoming.title : `AI Assistant: ${incoming.title || 'Notification'}`,
          type: incoming.type || 'ai_generated',
          aiGenerated: incoming.type === 'ai_generated' || incoming.title?.toLowerCase().includes('ai assistant'),
          timestamp: incoming.timestamp || incoming.createdAt,
        }, ...prev]
      })
    },
  })

  const markAsRead = async (id) => {
    trackUserAction('notification_mark_read', { id })
    try {
      await notificationService.markAsRead(id)
    } catch (error) {
      console.warn('Failed to mark notification as read in backend:', error)
    }

    setNotifications(
      notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = async () => {
    trackUserAction('notification_mark_all_read')
    try {
      if (user?.id) {
        await notificationService.markAllAsRead(user.id)
      }
    } catch (error) {
      console.warn('Failed to mark all notifications as read in backend:', error)
    }

    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Notifications"
          description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        />
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            aria-label="Mark all notifications as read"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notificationIcons[notification.type] || Bell
            const colorClass = notificationColors[notification.type] || 'bg-gray-50'

            return (
              <button
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                aria-label={`Mark notification ${notification.title} as read`}
                className={`w-full text-left p-4 rounded-lg border transition ${colorClass} ${
                  notification.read ? 'opacity-60' : 'opacity-100'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    {notification.aiGenerated && (
                      <span className="inline-flex mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        AI generated
                      </span>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="h-3 w-3 rounded-full bg-blue-600" />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up!"
        />
      )}
    </div>
  )
}
