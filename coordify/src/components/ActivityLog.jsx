import React from 'react'
import {
  CheckCircle2,
  MessageSquare,
  Zap,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react'

export const ActivityLog = ({ tasks = [], projectUsers = [] }) => {
  const getAssigneeName = (userId) => {
    return projectUsers.find((u) => u.id === userId)?.name || 'Unknown user'
  }

  const getCreatorName = (userId) => {
    return projectUsers.find((u) => u.id === userId)?.name || 'Unknown user'
  }

  // Generate activity from tasks
  const activities = React.useMemo(() => {
    const acts = []

    tasks.forEach((task) => {
      // Task completed
      if (task.status === 'completed') {
        acts.push({
          id: `${task.id}-completed`,
          type: 'completed',
          title: 'Task completed',
          description: `${getAssigneeName(task.assignedTo)} completed "${task.title}"`,
          timestamp: task.updatedAt || task.completedDate || task.createdAt,
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
        })
      }

      // Task in progress
      if (task.status === 'in_progress') {
        acts.push({
          id: `${task.id}-in-progress`,
          type: 'in_progress',
          title: 'Work started',
          description: `${getAssigneeName(task.assignedTo)} started working on "${task.title}"`,
          timestamp: task.startDate || task.createdAt,
          icon: Zap,
          color: 'text-blue-600 dark:text-blue-400',
        })
      }

      // Comments
      const commentsCount = Array.isArray(task.comments) ? task.comments.length : task.commentsCount || 0
      if (commentsCount > 0) {
        acts.push({
          id: `${task.id}-comments`,
          type: 'comment',
          title: 'Comments added',
          description: `${commentsCount} comment${commentsCount !== 1 ? 's' : ''} on "${task.title}"`,
          timestamp: task.updatedAt || task.createdAt,
          icon: MessageSquare,
          color: 'text-orange-600 dark:text-orange-400',
        })
      }

      // Task created
      acts.push({
        id: `${task.id}-created`,
        type: 'created',
        title: 'Task created',
        description: `"${task.title}" was created by ${getCreatorName(task.createdBy)}`,
        timestamp: task.createdAt || task.updatedAt,
        icon: FileText,
        color: 'text-gray-600 dark:text-gray-400',
      })
    })

    // Sort by timestamp descending
    return acts
      .filter((activity) => !!activity.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [tasks, projectUsers])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    // Less than a minute
    if (diff < 60000) return 'Just now'

    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes}m ago`
    }

    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours}h ago`
    }

    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000)
      return `${days}d ago`
    }

    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activity.icon
        return (
          <div
            key={activity.id}
            className="flex gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${activity.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {activity.title}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {activity.description}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(activity.timestamp)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
