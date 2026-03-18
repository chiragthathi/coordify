import React, { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MOCK_TASKS, MOCK_USERS, MOCK_PROJECTS, getTaskStats } from '../data'
import { DraggableKanbanBoard } from '../components/DraggableKanbanBoard'
import { Filter, Download } from 'lucide-react'

export const KanbanPage = () => {
  const { user } = useAuth()
  const [selectedProject, setSelectedProject] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')

  // Get tasks for display
  const displayTasks = useMemo(() => {
    let tasks = MOCK_TASKS

    // Filter by project
    if (selectedProject !== 'all') {
      tasks = tasks.filter(t => t.projectId === selectedProject)
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      tasks = tasks.filter(t => t.priority === filterPriority)
    }

    return tasks
  }, [selectedProject, filterPriority])

  const stats = useMemo(() => {
    const taskStats = {
      todo: displayTasks.filter(t => t.status === 'todo').length,
      inProgress: displayTasks.filter(t => t.status === 'in_progress').length,
      inReview: displayTasks.filter(t => t.status === 'in_review').length,
      completed: displayTasks.filter(t => t.status === 'completed').length,
    }
    return taskStats
  }, [displayTasks])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kanban Board</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Drag and drop tasks to organize your work
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Stats Cards */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Project Filter */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Projects</option>
          {MOCK_PROJECTS.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        {/* Priority Filter */}
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

        {/* Reset Button */}
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

      {/* Kanban Board */}
      <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-6 overflow-hidden">
        {displayTasks.length > 0 ? (
          <DraggableKanbanBoard tasks={displayTasks} users={MOCK_USERS} />
        ) : (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              No tasks found with the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
