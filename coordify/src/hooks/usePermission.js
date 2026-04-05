/**
 * Custom hooks for authentication and permissions
 */

import { useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  PERMISSIONS,
} from '../config/permissions'

/**
 * usePermission Hook
 * Check if current user has specific permission(s)
 */
export const usePermission = () => {
  const { user } = useAuth()

  const can = useCallback(
    (permission) => {
      if (!user) return false
      return hasPermission(user.role, permission)
    },
    [user]
  )

  const canAll = useCallback(
    (permissions) => {
      if (!user) return false
      return hasAllPermissions(user.role, permissions)
    },
    [user]
  )

  const canAny = useCallback(
    (permissions) => {
      if (!user) return false
      return hasAnyPermission(user.role, permissions)
    },
    [user]
  )

  return { can, canAll, canAny }
}

/**
 * useCanCreateProject Hook
 * Check if user can create projects
 */
export const useCanCreateProject = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.CREATE_PROJECT)
}

/**
 * useCanEditProject Hook
 * Check if user can edit projects
 */
export const useCanEditProject = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.EDIT_PROJECT)
}

/**
 * useCanDeleteProject Hook
 * Check if user can delete projects
 */
export const useCanDeleteProject = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.DELETE_PROJECT)
}

/**
 * useCanCreateTask Hook
 * Check if user can create tasks
 */
export const useCanCreateTask = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.CREATE_TASK)
}

/**
 * useCanEditTask Hook
 * Check if user can edit tasks
 */
export const useCanEditTask = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.EDIT_TASK)
}

/**
 * useCanInviteMember Hook
 * Check if user can invite members
 */
export const useCanInviteMember = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.INVITE_MEMBER)
}

/**
 * useCanManageSettings Hook
 * Check if user can manage settings
 */
export const useCanManageSettings = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.MANAGE_SETTINGS)
}

/**
 * useCanManageUsers Hook
 * Check if user can manage users
 */
export const useCanManageUsers = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.MANAGE_USERS)
}

/**
 * useCanCreateComment Hook
 * Check if user can create comments
 */
export const useCanCreateComment = () => {
  const { can } = usePermission()
  return can(PERMISSIONS.CREATE_COMMENT)
}
