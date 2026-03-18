/**
 * Can Component
 * Conditionally renders content based on user permissions
 *
 * Usage:
 * <Can permission="CREATE_PROJECT">
 *   <button>Create Project</button>
 * </Can>
 */

import React from 'react'
import { usePermission } from '../hooks/usePermission'

export const Can = ({
  permission,
  permissions, // Array for multiple checks
  require = 'any', // 'any' or 'all' - for multiple permissions
  children,
  fallback = null,
}) => {
  const { can, canAll, canAny } = usePermission()

  let hasAccess = false

  if (permissions && Array.isArray(permissions)) {
    // Multiple permissions
    hasAccess = require === 'all' ? canAll(permissions) : canAny(permissions)
  } else if (permission) {
    // Single permission
    hasAccess = can(permission)
  }

  if (!hasAccess) {
    return fallback
  }

  return children
}

/**
 * Can Component Variants
 */

/**
 * CanRead - Check if user can view/read
 */
export const CanRead = ({ children, fallback = null }) => {
  const { can } = usePermission()
  return can('READ') ? children : fallback
}

/**
 * CanWrite - Check if user can create/edit
 */
export const CanWrite = ({ children, fallback = null }) => {
  const { canAny } = usePermission()
  return canAny(['CREATE_PROJECT', 'EDIT_PROJECT', 'CREATE_TASK']) ? (
    children
  ) : (
    fallback
  )
}

/**
 * CanDelete - Check if user can delete
 */
export const CanDelete = ({ children, fallback = null }) => {
  const { canAny } = usePermission()
  return canAny(['DELETE_PROJECT', 'DELETE_TASK', 'DELETE_COMMENT']) ? (
    children
  ) : (
    fallback
  )
}

/**
 * CanManage - Check if user can manage (admin/manager level)
 */
export const CanManage = ({ children, fallback = null }) => {
  const { can } = usePermission()
  return can('MANAGE_USERS') || can('MANAGE_SETTINGS') ? children : fallback
}
