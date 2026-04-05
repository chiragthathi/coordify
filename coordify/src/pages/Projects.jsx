import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, FolderOpen, Search, Filter, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { projectService } from '../services/api'
import { Can } from '../components/Can'
import { CreateProjectModal } from '../components/CreateProjectModal'
import { useDebounce } from '../shared/hooks/useDebounce'
import { useProjects } from '../features/projects/hooks/useProjects'
import { AiConfirmDialog, AiMessageToast } from '../components/AiFeedback'

// ProjectCard Component
const ProjectCardComponent = ({ project, onClick, onDelete, isDeletingId, canDelete }) => {
  const toNumber = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const normalizePercent = (value) => {
    const parsed = toNumber(value)
    if (parsed === null) return null
    return Math.max(0, Math.min(100, Math.round(parsed)))
  }

  const memberCount = Array.from(new Set([
    ...(Array.isArray(project.memberIds) ? project.memberIds : []),
    ...(Array.isArray(project.memberEmails) ? project.memberEmails : []),
    ...(Array.isArray(project.members) ? project.members.map((member) => member?.id || member?.email).filter(Boolean) : []),
  ])).length

  const budgetValue = toNumber(project.budget)
  const spentValue = toNumber(project.spent)
  const budget = budgetValue !== null && budgetValue > 0 ? budgetValue : 1
  const spent = spentValue !== null && spentValue >= 0 ? spentValue : 0

  const progressFromFields = [
    project.progress,
    project.progressPercent,
    project.completion,
    project.completionPercentage,
    project.completionRate,
    project?.stats?.progress,
    project?.metrics?.progress,
  ]
    .map(normalizePercent)
    .find((value) => value !== null)

  const progressFromBudget = budget > 0 ? normalizePercent((spent / budget) * 100) : null
  const progress = progressFromFields ?? progressFromBudget ?? 0

  const dueDate = project.dueDate ? new Date(project.dueDate) : null
  const statusLabel = (project.status || 'planning').replace('_', ' ')

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
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
    }
  }

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 p-6 cursor-pointer transition-all hover:shadow-lg dark:hover:shadow-2xl"
    >
      {/* Header with image background */}
      <div
        className="h-32 rounded-lg mb-4 bg-cover bg-center relative overflow-hidden group-hover:scale-105 transition-transform"
        style={{
          backgroundImage: project.image
            ? `url('${project.image}')`
            : 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
            {statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Title and Priority */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {project.description}
            </p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${getPriorityColor(project.priority)}`}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Budget Info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Budget: ${(spent / 1000).toFixed(0)}k / ${(budget / 1000).toFixed(0)}k
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {Math.round((spent / budget) * 100)}%
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-200 dark:bg-gray-700" />

        {/* Footer - Team and Dates */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {memberCount > 0 ? `${memberCount} member${memberCount === 1 ? '' : 's'}` : 'No team members'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {dueDate ? `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}
            </span>
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(project)
                }}
                disabled={isDeletingId === project.id}
                className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition disabled:opacity-50"
                title="Delete project"
              >
                {isDeletingId === project.id ? (
                  <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ProjectCard = React.memo(ProjectCardComponent)

export const Projects = () => {
  const { user } = useAuth()
  const { can } = usePermission()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [localProjects, setLocalProjects] = useState([])
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects,
  } = useProjects({
    page: 1,
    limit: 200,
    filters: {},
    queryScope: { userId: user?.id || 'anonymous', role: user?.role || 'guest' },
  })

  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    setSearchTerm(urlSearch)
  }, [searchParams])

  // Async operations
  const createProjectAsync = useAsync(projectService.create)
  const deleteProjectAsync = useAsync(projectService.delete)

  const backendProjects = useMemo(() => {
    if (Array.isArray(projectsData)) {
      return projectsData
    }

    if (Array.isArray(projectsData?.items)) {
      return projectsData.items
    }

    if (Array.isArray(projectsData?.projects)) {
      return projectsData.projects
    }

    return []
  }, [projectsData])

  useEffect(() => {
    setLocalProjects(backendProjects)
  }, [backendProjects])

  const allProjects = localProjects

  // Check if user can delete projects
  const canDeleteProject = can('DELETE_PROJECT')

  // Filter projects
  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [allProjects, debouncedSearchTerm, statusFilter])

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}`)
  }

  const handleCreateProject = async (formData) => {
    // Check permission first
    if (!can('CREATE_PROJECT')) {
      setNotification({
        type: 'error',
        message: 'You do not have permission to create projects',
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    const result = await createProjectAsync.execute(formData)
    if (result.success) {
      if (result?.data?.id) {
        setLocalProjects((prev) => {
          const exists = prev.some((project) => project.id === result.data.id)
          if (exists) return prev
          return [result.data, ...prev]
        })
      }
      await refetchProjects()
      setIsCreateModalOpen(false)
      setNotification({
        type: 'success',
        message: `Project "${formData.name}" created successfully!`,
      })
      // Reset form
      createProjectAsync.reset()
      // Close notification after 3 seconds
      setTimeout(() => setNotification(null), 3000)
      return { success: true }
    }

    return { success: false, message: result?.message || 'Failed to create project' }
  }

  const handleDeleteProject = async (project) => {
    // Check permission first
    if (!can('DELETE_PROJECT')) {
      setNotification({
        type: 'error',
        message: 'You do not have permission to delete projects',
      })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setDeleteCandidate(project)
  }

  const confirmDeleteProject = async () => {
    if (!deleteCandidate?.id) return

    setDeletingId(deleteCandidate.id)
    const result = await deleteProjectAsync.execute(deleteCandidate.id)
    setDeletingId(null)

    if (result.success) {
      setLocalProjects((prev) => prev.filter((project) => project.id !== deleteCandidate.id))
      await refetchProjects()
      setNotification({
        type: 'success',
        message: 'Project deleted successfully',
      })
      setDeleteCandidate(null)
      deleteProjectAsync.reset()
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setNotification({
      type: 'error',
      message: result?.message || 'Failed to delete project',
    })
    setTimeout(() => setNotification(null), 3000)
  }

  const statuses = [
    { value: 'all', label: 'All Projects' },
    { value: 'planning', label: 'Planning' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'in_review', label: 'In Review' },
    { value: 'completed', label: 'Completed' },
    { value: 'on_hold', label: 'On Hold' },
  ]

  return (
    <div className="space-y-8">
      <AiMessageToast
        isOpen={Boolean(notification)}
        tone={notification?.type === 'success' ? 'success' : 'error'}
        message={notification?.message}
        onClose={() => setNotification(null)}
      />

      <AiConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Delete project"
        message={deleteCandidate ? `Delete \"${deleteCandidate.name}\" permanently? This action cannot be undone.` : ''}
        confirmText="Delete"
        onCancel={() => setDeleteCandidate(null)}
        onConfirm={confirmDeleteProject}
        busy={Boolean(deleteCandidate && deletingId === deleteCandidate.id)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Projects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Can permission="CREATE_PROJECT">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            disabled={createProjectAsync.loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            <span>{createProjectAsync.loading ? 'Creating...' : 'New Project'}</span>
          </button>
        </Can>
        {createProjectAsync.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{createProjectAsync.error}</p>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Projects Grid */}
      {projectsLoading && (
        <div className="text-center py-10 text-gray-600 dark:text-gray-400">Loading projects...</div>
      )}

      {!projectsLoading && projectsError && (
        <div className="text-center py-10 text-red-600 dark:text-red-400">
          Failed to load projects. Please refresh.
        </div>
      )}

      {!projectsLoading && !projectsError && filteredProjects.length > 0 ? (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Showing {filteredProjects.length} of {allProjects.length} projects
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
                onDelete={handleDeleteProject}
                isDeletingId={deletingId}
                canDelete={canDeleteProject}
              />
            ))}
          </div>
        </div>
      ) : (!projectsLoading && !projectsError && (
        <div className="text-center py-16">
          <FolderOpen className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No projects found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first project to get started'}
          </p>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      ))}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
