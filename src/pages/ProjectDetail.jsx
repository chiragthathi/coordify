import React, { useMemo, useState } from 'react'
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
  CheckCircle2,
  LayoutGrid,
  List,
  History,
  Settings,
} from 'lucide-react'
import { getProjectById, getTasksByProject, MOCK_USERS } from '../data'
import { Tabs } from '../components/Tabs'
import { DraggableKanbanBoard } from '../components/DraggableKanbanBoard'
import { TaskListView } from '../components/TaskListView'
import { ActivityLog } from '../components/ActivityLog'
import { ProjectSettings } from '../components/ProjectSettings'

export const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('kanban')

  const project = useMemo(() => getProjectById(projectId), [projectId])
  const tasks = useMemo(() => getTasksByProject(projectId), [projectId])
  const projectUsers = useMemo(
    () => MOCK_USERS.filter(u => project?.memberIds.includes(u.id)),
    [project]
  )

  if (!project) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Project not found
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The project you're looking for doesn't exist.
        </p>
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

  const getTaskStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const todo = tasks.filter(t => t.status === 'todo').length

    return { completed, inProgress, todo, total: tasks.length }
  }

  const taskStats = getTaskStats()
  const daysRemaining = Math.ceil(
    (new Date(project.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Tab definitions
  const tabs = [
    {
      id: 'kanban',
      label: 'Kanban Board',
      icon: LayoutGrid,
      content: <DraggableKanbanBoard tasks={tasks} users={projectUsers} />,
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
      content: <ProjectSettings project={project} />,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.name}
            </h1>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ').charAt(0).toUpperCase() +
                project.status.replace('_', ' ').slice(1)}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
        </div>
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <MoreVertical className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Hero Image */}
      <div
        className="h-64 rounded-lg bg-cover bg-center relative overflow-hidden"
        style={{
          backgroundImage: `url('${project.image}')`,
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Progress</h3>
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {project.progress}%
          </p>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Budget */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Budget</h3>
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ${(project.spent / 1000).toFixed(0)}k
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            of ${(project.budget / 1000).toFixed(0)}k
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Timeline</h3>
            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {daysRemaining > 0 ? daysRemaining : 0}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            days remaining
          </p>
        </div>

        {/* Team */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Team</h3>
            <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {projectUsers.length}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">team members</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs and Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs Component */}
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Project Details (visible when not on settings tab) */}
          {activeTab !== 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Project Details
              </h2>

              <div className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(project.startDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Due Date</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(project.dueDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Category</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {project.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Priority</p>
                    <p className={`text-base font-semibold ${getPriorityColor(project.priority)}`}>
                      {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
                    </p>
                  </div>
                </div>

                {/* Visibility and Owner */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Visibility</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white capitalize">
                      {project.visibility}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Owner</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {MOCK_USERS.find(u => u.id === project.owner)?.name || 'Unknown'}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {project.tags && project.tags.length > 0 && (
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

        {/* Right Column - Team */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Team Members</h2>

          {projectUsers.length > 0 ? (
            <div className="space-y-4">
              {projectUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {user.title}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded capitalize">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No team members assigned</p>
          )}

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Project
            </button>
            <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition font-semibold">
              View All Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
