import React from 'react'
import clsx from 'clsx'

export const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  const labels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    in_review: 'In Review',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }

  return (
    <span className={clsx('badge text-xs font-semibold', styles[status] || styles.pending)}>
      {labels[status] || status}
    </span>
  )
}

export const PriorityBadge = ({ priority }) => {
  const styles = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    urgent: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
  }

  const labels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  }

  return (
    <span className={clsx('badge text-xs font-semibold', styles[priority] || styles.medium)}>
      {labels[priority] || priority}
    </span>
  )
}
