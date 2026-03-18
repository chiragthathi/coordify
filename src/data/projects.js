/**
 * Mock Projects Data
 * Normalized structure ready for API integration
 */

export const MOCK_PROJECTS = [
  {
    id: 'proj_001',
    name: 'ProjectHub Platform',
    description: 'Enterprise-grade project management tool with real-time collaboration',
    slug: 'projecthub-platform',
    status: 'in_progress',
    priority: 'high',
    category: 'Product',
    owner: 'user_manager_001',
    memberIds: [
      'user_manager_001',
      'user_dev_001',
      'user_dev_002',
      'user_des_001',
    ],
    startDate: '2024-01-15',
    dueDate: '2024-06-30',
    progress: 65,
    budget: 150000,
    spent: 97500,
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop',
    description_long:
      'A comprehensive project management platform designed for enterprise teams. Features include real-time collaboration, task tracking, project analytics, and team communication tools.',
    tags: ['saas', 'product', 'enterprise'],
    visibility: 'private',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-15T14:22:00Z',
  },
  {
    id: 'proj_002',
    name: 'Mobile App Redesign',
    description: 'Complete redesign of the iOS and Android applications',
    slug: 'mobile-app-redesign',
    status: 'in_progress',
    priority: 'high',
    category: 'Design',
    owner: 'user_des_001',
    memberIds: ['user_des_001', 'user_dev_002', 'user_dev_003'],
    startDate: '2024-02-01',
    dueDate: '2024-05-15',
    progress: 45,
    budget: 80000,
    spent: 36000,
    color: 'purple',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    description_long:
      'Complete redesign of the mobile applications to improve user experience and performance. Includes new UI/UX components and navigation flows.',
    tags: ['mobile', 'design', 'ux'],
    visibility: 'private',
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-02-14T11:45:00Z',
  },
  {
    id: 'proj_003',
    name: 'API Gateway Implementation',
    description: 'Build scalable API gateway for microservices architecture',
    slug: 'api-gateway-implementation',
    status: 'in_progress',
    priority: 'critical',
    category: 'Backend',
    owner: 'user_dev_003',
    memberIds: ['user_dev_001', 'user_dev_003'],
    startDate: '2024-01-20',
    dueDate: '2024-04-30',
    progress: 55,
    budget: 120000,
    spent: 66000,
    color: 'green',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f70504c11?w=500&h=300&fit=crop',
    description_long:
      'Implementation of a centralized API gateway to manage all microservices. Features include rate limiting, authentication, and request routing.',
    tags: ['backend', 'infrastructure', 'api'],
    visibility: 'private',
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-02-15T16:30:00Z',
  },
  {
    id: 'proj_004',
    name: 'Documentation Portal',
    description: 'Comprehensive documentation website for developers',
    slug: 'documentation-portal',
    status: 'planning',
    priority: 'medium',
    category: 'Documentation',
    owner: 'user_manager_001',
    memberIds: ['user_manager_001', 'user_dev_001'],
    startDate: '2024-03-01',
    dueDate: '2024-06-15',
    progress: 15,
    budget: 40000,
    spent: 6000,
    color: 'orange',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop',
    description_long:
      'Create a comprehensive documentation portal with API references, tutorials, and guides for developers integrating with our platform.',
    tags: ['documentation', 'developer', 'support'],
    visibility: 'public',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-02-10T12:00:00Z',
  },
  {
    id: 'proj_005',
    name: 'Analytics Dashboard',
    description: 'Advanced analytics and reporting dashboard',
    slug: 'analytics-dashboard',
    status: 'completed',
    priority: 'medium',
    category: 'Analytics',
    owner: 'user_dev_001',
    memberIds: ['user_dev_001', 'user_dev_002'],
    startDate: '2023-12-15',
    dueDate: '2024-02-10',
    progress: 100,
    budget: 65000,
    spent: 65000,
    color: 'cyan',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop',
    description_long:
      'Comprehensive analytics dashboard providing real-time insights into project metrics, team productivity, and resource allocation.',
    tags: ['analytics', 'reporting', 'dashboard'],
    visibility: 'private',
    createdAt: '2023-12-15T14:30:00Z',
    updatedAt: '2024-02-10T17:00:00Z',
  },
]

// Helper to get project by ID
export const getProjectById = (projectId) => {
  return MOCK_PROJECTS.find((project) => project.id === projectId)
}

// Helper to get projects by status
export const getProjectsByStatus = (status) => {
  return MOCK_PROJECTS.filter((project) => project.status === status)
}

// Helper to get projects by owner
export const getProjectsByOwner = (ownerId) => {
  return MOCK_PROJECTS.filter((project) => project.owner === ownerId)
}

// Helper to get projects for a user (member or owner)
export const getProjectsForUser = (userId) => {
  return MOCK_PROJECTS.filter(
    (project) =>
      project.owner === userId || project.memberIds.includes(userId)
  )
}

// Helper to get active projects
export const getActiveProjects = () => {
  return MOCK_PROJECTS.filter(
    (project) => project.status === 'in_progress' || project.status === 'planning'
  )
}

// Helper to get project statistics
export const getProjectStats = () => {
  const total = MOCK_PROJECTS.length
  const completed = MOCK_PROJECTS.filter(
    (p) => p.status === 'completed'
  ).length
  const inProgress = MOCK_PROJECTS.filter(
    (p) => p.status === 'in_progress'
  ).length
  const planning = MOCK_PROJECTS.filter((p) => p.status === 'planning').length
  const onHold = MOCK_PROJECTS.filter((p) => p.status === 'on_hold').length

  const totalBudget = MOCK_PROJECTS.reduce((sum, p) => sum + p.budget, 0)
  const totalSpent = MOCK_PROJECTS.reduce((sum, p) => sum + p.spent, 0)
  const avgProgress =
    Math.round(
      MOCK_PROJECTS.reduce((sum, p) => sum + p.progress, 0) /
        MOCK_PROJECTS.length
    ) || 0

  return {
    total,
    completed,
    inProgress,
    planning,
    onHold,
    totalBudget,
    totalSpent,
    avgProgress,
  }
}
