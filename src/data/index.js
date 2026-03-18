/**
 * Mock Data - Central Export
 * All mock data files gathered in one place for easy imports
 */

export {
  MOCK_USERS,
  getUserById,
  getUsersByRole,
  getTeamMembers,
  getUserByEmail,
} from './users'

export {
  MOCK_PROJECTS,
  getProjectById,
  getProjectsByStatus,
  getProjectsByOwner,
  getProjectsForUser,
  getActiveProjects,
  getProjectStats,
} from './projects'

export {
  MOCK_TASKS,
  getTaskById,
  getTasksByProject,
  getTasksForUser,
  getTasksByStatus,
  getTasksByPriority,
  getOverdueTasks,
  getTasksDueSoon,
  getTaskStats,
  getKanbanBoard,
} from './tasks'

export {
  MOCK_NOTIFICATIONS,
  getNotificationsForUser,
  getUnreadNotifications,
  getUnreadCount,
  getNotificationsByType,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationStats,
  getRecentNotifications,
  createNotification,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
} from './notifications'

/**
 * Example Usage:
 *
 * import { MOCK_USERS, getProjectsForUser } from '@/data'
 *
 * const user = MOCK_USERS[0]
 * const userProjects = getProjectsForUser(user.id)
 */
