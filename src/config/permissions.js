/**
 * Centralized Permissions Configuration
 * Maps roles to fine-grained permissions and actions
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
  VIEWER: 'viewer',
}

/**
 * Permission Actions
 * These define what operations can be performed in the app
 */
export const PERMISSIONS = {
  // Project Permissions
  CREATE_PROJECT: 'CREATE_PROJECT',
  EDIT_PROJECT: 'EDIT_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  VIEW_PROJECT: 'VIEW_PROJECT',
  MANAGE_PROJECT_MEMBERS: 'MANAGE_PROJECT_MEMBERS',

  // Task Permissions
  CREATE_TASK: 'CREATE_TASK',
  EDIT_TASK: 'EDIT_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
  COMPLETE_TASK: 'COMPLETE_TASK',

  // Team Permissions
  INVITE_MEMBER: 'INVITE_MEMBER',
  REMOVE_MEMBER: 'REMOVE_MEMBER',
  MANAGE_ROLES: 'MANAGE_ROLES',

  // Settings Permissions
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_USERS: 'MANAGE_USERS',

  // Comment Permissions
  CREATE_COMMENT: 'CREATE_COMMENT',
  DELETE_COMMENT: 'DELETE_COMMENT',
}

/**
 * Role-to-Permissions Mapping
 * This is the source of truth for what each role can do
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // All permissions
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.COMPLETE_TASK,
    PERMISSIONS.INVITE_MEMBER,
    PERMISSIONS.REMOVE_MEMBER,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.DELETE_COMMENT,
  ],

  [ROLES.MANAGER]: [
    // Managers can manage projects and tasks, but cannot delete projects
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.MANAGE_PROJECT_MEMBERS,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.COMPLETE_TASK,
    PERMISSIONS.INVITE_MEMBER,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_COMMENT,
    PERMISSIONS.DELETE_COMMENT, // Can delete own comments
  ],

  [ROLES.MEMBER]: [
    // Members can view projects, mark tasks/subtasks as complete, and add comments (cannot create tasks)
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.COMPLETE_TASK,
    PERMISSIONS.CREATE_COMMENT,
  ],

  [ROLES.VIEWER]: [
    // Viewers are read-only - NO manage, delete, or add permissions
    PERMISSIONS.VIEW_PROJECT,
  ],
}

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {array}
 */
export const getPermissionsForRole = (role) => {
  return ROLE_PERMISSIONS[role] || []
}

/**
 * Check if user has multiple permissions (AND logic)
 * @param {string} role - User role
 * @param {array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(perm => hasPermission(role, perm))
}

/**
 * Check if user has any of the given permissions (OR logic)
 * @param {string} role - User role
 * @param {array} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(perm => hasPermission(role, perm))
}
