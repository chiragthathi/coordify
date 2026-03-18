import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication
 * Redirects unauthenticated users to login page
 * Supports role-based and permission-based access control
 *
 * @param {React.ReactNode} children - Component to render if authenticated
 * @param {string|string[]} requiredRole - Role(s) required to access this route
 * @param {string|string[]} requiredPermission - Permission(s) required to access
 * @param {string} fallback - Path to redirect if user doesn't have required role
 */
export const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  fallback = '/login',
}) => {
  const { user, loading, isAuthenticated, hasRole } = useAuth()
  const { can, canAll } = usePermission()

  // Show loading state while auth initializes
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center space-y-4">
          {/* Loading spinner */}
          <div className="flex justify-center">
            <div className="h-12 w-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 rounded-full animate-spin" />
          </div>

          {/* Loading text */}
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Loading...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Checking your access permissions
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Check role-based access if required
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page. Required role:{' '}
            <span className="font-semibold">
              {Array.isArray(requiredRole)
                ? requiredRole.join(', ')
                : requiredRole}
            </span>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Your current role: <span className="font-medium">{user.role}</span>
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Check permission-based access if required
  if (requiredPermission) {
    const hasRequiredPermission = Array.isArray(requiredPermission)
      ? canAll(requiredPermission)
      : can(requiredPermission)

    if (!hasRequiredPermission) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">⛔</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Permission Denied
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have the required permission to access this resource.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Required permission:{' '}
              <span className="font-medium">
                {Array.isArray(requiredPermission)
                  ? requiredPermission.join(', ')
                  : requiredPermission}
              </span>
            </p>
            <a
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      )
    }
  }

  // Render protected content
  return children
}

/**
 * RoleBasedRoute Component
 * Route wrapper that restricts access based on user role
 * Alternative to using requiredRole param on ProtectedRoute
 *
 * @param {React.ReactNode} children - Component to render
 * @param {string|string[]} requiredRole - Role(s) needed to view
 * @param {React.ReactNode} fallback - Component to render if access denied
 */
export const RoleBasedRoute = ({
  children,
  requiredRole,
  fallback = null,
}) => {
  const { user, hasRole } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasRole(requiredRole)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Insufficient permissions
          </p>
        </div>
      </div>
    )
  }

  return children
}

/**
 * Example Usage:
 *
 * // Basic protected route
 * <Route element={<ProtectedRoute><Dashboard /></ProtectedRoute>} path="/" />
 *
 * // Role-restricted route
 * <Route
 *   element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>}
 *   path="/admin"
 * />
 *
 * // Multiple allowed roles
 * <Route
 *   element={<ProtectedRoute requiredRole={['admin', 'manager']}><Reports /></ProtectedRoute>}
 *   path="/reports"
 * />
 */

