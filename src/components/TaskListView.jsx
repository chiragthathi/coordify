import React, { useMemo, useState } from 'react'
import { ChevronDown, CheckCircle2, Circle, AlertCircle } from 'lucide-react'

export const TaskListView = ({ tasks = [], projectUsers = [] }) => {
  const [sortBy, setSortBy] = useState('dueDate')

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks]
    switch (sortBy) {
      case 'dueDate':
        return sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
        return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      case 'status':
        const statusOrder = { todo: 0, in_progress: 1, in_review: 2, completed: 3 }
        return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
      default:
        return sorted
    }
  }, [tasks, sortBy])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'in_progress':
        return <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
      case 'in_review':
        return <Circle className="h-5 w-5 text-purple-500 fill-purple-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600" />
    }
  }

  const getStatusLabel = (status) => {
    return status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400'
      case 'in_review':
        return 'text-purple-600 dark:text-purple-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
    }
  }

  const getAssigneeName = (userId) => {
    return projectUsers.find(u => u.id === userId)?.name || 'Unassigned'
  }

  const isOverdue = (dueDate, status) => {
    return new Date(dueDate) < new Date() && status !== 'completed'
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No tasks yet. Create your first task to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sort Options */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Task
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Assignee
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => (
              <tr
                key={task.id}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                  task.status === 'completed' ? 'opacity-60' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === 'completed'
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusLabel(task.status)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-xs font-semibold px-2.5 py-1.5 rounded ${getPriorityColor(task.priority)}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {getAssigneeName(task.assignedTo)}
                  </p>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm ${
                        isOverdue(task.dueDate, task.status)
                          ? 'text-red-600 dark:text-red-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    {isOverdue(task.dueDate, task.status) && (
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
