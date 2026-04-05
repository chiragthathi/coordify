import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { authService } from '../features/auth/api/authService'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
} from '../shared/api/tokenStorage'

/**
 * AuthContext: Manages authentication state and user session
 * Uses useReducer for predictable state management
 */
const AuthContext = createContext(null)

// Action types
const AUTH_ACTIONS = {
  INIT_AUTH: 'INIT_AUTH',
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  SIGNUP_START: 'SIGNUP_START',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  SIGNUP_ERROR: 'SIGNUP_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
}

// Initial state
const initialState = {
  user: null,
  loading: true,
  isAuthenticated: false,
  error: null,
}

/**
 * Authentication reducer
 * Handles all auth state updates predictably
 */
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INIT_AUTH:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      }

    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      }

    case AUTH_ACTIONS.SIGNUP_START:
      return {
        ...state,
        loading: true,
        error: null,
      }

    case AUTH_ACTIONS.SIGNUP_SUCCESS:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.SIGNUP_ERROR:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      }

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      }

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      }

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      }

    default:
      return state
  }
}

/**
 * AuthProvider Component
 * Wraps app with authentication context
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAccessToken()
        const storedUser = getStoredUser()

        if (token && storedUser) {
          try {
            const meResponse = await authService.me()
            const backendUser = meResponse?.data || storedUser
            setStoredUser(backendUser)
            dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: backendUser })
          } catch {
            clearTokens()
            dispatch({ type: AUTH_ACTIONS.INIT_AUTH, payload: null })
          }
        } else {
          dispatch({
            type: AUTH_ACTIONS.INIT_AUTH,
            payload: null,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        clearTokens()
        dispatch({
          type: AUTH_ACTIONS.INIT_AUTH,
          payload: null,
        })
      }
    }

    initializeAuth()
  }, [])

  /**
   * Login function
   * Authenticates user with email and password
   */
  const login = useCallback(async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    try {
      const response = await authService.login(email, password)
      const payload = response?.data || {}
      const userData = {
        ...payload.user,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${payload.user?.email || email}`,
      }

      setAccessToken(payload.accessToken)
      setRefreshToken(payload.refreshToken)
      setStoredUser(userData)

      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData })
      return { success: true }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: error?.message || 'Invalid email or password',
      })
      return { success: false, message: error?.message || 'Login failed' }
    }
  }, [])

  /**
   * Signup function
   * Registers new user (mock implementation)
   */
  const signup = useCallback(async (email, name, password, role = 'member') => {
    dispatch({ type: AUTH_ACTIONS.SIGNUP_START })

    try {
      const response = await authService.signup({ email, name, password, role })
      const payload = response?.data || {}

      clearTokens()
      dispatch({ type: AUTH_ACTIONS.SIGNUP_SUCCESS, payload: null })
      return { success: true, data: payload }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.SIGNUP_ERROR,
        payload: error?.message || 'Signup failed',
      })
      return { success: false, message: error?.message || 'Signup failed' }
    }
  }, [])

  /**
   * Logout function
   * Clears user session
   */
  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (error) {
      console.warn('Logout API failed:', error)
    } finally {
      clearTokens()
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }, [])

  /**
   * Update user profile
   * Updates user information
   */
  const updateUser = useCallback((updates) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: updates,
    })

    // Persist updated user to localStorage
    if (state.user) {
      const updatedUser = { ...state.user, ...updates }
      setStoredUser(updatedUser)
    }
  }, [state.user])

  /**
   * Clear error messages
   */
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }, [])

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role) => {
    if (!state.user) return false
    if (typeof role === 'string') {
      return state.user.role === role
    }
    return role.includes(state.user.role)
  }, [state.user])

  /**
   * Check if user has specific permission
   * Can be extended for fine-grained permissions
   */
  const hasPermission = useCallback((permission) => {
    if (!state.user) return false

    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_projects'],
      manager: ['read', 'write', 'delete', 'manage_projects'],
      member: ['read', 'write'],
      viewer: ['read'],
    }

    const permissions = rolePermissions[state.user.role] || []
    return permissions.includes(permission)
  }, [state.user])

  const value = {
    // State
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,

    // Actions
    login,
    signup,
    logout,
    updateUser,
    clearError,

    // Utilities
    hasRole,
    hasPermission,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook
 * Custom hook to access auth context
 * Throws error if used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. Make sure AuthProvider wraps your app.'
    )
  }

  return context
}

