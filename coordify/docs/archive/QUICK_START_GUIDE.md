# RBAC Quick Start - 5 Minute Setup Guide

## For Adding RBAC to Any Component

### Copy-Paste Template

```javascript
import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { Can } from '../components/Can'
import { projectService } from '../services/api'  // Replace as needed

export const YourComponent = () => {
  const { user } = useAuth()
  const { can } = usePermission()
  const [notification, setNotification] = useState(null)

  // State for async operations
  const createAsync = useAsync(projectService.create)
  const deleteAsync = useAsync(projectService.delete)

  // Handler with permission check
  const handleCreate = async (data) => {
    if (!can('CREATE_PROJECT')) {
      setNotification({ type: 'error', msg: 'No permission' })
      return
    }

    const result = await createAsync.execute(data)
    if (result.success) {
      setNotification({ type: 'success', msg: 'Created!' })
      createAsync.reset()
    }
  }

  // Show notification
  const showNotif = (type, msg) => {
    setNotification({ type, msg })
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div>
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}

      {/* Permission-based button */}
      <Can permission="CREATE_PROJECT">
        <button onClick={() => handleCreate(data)}>Create</button>
      </Can>

      {/* Or check with hook */}
      {can('DELETE_PROJECT') && (
        <button onClick={() => handleDelete(id)}>Delete</button>
      )}

      {/* Show loading, error states */}
      <button disabled={createAsync.loading}>
        {createAsync.loading ? 'Creating...' : 'Action'}
      </button>
      {createAsync.error && <p>{createAsync.error}</p>}
    </div>
  )
}
```

---

## Common Patterns

### Pattern 1: Hidden Button
```javascript
<Can permission="CREATE_PROJECT">
  <button>Create</button>
</Can>
// Button is completely hidden if user lacks permission
```

### Pattern 2: Disabled Button
```javascript
<button disabled={!can('DELETE_PROJECT')}>Delete</button>
// Button is visible but disabled if user lacks permission
```

### Pattern 3: Conditional Content
```javascript
{can('VIEW_REPORTS') && (
  <ReportsSection />
)}
// Entire section hidden for viewers
```

### Pattern 4: Multiple Permissions
```javascript
<Can permission={['MANAGE_USERS', 'VIEW_REPORTS']} require="all">
  <AdminPanel />
</Can>
// Only renders if user has ALL permissions
```

### Pattern 5: Multiple Roles
```javascript
{user?.role === 'admin' || user?.role === 'manager' ? (
  <TeamManagement />
) : (
  <p>No access</p>
)}

// Or using hook:
const { can } = usePermission()
if (can('INVITE_MEMBER')) { /* team management */ }
```

---

## Async Operations TL;DR

```javascript
// 1. Create async handler
const deleteAsync = useAsync(projectService.delete)

// 2. In handler function
const result = await deleteAsync.execute(id)

// 3. Check result
if (result.success) { /* success */ }
if (deleteAsync.error) { /* error */ }

// 4. In JSX
disabled={deleteAsync.loading}           // Button disabled while loading
{deleteAsync.loading ? 'Deleting...' : 'Delete'}   // Text changes
{deleteAsync.error && <p>{deleteAsync.error}</p>}   // Show error

// 5. Clean up if needed
deleteAsync.reset()                      // Clear state
deleteAsync.clearError()                 // Just clear error
```

---

## Adding to Existing Pages

### Team.jsx Example

```javascript
// 1. Add at top of component
import { usePermission } from '../hooks/usePermission'
import { useAsync } from '../hooks/useAsync'
import { teamService } from '../services/api'
import { Can } from '../components/Can'

// 2. In component body
const { can } = usePermission()
const inviteAsync = useAsync(teamService.inviteMember)

// 3. Add handler
const handleInvite = async (email, role) => {
  if (!can('INVITE_MEMBER')) {
    alert('No permission')
    return
  }
  const result = await inviteAsync.execute(email, role)
  if (result.success) alert('Invited!')
}

// 4. Wrap button
<Can permission="INVITE_MEMBER">
  <button onClick={() => handleInvite(email, role)}>
    {inviteAsync.loading ? 'Inviting...' : 'Invite'}
  </button>
</Can>
```

---

## Permissions Quick Reference

| Permission | Use For | Roles |
|-----------|---------|-------|
| CREATE_PROJECT | Create projects | Admin, Manager |
| EDIT_PROJECT | Edit projects | Admin, Manager |
| DELETE_PROJECT | Delete projects | Admin, Manager |
| CREATE_TASK | Create tasks | Admin, Manager, Member |
| EDIT_TASK | Edit tasks | Admin, Manager, Member |
| DELETE_TASK | Delete tasks | Admin, Manager |
| INVITE_MEMBER | Invite to team | Admin, Manager |
| MANAGE_USERS | User management | Admin |
| VIEW_REPORTS | See reports | Admin, Manager |
| CREATE_COMMENT | Comment on tasks | All |

---

## Debug Tips

```javascript
// See what permissions a user has
const { user } = useAuth()
console.log(user.role)  // admin, manager, member, viewer

// Test permission
const { can } = usePermission()
console.log(can('CREATE_PROJECT'))  // true/false

// Check token exists (for auth)
console.log(localStorage.getItem('auth_token'))

// Test API call
import { projectService } from '../services/api'
const result = await projectService.create({ name: 'Test' })
console.log(result)  // Should show { success: true, data: {...} }
```

---

## Common Gotchas

❌ **Don't:** Check permission outside render
```javascript
// BAD - checked once, won't update if role changes
const hasPermission = can('CREATE_PROJECT')  // Outside component
return <button disabled={hasPermission}>...</button>
```

✅ **Do:** Check permission in render
```javascript
// GOOD - checked every render
const { can } = usePermission()
return <button disabled={!can('CREATE_PROJECT')}>...</button>
```

---

❌ **Don't:** Forget permission check before API
```javascript
const handleDelete = async () => {
  const result = await deleteAsync.execute(id)  // No permission check!
  // ...
}
```

✅ **Do:** Check permission first
```javascript
const handleDelete = async () => {
  if (!can('DELETE_PROJECT')) {
    alert('No permission')
    return
  }
  const result = await deleteAsync.execute(id)
  // ...
}
```

---

## Cheat Sheet

```javascript
// --- Check Permissions ---
const { can, canAll, canAny } = usePermission()
can('CREATE_PROJECT')                           // Single
canAll(['MANAGE_USERS', 'VIEW_REPORTS'])       // All needed
canAny(['DELETE_PROJECT', 'DELETE_TASK'])      // Any ok

// --- User Info ---
const { user } = useAuth()
user.role      // admin, manager, member, viewer
user.id        // user ID
user.email     // user email

// --- Async Operations ---
const operation = useAsync(apiService.create)
await operation.execute(data)     // Call API
operation.loading                 // true while running
operation.success                 // true if succeeded
operation.error                   // error message string
operation.data                    // returned data
operation.reset()                 // clear all states

// --- UI With Can ---
<Can permission="CREATE_PROJECT">
  <button>Create</button>
</Can>

<Can permission={['A', 'B']} require="all">
  <div>Needs both</div>
</Can>

<Can permission={['A', 'B']} require="any">
  <div>Needs either</div>
</Can>

// --- Routing ---
<Route
  element={<ProtectedRoute requiredRole="admin">
    <AdminPage />
  </ProtectedRoute>}
  path="/admin"
/>
```

---

## Test in 2 Minutes

1. Open app and login as `admin@example.com` / `admin123`
2. Go to Dashboard → Should see "Reports & Analytics" section ✅
3. Go to Projects → Click "New Project" button ✅
4. On a project card → Should have delete button (trash icon) ✅
5. Logout and login as `member@example.com` / `member123`
6. Go to Projects → "New Project" button should be HIDDEN ✅
7. Project cards → NO delete button visible ✅
8. Dashboard → My Tasks section → "New Task" button visible ✅

**Success = System working!** 🎉

---

## Need Help?

- Permission not working? → Check `src/config/permissions.js`
- Hook not working? → Check `src/hooks/usePermission.js`
- Can component not working? → Check `src/components/Can.jsx`
- Button not handling? → Check if using `useAsync` properly
- Permission check failing? → Check user role in console
- API failing? → Check `src/services/api.js` for mock

---

## Deploy Checklist

- [ ] All buttons have permission checks
- [ ] Tested with all 4 roles
- [ ] No console errors
- [ ] Notifications show properly
- [ ] Loading states work
- [ ] Replace mock API with real endpoints
- [ ] Add JWT token management
- [ ] Backend validates permissions
- [ ] Error handling works
- [ ] Success messages show

**Ready to ship!** 🚀
