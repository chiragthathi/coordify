import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DraggableKanbanBoard } from '../components/DraggableKanbanBoard'
import { Filter, Plus, X } from 'lucide-react'
import { useProjects } from '../features/projects/hooks/useProjects'
import { useTasks } from '../features/tasks/hooks/useTasks'
import { taskService, teamService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'

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

const getProjectMembershipTokens = (project = {}) => {
  return [
    ...(Array.isArray(project.memberIds) ? project.memberIds : []),
    ...(Array.isArray(project.memberEmails) ? project.memberEmails : []),
    project.owner,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

const NewKanbanTaskModal = ({ isOpen, onClose, projects = [], members = [], onCreate, creating, error }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setFormData((prev) => ({
      ...prev,
      projectId: prev.projectId || projects[0]?.id || '',
      assignedTo: prev.assignedTo || members[0]?.id || '',
    }))
  }, [isOpen, projects, members])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign New Task</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <form
            className="p-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              onCreate(formData)
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                required
                minLength={3}
                rows={3}
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, projectId: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To</label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(event) => setFormData((prev) => ({ ...prev, assignedTo: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(event) => setFormData((prev) => ({ ...prev, priority: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || projects.length === 0 || members.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create & Assign Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

const normalizeCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.tasks)) return value.tasks
  if (Array.isArray(value?.projects)) return value.projects
  return []
}

export const KanbanPage = () => {
  const { user } = useAuth()
  const { can } = usePermission()
  const navigate = useNavigate()
  const { taskId } = useParams()
  const [selectedProject, setSelectedProject] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [members, setMembers] = useState([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [liveTasks, setLiveTasks] = useState([])
  const canCreateTask = can('CREATE_TASK')

  const { data: projectsData, isLoading: projectsLoading } = useProjects({ page: 1, limit: 200 })
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    page: 1,
    limit: 400,
    filters: {
      ...(selectedProject !== 'all' ? { projectId: selectedProject } : {}),
      ...(filterPriority !== 'all' ? { priority: filterPriority } : {}),
    },
  })

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await teamService.getMembers({})
        setMembers(Array.isArray(response?.data) ? response.data : [])
      } catch {
        setMembers([])
      }
    }

    loadMembers()
  }, [])

  const projects = useMemo(() => normalizeCollection(projectsData), [projectsData])
  const visibleProjects = useMemo(() => {
    if (!['member', 'viewer'].includes(user?.role)) return projects

    const userTokens = new Set(getUserIdentityTokens(user))
    if (userTokens.size === 0) return []

    return projects.filter((project) => {
      const projectTokens = getProjectMembershipTokens(project)
      return projectTokens.some((token) => userTokens.has(token))
    })
  }, [projects, user, user?.role])

  const allowedProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects])
  const serverTasks = useMemo(() => normalizeCollection(tasksData), [tasksData])
  const roleScopedServerTasks = useMemo(() => {
    if (!['member', 'viewer'].includes(user?.role)) return serverTasks
    return serverTasks.filter((task) => allowedProjectIds.has(task.projectId))
  }, [allowedProjectIds, serverTasks, user?.role])

  useEffect(() => {
    setLiveTasks(roleScopedServerTasks.map((task) => ({
      ...task,
      status: normalizeTaskStatus(getTaskStatusValue(task)),
    })))
  }, [roleScopedServerTasks])

  const displayTasks = liveTasks
  const assignableMembers = useMemo(() => {
    const activeMembers = members.filter((member) => member.status === 'active' || member.status === 'joined')
    if (activeMembers.length > 0) {
      return activeMembers
    }

    if (user?.id) {
      return [{ id: user.id, name: user.name || 'Current User', email: user.email || 'you@example.com' }]
    }

    return []
  }, [members, user?.id, user?.name, user?.email])

  const handleCreateTask = async (payload) => {
    try {
      setCreating(true)
      setCreateError('')

      const response = await taskService.create({
        title: payload.title,
        description: payload.description,
        projectId: payload.projectId,
        assignedTo: payload.assignedTo,
        status: normalizeTaskStatus(payload.status),
        priority: payload.priority,
        dueDate: payload.dueDate || undefined,
      })

      setIsCreateOpen(false)
      await refetchTasks()

      const createdTaskId = response?.data?.id
      if (createdTaskId) {
        navigate(`/tasks/${encodeURIComponent(createdTaskId)}`)
      }
    } catch (error) {
      setCreateError(error?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  const stats = useMemo(() => {
    return {
      todo: displayTasks.filter((task) => normalizeTaskStatus(task.status) === 'todo').length,
      inProgress: displayTasks.filter((task) => normalizeTaskStatus(task.status) === 'in_progress').length,
      inReview: displayTasks.filter((task) => normalizeTaskStatus(task.status) === 'in_review').length,
      completed: displayTasks.filter((task) => normalizeTaskStatus(task.status) === 'completed').length,
    }
  }, [displayTasks])

  const isLoading = projectsLoading || tasksLoading

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Drag and drop tasks to organize your work</p>
        </div>
        {canCreateTask && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        )}
      </div>

      {canCreateTask && (
        <NewKanbanTaskModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false)
            setCreateError('')
          }}
          projects={visibleProjects}
          members={assignableMembers}
          onCreate={handleCreateTask}
          creating={creating}
          error={createError}
        />
      )}

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading board data...</div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">To Do</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todo}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">In Progress</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">In Review</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.inReview}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Done</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completed}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Projects</option>
              {visibleProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {(selectedProject !== 'all' || filterPriority !== 'all') && (
              <button
                onClick={() => {
                  setSelectedProject('all')
                  setFilterPriority('all')
                }}
                className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
            {displayTasks.length > 0 ? (
              <DraggableKanbanBoard
                tasks={displayTasks}
                users={members}
                selectedTaskId={taskId || null}
                onRequestTaskRoute={(nextTaskId) => navigate(`/tasks/${encodeURIComponent(nextTaskId)}`)}
                onTaskPanelClose={() => {
                  if (taskId) {
                    navigate('/kanban')
                  }
                }}
                onTaskUpdated={(updatedTask) => {
                  if (!updatedTask?.id) return
                  setLiveTasks((prev) => prev.map((task) => {
                    if (task.id !== updatedTask.id) return task

                    return {
                      ...task,
                      ...updatedTask,
                      status: normalizeTaskStatus(getTaskStatusValue(updatedTask)),
                    }
                  }))
                  refetchTasks()
                }}
              />
            ) : (
              <div className="text-center py-16">
                <Filter className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No tasks found with the selected filters</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
