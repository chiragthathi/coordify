import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

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

// Mock user database with different roles
const MOCK_USERS = {
  'admin@example.com': {
    id: 'user_admin_001',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123',
  },
  'manager@example.com': {
    id: 'user_mgr_001',
    email: 'manager@example.com',
    name: 'Manager User',
    role: 'manager',
    password: 'manager123',
  },
  'member@example.com': {
    id: 'user_mem_001',
    email: 'member@example.com',
    name: 'Member User',
    role: 'member',
    password: 'member123',
  },
  'viewer@example.com': {
    id: 'user_view_001',
    email: 'viewer@example.com',
    name: 'Viewer User',
    role: 'viewer',
    password: 'viewer123',
  },
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
        user: action.payload,
        isAuthenticated: true,
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
        const storedUser = localStorage.getItem('projecthub_user')

        if (storedUser) {
          const user = JSON.parse(storedUser)
          // Verify user still exists in mock DB
          if (MOCK_USERS[user.email]) {
            dispatch({
              type: AUTH_ACTIONS.INIT_AUTH,
              payload: user,
            })
          } else {
            localStorage.removeItem('projecthub_user')
            dispatch({
              type: AUTH_ACTIONS.INIT_AUTH,
              payload: null,
            })
          }
        } else {
          dispatch({
            type: AUTH_ACTIONS.INIT_AUTH,
            payload: null,
          })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        localStorage.removeItem('projecthub_user')
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
  const login = useCallback((email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START })

    // Simulate async operation
    setTimeout(() => {
      const mockUser = MOCK_USERS[email]

      if (mockUser && mockUser.password === password) {
        const userData = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          loginTime: new Date().toISOString(),
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: userData,
        })

        localStorage.setItem('projecthub_user', JSON.stringify(userData))
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_ERROR,
          payload: 'Invalid email or password',
        })
      }
    }, 300)
  }, [])

  /**
   * Signup function
   * Registers new user (mock implementation)
   */
  const signup = useCallback((email, name, password, role = 'member') => {
    dispatch({ type: AUTH_ACTIONS.SIGNUP_START })

    // Simulate async operation
    setTimeout(() => {
      // Check if user already exists
      if (MOCK_USERS[email]) {
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_ERROR,
          payload: 'Email already registered',
        })
        return
      }

      // Validate inputs
      if (!email || !name || !password) {
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_ERROR,
          payload: 'Please fill in all fields',
        })
        return
      }

      if (password.length < 6) {
        dispatch({
          type: AUTH_ACTIONS.SIGNUP_ERROR,
          payload: 'Password must be at least 6 characters',
        })
        return
      }

      // Create new user
      const userData = {
        id: `user_${Date.now()}`,
        email,
        name,
        role: role || 'member',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        createdAt: new Date().toISOString(),
      }

      dispatch({
        type: AUTH_ACTIONS.SIGNUP_SUCCESS,
        payload: userData,
      })

      localStorage.setItem('projecthub_user', JSON.stringify(userData))

      // Add to mock users DB for future logins
      MOCK_USERS[email] = {
        id: userData.id,
        email,
        name,
        role,
        password, // In production, this would be hashed
      }
    }, 300)
  }, [])

  /**
   * Logout function
   * Clears user session
   */
  const logout = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT })
    localStorage.removeItem('projecthub_user')
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
      localStorage.setItem('projecthub_user', JSON.stringify(updatedUser))
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

