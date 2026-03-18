/**
 * Mock Tasks Data
 * Normalized structure ready for API integration
 */

export const MOCK_TASKS = [
  {
    id: 'task_001',
    title: 'Design login page mockups',
    description: 'Create high-fidelity mockups for the new login page design',
    projectId: 'proj_001',
    assignedTo: 'user_des_001',
    createdBy: 'user_manager_001',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-02-10',
    startDate: '2024-02-01',
    completedDate: '2024-02-09',
    tags: ['design', 'ui'],
    commentsCount: 3,
    attachmentsCount: 2,
    subtasks: [
      { id: 'sub_001', title: 'Desktop version', completed: true },
      { id: 'sub_002', title: 'Mobile version', completed: true },
      { id: 'sub_003', title: 'Dark mode variant', completed: true },
    ],
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-09T15:30:00Z',
  },
  {
    id: 'task_002',
    title: 'Implement authentication API',
    description:
      'Build JWT-based authentication endpoints for login and signup',
    projectId: 'proj_001',
    assignedTo: 'user_dev_003',
    createdBy: 'user_manager_001',
    status: 'in_progress',
    priority: 'critical',
    dueDate: '2024-03-01',
    startDate: '2024-02-05',
    completedDate: null,
    tags: ['backend', 'api', 'security'],
    commentsCount: 5,
    attachmentsCount: 1,
    subtasks: [
      { id: 'sub_004', title: 'Login endpoint', completed: true },
      { id: 'sub_005', title: 'Signup endpoint', completed: true },
      { id: 'sub_006', title: 'Token refresh logic', completed: false },
      { id: 'sub_007', title: 'Password reset flow', completed: false },
    ],
    createdAt: '2024-02-05T08:00:00Z',
    updatedAt: '2024-02-15T14:22:00Z',
  },
  {
    id: 'task_003',
    title: 'Setup database schema',
    description: 'Design and implement PostgreSQL schema for projects and tasks',
    projectId: 'proj_001',
    assignedTo: 'user_dev_001',
    createdBy: 'user_manager_001',
    status: 'in_progress',
    priority: 'critical',
    dueDate: '2024-02-25',
    startDate: '2024-02-10',
    completedDate: null,
    tags: ['backend', 'database'],
    commentsCount: 2,
    attachmentsCount: 0,
    subtasks: [
      { id: 'sub_008', title: 'Users table', completed: true },
      { id: 'sub_009', title: 'Projects table', completed: true },
      { id: 'sub_010', title: 'Tasks table', completed: false },
      { id: 'sub_011', title: 'Relationships & indexes', completed: false },
    ],
    createdAt: '2024-02-10T09:30:00Z',
    updatedAt: '2024-02-14T16:45:00Z',
  },
  {
    id: 'task_004',
    title: 'iOS app UI refactor',
    description: 'Refactor iOS components to match new design system',
    projectId: 'proj_002',
    assignedTo: 'user_dev_002',
    createdBy: 'user_des_001',
    status: 'in_progress',
    priority: 'medium',
    dueDate: '2024-04-15',
    startDate: '2024-02-08',
    completedDate: null,
    tags: ['mobile', 'ios', 'ui'],
    commentsCount: 8,
    attachmentsCount: 5,
    subtasks: [
      { id: 'sub_012', title: 'Button components', completed: true },
      { id: 'sub_013', title: 'Form controls', completed: false },
      { id: 'sub_014', title: 'Navigation', completed: false },
    ],
    createdAt: '2024-02-08T11:00:00Z',
    updatedAt: '2024-02-15T10:15:00Z',
  },
  {
    id: 'task_005',
    title: 'Create design system documentation',
    description: 'Document all design components and usage guidelines',
    projectId: 'proj_002',
    assignedTo: 'user_des_001',
    createdBy: 'user_manager_001',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-05-01',
    startDate: null,
    completedDate: null,
    tags: ['design', 'documentation'],
    commentsCount: 0,
    attachmentsCount: 0,
    subtasks: [],
    createdAt: '2024-02-12T13:20:00Z',
    updatedAt: '2024-02-12T13:20:00Z',
  },
  {
    id: 'task_006',
    title: 'Implement rate limiting',
    description: 'Add rate limiting to API endpoints for security',
    projectId: 'proj_003',
    assignedTo: 'user_dev_003',
    createdBy: 'user_manager_001',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-03-15',
    startDate: '2024-02-10',
    completedDate: null,
    tags: ['backend', 'security', 'infrastructure'],
    commentsCount: 4,
    attachmentsCount: 1,
    subtasks: [
      { id: 'sub_015', title: 'Redis integration', completed: true },
      { id: 'sub_016', title: 'Rate limit logic', completed: false },
      { id: 'sub_017', title: 'Tests', completed: false },
    ],
    createdAt: '2024-02-10T14:00:00Z',
    updatedAt: '2024-02-14T09:30:00Z',
  },
  {
    id: 'task_007',
    title: 'Setup monitoring and logging',
    description: 'Implement ELK stack for application monitoring',
    projectId: 'proj_003',
    assignedTo: 'user_dev_001',
    createdBy: 'user_manager_001',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-04-20',
    startDate: null,
    completedDate: null,
    tags: ['infrastructure', 'monitoring'],
    commentsCount: 1,
    attachmentsCount: 0,
    subtasks: [],
    createdAt: '2024-02-11T10:00:00Z',
    updatedAt: '2024-02-15T08:00:00Z',
  },
  {
    id: 'task_008',
    title: 'Create getting started guide',
    description: 'Write comprehensive getting started documentation',
    projectId: 'proj_004',
    assignedTo: 'user_dev_001',
    createdBy: 'user_manager_001',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-05-30',
    startDate: null,
    completedDate: null,
    tags: ['documentation', 'guide'],
    commentsCount: 0,
    attachmentsCount: 0,
    subtasks: [],
    createdAt: '2024-02-13T09:15:00Z',
    updatedAt: '2024-02-13T09:15:00Z',
  },
  {
    id: 'task_009',
    title: 'Build dashboard widgets',
    description: 'Create reusable dashboard widgets for analytics',
    projectId: 'proj_005',
    assignedTo: 'user_dev_001',
    createdBy: 'user_manager_001',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-02-01',
    startDate: '2024-01-20',
    completedDate: '2024-02-01',
    tags: ['frontend', 'analytics'],
    commentsCount: 6,
    attachmentsCount: 3,
    subtasks: [
      { id: 'sub_018', title: 'Chart widgets', completed: true },
      { id: 'sub_019', title: 'Data table widget', completed: true },
      { id: 'sub_020', title: 'KPI cards', completed: true },
    ],
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-02-01T16:00:00Z',
  },
  {
    id: 'task_010',
    title: 'User acceptance testing',
    description: 'Conduct UAT for dashboard features',
    projectId: 'proj_005',
    assignedTo: 'user_manager_001',
    createdBy: 'user_manager_001',
    status: 'completed',
    priority: 'high',
    dueDate: '2024-02-08',
    startDate: '2024-02-05',
    completedDate: '2024-02-08',
    tags: ['testing', 'qa'],
    commentsCount: 3,
    attachmentsCount: 2,
    subtasks: [
      { id: 'sub_021', title: 'Functional testing', completed: true },
      { id: 'sub_022', title: 'Performance testing', completed: true },
      { id: 'sub_023', title: 'Bug fixes', completed: true },
    ],
    createdAt: '2024-02-05T08:00:00Z',
    updatedAt: '2024-02-08T14:30:00Z',
  },
]

// Helper to get task by ID
export const getTaskById = (taskId) => {
  return MOCK_TASKS.find((task) => task.id === taskId)
}

// Helper to get tasks by project
export const getTasksByProject = (projectId) => {
  return MOCK_TASKS.filter((task) => task.projectId === projectId)
}

// Helper to get tasks assigned to user
export const getTasksForUser = (userId) => {
  return MOCK_TASKS.filter((task) => task.assignedTo === userId)
}

// Helper to get tasks by status
export const getTasksByStatus = (status) => {
  return MOCK_TASKS.filter((task) => task.status === status)
}

// Helper to get tasks by priority
export const getTasksByPriority = (priority) => {
  return MOCK_TASKS.filter((task) => task.priority === priority)
}

// Helper to get overdue tasks
export const getOverdueTasks = () => {
  const today = new Date().toISOString().split('T')[0]
  return MOCK_TASKS.filter(
    (task) => task.dueDate < today && task.status !== 'completed'
  )
}

// Helper to get tasks due soon (next 7 days)
export const getTasksDueSoon = (days = 7) => {
  const today = new Date()
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)
  const todayStr = today.toISOString().split('T')[0]
  const futureDateStr = futureDate.toISOString().split('T')[0]

  return MOCK_TASKS.filter(
    (task) =>
      task.dueDate >= todayStr &&
      task.dueDate <= futureDateStr &&
      task.status !== 'completed'
  )
}

// Helper to get task statistics
export const getTaskStats = () => {
  const total = MOCK_TASKS.length
  const completed = MOCK_TASKS.filter((t) => t.status === 'completed').length
  const inProgress = MOCK_TASKS.filter((t) => t.status === 'in_progress')
    .length
  const todo = MOCK_TASKS.filter((t) => t.status === 'todo').length
  const overdue = getOverdueTasks().length

  const byPriority = {
    critical: MOCK_TASKS.filter((t) => t.priority === 'critical').length,
    high: MOCK_TASKS.filter((t) => t.priority === 'high').length,
    medium: MOCK_TASKS.filter((t) => t.priority === 'medium').length,
    low: MOCK_TASKS.filter((t) => t.priority === 'low').length,
  }

  return {
    total,
    completed,
    inProgress,
    todo,
    overdue,
    byPriority,
  }
}

// Helper to get kanban board data (grouped by status)
export const getKanbanBoard = (projectId = null) => {
  let tasks = projectId
    ? MOCK_TASKS.filter((task) => task.projectId === projectId)
    : MOCK_TASKS

  return {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    in_review: tasks.filter((t) => t.status === 'in_review'),
    completed: tasks.filter((t) => t.status === 'completed'),
  }
}
