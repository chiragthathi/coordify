import React, { useState } from 'react'
import { Bell, CheckCircle, AlertCircle, Info, MessageSquare } from 'lucide-react'
import { PageHeader, EmptyState } from '../components/Common'
import { mockNotifications } from '../data/mockData'

const notificationIcons = {
  task_assigned: AlertCircle,
  project_updated: Info,
  comment_added: MessageSquare,
  team_member_added: CheckCircle,
}

const notificationColors = {
  task_assigned: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  project_updated: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  comment_added: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  team_member_added: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
}

export const Notifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications)

  const markAsRead = (id) => {
    setNotifications(
      notifications.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
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
