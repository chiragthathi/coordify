# Code Changes Reference

## Summary of Changes to Existing Files

This document outlines what was modified in existing files to implement the RBAC system.

---

## 1. Dashboard.jsx

### Imports Added
```javascript
import { useNavigate } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { projectService, taskService, reportService } from '../services/api'
import { Can } from '../components/Can'
import { Plus } from 'lucide-react'  // Added icon
```

### State Added
```javascript
const navigate = useNavigate()
const { canAny } = usePermission()
const [showNotification, setShowNotification] = useState(false)
```

### Async Handlers Added
```javascript
const generateReportAsync = useAsync(reportService.generateProjectReport)
const generateTeamReportAsync = useAsync(reportService.generateTeamReport)

// Handle functions for button clicks
const handleGenerateReport = async () => { /* ... */ }
const handleGenerateTeamReport = async () => { /* ... */ }
const handleViewActivities = () => navigate('/notifications')
const handleCreateTask = () => navigate('/kanban')
```

### UI Changes
1. **Notification Toast** - Added fixed top-right toast for success/error feedback
2. **Activity Feed Button** - Added `onClick={handleViewActivities}` to "View all" button
3. **My Tasks Button** - Added "New Task" button with permission check `<Can permission="CREATE_TASK">`
4. **Reports Section** - Added new section wrapped in `<Can permission="VIEW_REPORTS">` with two buttons
5. **Nested Can Component** - Team Report button wrapped in `<Can permission="MANAGE_USERS">`

### Styling
- Added loading state styling for buttons
- Added error message styling (red text)
- Disabled button styling (opacity + cursor)

---

## 2. Projects.jsx

### Imports Added
```javascript
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { projectService } from '../services/api'
import { Can } from '../components/Can'
import { Trash2 } from 'lucide-react'  // Added icon
```

### ProjectCard Component Changes
- **Parameters:** Added `onDelete`, `isDeletingId`, `canDelete` props
- **Delete Button:** Added conditional delete button in footer with:
  - Event stopping to prevent card click
  - Loading spinner during deletion
  - Permission check display

```javascript
{canDelete && (
  <button onClick={(e) => { e.stopPropagation(); onDelete(project.id) }}>
    {isDeletingId === project.id ? <spinner/> : <Trash2 />}
  </button>
)}
```

### Main Projects Component Changes
```javascript
// New state variables
const { can } = usePermission()
const [deletingId, setDeletingId] = useState(null)
const [notification, setNotification] = useState(null)

// New async handlers
const createProjectAsync = useAsync(projectService.create)
const deleteProjectAsync = useAsync(projectService.delete)

// New handler functions
const handleCreateProject = async (formData) => {
  if (!can('CREATE_PROJECT')) { /* error */ }
  const result = await createProjectAsync.execute(formData)
  // Show notification
}

const handleDeleteProject = async (projectId) => {
  if (!can('DELETE_PROJECT')) { /* error */ }
  if (!confirm('...')) return
  // Delete project
}
```

### Button Updates
1. **New Project Button** - Wrapped in `<Can permission="CREATE_PROJECT">`
2. **Button State** - `disabled={createProjectAsync.loading}`
3. **Button Text** - Shows "Creating..." during loading
4. **Error Display** - Shows error message if API fails

### Projects Grid
- **ProjectCard Props** - Pass delete handler and permission state:
  ```javascript
  onDelete={handleDeleteProject}
  isDeletingId={deletingId}
  canDelete={can('DELETE_PROJECT')}
  ```

### Notification Toast
- Added fixed position toast that shows success/error messages
- Auto-dismisses after 3 seconds

---

## 3. ProtectedRoute.jsx

### Imports Added
```javascript
import { usePermission } from '../hooks/usePermission'
```

### Props Added
```javascript
requiredPermission = null,  // New parameter
```

### Permission Check Logic Added
```javascript
// Check permission-based access if required
if (requiredPermission) {
  const hasRequiredPermission = Array.isArray(requiredPermission)
    ? canAll(requiredPermission)
    : can(requiredPermission)

  if (!hasRequiredPermission) {
    return (
      <div className="...">
        <div className="text-6xl">⛔</div>
        <h1>Permission Denied</h1>
        <p>You don't have the required permission to access this resource.</p>
      </div>
    )
  }
}
```

### Usage Example
```javascript
// Role-based (existing)
<Route element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} path="/admin" />

// Permission-based (new)
<Route element={<ProtectedRoute requiredPermission="MANAGE_USERS"><Users /></ProtectedRoute>} path="/users" />

// Multiple permissions (new)
<Route element={<ProtectedRoute requiredPermission={['MANAGE_USERS', 'VIEW_REPORTS']}><Reports /></ProtectedRoute>} path="/reports" />
```

---

## What Was NOT Changed

### AuthContext.jsx
✅ **No changes needed** - Already had proper structure with:
- useReducer for state management
- Mock user database
- hasRole() and hasPermission() methods
- localStorage persistence
- All necessary hooks

### Other Components
✅ **No changes** to:
- TopNav.jsx
- Layout.jsx
- Common.jsx (Badges, EmptyState, etc.)
- KanbanBoard components
- Team.jsx
- Notifications.jsx
- Settings.jsx
- Auth pages (Login, Signup, etc.)

These can be enhanced individually with the same patterns.

---

## Pattern Used for Button Handlers

All button implementations follow this pattern:

```javascript
// 1. Import async hook and service
import { useAsync } from '../hooks/useAsync'
import { projectService } from '../services/api'

// 2. Create async state
const operationAsync = useAsync(projectService.create)

// 3. Define handler with permission check
const handleOperation = async (data) => {
  // Check permission first
  if (!can('PERMISSION_NAME')) {
    showNotification('error', 'No permission')
    return
  }

  // Execute with loading state
  const result = await operationAsync.execute(data)

  // Handle result
  if (result.success) {
    showNotification('success', 'Done!')
    operationAsync.reset()
  }
}

// 4. Render with permission wrapper and state management
<Can permission="PERMISSION_NAME">
  <button
    onClick={handleOperation}
    disabled={operationAsync.loading}
  >
    {operationAsync.loading ? 'Loading...' : 'Action'}
  </button>
</Can>

{operationAsync.error && <p>{operationAsync.error}</p>}
```

---

## How to Apply Similar Pattern to Other Pages

### Example: Team.jsx Enhancement

```javascript
// 1. Add imports
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { teamService } from '../services/api'
import { Can } from '../components/Can'

// 2. In component
const { can } = usePermission()
const inviteAsync = useAsync(teamService.inviteMember)

// 3. Create handler
const handleInvite = async (email, role) => {
  if (!can('INVITE_MEMBER')) return
  const result = await inviteAsync.execute(email, role)
  // ... handle result
}

// 4. Render
<Can permission="INVITE_MEMBER">
  <button onClick={() => handleInvite(email, role)}>
    {inviteAsync.loading ? 'Inviting...' : 'Invite'}
  </button>
</Can>
```

---

## Integration Checklist

- [x] Add permission config file
- [x] Add permission hooks
- [x] Add Can wrapper component
- [x] Add useAsync hook
- [x] Add API service layer
- [x] Update ProtectedRoute
- [x] Update Dashboard with buttons
- [x] Update Projects with buttons
- [x] Create AdminPanel example
- [x] Write testing guide
- [ ] Update other pages (Team, Settings, Notifications)
- [ ] Add permission checks to KanbanBoard
- [ ] Connect real backend APIs
- [ ] Add JWT token management
- [ ] Set up role/permission database

---

## Migration Guide: From Mock to Real API

### Step 1: Update API Service

**File:** `src/services/api.js`

```javascript
// Replace this:
export const projectService = {
  create: async (data) => {
    return apiCall(() => {
      const newProject = { id: `proj_${Date.now()}`, ...data }
      return { success: true, data: newProject }
    })
  }
}

// With this:
export const projectService = {
  create: async (data) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }
}
```

### Step 2: Update Auth Service

**File:** `src/contexts/AuthContext.jsx`

```javascript
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
  const { token, user, role } = await response.json()

  localStorage.setItem('auth_token', token)
  localStorage.setItem('user', JSON.stringify({ ...user, role }))

  dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: { ...user, role } })
}
```

### Step 3: No Component Changes Needed!

All components will continue to work because they use the same interface:
- `useAsync()` for state management
- `usePermission()` for checks
- `Can` component for rendering
- API services return `{ success, data, message }`

---

## Testing the Changes

### Verify Each Piece

```bash
# 1. Check permission config loads
import { PERMISSIONS, ROLE_PERMISSIONS } from './config/permissions'
console.log(PERMISSIONS.CREATE_PROJECT)  # Should print permission name

# 2. Check hooks work
const { can } = usePermission()
console.log(can('CREATE_PROJECT'))  # Should print true/false based on role

# 3. Check Can component works
<Can permission="CREATE_PROJECT">
  <p>Content</p>
</Can>

# 4. Check async hook works
const async = useAsync(projectService.create)
await async.execute(data)
console.log(async.loading, async.success, async.error)
```

---

## Performance Considerations

✅ **Optimized for:**
- Minimal re-renders (hooks use useCallback)
- No permission checking overhead
- Lazy permission evaluation
- No unnecessary API calls

⚠️ **Future improvements:**
- Implement permission caching
- Add debouncing for rapid operations
- Implement request batching
- Add optimistic updates

---

## Security Notes

⚠️ **Frontend RBAC is NOT SECURE alone:**
- Always validate permissions on backend
- Never trust client-side permission checks
- Check permissions before processing any API request
- Implement rate limiting on backend
- Log all sensitive operations

✅ **This implementation:**
- Provides good UX (hide unavailable options)
- Prevents accidental misuse
- Shows when users lack permissions
- Should be paired with backend validation

---

## Troubleshooting

### Button Not Showing?
1. Check permission config
2. Verify user role in console: `useAuth().user.role`
3. Verify permission with: `usePermission().can('PERMISSION_NAME')`

### Handler Not Executing?
1. Check browser console for errors
2. Verify service method exists
3. Check permission check is returning true

### Toast Not Showing?
1. Verify state is set: `setNotification(...)`
2. Check CSS classes are applied
3. Verify z-index (should be 50 or higher)

---

End of Reference Document
