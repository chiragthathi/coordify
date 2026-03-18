/**
 * Mock Users Data
 * Normalized structure ready for API integration
 */

export const MOCK_USERS = [
  {
    id: 'user_admin_001',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin@example.com',
    title: 'System Administrator',
    department: 'Management',
    status: 'active',
    joinedDate: '2024-01-15',
    bio: 'System admin ensuring smooth operations',
    timezone: 'UTC-5',
  },
  {
    id: 'user_manager_001',
    email: 'manager@example.com',
    name: 'Manager User',
    role: 'manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager@example.com',
    title: 'Project Manager',
    department: 'Project Management',
    status: 'active',
    joinedDate: '2024-01-15',
    bio: 'Managing multiple projects and teams',
    timezone: 'UTC-5',
  },
  {
    id: 'user_mem_001',
    email: 'member@example.com',
    name: 'Member User',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member@example.com',
    title: 'Team Member',
    department: 'Development',
    status: 'active',
    joinedDate: '2024-02-01',
    bio: 'Building great products with the team',
    timezone: 'UTC-5',
  },
  {
    id: 'user_view_001',
    email: 'viewer@example.com',
    name: 'Viewer User',
    role: 'viewer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=viewer@example.com',
    title: 'Stakeholder',
    department: 'Business',
    status: 'active',
    joinedDate: '2024-02-10',
    bio: 'Monitoring project progress',
    timezone: 'UTC-5',
  },
  {
    id: 'user_dev_001',
    email: 'sarah.chen@example.com',
    name: 'Sarah Chen',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah.chen@example.com',
    title: 'Senior Developer',
    department: 'Development',
    status: 'active',
    joinedDate: '2024-01-20',
    bio: 'Full-stack developer with 5 years experience',
    timezone: 'UTC-5',
  },
  {
    id: 'user_dev_002',
    email: 'james.rodriguez@example.com',
    name: 'James Rodriguez',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james.rodriguez@example.com',
    title: 'Frontend Developer',
    department: 'Development',
    status: 'active',
    joinedDate: '2024-02-05',
    bio: 'React specialist focusing on UX',
    timezone: 'UTC-5',
  },
  {
    id: 'user_dev_003',
    email: 'emily.watson@example.com',
    name: 'Emily Watson',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily.watson@example.com',
    title: 'Backend Developer',
    department: 'Development',
    status: 'active',
    joinedDate: '2024-02-08',
    bio: 'Node.js and database expert',
    timezone: 'UTC-5',
  },
  {
    id: 'user_des_001',
    email: 'alex.kim@example.com',
    name: 'Alex Kim',
    role: 'member',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex.kim@example.com',
    title: 'UI/UX Designer',
    department: 'Design',
    status: 'active',
    joinedDate: '2024-01-25',
    bio: 'Creating beautiful and intuitive interfaces',
    timezone: 'UTC-5',
  },
]

// Helper to get user by ID
export const getUserById = (userId) => {
  return MOCK_USERS.find((user) => user.id === userId)
}

// Helper to get users by role
export const getUsersByRole = (role) => {
  return MOCK_USERS.filter((user) => user.role === role)
}

// Helper to get team members (excluding current user)
export const getTeamMembers = (excludeUserId = null) => {
  return MOCK_USERS.filter((user) => user.id !== excludeUserId)
}

// Helper to get user by email
export const getUserByEmail = (email) => {
  return MOCK_USERS.find((user) => user.email === email)
}
