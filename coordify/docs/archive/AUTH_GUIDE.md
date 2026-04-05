# AuthContext Implementation Guide

Complete authentication system for ProjectHub using React Context + useReducer.

## Overview

The AuthContext provides:
- **useReducer** for predictable state management
- **Mock user database** with 4 roles (Admin, Manager, Member, Viewer)
- **localStorage persistence** for session management
- **Role-based access control** (RBAC)
- **Permission-based access** for fine-grained control
- **Protected routes** with automatic redirection
- **Error handling** and loading states

## Architecture

### Files

1. **src/contexts/AuthContext.jsx** - Main auth context with useReducer
2. **src/components/ProtectedRoute.jsx** - Route protection & role-based access
3. **src/pages/Login.jsx** - Login page with all test accounts
4. **src/pages/Signup.jsx** - Sign up with role selection

## AuthContext.jsx - Complete Features

### State Management

```javascript
// Initial state
{
  user: null,                    // Authenticated user object
  loading: true,                 // Loading state during init
  isAuthenticated: false,        // Boolean auth flag
  error: null,                   // Error message
}
```

### Action Types

```javascript
AUTH_ACTIONS = {
  INIT_AUTH,        // Initialize auth from localStorage
  LOGIN_START,      // Login request started
  LOGIN_SUCCESS,    // Login successful
  LOGIN_ERROR,      // Login failed
  SIGNUP_START,     // Signup request started
  SIGNUP_SUCCESS,   // Signup successful
  SIGNUP_ERROR,     // Signup failed
  LOGOUT,           // User logged out
  UPDATE_USER,      // Update user profile
  CLEAR_ERROR,      // Clear error message
}
```

### Mock Users Database

```javascript
MOCK_USERS = {
  'admin@example.com': {
    id: 'user_admin_001',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    password: 'admin123',
  },
  'manager@example.com': { ... },
  'member@example.com': { ... },
  'viewer@example.com': { ... },
}
```

## useAuth Hook Usage

### Basic Usage

```javascript
import { useAuth } from '../contexts/AuthContext'

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth()

  if (!isAuthenticated) {
    return <p>Please log in</p>
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

### Available Context Values

```javascript
{
  // State
  user: {
    id: string,
    email: string,
    name: string,
    role: 'admin' | 'manager' | 'member' | 'viewer',
    avatar: string,
    loginTime?: string,
    createdAt?: string,
  },
  loading: boolean,
  isAuthenticated: boolean,
  error: string | null,

  // Actions
  login(email: string, password: string): void,
  signup(email: string, name: string, password: string, role?: string): void,
  logout(): void,
  updateUser(updates: object): void,
  clearError(): void,

  // Utilities
  hasRole(role: string | string[]): boolean,
  hasPermission(permission: string): boolean,
}
```

## ProtectedRoute Component

### Basic Protected Route

```javascript
import { ProtectedRoute } from '../components/ProtectedRoute'
import { Dashboard } from '../pages/Dashboard'

<Route
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
  path="/"
/>
```

### Role-Based Route

```javascript
// Admin only
<Route
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminPanel />
    </ProtectedRoute>
  }
  path="/admin"
/>ma

// Multiple allowed roles
<Route
  element={
    <ProtectedRoute requiredRole={['admin', 'manager']}>
      <Reports />
    </ProtectedRoute>
  }
  path="/reports"
/>
```

### RoleBasedRoute Alternative

```javascript
import { RoleBasedRoute } from '../components/ProtectedRoute'

<RoleBasedRoute requiredRole="admin">
  <AdminPanel />
</RoleBasedRoute>
```

## User Roles & Permissions

### Roles

| Role | Permissions | Use Case |
|------|------------|----------|
| **Admin** | read, write, delete, manage_users, manage_projects | System administrator |
| **Manager** | read, write, delete, manage_projects | Project manager |
| **Member** | read, write | Team member |
| **Viewer** | read | Read-only access |

### Permission Checking

```javascript
const { hasRole, hasPermission } = useAuth()

// Check role
if (hasRole('admin')) {
  // Admin-only feature
}

// Check multiple roles
if (hasRole(['admin', 'manager'])) {
  // Admin or manager feature
}

// Check permission
if (hasPermission('delete')) {
  // Can delete
}
```

## Test Accounts

### Available Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Member | member@example.com | member123 |
| Viewer | viewer@example.com | viewer123 |

### Quick Login Feature

Login page has quick-access buttons for all test accounts to easily switch between roles.

## Login Flow

```
User enters email/password
    ↓
login() dispatches LOGIN_START
    ↓
Mock validation against MOCK_USERS
    ↓
Email/password match?
    ├─ Yes → LOGIN_SUCCESS + save to localStorage + generate avatar
    └─ No → LOGIN_ERROR with message
```

## Signup Flow

```
User fills form (name, email, password, role)
    ↓
signup() dispatches SIGNUP_START
    ↓
Validation:
  - All fields filled?
  - Passwords match?
  - Password >= 6 chars?
  - Email not already registered?
    ↓
Valid → SIGNUP_SUCCESS + save to localStorage
Invalid → SIGNUP_ERROR with specific message
```

## localStorage Structure

```javascript
// Stored as: localStorage.projecthub_user
{
  id: string,
  email: string,
  name: string,
  role: string,
  avatar: string,
  loginTime: ISO string,
  createdAt?: ISO string,
}
```

## Error Handling

```javascript
const { error, clearError } = useAuth()

if (error) {
  return (
    <div className="error">
      <p>{error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  )
}
```

### Common Errors

- "Invalid email or password"
- "Email already registered"
- "Please fill in all fields"
- "Password must be at least 6 characters"
- "Passwords do not match"

## Loading States

```javascript
const { loading } = useAuth()

if (loading) {
  return <LoadingSpinner />
}
```

Loading appears:
- During app initialization (checking localStorage)
- During login/signup process
- While validating user session

## Session Persistence

1. User logs in → data saved to localStorage
2. Page refreshes → AuthContext initializes from localStorage
3. User logs out → localStorage cleared
4. Session survives page reloads & browser restart

## Integration with App.jsx

```javascript
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Your routes */}
      </AuthProvider>
    </ThemeProvider>
  )
}
```

## Example: Role-Based UI

```javascript
import { useAuth } from '../contexts/AuthContext'

function Dashboard() {
  const { user, hasRole, hasPermission } = useAuth()

  return (
    <div>
      {hasRole('admin') && <AdminStats />}
      {hasRole(['admin', 'manager']) && <ManageProjects />}
      {hasPermission('delete') && <DeleteButton />}
    </div>
  )
}
```

## Future Backend Integration

To connect with a real API:

1. Replace login/signup mock functions with API calls
2. Change localStorage to session tokens (JWT)
3. Add token refresh logic
4. Update error handling for HTTP status codes
5. Implement proper password hashing

Example:
```javascript
const login = useCallback(async (email, password) => {
  dispatch({ type: AUTH_ACTIONS.LOGIN_START })

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('token', data.token)
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: data.user,
      })
    } else {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_ERROR,
        payload: data.message,
      })
    }
  } catch (error) {
    dispatch({
      type: AUTH_ACTIONS.LOGIN_ERROR,
      payload: error.message,
    })
  }
}, [])
```

## Best Practices

1. **Always check authentication before rendering sensitive components**
   ```javascript
   if (!isAuthenticated) return <Navigate to="/login" />
   ```

2. **Use hasRole() for UI control, ProtectedRoute for route protection**
   - UI: show/hide conditional elements
   - Routes: prevent navigation to restricted pages

3. **Clear errors when user navigates away**
   ```javascript
   useEffect(() => {
     return () => clearError()
   }, [clearError])
   ```

4. **Handle loading state during async operations**
   ```javascript
   <button disabled={loading}>
     {loading ? 'Loading...' : 'Submit'}
   </button>
   ```

5. **Validate permissions on both frontend AND backend**
   - Frontend: for UX (disable buttons, hide features)
   - Backend: for security (always validate)

## Troubleshooting

### "useAuth must be used within AuthProvider"
- Ensure AuthProvider wraps all components using useAuth
- Check that App.jsx imports and renders AuthProvider

### Login not working
- Check MOCK_USERS database has the email/password
- Verify localStorage isn't disabled
- Check browser console for errors

### Session lost after refresh
- Verify localStorage key is 'projecthub_user'
- Check MOCK_USERS includes the stored email
- Inspect Application tab in DevTools

## References

- React Context: https://react.dev/reference/react/useContext
- useReducer: https://react.dev/reference/react/useReducer
- localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- Protected Routes: https://reactrouter.com/en/main/components/Navigate
