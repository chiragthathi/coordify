import React, { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { GripVertical, Tag, MessageSquare, CheckCircle2, Circle, AlertCircle, Lock } from 'lucide-react'
import { TaskDetailPanel } from './TaskDetailPanel'
import { usePermission } from '../hooks/usePermission'
import { useAuth } from '../contexts/AuthContext'
import { taskService } from '../services/api'

const normalizeTaskStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (normalized === 'to_do' || normalized === 'todo') return 'todo'
  if (normalized === 'inprogress') return 'in_progress'
  if (normalized === 'inreview' || normalized === 'review') return 'in_review'
  if (normalized === 'done' || normalized === 'complete') return 'completed'

  return normalized || 'todo'
}

const getTaskStatusValue = (task = {}) => {
  return task.status ?? task.state ?? task.stage ?? task.column ?? 'todo'
}

const normalizeIdentityToken = (value) => String(value || '').trim().toLowerCase()

const getUserIdentityTokens = (user = {}) => {
  return [user.id, user.userId, user.authUserId, user.memberId, user.email]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const getTaskAssigneeTokens = (task = {}) => {
  const assignee = task.assignee || {}

  return [
    task.assignedTo,
    task.assigneeId,
    task.assignedToId,
    task.assignedToEmail,
    task.assigneeEmail,
    assignee.id,
    assignee.userId,
    assignee.authUserId,
    assignee.memberId,
    assignee.email,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const resolveUserAvatar = (user = {}) => {
  return user.avatar || user.avatarUrl || user.image || user.profileImage || user.photoURL || ''
}

const resolveAssignee = (task = {}, users = []) => {
  const assigneeTokens = new Set(getTaskAssigneeTokens(task))
  if (assigneeTokens.size === 0) return null

  return users.find((user) => getUserIdentityTokens(user).some((token) => assigneeTokens.has(token))) || null
}

const buildAvatarFallback = (assignee = {}) => {
  const seed = assignee.email || assignee.name || assignee.id || 'assignee'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

// Draggable Task Card Component
const DraggableTaskCard = ({ task, isDragging, users = [], onTaskClick, canDrag = true }) => {
  const assignee = resolveAssignee(task, users)
  const assigneeAvatar = assignee ? (resolveUserAvatar(assignee) || buildAvatarFallback(assignee)) : ''
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0
  const totalSubtasks = task.subtasks?.length || 0

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityBorder = (priority) => {
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
        return 'border-l-4 border-gray-500'
    }
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onTaskClick && onTaskClick(task)
      }}
      className={`
        bg-white dark:bg-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition cursor-pointer
        ${getPriorityBorder(task.priority)}
        ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}
        ${!canDrag ? 'opacity-75' : ''}
      `}
    >
      {/* Header with Grip and Priority */}
      <div className="flex items-start gap-2 mb-3">
        {canDrag ? (
          <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing" />
        ) : (
          <Lock className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" title="Read-only: You cannot edit tasks" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {task.title}
          </p>
        </div>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} title={task.priority} />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {task.tags.length > 2 && (
            <span className="text-xs text-gray-600 dark:text-gray-400">+{task.tags.length - 2}</span>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2 mb-3">
        {/* Due Date */}
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>

        {/* Subtasks Progress */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}
      </div>

      {/* Footer - Assignee and Counts */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          {assignee && (
            <img
              src={assigneeAvatar}
              alt={assignee.name}
              title={assignee.name}
              className="h-6 w-6 rounded-full ring-1 ring-gray-300 dark:ring-gray-600"
            />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          {task.commentsCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.commentsCount}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Kanban Column Component
const KanbanColumn = ({ columnId, columnTitle, tasks, users = [], onTaskClick, canDrag = true }) => {
  const columnTasks = tasks.filter(t => {
    const statusMap = {
      'todo-column': 'todo',
      'in-progress-column': 'in_progress',
      'in-review-column': 'in_review',
      'done-column': 'completed',
    }
    return normalizeTaskStatus(t.status) === statusMap[columnId]
  })

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 min-h-96 flex-1">
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">{columnTitle}</h3>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <div className="h-1 bg-gradient-to-r from-blue-500 to-transparent rounded" />
      </div>

      {/* Sortable Tasks */}
      <SortableContext
        items={columnTasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {columnTasks.length > 0 ? (
            columnTasks.map((task) => (
              <div key={task.id} className={canDrag ? "cursor-grab active:cursor-grabbing" : ""}>
                <DraggableTaskCard task={task} users={users} onTaskClick={onTaskClick} canDrag={canDrag} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// Main Kanban Board Component
export const DraggableKanbanBoard = ({
  projectId,
  tasks = [],
  users = [],
  selectedTaskId = null,
  onRequestTaskRoute,
  onTaskPanelClose,
  onTaskUpdated,
}) => {
  // Use provided tasks or fetch from project
  const projectTasks = useMemo(() => {
    return (tasks || []).map((task) => ({
      ...task,
      status: normalizeTaskStatus(getTaskStatusValue(task)),
    }))
  }, [tasks])

  const [taskList, setTaskList] = useState(projectTasks)
  const [activeId, setActiveId] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const statusMap = {
    'todo-column': 'todo',
    'in-progress-column': 'in_progress',
    'in-review-column': 'in_review',
    'done-column': 'completed',
  }

  useEffect(() => {
    setTaskList(projectTasks)
  }, [projectTasks])

  useEffect(() => {
    if (!selectedTaskId) return

    const matchedTask = projectTasks.find((task) => String(task.id) === String(selectedTaskId))
    if (!matchedTask) return

    setSelectedTask(matchedTask)
    setIsDetailOpen(true)
  }, [projectTasks, selectedTaskId])

  // Check if user can edit tasks (for drag-and-drop)
  const { user } = useAuth()
  const { can } = usePermission()
  const canEditTask = can('EDIT_TASK')
  const canEditTaskStatus = canEditTask
  const canDragTasks = canEditTaskStatus

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setIsDetailOpen(true)
    onRequestTaskRoute?.(task.id)
  }

  const handleDetailClose = () => {
    setIsDetailOpen(false)
    setTimeout(() => setSelectedTask(null), 300)
    onTaskPanelClose?.()
  }

  const handleTaskUpdated = (updatedTask) => {
    if (!updatedTask?.id) return

    const normalizedUpdatedTask = {
      ...updatedTask,
      status: normalizeTaskStatus(updatedTask.status),
    }

    setTaskList((prev) => prev.map((task) => (task.id === normalizedUpdatedTask.id ? { ...task, ...normalizedUpdatedTask } : task)))
    setSelectedTask((prev) => (prev?.id === normalizedUpdatedTask.id ? { ...prev, ...normalizedUpdatedTask } : prev))
    onTaskUpdated?.(normalizedUpdatedTask)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    // Prevent drag if user doesn't have permission
    if (!canDragTasks) return
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    // Prevent drag if user doesn't have permission
    if (!canDragTasks) return

    const { active, over } = event
    if (!over) return

    const activeTask = taskList.find(t => t.id === active.id)
    const overTask = taskList.find(t => t.id === over.id)

    if (!activeTask || !overTask) return

    // Keep drag-over side-effect free; final status persistence is handled on drag-end.
  }

  const handleDragEnd = async (event) => {
    // Prevent drag if user doesn't have permission
    if (!canDragTasks) {
      setActiveId(null)
      return
    }

    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeTask = taskList.find((task) => task.id === active.id)
    if (!activeTask) return

    const overContainerId =
      over.data?.current?.sortable?.containerId ||
      (statusMap[over.id] ? over.id : null)

    const nextStatus = statusMap[overContainerId]

    if (nextStatus && normalizeTaskStatus(activeTask.status) !== nextStatus) {
      const previousTasks = taskList
      const optimisticTask = { ...activeTask, status: nextStatus }

      setTaskList((prev) => prev.map((task) => (task.id === activeTask.id ? optimisticTask : task)))
      setSelectedTask((prev) => (prev?.id === activeTask.id ? optimisticTask : prev))
      onTaskUpdated?.(optimisticTask)

      try {
        const response = await taskService.updateStatus(activeTask.id, nextStatus)
        const persistedTask = response?.data || optimisticTask

        setTaskList((prev) => prev.map((task) => (task.id === activeTask.id ? { ...task, ...persistedTask } : task)))
        setSelectedTask((prev) => (prev?.id === activeTask.id ? { ...prev, ...persistedTask } : prev))
        onTaskUpdated?.(persistedTask)
      } catch (error) {
        setTaskList(previousTasks)
        setSelectedTask((prev) => (prev?.id === activeTask.id ? activeTask : prev))
        onTaskUpdated?.(activeTask)
        console.error('Failed to persist task status update after drag:', error)
      }

      return
    }

    // Reorder within same column
    const activeIndex = taskList.findIndex(t => t.id === active.id)
    const overIndex = taskList.findIndex(t => t.id === over.id)

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      setTaskList(arrayMove(taskList, activeIndex, overIndex))
    }
  }

  const activeDragTask = taskList.find(t => t.id === activeId)

  const columns = [
    { id: 'todo-column', title: 'To Do' },
    { id: 'in-progress-column', title: 'In Progress' },
    { id: 'in-review-column', title: 'In Review' },
    { id: 'done-column', title: 'Done' },
  ]

  return (
    <>
      {/* Read-only Banner for VIEWER users or Limited Banner for MEMBER */}
      {!canEditTaskStatus && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
          <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Read-only view:</span>{' '}
            You don't have permission to edit or move tasks.
          </p>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div key={column.id} className="min-w-96">
              <KanbanColumn
                columnId={column.id}
                columnTitle={column.title}
                tasks={taskList}
                users={users}
                onTaskClick={handleTaskClick}
                canDrag={canDragTasks}
              />
            </div>
          ))}
        </div>

        {/* Drag Overlay - Shows dragged task at cursor */}
        <DragOverlay>
          {activeDragTask ? (
            <div className="w-96">
              <DraggableTaskCard task={activeDragTask} isDragging users={users} canDrag={canDragTasks} />
            </div>
          ) : null}
        </DragOverlay>

        {/* Task Detail Panel */}
        <TaskDetailPanel
          task={selectedTask}
          isOpen={isDetailOpen}
          onClose={handleDetailClose}
          users={users}
          onTaskUpdated={handleTaskUpdated}
        />
      </DndContext>
    </>
  )
}
