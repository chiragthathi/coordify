import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  MessageSquare,
  ArrowRight,
  Plus,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { projectService, taskService, reportService } from '../services/api'
import { Can } from '../components/Can'
import {
  MOCK_TASKS,
  MOCK_PROJECTS,
  MOCK_NOTIFICATIONS,
  getTaskStats,
  getProjectStats,
  getTasksForUser,
  getOverdueTasks,
} from '../data'

// Activity Feed Component
const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'task_assigned':
        return <Briefcase className="h-5 w-5 text-blue-500" />
      case 'project_update':
        return <TrendingUp className="h-5 w-5 text-purple-500" />
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-orange-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        activities.map((activity, idx) => (
          <div key={idx} className="flex items-start space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium text-gray-700 dark:text-gray-300">{activity.target}</span>
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

// My Tasks Component
const MyTasks = ({ tasks = [] }) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400'
      case 'todo':
        return 'text-gray-600 dark:text-gray-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-3">
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${getStatusColor(task.status)}`}>{task.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(
                      task.priority
                    )}`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="inline h-3 w-3 mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  )
}

// Enhanced StatCard Component
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

export const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { canAny } = usePermission()
  const [showNotification, setShowNotification] = useState(false)

  // Get statistics
  const projectStats = getProjectStats()
  const taskStats = getTaskStats()
  const userTasks = useMemo(() => getTasksForUser(user?.id), [user?.id])
  const overdueTasks = getOverdueTasks()

  // Async state for actions
  const generateReportAsync = useAsync(reportService.generateProjectReport)
  const generateTeamReportAsync = useAsync(reportService.generateTeamReport)

  // Handle generate report
  const handleGenerateReport = async () => {
    const result = await generateReportAsync.execute('project_001')
    if (result.success) {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  // Handle generate team report (admin only)
  const handleGenerateTeamReport = async () => {
    const result = await generateTeamReportAsync.execute()
    if (result.success) {
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }

  // Handle view all activities
  const handleViewActivities = () => {
    navigate('/notifications')
  }

  // Handle create new task
  const handleCreateTask = () => {
    navigate('/kanban')
  }

  // Handle view all tasks
  const handleViewAllTasks = () => {
    navigate('/kanban')
  }

  // Chart data - Tasks by status
  const tasksStatusData = [
    { name: 'Completed', value: taskStats.completed, fill: '#10b981' },
    { name: 'In Progress', value: taskStats.inProgress, fill: '#3b82f6' },
    { name: 'Todo', value: taskStats.todo, fill: '#f59e0b' },
  ]

  // Weekly tasks completed data
  const weeklyData = [
    { name: 'Mon', completed: 8 },
    { name: 'Tue', completed: 12 },
    { name: 'Wed', completed: 15 },
    { name: 'Thu', completed: 11 },
    { name: 'Fri', completed: 18 },
    { name: 'Sat', completed: 6 },
    { name: 'Sun', completed: 4 },
  ]

  // Recent activity (simulated from tasks)
  const recentActivity = MOCK_TASKS.filter(t => t.status === 'completed' || t.status === 'in_progress')
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 8)
    .map((task) => ({
      type: task.status === 'completed' ? 'task_completed' : 'task_assigned',
      user: 'Team member',
      action: task.status === 'completed' ? 'completed task' : 'started working on',
      target: task.title,
      timestamp: task.updatedAt,
    }))

  // My tasks (for current user)
  const myTasksDisplay = userTasks.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          ✓ Operation completed successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
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

      {/* Stats Grid */}
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
          trend
          trendValue={`${Math.round((taskStats.completed / taskStats.total) * 100)}% complete`}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by Status - Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tasks by Status
          </h3>
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
          <div className="flex justify-center gap-6 mt-4 text-sm">
            {tasksStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Tasks Completed */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Tasks Completed This Week
          </h3>
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

      {/* Content Grid - Activity Feed and My Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <button
              onClick={handleViewActivities}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition font-medium"
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <ActivityFeed activities={recentActivity} />
        </div>

        {/* My Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              My Tasks
            </h3>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
              {myTasksDisplay.length}
            </span>
          </div>
          <MyTasks tasks={myTasksDisplay} />
          <Can permission="CREATE_TASK">
            <button
              onClick={handleCreateTask}
              disabled={generateTeamReportAsync.loading}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {generateTeamReportAsync.loading ? 'Creating...' : 'New Task'}
            </button>
          </Can>
          {generateTeamReportAsync.error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{generateTeamReportAsync.error}</p>
          )}
        </div>
      </div>

      {/* Admin Section - Team Reports */}
      <Can permission="VIEW_REPORTS">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Reports & Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Generate detailed reports on projects and team performance
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={generateReportAsync.loading}
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
          {(generateReportAsync.error || generateTeamReportAsync.error) && (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">
              {generateReportAsync.error || generateTeamReportAsync.error}
            </div>
          )}
        </div>
      </Can>
    </div>
  )
}
