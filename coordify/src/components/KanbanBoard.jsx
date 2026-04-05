import React, { useMemo } from 'react'
import { GripVertical, CheckCircle2, AlertCircle } from 'lucide-react'

export const KanbanBoard = ({ tasks = [] }) => {
  // Group tasks by status
  const kanbanData = useMemo(() => {
    return {
      todo: tasks.filter(t => t.status === 'todo'),
      in_progress: tasks.filter(t => t.status === 'in_progress'),
      in_review: tasks.filter(t => t.status === 'in_review'),
      completed: tasks.filter(t => t.status === 'completed'),
    }
  }, [tasks])

  const columns = [
    { id: 'todo', label: 'To Do', color: 'bg-gray-100 dark:bg-gray-700' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 'in_review', label: 'In Review', color: 'bg-purple-100 dark:bg-purple-900/30' },
    { id: 'completed', label: 'Completed', color: 'bg-green-100 dark:bg-green-900/30' },
  ]

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-l-4 border-red-500'
      case 'high':
        return 'border-l-4 border-orange-500'
      case 'medium':
        return 'border-l-4 border-yellow-500'
      case 'low':
        return 'border-l-4 border-green-500'
      default:
        return ''
    }
  }

  const TaskCard = ({ task }) => (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-move ${getPriorityColor(
        task.priority
      )}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {task.title}
          </p>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize whitespace-nowrap">
          {task.priority}
        </span>
        {task.subtasks && task.subtasks.length > 0 && (
          <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </div>
  )

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">No tasks yet. Create your first task to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mx-6 -my-6 p-6">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col">
          {/* Column Header */}
          <div className="mb-4">
            <div className={`${column.color} rounded-lg p-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">{column.label}</h3>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {kanbanData[column.id].length}
                </span>
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            {kanbanData[column.id].length > 0 ? (
              kanbanData[column.id].map((task) => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : (
              <div className="h-20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <p className="text-xs text-gray-500 dark:text-gray-500">Drop tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
