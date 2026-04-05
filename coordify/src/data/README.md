# Mock Data Structure & API Integration Guide

## Overview

Coordify uses normalized mock data in `src/data/` that is designed to be easily replaced with real API calls. The structure follows REST API patterns and uses ID references for relationships (no nested objects).

## Data Files

### 1. **users.js** - User Management
**Purpose**: Store user profiles with roles and metadata

**Structure**:
```javascript
{
  id,                 // Unique user identifier
  email,              // Email address (unique)
  name,               // Full name
  role,               // admin | manager | member | viewer
  avatar,             // Avatar URL (DiceBear)
  title,              // Job title
  department,         // Department name
  status,             // active | inactive | suspended
  joinedDate,         // ISO date string
  bio,                // User biography
  timezone,           // Timezone (e.g., UTC-5)
}
```

**Available Helpers**:
- `getUserById(userId)` - Get single user
- `getUsersByRole(role)` - Get users by role
- `getTeamMembers(excludeUserId)` - Get all team members
- `getUserByEmail(email)` - Find user by email

**Roles & Permissions**:
- `admin` - Full system access
- `manager` - Project and team management
- `member` - Team member with read/write access
- `viewer` - Read-only access

### 2. **projects.js** - Project Management
**Purpose**: Store project data with metadata and team information

**Structure**:
```javascript
{
  id,                    // Unique project identifier
  name,                  // Project name
  description,           // Short description
  slug,                  // URL-friendly name
  status,                // planning | in_progress | in_review | on_hold | completed
  priority,              // low | medium | high | critical
  category,              // Product | Design | Backend | Documentation | Analytics
  owner,                 // User ID of project owner
  memberIds,             // Array of user IDs
  startDate,             // ISO date string
  dueDate,               // ISO date string
  progress,              // 0-100 percentage
  budget,                // Budget amount in dollars
  spent,                 // Amount spent so far
  color,                 // Color identifier for UI (blue, purple, green, etc.)
  image,                 // Hero image URL
  description_long,      // Detailed description
  tags,                  // Array of tag strings
  visibility,            // private | public
  createdAt,             // ISO timestamp
  updatedAt,             // ISO timestamp
}
```

**Available Helpers**:
- `getProjectById(projectId)` - Get single project
- `getProjectsByStatus(status)` - Filter by status
- `getProjectsByOwner(ownerId)` - Get projects owned by user
- `getProjectsForUser(userId)` - Get projects for user (member or owner)
- `getActiveProjects()` - Get in_progress and planning projects
- `getProjectStats()` - Get aggregated project statistics

### 3. **tasks.js** - Task Management
**Purpose**: Store task data with relationships to projects and users

**Structure**:
```javascript
{
  id,                    // Unique task identifier
  title,                 // Task title
  description,           // Task description
  projectId,             // Foreign key to project
  assignedTo,            // User ID assigned to task
  createdBy,             // User ID who created task
  status,                // todo | in_progress | in_review | completed
  priority,              // low | medium | high | critical
  dueDate,               // ISO date string
  startDate,             // ISO date string (nullable)
  completedDate,         // ISO date string (nullable)
  tags,                  // Array of tag strings
  commentsCount,         // Number of comments
  attachmentsCount,      // Number of attachments
  subtasks,              // Array of subtask objects
  createdAt,             // ISO timestamp
  updatedAt,             // ISO timestamp
}

// Subtask structure:
{
  id,                    // Subtask ID
  title,                 // Subtask title
  completed,             // Boolean
}
```

**Available Helpers**:
- `getTaskById(taskId)` - Get single task
- `getTasksByProject(projectId)` - Get tasks for project
- `getTasksForUser(userId)` - Get tasks assigned to user
- `getTasksByStatus(status)` - Filter by status
- `getTasksByPriority(priority)` - Filter by priority
- `getOverdueTasks()` - Get tasks past due date
- `getTasksDueSoon(days)` - Get tasks due within N days
- `getTaskStats()` - Get aggregated task statistics
- `getKanbanBoard(projectId)` - Get tasks grouped by status

### 4. **notifications.js** - Notification System
**Purpose**: Store notifications for users with type and priority

**Structure**:
```javascript
{
  id,                    // Unique notification ID
  userId,                // User receiving notification
  type,                  // Notification type (see NOTIFICATION_TYPES)
  title,                 // Notification title
  message,               // Notification message
  relatedId,             // ID of related object (task, project, etc.)
  relatedType,           // Type of related object (task | project | user)
  actionUrl,             // URL to navigate to on click
  read,                  // Boolean read status
  priority,              // high | medium | low
  icon,                  // Icon identifier for UI
  avatar,                // Avatar URL of related user (nullable)
  createdAt,             // ISO timestamp
  expiresAt,             // ISO timestamp (nullable)
}
```

**Notification Types**:
- `task_assigned` - Task assigned to user
- `project_update` - Project status/progress updated
- `comment` - New comment on task/project
- `team_member_joined` - User joined project
- `task_completed` - Task marked as complete
- `deadline_reminder` - Project/task approaching deadline
- `file_uploaded` - File uploaded to task
- `status_changed` - Task status changed
- `mention` - User mentioned in comment
- `budget_alert` - Project budget threshold reached

**Available Helpers**:
- `getNotificationsForUser(userId)` - Get all notifications
- `getUnreadNotifications(userId)` - Get unread notifications
- `getUnreadCount(userId)` - Count of unread notifications
- `getNotificationsByType(userId, type)` - Filter by type
- `markNotificationAsRead(notificationId)` - Mark single as read
- `markAllNotificationsAsRead(userId)` - Mark all as read
- `deleteNotification(notificationId)` - Delete notification
- `getNotificationStats(userId)` - Aggregated statistics
- `getRecentNotifications(userId, limit)` - Get N most recent
- `createNotification(data)` - Create new notification

## Data Relationships

```
User
  ├─ Projects (owner)
  └─ Tasks (assigned)
  └─ Notifications

Project
  ├─ Owner (User)
  ├─ Members (Users)
  └─ Tasks

Task
  ├─ Project
  ├─ Assigned User
  ├─ Created By User
  └─ Subtasks

Notification
  └─ User
  └─ Related Entity (Task/Project/User)
```

## API Integration Steps

### 1. **Install API Client**
```bash
npm install axios
```

### 2. **Create API Service**
```javascript
// src/services/api.js
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

export const userAPI = {
  getAll: () => fetch(`${API_BASE}/users`),
  getById: (id) => fetch(`${API_BASE}/users/${id}`),
}

export const projectAPI = {
  getAll: () => fetch(`${API_BASE}/projects`),
  getById: (id) => fetch(`${API_BASE}/projects/${id}`),
}

export const taskAPI = {
  getAll: () => fetch(`${API_BASE}/tasks`),
  getById: (id) => fetch(`${API_BASE}/tasks/${id}`),
}

export const notificationAPI = {
  getAll: () => fetch(`${API_BASE}/notifications`),
  markRead: (id) => fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'PATCH',
  }),
}
```

### 3. **Replace Mock Data Imports**
```javascript
// OLD - Mock data
import { getProjectsForUser } from '@/data'
const projects = getProjectsForUser(userId)

// NEW - API call
import { projectAPI } from '@/services/api'
const response = await projectAPI.getByUser(userId)
const projects = response.data
```

### 4. **Use in React Components**
```javascript
import { useEffect, useState } from 'react'
import { projectAPI } from '@/services/api'

function ProjectList() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectAPI.getAll().then((data) => {
      setProjects(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <p>Loading...</p>
  return <div>{/* Render projects */}</div>
}
```

## Backend API Endpoints

**Users Service**
```
GET    /api/users                    # Get all users
GET    /api/users/:id                # Get user by ID
GET    /api/users/email/:email       # Get user by email
POST   /api/users                    # Create user
PUT    /api/users/:id                # Update user
DELETE /api/users/:id                # Delete user
```

**Projects Service**
```
GET    /api/projects                 # Get all projects
GET    /api/projects/:id             # Get project by ID
GET    /api/projects/user/:userId    # Get projects for user
POST   /api/projects                 # Create project
PUT    /api/projects/:id             # Update project
DELETE /api/projects/:id             # Delete project
GET    /api/projects/:id/stats       # Get project statistics
```

**Tasks Service**
```
GET    /api/tasks                    # Get all tasks
GET    /api/tasks/:id                # Get task by ID
GET    /api/tasks/project/:projectId # Get tasks for project
GET    /api/tasks/user/:userId       # Get tasks for user
POST   /api/tasks                    # Create task
PUT    /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Delete task
PATCH  /api/tasks/:id/status         # Update task status
GET    /api/tasks/overdue            # Get overdue tasks
```

**Notifications Service**
```
GET    /api/notifications            # Get all notifications
GET    /api/notifications/user/:id   # Get user notifications
GET    /api/notifications/unread     # Get unread count
POST   /api/notifications            # Create notification
PATCH  /api/notifications/:id/read   # Mark as read
PATCH  /api/notifications/read-all   # Mark all as read
DELETE /api/notifications/:id        # Delete notification
```

## Environment Variables

```bash
# .env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_TIMEOUT=30000
REACT_APP_USE_MOCK_DATA=false  # Set to true to use mock data instead of API
```

## Data Validation

Always validate data from API responses:

```javascript
// Example validator
const validateUser = (user) => {
  if (!user.id || !user.email || !user.name) {
    throw new Error('Invalid user data')
  }
  return user
}

const validateProject = (project) => {
  if (!project.id || !project.name || !project.owner) {
    throw new Error('Invalid project data')
  }
  return project
}
```

## Error Handling

```javascript
async function fetchProjects(userId) {
  try {
    const response = await projectAPI.getByUser(userId)
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch projects:', error)
    // Fall back to mock data or show error to user
    return []
  }
}
```

## Caching Strategy

Consider implementing caching for performance:

```javascript
// Simple cache implementation
class DataCache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map()
    this.ttl = ttl
  }

  get(key) {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data
    }
    this.cache.delete(key)
    return null
  }

  set(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }
}

export const projectCache = new DataCache()
```

## Testing with Mock Data

Keep mock data available for:
- Development
- Unit testing
- Storybook stories
- Demo/sandbox environments

```javascript
// src/hooks/useProjects.js
import { useEnvironment } from '@/hooks/useEnvironment'
import { getProjectsForUser } from '@/data'
import { projectAPI } from '@/services/api'

export const useProjects = (userId) => {
  const [projects, setProjects] = useState([])
  const { useMockData } = useEnvironment()

  useEffect(() => {
    if (useMockData) {
      setProjects(getProjectsForUser(userId))
    } else {
      projectAPI.getByUser(userId).then(setProjects)
    }
  }, [userId])

  return projects
}
```

## Summary

| Aspect | Details |
|--------|---------|
| **Files** | users.js, projects.js, tasks.js, notifications.js |
| **Pattern** | Normalized with ID references |
| **Relationships** | Foreign keys (no nested objects) |
| **Helpers** | Query functions for each data type |
| **API Ready** | Direct mapping to REST endpoints |
| **Validation** | Can be validated before API integration |
| **Caching** | Easily cacheable structure |
| **Performance** | Optimized for read operations |

---

**Version**: 1.0.0
**Last Updated**: 2024-02-15
**Status**: Ready for API Integration
