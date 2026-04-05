# Complete Role Permissions Summary

## All Roles at a Glance

```
ADMIN      → Full Access (All permissions)
MANAGER    → Project & Task Management (No user management)
MEMBER     → Task Creation Only (Create task + View project)
VIEWER     → Read-Only (View project only)
```

---

## Detailed Permissions Matrix

| Action | VIEWER | MEMBER | MANAGER | ADMIN |
|--------|--------|--------|---------|-------|
| **Projects** | | | | |
| View Projects | ✅ | ✅ | ✅ | ✅ |
| Create Project | ❌ | ❌ | ✅ | ✅ |
| Edit Project | ❌ | ❌ | ✅ | ✅ |
| Delete Project | ❌ | ❌ | ✅ | ✅ |
| Manage Project Members | ❌ | ❌ | ✅ | ✅ |
| **Tasks** | | | | |
| View Tasks | ✅ | ✅ | ✅ | ✅ |
| Create Task | ❌ | ✅ | ✅ | ✅ |
| Edit Task | ❌ | ❌ | ✅ | ✅ |
| Delete Task | ❌ | ❌ | ✅ | ✅ |
| Assign Task | ❌ | ❌ | ✅ | ✅ |
| Move Tasks (Drag) | ❌ | ❌ | ✅ | ✅ |
| **Comments** | | | | |
| View Comments | ✅ | ✅ | ✅ | ✅ |
| Create Comment | ❌ | ❌ | ✅ | ✅ |
| Delete Comment | ❌ | ❌ | ✅ | ✅ |
| **Team** | | | | |
| View Team Members | ✅ | ✅ | ✅ | ✅ |
| Invite Member | ❌ | ❌ | ✅ | ✅ |
| Remove Member | ❌ | ❌ | ❌ | ✅ |
| Manage Roles | ❌ | ❌ | ❌ | ✅ |
| **Admin** | | | | |
| Access Admin Panel | ❌ | ❌ | ❌ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ✅ |
| View Reports | ❌ | ❌ | ✅ | ✅ |
| Manage Settings | ❌ | ❌ | ❌ | ✅ |

---

## Configuration in Code

**File:** `src/config/permissions.js`

### ADMIN (Lines 51-70)
```javascript
[ROLES.ADMIN]: [
  // All permissions
  CREATE_PROJECT, EDIT_PROJECT, DELETE_PROJECT, VIEW_PROJECT, MANAGE_PROJECT_MEMBERS,
  CREATE_TASK, EDIT_TASK, DELETE_TASK, ASSIGN_TASK,
  INVITE_MEMBER, REMOVE_MEMBER, MANAGE_ROLES,
  MANAGE_SETTINGS, VIEW_REPORTS, MANAGE_USERS,
  CREATE_COMMENT, DELETE_COMMENT,
]
```

### MANAGER (Lines 72-87)
```javascript
[ROLES.MANAGER]: [
  // Managers can do most things except user management
  CREATE_PROJECT, EDIT_PROJECT, DELETE_PROJECT, VIEW_PROJECT, MANAGE_PROJECT_MEMBERS,
  CREATE_TASK, EDIT_TASK, DELETE_TASK, ASSIGN_TASK,
  INVITE_MEMBER, VIEW_REPORTS,
  CREATE_COMMENT, DELETE_COMMENT,
]
```

### MEMBER (Lines 89-93) ✅ NEW
```javascript
[ROLES.MEMBER]: [
  // Members can only create tasks and view projects
  VIEW_PROJECT,
  CREATE_TASK,
]
```

### VIEWER (Lines 95-102) ✅ EXISTING
```javascript
[ROLES.VIEWER]: [
  // Viewers are read-only - NO manage, delete, or add permissions
  VIEW_PROJECT,
]
```

---

## UI Component Impact

### Dashboard
| Role | New Task | Reports |
|------|----------|---------|
| VIEWER | ❌ Hidden | ❌ Hidden |
| MEMBER | ❌ Hidden | ❌ Hidden |
| MANAGER | ✅ Visible | ✅ Visible |
| ADMIN | ✅ Visible | ✅ Visible |

### Projects Page
| Role | New Project | Delete Icon |
|------|-------------|-------------|
| VIEWER | ❌ Hidden | ❌ Hidden |
| MEMBER | ❌ Hidden | ❌ Hidden |
| MANAGER | ✅ Visible | ✅ Visible |
| ADMIN | ✅ Visible | ✅ Visible |

### Kanban Board
| Role | Drag Tasks | Edit Tasks | Lock Icon |
|------|------------|-----------|-----------|
| VIEWER | ❌ Blocked | ❌ Disabled | ✅ Visible |
| MEMBER | ❌ Blocked | ❌ Disabled | ✅ Visible |
| MANAGER | ✅ Enabled | ✅ Enabled | ❌ Hidden |
| ADMIN | ✅ Enabled | ✅ Enabled | ❌ Hidden |

### Task Detail Panel
| Role | Edit Status | Edit Priority | Add Comments | Add Subtasks | Attachments |
|------|------------|---------------|--------------|--------------|-------------|
| VIEWER | ❌ Display | ❌ Display | ❌ Hidden | ❌ No | ❌ Hidden |
| MEMBER | ❌ Display | ❌ Display | ❌ Hidden | ❌ No | ❌ Hidden |
| MANAGER | ✅ Dropdown | ✅ Dropdown | ✅ Enabled | ✅ Yes | ✅ Visible |
| ADMIN | ✅ Dropdown | ✅ Dropdown | ✅ Enabled | ✅ Yes | ✅ Visible |

### Team Page
| Role | Invite Member | Remove Member |
|------|---------------|---------------|
| VIEWER | ❌ Hidden | ❌ Hidden |
| MEMBER | ❌ Hidden | ❌ Hidden |
| MANAGER | ✅ Visible | ❌ Hidden |
| ADMIN | ✅ Visible | ✅ Visible |

### Admin Panel
| Role | Can Access |
|------|-----------|
| VIEWER | ❌ Access Denied |
| MEMBER | ❌ Access Denied |
| MANAGER | ❌ Access Denied |
| ADMIN | ✅ Full Access |

---

## Use Cases Per Role

### VIEWER
- **Use For:** Stakeholders, clients, observers
- **Can Do:** Read-only access to all projects and tasks
- **Cannot Do:** Anything (fully read-only)
- **Good For:** Project monitoring, status checking, sharing with external parties

### MEMBER
- **Use For:** New team members, contributors
- **Can Do:** View projects and create tasks
- **Cannot Do:** Edit/delete tasks, manage projects, manage users
- **Good For:** Creating work items, reporting tasks, basic participation

### MANAGER
- **Use For:** Project leads, team leads
- **Can Do:** Create/edit/delete projects and tasks, manage team members, view reports
- **Cannot Do:** User management (no remove members, no manage roles)
- **Good For:** Day-to-day project management, task administration

### ADMIN
- **Use For:** System administrators
- **Can Do:** EVERYTHING (all permissions)
- **Cannot Do:** Nothing (full access)
- **Good For:** System setup, user management, global settings

---

## Permission Enforcement Layers

### 1. Configuration Level
✅ Source of truth in `src/config/permissions.js`
- Centralized role-to-permission mapping
- Easy to audit and update
- All permission definitions in one place

### 2. Component Level
✅ Using `<Can>` wrapper component
```javascript
<Can permission="PERMISSION_NAME">
  {/* Hidden if user doesn't have permission */}
</Can>
```

### 3. Hook Level
✅ Using `usePermission()` hook
```javascript
const { can } = usePermission()
if (can('PERMISSION_NAME')) { /* show UI */ }
```

### 4. Handler Level
✅ Checking permissions before API calls
```javascript
const handleAction = async () => {
  if (!can('PERMISSION_NAME')) return
  // Execute action
}
```

---

## Testing Checklist

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| ADMIN | admin@example.com | admin123 |
| MANAGER | manager@example.com | manager123 |
| MEMBER | member@example.com | member123 |
| VIEWER | viewer@example.com | viewer123 |

### Test Steps

1. **Login as VIEWER**
   - [ ] Can view all pages (read-only)
   - [ ] No action buttons visible
   - [ ] Cannot edit anything
   - [ ] Cannot drag tasks

2. **Login as MEMBER**
   - [ ] Can view projects and tasks
   - [ ] "New Project" button NOT visible
   - [ ] Cannot edit tasks
   - [ ] Cannot drag tasks
   - [ ] Cannot add comments

3. **Login as MANAGER**
   - [ ] Can create/delete projects
   - [ ] Can edit/delete tasks
   - [ ] Can drag tasks
   - [ ] Can invite team members
   - [ ] Can view reports
   - [ ] Cannot access admin panel

4. **Login as ADMIN**
   - [ ] Can do everything
   - [ ] Can access admin panel
   - [ ] Can manage users
   - [ ] Can remove members

---

## Files & Locations

| File | Permissions | Lines |
|------|-----------|-------|
| src/config/permissions.js | Configuration | varies |
| src/hooks/usePermission.js | Permission hooks | varies |
| src/components/Can.jsx | Can wrapper | varies |
| src/pages/Dashboard.jsx | Dashboard buttons | varies |
| src/pages/Projects.jsx | Projects buttons | 287 |
| src/components/TaskDetailPanel.jsx | Task editing | varies |
| src/components/DraggableKanbanBoard.jsx | Drag-drop | varies |

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         User Login                      │
│    ↓ (email + password)                 │
├─────────────────────────────────────────┤
│  AuthContext                            │
│  • Verify credentials                   │
│  • Set user role                        │
│  • Store in localStorage                │
└────────────┬────────────────────────────┘
             │
    ┌────────▼──────────────┐
    │ usePermission()       │
    │ Gets user role from   │
    │ AuthContext           │
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────┐
    │ ROLE_PERMISSIONS lookup           │
    │ [ROLE] → [permissions array]      │
    │ Checks if role has permission     │
    └────────┬──────────────────────────┘
             │
    ┌────────▼──────────────┐
    │ Returns true/false    │
    │ can('PERMISSION_NAME')│
    └────────┬──────────────┘
             │
    ┌────────▼──────────────────────────┐
    │ Component Rendering               │
    │ • <Can> wrapper                   │
    │ • Conditional rendering           │
    │ • UI shows/hides                  │
    └──────────────────────────────────┘
```

---

## Summary

✅ **Complete RBAC System Implemented:**

| Role | Permissions | Use Case |
|------|-----------|----------|
| **VIEWER** | 1 (VIEW_PROJECT) | Read-only observers |
| **MEMBER** | 2 (VIEW_PROJECT, CREATE_TASK) | Basic contributors |
| **MANAGER** | 11 (All except user mgmt) | Project managers |
| **ADMIN** | 17 (All permissions) | System admins |

**Total Permissions: 17**
- Project: 5
- Task: 4
- Team: 3
- Comments: 2
- Admin: 3

**Implementation Complete! 🎉**

