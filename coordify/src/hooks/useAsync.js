/**
 * useAsync Hook
 * Manages loading, error, and success states for async operations
 * Perfect for button handlers with API calls
 */

import { useState, useCallback } from 'react'

/**
 * useAsync Hook - Handles async operation state
 *
 * Usage:
 * const { execute, loading, error, data, success } = useAsync(apiService.create)
 *
 * return (
 *   <>
 *     <button onClick={() => execute(projectData)} disabled={loading}>
 *       {loading ? 'Creating...' : 'Create Project'}
 *     </button>
 *     {error && <p className="text-red-500">{error}</p>}
 *     {success && <p className="text-green-500">Success!</p>}
 *   </>
 * )
 */
export const useAsync = (asyncFunction, immediate = false) => {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
    success: false,
  })

  // Execute the async function
  const execute = useCallback(async (...args) => {
    setState({ data: null, loading: true, error: null, success: false })

    try {
      const response = await asyncFunction(...args)

      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          success: true,
        })
        return response
      } else {
        throw new Error(response.message || 'Operation failed')
      }
    } catch (error) {
      const errorMessage = error.message || 'An error occurred'
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      })
      console.error('Async operation error:', error)
      return { success: false, message: errorMessage }
    }
  }, [asyncFunction])

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    })
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    execute,
    reset,
    clearError,
    ...state,
  }
}

/**
 * Custom hook combining useAsync with permission checks
 * Used for operations that require specific permissions
 */
export const useAsyncWithPermission = (
  asyncFunction,
  requiredPermission,
  { usePermission: usePermissionHook }
) => {
  const { can } = usePermissionHook()
  const asyncState = useAsync(asyncFunction)

  const executeWithCheck = useCallback(
    async (...args) => {
      if (!can(requiredPermission)) {
        asyncState.setState({
          data: null,
          loading: false,
          error: 'You do not have permission to perform this action',
          success: false,
        })
        return { success: false }
      }

      return asyncState.execute(...args)
    },
    [can, requiredPermission, asyncState]
  )

  return {
    ...asyncState,
    execute: executeWithCheck,
    hasPermission: can(requiredPermission),
  }
}
