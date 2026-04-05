import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  ArrowRight,
  Plus,
  X,
  Search,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { reportService, taskService, teamService } from '../services/api'
import { Can } from '../components/Can'
import { useProjects } from '../features/projects/hooks/useProjects'
import { useTasks } from '../features/tasks/hooks/useTasks'
import { useDebounce } from '../shared/hooks/useDebounce'
import { AiMessageToast } from '../components/AiFeedback'

const normalizeCollection = (value) => {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.projects)) return value.projects
  if (Array.isArray(value?.tasks)) return value.tasks
  return []
}

const normalizeTaskStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (normalized === 'to_do' || normalized === 'todo') return 'todo'
  if (normalized === 'in_reveiew' || normalized === 'in_reveiw' || normalized === 'reveiew' || normalized === 'reveiw') return 'in_review'
  if (normalized === 'inprogress') return 'in_progress'
  if (normalized === 'inreview' || normalized === 'review') return 'in_review'
  if (normalized === 'done' || normalized === 'complete') return 'completed'

  return normalized
}

const isCompletedStatus = (value) => normalizeTaskStatus(value) === 'completed'

const getCompletionTimestamp = (task = {}) => {
  return task.completedAt || task.statusUpdatedAt || task.updatedAt || task.createdAt || null
}

const getStartOfWeek = (date) => {
  const start = new Date(date)
  const day = start.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + mondayOffset)
  start.setHours(0, 0, 0, 0)
  return start
}

const normalizeIdentityToken = (value) => String(value || '').trim().toLowerCase()

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

const isTaskAssignedToUser = (task = {}, user = {}) => {
  const taskTokens = new Set(getTaskAssigneeTokens(task))
  if (taskTokens.size === 0) return false

  return getUserIdentityTokens(user).some((token) => taskTokens.has(token))
}

const isTaskAssignedToTokens = (task = {}, userTokens = []) => {
  const taskTokens = new Set(getTaskAssigneeTokens(task))
  if (taskTokens.size === 0) return false

  const normalizedUserTokens = userTokens.map(normalizeIdentityToken).filter(Boolean)
  return normalizedUserTokens.some((token) => taskTokens.has(token))
}

const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'task_assigned':
        return <Briefcase className="h-5 w-5 text-blue-500" />
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-orange-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">{activity.user}</span> {activity.action}{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">{activity.target}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
        </div>
      )}
    </div>
  )
}

const MyTasks = ({ tasks = [], onOpenTask }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case 'low':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => onOpenTask?.(task)}
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                    {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                  </span>
                </div>
              </div>
              {task.status === 'completed' && (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-200 dark:text-green-900/40 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No tasks assigned</p>
        </div>
      )}
    </div>
  )
}

const StatCardComponent = ({ label, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-gray-300 dark:hover:border-gray-600 transition">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`${colors[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

const NewTaskModal = ({ isOpen, onClose, onCreateTask, projects = [], creating, error }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    dueDate: '',
  })

  useEffect(() => {
    if (!isOpen) return
    setFormData((prev) => ({
      ...prev,
      projectId: prev.projectId || projects[0]?.id || '',
    }))
  }, [isOpen, projects])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl w-full max-w-lg">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h3>
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              onCreateTask(formData)
            }}
            className="p-5 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                required
                minLength={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                required
                minLength={3}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                <select
                  value={formData.projectId}
                  onChange={(event) => setFormData((prev) => ({ ...prev, projectId: event.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date (optional)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || projects.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [recentReports, setRecentReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [assistantMessage, setAssistantMessage] = useState(null)
  const [resolvedUserTokens, setResolvedUserTokens] = useState([])

  const dashboardQueryOptions = useMemo(() => ({
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  }), [])

  const { data: projectsData, isLoading: projectsLoading, refetch: refetchProjects } = useProjects({
    page: 1,
    limit: 200,
    queryScope: { view: 'dashboard' },
    queryOptions: dashboardQueryOptions,
  })
  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useTasks({
    page: 1,
    limit: 400,
    queryOptions: dashboardQueryOptions,
  })

  const projects = useMemo(() => normalizeCollection(projectsData), [projectsData])
  const tasks = useMemo(() => {
    const normalizedTasks = normalizeCollection(tasksData).map((task) => ({
      ...task,
      status: normalizeTaskStatus(task.status ?? task.state ?? task.stage ?? task.column),
      assignedTo: task.assignedTo ?? task.assigneeId ?? task.assignedToId ?? task?.assignee?.id ?? '',
    }))

    const uniqueById = new Map()
    normalizedTasks.forEach((task) => {
      if (!task?.id) return

      const previous = uniqueById.get(task.id)
      if (!previous) {
        uniqueById.set(task.id, task)
        return
      }

      const prevTs = new Date(previous.updatedAt || previous.createdAt || 0).getTime()
      const nextTs = new Date(task.updatedAt || task.createdAt || 0).getTime()
      if (nextTs >= prevTs) {
        uniqueById.set(task.id, task)
      }
    })

    return Array.from(uniqueById.values())
  }, [tasksData])
  const debouncedSearchTerm = useDebounce(searchTerm, 250)

  useEffect(() => {
    let active = true

    const baseTokens = getUserIdentityTokens(user)

    const resolveUserTokens = async () => {
      if (!user) {
        if (active) setResolvedUserTokens([])
        return
      }

      try {
        const response = await teamService.getMembers({})
        const teamMembers = Array.isArray(response?.data) ? response.data : []
        const baseSet = new Set(baseTokens)

        const matchedMembers = teamMembers.filter((member) => {
          const memberTokens = [member.id, member.userId, member.authUserId, member.memberId, member.email]
            .map(normalizeIdentityToken)
            .filter(Boolean)
          return memberTokens.some((token) => baseSet.has(token))
        })

        const extraTokens = matchedMembers.flatMap((member) => [member.id, member.userId, member.authUserId, member.memberId, member.email])
        const merged = Array.from(new Set([...baseTokens, ...extraTokens.map(normalizeIdentityToken).filter(Boolean)]))

        if (active) {
          setResolvedUserTokens(merged)
        }
      } catch {
        if (active) {
          setResolvedUserTokens(baseTokens)
        }
      }
    }

    resolveUserTokens()

    return () => {
      active = false
    }
  }, [user])

  const roleScopedProjects = useMemo(() => {
    if (!['member', 'viewer'].includes(user?.role)) return projects

    const userTokens = new Set(resolvedUserTokens)
    if (userTokens.size === 0) return []

    return projects.filter((project) => {
      const projectTokens = getProjectMembershipTokens(project)
      return projectTokens.some((token) => userTokens.has(token))
    })
  }, [projects, resolvedUserTokens, user?.role])

  const roleScopedTasks = useMemo(() => {
    const allowedProjectIds = new Set(roleScopedProjects.map((project) => project.id))

    return tasks.filter((task) => task.projectId && allowedProjectIds.has(task.projectId))
  }, [tasks, roleScopedProjects, resolvedUserTokens, user?.role])

  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchTerm(urlSearch)
  }, [searchParams])

  useEffect(() => {
    const normalized = debouncedSearchTerm.trim()
    const current = searchParams.get('search') || ''

    if (normalized === current) return

    const nextParams = new URLSearchParams(searchParams)
    if (normalized) {
      nextParams.set('search', normalized)
    } else {
      nextParams.delete('search')
    }

    setSearchParams(nextParams, { replace: true })
  }, [debouncedSearchTerm, searchParams, setSearchParams])

  const normalizedSearch = debouncedSearchTerm.trim().toLowerCase()
  const hasActiveSearch = normalizedSearch.length > 0

  const filteredProjects = useMemo(() => {
    if (!hasActiveSearch) return roleScopedProjects

    return roleScopedProjects.filter((project) => {
      const values = [project.name, project.description, project.status, project.priority, project.visibility]
      return values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    })
  }, [roleScopedProjects, hasActiveSearch, normalizedSearch])

  const filteredTasks = useMemo(() => {
    if (!hasActiveSearch) return roleScopedTasks

    return roleScopedTasks.filter((task) => {
      const values = [task.title, task.description, task.status, task.priority, task.projectId, task.assignedTo]
      return values.some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
    })
  }, [roleScopedTasks, hasActiveSearch, normalizedSearch])

  const projectStats = useMemo(() => {
    const total = filteredProjects.length
    const inProgress = filteredProjects.filter((project) => project.status === 'in_progress').length
    const completed = filteredProjects.filter((project) => project.status === 'completed').length
    const inReview = filteredProjects.filter((project) => project.status === 'in_review').length
    const onHold = filteredProjects.filter((project) => project.status === 'on_hold').length
    const planning = filteredProjects.filter((project) => project.status === 'planning').length

    return { total, inProgress, completed, inReview, onHold, planning }
  }, [filteredProjects])

  const taskStats = useMemo(() => {
    const total = filteredTasks.length
    const completed = filteredTasks.filter((task) => isCompletedStatus(task.status)).length
    const inProgress = filteredTasks.filter((task) => normalizeTaskStatus(task.status) === 'in_progress').length
    const todo = filteredTasks.filter((task) => normalizeTaskStatus(task.status) === 'todo').length

    return { total, completed, inProgress, todo }
  }, [filteredTasks])

  const userTasks = useMemo(() => {
    if (!user || resolvedUserTokens.length === 0) return []

    return roleScopedTasks
      .filter((task) => !isCompletedStatus(task.status))
      .filter((task) => isTaskAssignedToTokens(task, resolvedUserTokens))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
  }, [roleScopedTasks, resolvedUserTokens, user])

  const overdueTasks = useMemo(() => {
    const now = Date.now()
    return filteredTasks.filter((task) => task.dueDate && new Date(task.dueDate).getTime() < now && !isCompletedStatus(task.status))
  }, [filteredTasks])

  const recentActivity = useMemo(() => {
    return filteredTasks
      .filter((task) => isCompletedStatus(task.status) || normalizeTaskStatus(task.status) === 'in_progress')
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 8)
      .map((task) => ({
        id: task.id,
        type: isCompletedStatus(task.status) ? 'task_completed' : 'task_assigned',
        user: 'Team member',
        action: isCompletedStatus(task.status) ? 'completed task' : 'started working on',
        target: task.title,
        timestamp: task.updatedAt || task.createdAt || new Date().toISOString(),
      }))
  }, [filteredTasks])

  const myTasksDisplay = userTasks.slice(0, 10)
  const openMyTask = (task) => {
    navigate(`/tasks/${encodeURIComponent(task.id)}`)
  }

  const generateReportAsync = useAsync(reportService.generateProjectReport)
  const generateTeamReportAsync = useAsync(reportService.generateTeamReport)
  const createTaskAsync = useAsync(taskService.create)

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await reportService.list()
        const reports = Array.isArray(response?.data) ? response.data : []
        const normalized = reports.slice(-5).reverse()
        setRecentReports(normalized)
        setSelectedReport(normalized[0] || null)
      } catch {
        setRecentReports([])
        setSelectedReport(null)
      }
    }

    loadReports()
  }, [])

  const showToast = (message, type = 'success') => {
    setAssistantMessage({ message, type })
    setTimeout(() => setAssistantMessage(null), 3000)
  }

  const handleCreateTask = async (taskPayload) => {
    const result = await createTaskAsync.execute({
      ...taskPayload,
      dueDate: taskPayload.dueDate || undefined,
    })

    if (!result.success) {
      return
    }

    const createdTask = result?.data
    await Promise.all([refetchTasks(), refetchProjects()])
    setIsTaskModalOpen(false)
    showToast('Task created successfully.')

    if (createdTask?.id) {
      navigate(`/tasks/${encodeURIComponent(createdTask.id)}`)
    }
  }

  const handleGenerateReport = async () => {
    if (!projects.length) {
      return
    }

    const result = await generateReportAsync.execute(projects[0].id)
    if (result.success) {
      const created = result?.data
      if (created) {
        setRecentReports((prev) => [created, ...prev].slice(0, 5))
        setSelectedReport(created)
      }
      showToast('Project report generated.')
    }
  }

  const handleGenerateTeamReport = async () => {
    const result = await generateTeamReportAsync.execute()
    if (result.success) {
      const created = result?.data
      if (created) {
        setRecentReports((prev) => [created, ...prev].slice(0, 5))
        setSelectedReport(created)
      }
      showToast('Team report generated.')
    }
  }

  const handleOpenReport = async (report) => {
    if (!report?.id) {
      return
    }

    try {
      const response = await reportService.getById(report.id)
      if (response?.success && response?.data) {
        setSelectedReport(response.data)
        return
      }
    } catch {
      // Fall back to already loaded item when detail fetch fails.
    }

    setSelectedReport(report)
  }

  const selectedChartData = Array.isArray(selectedReport?.ai?.chartData) && selectedReport.ai.chartData.length > 0
    ? selectedReport.ai.chartData
    : Object.entries(selectedReport?.summary || {}).map(([metric, value]) => ({
        metric,
        value: Number(value) || 0,
      }))

  const tasksStatusData = [
    { name: 'Completed', value: taskStats.completed, fill: '#10b981' },
    { name: 'In Progress', value: taskStats.inProgress, fill: '#3b82f6' },
    { name: 'Todo', value: taskStats.todo, fill: '#f59e0b' },
  ]

  const weeklyData = useMemo(() => {
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const weekStart = getStartOfWeek(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const counters = [0, 0, 0, 0, 0, 0, 0]

    filteredTasks.forEach((task) => {
      if (normalizeTaskStatus(task.status) !== 'completed') return

      const completedAt = getCompletionTimestamp(task)
      if (!completedAt) return

      const completedDate = new Date(completedAt)
      if (Number.isNaN(completedDate.getTime())) return
      if (completedDate < weekStart || completedDate >= weekEnd) return

      const day = completedDate.getDay()
      const index = day === 0 ? 6 : day - 1
      counters[index] += 1
    })

    return dayNames.map((name, index) => ({
      name,
      completed: counters[index],
    }))
  }, [filteredTasks])

  const isLoading = projectsLoading || tasksLoading

  return (
    <div className="space-y-8">
      <AiMessageToast
        isOpen={Boolean(assistantMessage)}
        tone={assistantMessage?.type === 'error' ? 'error' : 'success'}
        message={assistantMessage?.message}
        onClose={() => setAssistantMessage(null)}
      />

      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onCreateTask={handleCreateTask}
        projects={projects}
        creating={createTaskAsync.loading}
        error={createTaskAsync.error}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {user?.name || 'User'}! Here's what's happening with your projects.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-5 w-5" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search in dashboard: projects, tasks, status, priority..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {hasActiveSearch && (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Showing filtered dashboard results for "{debouncedSearchTerm.trim()}"
          </p>
        )}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading dashboard data...</div>
      )}

      {!isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardComponent
              label="Total Projects"
              value={projectStats.total}
              icon={Briefcase}
              trend={projectStats.total > 0}
              trendValue={`${projectStats.inProgress} active`}
              color="blue"
            />
            <StatCardComponent
              label="Completed Tasks"
              value={taskStats.completed}
              icon={CheckCircle2}
              trend={taskStats.total > 0}
              trendValue={`${taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% complete`}
              color="green"
            />
            <StatCardComponent
              label="Total Tasks"
              value={taskStats.total}
              icon={Briefcase}
              trend={taskStats.inProgress > 0}
              trendValue={`${taskStats.inProgress} in progress`}
              color="purple"
            />
            <StatCardComponent
              label="Overdue Items"
              value={overdueTasks.length}
              icon={AlertCircle}
              trend={false}
              trendValue={overdueTasks.length > 0 ? 'Needs attention' : 'All on track'}
              color={overdueTasks.length > 0 ? 'orange' : 'green'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Tasks by Status</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={tasksStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {tasksStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Tasks Completed This Week</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="completed" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition font-medium"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <ActivityFeed activities={recentActivity} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Tasks</h3>
                <button
                  onClick={() => navigate('/kanban')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full"
                >
                  View All ({userTasks.length})
                </button>
              </div>
              <MyTasks tasks={myTasksDisplay} onOpenTask={openMyTask} />
              <Can permission="CREATE_TASK">
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              </Can>
            </div>
          </div>

          <Can permission="VIEW_REPORTS">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports & Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Generate detailed reports on projects and team performance
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateReport}
                    disabled={generateReportAsync.loading || projects.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    {generateReportAsync.loading ? 'Generating...' : 'Generate Report'}
                  </button>
                  <Can permission="MANAGE_USERS">
                    <button
                      onClick={handleGenerateTeamReport}
                      disabled={generateTeamReportAsync.loading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                    >
                      {generateTeamReportAsync.loading ? 'Generating...' : 'Team Report'}
                    </button>
                  </Can>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Generated Reports</h4>
                {recentReports.length > 0 ? (
                  recentReports.map((report) => (
                    <div key={report.id} className="bg-white/80 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                            {report.type} report
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {new Date(report.generatedAt).toLocaleString()} - ID: {report.id}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenReport(report)}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Open Report
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No reports generated yet.</p>
                )}

                {selectedReport && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                          {selectedReport.type} report details
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Provider: {selectedReport?.ai?.provider || 'fallback'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {selectedReport?.ai?.narrativeHtml ? (
                      <div
                        className="prose prose-sm max-w-none dark:prose-invert text-gray-800 dark:text-gray-200"
                        dangerouslySetInnerHTML={{ __html: selectedReport.ai.narrativeHtml }}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedReport?.ai?.narrativeText || JSON.stringify(selectedReport?.summary || {})}
                      </p>
                    )}

                    {selectedChartData.length > 0 && (
                      <div className="h-52 mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={selectedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="metric" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Can>
        </>
      )}
    </div>
  )
}
