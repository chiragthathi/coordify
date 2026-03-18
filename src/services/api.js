/**
 * API Service Layer
 * Mock implementations that can be easily swapped for real API calls
 * This provides the interface for all async operations
 */

// Simulated network delay (ms)
const NETWORK_DELAY = 300

/**
 * Utility: Simulate async API call
 */
const apiCall = (fn, delay = NETWORK_DELAY) =>
  new Promise((resolve) => setTimeout(() => resolve(fn()), delay))

/**
 * Project Service
 */
export const projectService = {
  /**
   * Create a new project
   */
  create: async (projectData) => {
    return apiCall(() => {
      const newProject = {
        id: `proj_${Date.now()}`,
        createdAt: new Date().toISOString(),
        progress: 0,
        status: 'planning',
        ...projectData,
      }
      console.log('✓ Project created:', newProject)
      return { success: true, data: newProject }
    })
  },

  /**
   * Update an existing project
   */
  update: async (projectId, updates) => {
    return apiCall(() => {
      console.log(`✓ Project ${projectId} updated:`, updates)
      return { success: true, data: { id: projectId, ...updates } }
    })
  },

  /**
   * Delete a project
   */
  delete: async (projectId) => {
    return apiCall(() => {
      console.log(`✓ Project ${projectId} deleted`)
      return { success: true, message: 'Project deleted successfully' }
    })
  },

  /**
   * Get project details
   */
  getById: async (projectId) => {
    return apiCall(() => {
      console.log(`✓ Fetching project ${projectId}`)
      return { success: true, data: { id: projectId } }
    })
  },

  /**
   * Add member to project
   */
  addMember: async (projectId, memberId) => {
    return apiCall(() => {
      console.log(`✓ Member ${memberId} added to project ${projectId}`)
      return { success: true }
    })
  },

  /**
   * Remove member from project
   */
  removeMember: async (projectId, memberId) => {
    return apiCall(() => {
      console.log(`✓ Member ${memberId} removed from project ${projectId}`)
      return { success: true }
    })
  },
}

/**
 * Task Service
 */
export const taskService = {
  /**
   * Create a new task
   */
  create: async (taskData) => {
    return apiCall(() => {
      const newTask = {
        id: `task_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'todo',
        priority: 'medium',
        ...taskData,
      }
      console.log('✓ Task created:', newTask)
      return { success: true, data: newTask }
    })
  },

  /**
   * Update a task
   */
  update: async (taskId, updates) => {
    return apiCall(() => {
      console.log(`✓ Task ${taskId} updated:`, updates)
      return { success: true, data: { id: taskId, ...updates } }
    })
  },

  /**
   * Delete a task
   */
  delete: async (taskId) => {
    return apiCall(() => {
      console.log(`✓ Task ${taskId} deleted`)
      return { success: true }
    })
  },

  /**
   * Assign task to user
   */
  assign: async (taskId, userId) => {
    return apiCall(() => {
      console.log(`✓ Task ${taskId} assigned to user ${userId}`)
      return { success: true }
    })
  },

  /**
   * Update task status (for kanban board)
   */
  updateStatus: async (taskId, status) => {
    return apiCall(() => {
      console.log(`✓ Task ${taskId} status updated to ${status}`)
      return { success: true, data: { id: taskId, status } }
    })
  },
}

/**
 * Team Service
 */
export const teamService = {
  /**
   * Invite user to team
   */
  inviteMember: async (email, role = 'member') => {
    return apiCall(() => {
      if (!email.includes('@')) {
        throw new Error('Invalid email address')
      }
      console.log(`✓ Invitation sent to ${email} as ${role}`)
      return {
        success: true,
        message: `Invitation sent to ${email}`,
      }
    })
  },

  /**
   * Remove member from team
   */
  removeMember: async (userId) => {
    return apiCall(() => {
      console.log(`✓ Member ${userId} removed from team`)
      return { success: true }
    })
  },

  /**
   * Update member role
   */
  updateRole: async (userId, newRole) => {
    return apiCall(() => {
      console.log(`✓ User ${userId} role updated to ${newRole}`)
      return { success: true }
    })
  },

  /**
   * Get all team members
   */
  getMembers: async () => {
    return apiCall(() => {
      console.log('✓ Fetching team members')
      return { success: true, data: [] }
    })
  },
}

/**
 * Notification Service
 */
export const notificationService = {
  /**
   * Mark notification as read
   */
  markAsRead: async (notificationId) => {
    return apiCall(() => {
      console.log(`✓ Notification ${notificationId} marked as read`)
      return { success: true }
    })
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    return apiCall(() => {
      console.log('✓ All notifications marked as read')
      return { success: true }
    })
  },

  /**
   * Delete notification
   */
  delete: async (notificationId) => {
    return apiCall(() => {
      console.log(`✓ Notification ${notificationId} deleted`)
      return { success: true }
    })
  },
}

/**
 * Comment Service
 */
export const commentService = {
  /**
   * Create a comment
   */
  create: async (taskId, content) => {
    return apiCall(() => {
      const newComment = {
        id: `comment_${Date.now()}`,
        taskId,
        content,
        createdAt: new Date().toISOString(),
      }
      console.log('✓ Comment created:', newComment)
      return { success: true, data: newComment }
    })
  },

  /**
   * Delete a comment
   */
  delete: async (commentId) => {
    return apiCall(() => {
      console.log(`✓ Comment ${commentId} deleted`)
      return { success: true }
    })
  },

  /**
   * Update a comment
   */
  update: async (commentId, content) => {
    return apiCall(() => {
      console.log(`✓ Comment ${commentId} updated`)
      return { success: true }
    })
  },
}

/**
 * Settings Service
 */
export const settingsService = {
  /**
   * Update user settings
   */
  updateSettings: async (settings) => {
    return apiCall(() => {
      console.log('✓ Settings updated:', settings)
      return { success: true, data: settings }
    })
  },

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: async (preferences) => {
    return apiCall(() => {
      console.log('✓ Notification preferences updated:', preferences)
      return { success: true }
    })
  },
}

/**
 * Report Service
 */
export const reportService = {
  /**
   * Generate project report
   */
  generateProjectReport: async (projectId) => {
    return apiCall(() => {
      console.log(`✓ Generating report for project ${projectId}`)
      return {
        success: true,
        data: {
          projectId,
          generatedAt: new Date().toISOString(),
        },
      }
    }, 500)
  },

  /**
   * Generate team report
   */
  generateTeamReport: async () => {
    return apiCall(() => {
      console.log('✓ Generating team report')
      return {
        success: true,
        data: {
          generatedAt: new Date().toISOString(),
        },
      }
    }, 500)
  },
}
