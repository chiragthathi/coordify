import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  DollarSign,
  Tag,
  Edit2,
  MoreVertical,
  LayoutGrid,
  List,
  History,
  Settings,
} from 'lucide-react'
import { Tabs } from '../components/Tabs'
import { DraggableKanbanBoard } from '../components/DraggableKanbanBoard'
import { TaskListView } from '../components/TaskListView'
import { ActivityLog } from '../components/ActivityLog'
import { ProjectSettings } from '../components/ProjectSettings'
import { projectService, taskService, teamService } from '../services/api'

const normalizeStatusToken = (value) => {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

  if (normalized === 'to_do' || normalized === 'todo') return 'todo'
  if (normalized === 'inprogress') return 'in_progress'
  if (normalized === 'review' || normalized === 'inreview') return 'in_review'
  if (normalized === 'done' || normalized === 'complete') return 'completed'

  return normalized
}

const getTaskStatusValue = (task = {}) => {
  return task.status ?? task.state ?? task.stage ?? task.column ?? 'todo'
}

const normalizeIdentityToken = (value) => String(value || '').trim().toLowerCase()

const getMemberIdentityTokens = (member = {}) => {
  return [
    member.id,
    member.userId,
    member.authUserId,
    member.memberId,
    member.email,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean)
}

export const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('kanban')
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProjectDetail = async () => {
      if (!projectId) {
        setError('Missing project id')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const [projectResponse, tasksResponse, membersResponse] = await Promise.all([
          projectService.getById(projectId),
          taskService.list({ page: 1, limit: 300, filters: { projectId } }),
          teamService.getMembers({}),
        ])

        setProject(projectResponse?.data || null)

        const normalizedTasks = Array.isArray(tasksResponse?.data)
          ? tasksResponse.data
          : Array.isArray(tasksResponse?.data?.items)
            ? tasksResponse.data.items
            : []
        setTasks(normalizedTasks.map((task) => ({
          ...task,
          status: normalizeStatusToken(getTaskStatusValue(task)) || 'todo',
        })))

        const normalizedMembers = Array.isArray(membersResponse?.data) ? membersResponse.data : []
        setMembers(normalizedMembers)
      } catch (loadError) {
        setError(loadError?.message || 'Failed to load project details')
      } finally {
        setLoading(false)
      }
    }

    loadProjectDetail()
  }, [projectId])

  const projectUsers = useMemo(() => {
    const projectMemberTokens = new Set([
      ...(Array.isArray(project?.memberIds) ? project.memberIds : []),
      ...(Array.isArray(project?.memberEmails) ? project.memberEmails : []),
    ].map(normalizeIdentityToken).filter(Boolean))

    return members.filter((member) => {
      return getMemberIdentityTokens(member).some((token) => projectMemberTokens.has(token))
    })
  }, [members, project?.memberEmails, project?.memberIds])

  if (loading) {
    return <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading project...</div>
  }

  if (error) {
    return <div className="text-center py-12 text-red-600 dark:text-red-400">{error}</div>
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The project you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/projects')}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Back to Projects
        </button>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'in_progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'in_review':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
      case 'planning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'on_hold':
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 dark:text-red-400'
      case 'high':
        return 'text-orange-600 dark:text-orange-400'
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'low':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const completedTasks = tasks.filter((task) => normalizeStatusToken(task.status) === 'completed').length
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0
  const spent = Number.isFinite(project.spent) ? project.spent : 0
  const budget = Number.isFinite(project.budget) && project.budget > 0 ? project.budget : 1
  const daysRemaining = project.dueDate
    ? Math.ceil((new Date(project.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  const tabs = [
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: LayoutGrid,
      content: (
        <DraggableKanbanBoard
          tasks={tasks}
          users={projectUsers}
          onTaskUpdated={(updatedTask) => {
            if (!updatedTask?.id) return
            setTasks((prev) => prev.map((task) => {
              if (task.id !== updatedTask.id) return task

              return {
                ...task,
                ...updatedTask,
                status: normalizeStatusToken(getTaskStatusValue(updatedTask)) || 'todo',
              }
            }))
          }}
        />
      ),
    },
    {
      id: 'list',
      label: 'List View',
      icon: List,
      content: <TaskListView tasks={tasks} projectUsers={projectUsers} />,
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: History,
      content: <ActivityLog tasks={tasks} projectUsers={projectUsers} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      content: (
        <ProjectSettings
          project={project}
          onProjectUpdated={setProject}
          onProjectDeleted={() => navigate('/projects')}
        />
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(normalizeStatusToken(project.status))}`}>
              {(normalizeStatusToken(project.status) || 'planning').replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <MoreVertical className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div
        className="h-64 rounded-lg bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: project.image
            ? `url('${project.image}')`
            : 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Progress</h3>
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{progress}%</p>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Budget</h3>
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">${(spent / 1000).toFixed(0)}k</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">of ${(budget / 1000).toFixed(0)}k</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Timeline</h3>
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{daysRemaining > 0 ? daysRemaining : 0}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">days remaining</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Team</h3>
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{projectUsers.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">team members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab !== 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Project Details</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Due Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {project.dueDate
                        ? new Date(project.dueDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{project.category || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Priority</p>
                    <p className={`text-base font-semibold ${getPriorityColor(project.priority)}`}>
                      {(project.priority || 'medium').charAt(0).toUpperCase() + (project.priority || 'medium').slice(1)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Visibility</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                      {project.visibility || 'private'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Owner</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {members.find((member) => {
                        const ownerToken = normalizeIdentityToken(project.owner)
                        return getMemberIdentityTokens(member).includes(ownerToken)
                      })?.name || project.owner || 'Unknown'}
                    </p>
                  </div>
                </div>

                {Array.isArray(project.tags) && project.tags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Team Members</h2>

          {projectUsers.length > 0 ? (
            <div className="space-y-4">
              {projectUsers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                  <img
                    src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email || member.name || member.id}`}
                    alt={member.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{member.email}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded capitalize">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No team members assigned</p>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <Edit2 className="h-4 w-4" />
              Edit Project
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition font-semibold"
            >
              View All Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
