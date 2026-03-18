import React, { useState } from 'react'
import {
  X,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  MessageSquare,
  Paperclip,
  Send,
  Edit2,
  Save,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { MOCK_USERS } from '../data'
import { usePermission } from '../hooks/usePermission'

// Comments Section Component
const CommentsSection = ({ commentsCount = 0, canCreate = true }) => {
  const [comments, setComments] = useState([
    {
      id: '1',
      author: 'Alice Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      text: 'Great design! Just a few tweaks needed on the mobile layout.',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      author: 'Bob Smith',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      text: 'I agree. Let\'s schedule a review meeting tomorrow.',
      timestamp: '1 hour ago',
    },
  ])
  const [newComment, setNewComment] = useState('')

  const handleAddComment = () => {
    if (newComment.trim()) {
      setComments([
        ...comments,
        {
          id: String(comments.length + 1),
          author: 'You',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=you',
          text: newComment,
          timestamp: 'Just now',
        },
      ])
      setNewComment('')
    }
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
              src={comment.avatar}
              alt={comment.author}
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {comment.author}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {comment.text}
                </p>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {comment.timestamp}
              </p>
            </div>
          </div>
        ))}
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
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddComment}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Subtasks Section Component
const SubtasksSection = ({ subtasks = [], canEdit = true, canAddSubtasks = true }) => {
  const [taskSubtasks, setTaskSubtasks] = useState(subtasks)
  const [newSubtask, setNewSubtask] = useState('')

  const toggleSubtask = (id) => {
    if (!canEdit) return
    setTaskSubtasks(
      taskSubtasks.map(st =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    )
  }

  const addSubtask = () => {
    if (!canAddSubtasks || !newSubtask.trim()) return
    setTaskSubtasks([
      ...taskSubtasks,
      {
        id: `sub_${Date.now()}`,
        title: newSubtask,
        completed: false,
      },
    ])
    setNewSubtask('')
  }

  const completedCount = taskSubtasks.filter(st => st.completed).length

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
        <span className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Subtasks
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {completedCount}/{taskSubtasks.length}
        </span>
      </h3>

      {/* Progress Bar */}
      {taskSubtasks.length > 0 && (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(completedCount / taskSubtasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {taskSubtasks.map((subtask) => (
          <label
            key={subtask.id}
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
              canEdit ? 'hover:bg-gray-100 dark:hover:bg-gray-700/50' : 'opacity-75'
            }`}
          >
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() => toggleSubtask(subtask.id)}
              disabled={!canEdit}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <span
              className={`text-sm flex-1 ${
                subtask.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {subtask.title}
            </span>
          </label>
        ))}
      </div>

      {/* Add New Subtask - only if user can add subtasks */}
      {canAddSubtasks && (
        <div className="flex gap-2 pt-2">
          <input
            type="text"
            placeholder="Add subtask..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addSubtask()}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addSubtask}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Main Task Detail Panel Component
export const TaskDetailPanel = ({ task, isOpen, onClose, users = MOCK_USERS }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [taskData, setTaskData] = useState(task || {})
  const { can } = usePermission()

  // Check if user can edit tasks
  const canEditTask = can('EDIT_TASK')
  // Check if user can complete tasks (includes subtasks)
  const canCompleteTask = can('COMPLETE_TASK')
  // Allow toggling existing subtasks if user can either edit or complete
  const canEditSubtasks = canEditTask || canCompleteTask
  // Allow adding new subtasks only if user can fully edit (MANAGER/ADMIN only)
  const canAddSubtasks = canEditTask

  if (!isOpen || !task) return null

  const assignee = users.find(u => u.id === task.assignedTo)
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

  const handleStatusChange = (newStatus) => {
    setTaskData({ ...taskData, status: newStatus })
  }

  const handlePriorityChange = (newPriority) => {
    setTaskData({ ...taskData, priority: newPriority })
  }

  const handleSave = () => {
    setIsEditing(false)
    // TODO: Save task via API
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
            {isEditing && canEditTask ? (
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
                {task.title}
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
              {canEditTask ? (
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
              {canEditTask ? (
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
            {isEditing && canEditTask ? (
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
                {task.description || 'No description'}
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
                      src={assignee.avatar}
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
              {isEditing && canEditTask ? (
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
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
            {task.tags && task.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
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
            <SubtasksSection subtasks={task.subtasks} canEdit={canEditSubtasks} canAddSubtasks={canAddSubtasks} />
          </div>

          {/* File Attachments - only if user can edit */}
          {canEditTask && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Paperclip className="h-5 w-5" />
                Attachments ({task.attachmentsCount || 0})
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag files here or click to upload
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  PDF, images, documents up to 10MB
                </p>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <CommentsSection commentsCount={task.commentsCount} canCreate={can('CREATE_COMMENT')} />
          </div>

          {/* Action Buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
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
