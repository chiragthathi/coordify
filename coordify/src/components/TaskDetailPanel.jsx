import React, { useEffect, useState } from 'react'
import {
  X,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  Check,
  Save,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { usePermission } from '../hooks/usePermission'
import { useAuth } from '../contexts/AuthContext'
import { commentService, taskService } from '../services/api'

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

const resolveAssignee = (task = {}, users = []) => {
  const assigneeTokens = new Set(getTaskAssigneeTokens(task))
  if (assigneeTokens.size === 0) return null

  return users.find((candidate) => getUserIdentityTokens(candidate).some((token) => assigneeTokens.has(token))) || null
}

const resolveUserAvatar = (user = {}) => {
  return user.avatar || user.avatarUrl || user.image || user.profileImage || user.photoURL || ''
}

const buildAvatarFallback = (user = {}) => {
  const seed = user.email || user.name || user.id || 'user'
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`
}

// Comments Section Component
const CommentsSection = ({
  comments = [],
  canCreate = true,
  onAddComment,
  addingComment,
  addError,
  resolveAuthor,
}) => {
  const [newComment, setNewComment] = useState('')

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    await onAddComment?.(newComment.trim())
    setNewComment('')
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <img
              src={comment.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author || comment.id}`}
              alt={comment.author || 'Author'}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {resolveAuthor?.(comment) || comment.author || 'Team Member'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {comment.text || comment.content}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {comment.timestamp || (comment.createdAt ? new Date(comment.createdAt).toLocaleString() : '')}
              </p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
        )}
      </div>

      {/* Add Comment - only if user has permission */}
      {canCreate && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            disabled={addingComment}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddComment}
            disabled={addingComment}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
      {addError && <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>}
    </div>
  )
}

// Subtasks Section Component
const SubtasksSection = ({
  subtasks = [],
  canToggle = true,
  canManageSubtasks = true,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  saving = false,
  error = '',
}) => {
  const [newSubtask, setNewSubtask] = useState('')
  const [editingSubtaskId, setEditingSubtaskId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')

  const toggleSubtask = async (id, completed) => {
    if (!canToggle) return
    await onToggleSubtask?.(id, completed)
  }

  const addSubtask = async () => {
    if (!canManageSubtasks || !newSubtask.trim()) return
    const nextTitle = newSubtask.trim()
    await onAddSubtask?.(nextTitle)
    setNewSubtask('')
  }

  const startEditing = (subtask) => {
    setEditingSubtaskId(subtask.id)
    setEditingTitle(subtask.title || '')
  }

  const saveEdit = async () => {
    if (!editingSubtaskId || !editingTitle.trim()) return
    await onEditSubtask?.(editingSubtaskId, editingTitle.trim())
    setEditingSubtaskId(null)
    setEditingTitle('')
  }

  const cancelEdit = () => {
    setEditingSubtaskId(null)
    setEditingTitle('')
  }

  const completedCount = subtasks.filter(st => st.completed).length

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Subtasks
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount}/{subtasks.length}
        </span>
      </h3>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(completedCount / subtasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition ${
              canToggle ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50' : 'opacity-75'
            }`}
          >
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => toggleSubtask(subtask.id, !subtask.completed)}
              disabled={!canToggle || saving}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            {editingSubtaskId === subtask.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                  disabled={saving}
                />
                <button
                  onClick={saveEdit}
                  disabled={saving || !editingTitle.trim()}
                  className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                  title="Save subtask"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span
                  className={`text-sm flex-1 ${
                    subtask.completed
                      ? 'text-gray-500 line-through'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {subtask.title}
                </span>
                {canManageSubtasks && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(subtask)}
                      disabled={saving}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Edit subtask"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSubtask?.(subtask.id)}
                      disabled={saving}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete subtask"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add New Subtask - only if user can add subtasks */}
      {canManageSubtasks && (
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
            disabled={saving}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addSubtask}
            disabled={saving}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

// Main Task Detail Panel Component
export const TaskDetailPanel = ({ task, isOpen, onClose, users = [], onTaskUpdated }) => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [taskData, setTaskData] = useState(task || {})
  const [savingTask, setSavingTask] = useState(false)
  const [taskError, setTaskError] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [savingSubtasks, setSavingSubtasks] = useState(false)
  const [subtaskError, setSubtaskError] = useState('')
  const { can } = usePermission()

  // Check if user can edit tasks
  const canEditTask = can('EDIT_TASK')
  // Check if user can complete tasks (includes subtasks)
  const canCompleteTask = can('COMPLETE_TASK')
  const isMember = String(user?.role || '').toLowerCase() === 'member'
  const canEditTaskFields = canEditTask && !isMember
  const canEditStatus = canEditTask
  const canEditPriority = canEditTask && !isMember
  // Allow toggling existing subtasks if user can either edit or complete
  const canEditSubtasks = canEditTask || canCompleteTask
  // Allow add/edit/delete subtasks for team members as requested.
  const canManageSubtasks = canEditTask || canCompleteTask

  useEffect(() => {
    setTaskData(task || {})
    setTaskError('')
    setCommentError('')
    setSubtaskError('')
    setIsEditing(false)
  }, [task])

  if (!isOpen || !task) return null

  const assignee = resolveAssignee(task, users)
  const assigneeAvatar = assignee ? (resolveUserAvatar(assignee) || buildAvatarFallback(assignee)) : ''
  const creator = users.find(u => u.id === task.createdBy)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'in_review':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
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

  const handleStatusChange = async (newStatus) => {
    setTaskData((prev) => ({ ...prev, status: newStatus }))

    if (!task?.id || !canEditStatus) return

    try {
      const response = await taskService.update(task.id, { status: newStatus })
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
      }
    } catch (error) {
      setTaskError(error?.message || 'Failed to update status')
    }
  }

  const handlePriorityChange = async (newPriority) => {
    setTaskData((prev) => ({ ...prev, priority: newPriority }))

    if (!task?.id || !canEditPriority) return

    try {
      const response = await taskService.update(task.id, { priority: newPriority })
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
      }
    } catch (error) {
      setTaskError(error?.message || 'Failed to update priority')
    }
  }

  const resolveAuthor = (comment) => {
    const byId = users.find((user) => user.id === comment.authorId)
    return byId?.name || comment.author || 'Team Member'
  }

  const handleAddComment = async (content) => {
    if (!task?.id) return

    try {
      setAddingComment(true)
      setCommentError('')
      const response = await commentService.create(task.id, content)
      const comments = Array.isArray(response?.data) ? response.data : []
      setTaskData((prev) => {
        const nextTask = { ...prev, comments, commentsCount: comments.length }
        onTaskUpdated?.(nextTask)
        return nextTask
      })
    } catch (error) {
      setCommentError(error?.message || 'Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  const handleToggleSubtask = async (subtaskId, completed) => {
    if (!task?.id || !subtaskId) return

    try {
      setSavingSubtasks(true)
      setSubtaskError('')
      const response = await taskService.updateSubtask(task.id, subtaskId, { completed })
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
        return
      }

      setTaskData((prev) => {
        const subtasks = Array.isArray(prev.subtasks)
          ? prev.subtasks.map((subtask) => (subtask.id === subtaskId ? { ...subtask, completed } : subtask))
          : []
        const nextTask = { ...prev, subtasks }
        onTaskUpdated?.(nextTask)
        return nextTask
      })
    } catch (error) {
      setSubtaskError(error?.message || 'Failed to update subtask')
    } finally {
      setSavingSubtasks(false)
    }
  }

  const handleAddSubtask = async (title) => {
    if (!task?.id || !title) return

    try {
      setSavingSubtasks(true)
      setSubtaskError('')
      const response = await taskService.addSubtask(task.id, title)
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
      }
    } catch (error) {
      setSubtaskError(error?.message || 'Failed to add subtask')
    } finally {
      setSavingSubtasks(false)
    }
  }

  const handleEditSubtask = async (subtaskId, title) => {
    if (!task?.id || !subtaskId || !title) return

    try {
      setSavingSubtasks(true)
      setSubtaskError('')
      const response = await taskService.updateSubtask(task.id, subtaskId, { title })
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
      }
    } catch (error) {
      setSubtaskError(error?.message || 'Failed to edit subtask')
    } finally {
      setSavingSubtasks(false)
    }
  }

  const handleDeleteSubtask = async (subtaskId) => {
    if (!task?.id || !subtaskId) return

    try {
      setSavingSubtasks(true)
      setSubtaskError('')
      const response = await taskService.deleteSubtask(task.id, subtaskId)
      const updatedTask = response?.data
      if (updatedTask) {
        setTaskData(updatedTask)
        onTaskUpdated?.(updatedTask)
      }
    } catch (error) {
      setSubtaskError(error?.message || 'Failed to delete subtask')
    } finally {
      setSavingSubtasks(false)
    }
  }

  const handleSave = async () => {
    if (!task?.id) return

    try {
      setSavingTask(true)
      setTaskError('')
      const payload = {
        title: taskData.title,
        description: taskData.description,
        dueDate: taskData.dueDate,
        ...(canEditStatus ? { status: taskData.status } : {}),
        ...(canEditPriority ? { priority: taskData.priority } : {}),
      }
      const response = await taskService.update(task.id, payload)
      const updatedTask = response?.data || { ...taskData }
      setTaskData(updatedTask)
      onTaskUpdated?.(updatedTask)
      setIsEditing(false)
    } catch (error) {
      setTaskError(error?.message || 'Failed to save task changes')
    } finally {
      setSavingTask(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            {isEditing && canEditTaskFields ? (
              <input
                type="text"
                value={taskData.title || ''}
                onChange={(e) =>
                  setTaskData({ ...taskData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-lg text-gray-900 dark:text-white">
                {taskData.title}
              </p>
            )}
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              {canEditStatus ? (
                <select
                  value={taskData.status || 'todo'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                    taskData.status
                  )}`}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <div className={`w-full px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(taskData.status)}`}>
                  {taskData.status === 'todo' && 'To Do'}
                  {taskData.status === 'in_progress' && 'In Progress'}
                  {taskData.status === 'in_review' && 'In Review'}
                  {taskData.status === 'completed' && 'Completed'}
                </div>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              {canEditPriority ? (
                <select
                  value={taskData.priority || 'medium'}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(
                    taskData.priority
                  )}`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              ) : (
                <div className={`w-full px-3 py-2 rounded-lg text-sm font-medium ${getPriorityColor(taskData.priority)}`}>
                  {taskData.priority === 'low' && 'Low'}
                  {taskData.priority === 'medium' && 'Medium'}
                  {taskData.priority === 'high' && 'High'}
                  {taskData.priority === 'critical' && 'Critical'}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            {isEditing && canEditTaskFields ? (
              <textarea
                value={taskData.description || ''}
                onChange={(e) =>
                  setTaskData({ ...taskData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter task description..."
              />
            ) : (
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {taskData.description || 'No description'}
              </p>
            )}
          </div>

          {/* Assignee and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assignee
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {assignee && (
                  <>
                    <img
                      src={assigneeAvatar}
                      alt={assignee.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {assignee.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {assignee.title}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </label>
              {isEditing && canEditTaskFields ? (
                <input
                  type="date"
                  value={taskData.dueDate || ''}
                  onChange={(e) =>
                    setTaskData({ ...taskData, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {taskData.dueDate ? new Date(taskData.dueDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }) : 'No due date'}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </label>
            {taskData.tags && taskData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {taskData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                No tags
              </p>
            )}
          </div>

          {/* Subtasks */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <SubtasksSection
              subtasks={Array.isArray(taskData.subtasks) ? taskData.subtasks : []}
              canToggle={canEditSubtasks}
              canManageSubtasks={canManageSubtasks}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              saving={savingSubtasks}
              error={subtaskError}
            />
          </div>

          {/* Comments */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <CommentsSection
              comments={Array.isArray(taskData.comments) ? taskData.comments : []}
              canCreate={can('CREATE_COMMENT')}
              onAddComment={handleAddComment}
              addingComment={addingComment}
              addError={commentError}
              resolveAuthor={resolveAuthor}
            />
          </div>

          {taskError && (
            <p className="text-sm text-red-600 dark:text-red-400">{taskError}</p>
          )}

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={savingTask}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingTask ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={!canEditTask}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition font-semibold ${
                    canEditTask
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  title={!canEditTask ? 'You do not have permission to edit tasks' : ''}
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Task
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
