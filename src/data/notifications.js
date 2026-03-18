/**
 * Mock Notifications Data
 * Normalized structure ready for API integration
 */

export const MOCK_NOTIFICATIONS = [
  {
    id: 'notif_001',
    userId: 'user_admin_001',
    type: 'task_assigned',
    title: 'Task Assigned',
    message: 'You have been assigned to "Implement authentication API"',
    relatedId: 'task_002',
    relatedType: 'task',
    actionUrl: '/projects/proj_001?task=task_002',
    read: false,
    priority: 'high',
    icon: 'check-square',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager@example.com',
    createdAt: '2024-02-15T14:30:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_002',
    userId: 'user_admin_001',
    type: 'project_update',
    title: 'Project Update',
    message: 'ProjectHub Platform progress updated to 65%',
    relatedId: 'proj_001',
    relatedType: 'project',
    actionUrl: '/projects/proj_001',
    read: false,
    priority: 'medium',
    icon: 'trending-up',
    avatar: null,
    createdAt: '2024-02-15T13:45:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_003',
    userId: 'user_admin_001',
    type: 'comment',
    title: 'New Comment',
    message: 'Sarah Chen commented on "Design login page mockups"',
    relatedId: 'task_001',
    relatedType: 'task',
    actionUrl: '/projects/proj_001?task=task_001',
    read: true,
    priority: 'low',
    icon: 'message-square',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah.chen@example.com',
    createdAt: '2024-02-15T11:20:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_004',
    userId: 'user_admin_001',
    type: 'team_member_joined',
    title: 'Team Member Joined',
    message: 'Emily Watson has joined ProjectHub Platform project',
    relatedId: 'proj_001',
    relatedType: 'project',
    actionUrl: '/projects/proj_001/team',
    read: true,
    priority: 'low',
    icon: 'user-plus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily.watson@example.com',
    createdAt: '2024-02-15T10:00:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_005',
    userId: 'user_admin_001',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Alex Kim completed "Design login page mockups"',
    relatedId: 'task_001',
    relatedType: 'task',
    actionUrl: '/projects/proj_001?task=task_001',
    read: true,
    priority: 'medium',
    icon: 'check-circle',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex.kim@example.com',
    createdAt: '2024-02-15T09:15:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_006',
    userId: 'user_admin_001',
    type: 'deadline_reminder',
    title: 'Deadline Reminder',
    message: 'API Gateway Implementation is due on April 30, 2024',
    relatedId: 'proj_003',
    relatedType: 'project',
    actionUrl: '/projects/proj_003',
    read: true,
    priority: 'high',
    icon: 'alert-circle',
    avatar: null,
    createdAt: '2024-02-15T08:00:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_007',
    userId: 'user_admin_001',
    type: 'file_uploaded',
    title: 'File Uploaded',
    message: 'James Rodriguez uploaded design specifications',
    relatedId: 'task_004',
    relatedType: 'task',
    actionUrl: '/projects/proj_002?task=task_004',
    read: true,
    priority: 'low',
    icon: 'file-plus',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james.rodriguez@example.com',
    createdAt: '2024-02-14T16:30:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_008',
    userId: 'user_admin_001',
    type: 'status_changed',
    title: 'Task Status Changed',
    message: 'Setup database schema status changed to In Progress',
    relatedId: 'task_003',
    relatedType: 'task',
    actionUrl: '/projects/proj_001?task=task_003',
    read: true,
    priority: 'medium',
    icon: 'refresh-cw',
    avatar: null,
    createdAt: '2024-02-14T14:45:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_009',
    userId: 'user_admin_001',
    type: 'mention',
    title: 'You Were Mentioned',
    message: 'Manager mentioned you in a comment on "Implement authentication API"',
    relatedId: 'task_002',
    relatedType: 'task',
    actionUrl: '/projects/proj_001?task=task_002',
    read: true,
    priority: 'high',
    icon: 'at-sign',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager@example.com',
    createdAt: '2024-02-14T13:20:00Z',
    expiresAt: null,
  },
  {
    id: 'notif_010',
    userId: 'user_admin_001',
    type: 'budget_alert',
    title: 'Budget Alert',
    message: 'ProjectHub Platform has reached 65% of budget',
    relatedId: 'proj_001',
    relatedType: 'project',
    actionUrl: '/projects/proj_001/settings',
    read: true,
    priority: 'high',
    icon: 'alert-triangle',
    avatar: null,
    createdAt: '2024-02-14T10:00:00Z',
    expiresAt: null,
  },
]

// Helper to get notifications for a user
export const getNotificationsForUser = (userId) => {
  return MOCK_NOTIFICATIONS.filter((notif) => notif.userId === userId)
}

// Helper to get unread notifications
export const getUnreadNotifications = (userId) => {
  return MOCK_NOTIFICATIONS.filter(
    (notif) => notif.userId === userId && !notif.read
  )
}

// Helper to get unread count
export const getUnreadCount = (userId) => {
  return getUnreadNotifications(userId).length
}

// Helper to get notifications by type
export const getNotificationsByType = (userId, type) => {
  return MOCK_NOTIFICATIONS.filter(
    (notif) => notif.userId === userId && notif.type === type
  )
}

// Helper to mark notification as read
export const markNotificationAsRead = (notificationId) => {
  const notification = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId)
  if (notification) {
    notification.read = true
  }
  return notification
}

// Helper to mark all notifications as read for a user
export const markAllNotificationsAsRead = (userId) => {
  MOCK_NOTIFICATIONS.forEach((notif) => {
    if (notif.userId === userId) {
      notif.read = true
    }
  })
}

// Helper to delete notification
export const deleteNotification = (notificationId) => {
  const index = MOCK_NOTIFICATIONS.findIndex((n) => n.id === notificationId)
  if (index > -1) {
    return MOCK_NOTIFICATIONS.splice(index, 1)
  }
  return null
}

// Notification statistics
export const getNotificationStats = (userId) => {
  const userNotifications = getNotificationsForUser(userId)
  const unread = userNotifications.filter((n) => !n.read).length

  const byType = {}
  userNotifications.forEach((notif) => {
    byType[notif.type] = (byType[notif.type] || 0) + 1
  })

  const byPriority = {
    high: userNotifications.filter((n) => n.priority === 'high').length,
    medium: userNotifications.filter((n) => n.priority === 'medium').length,
    low: userNotifications.filter((n) => n.priority === 'low').length,
  }

  return {
    total: userNotifications.length,
    unread,
    byType,
    byPriority,
  }
}

// Helper to get recent notifications
export const getRecentNotifications = (userId, limit = 10) => {
  return getNotificationsForUser(userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
}

// Notification types
export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  PROJECT_UPDATE: 'project_update',
  COMMENT: 'comment',
  TEAM_MEMBER_JOINED: 'team_member_joined',
  TASK_COMPLETED: 'task_completed',
  DEADLINE_REMINDER: 'deadline_reminder',
  FILE_UPLOADED: 'file_uploaded',
  STATUS_CHANGED: 'status_changed',
  MENTION: 'mention',
  BUDGET_ALERT: 'budget_alert',
}

// Notification priorities
export const NOTIFICATION_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
}

/**
 * Helper to create a new notification (for future API integration)
 * @param {Object} notificationData
 * @returns {Object} Created notification
 */
export const createNotification = (notificationData) => {
  const newNotification = {
    id: `notif_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    ...notificationData,
  }
  MOCK_NOTIFICATIONS.push(newNotification)
  return newNotification
}
