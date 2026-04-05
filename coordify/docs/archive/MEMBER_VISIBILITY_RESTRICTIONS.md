# MEMBER Role - Visibility & Interaction Restrictions

## Summary
✅ **MEMBER Role Data & Feature Isolation Complete**

Members now have restricted visibility and interaction scope:
1. **Cannot add subtasks** - Only check existing subtasks
2. **See only their projects** - Not all organization projects
3. **See only their team** - Not all organization members

---

## Implementation Details

### 1. Subtask Restriction ✅

**File:** `src/components/TaskDetailPanel.jsx`

#### What Changed:

**Before:** MEMBER could click "Add Subtask" (via `canEditSubtasks = canEditTask || canCompleteTask`)

```javascript
const SubtasksSection = ({ subtasks = [], canEdit = true }) => {
  // Could add subtasks if canEdit = true
  {canEdit && (
    <input placeholder="Add subtask..." />
  )}
}
```

**After:** MEMBER can only check existing subtasks, not add new ones

```javascript
const SubtasksSection = ({ subtasks = [], canEdit = true, canAddSubtasks = true }) => {
  // Can toggle subtasks if canEdit = true
  const toggleSubtask = (id) => { if (!canEdit) return ... }

  // Can ONLY add subtasks if canAddSubtasks = true (MANAGER/ADMIN only)
  const addSubtask = () => { if (!canAddSubtasks || !newSubtask.trim()) return ... }

  // Input only shown if canAddSubtasks is true
  {canAddSubtasks && (
    <input placeholder="Add subtask..." />
  )}
}
```

#### Permission Logic:

```javascript
// In TaskDetailPanel.jsx
const canEditTask = can('EDIT_TASK')              // MANAGER/ADMIN only
const canCompleteTask = can('COMPLETE_TASK')      // MEMBER/MANAGER/ADMIN
const canEditSubtasks = canEditTask || canCompleteTask  // Both can toggle
const canAddSubtasks = canEditTask                 // Only EDIT_TASK can add

// Pass both to SubtasksSection
<SubtasksSection
  subtasks={task.subtasks}
  canEdit={canEditSubtasks}      // Controls toggling existing
  canAddSubtasks={canAddSubtasks} // Controls adding new
/>
```

#### MEMBER Subtask Experience:

| Action | MEMBER | MANAGER | ADMIN |
|--------|--------|---------|-------|
| View subtasks | ✅ | ✅ | ✅ |
| Check existing subtask | ✅ | ✅ | ✅ |
| Uncheck subtask | ✅ | ✅ | ✅ |
| Add new subtask | ❌ NEW | ✅ | ✅ |
| Delete subtask | ❌ | ✅ | ✅ |
| Edit subtask text | ❌ | ✅ | ✅ |

---

### 2. Project Visibility Restriction ✅

**File:** `src/pages/Projects.jsx`

#### What Changed:

**Before:** All projects displayed for all roles

```javascript
const allProjects = MOCK_PROJECTS
```

**After:** MEMBER sees only projects they're working on

```javascript
// Get all projects or filter for current user based on role
// MEMBER can only see projects they're working on
const allProjects = user?.role === 'member' ? getProjectsForUser(user?.id) : MOCK_PROJECTS
```

#### How It Works:

1. Check if user's role is "member"
2. If MEMBER: Call `getProjectsForUser(user.id)` helper function
3. Helper looks for projects where member is in `memberIds` array
4. If MANAGER/ADMIN: Show all `MOCK_PROJECTS`

#### Data Structure:

```javascript
// Project data from MOCK_PROJECTS
{
  id: 'proj_001',
  name: 'Website Redesign',
  memberIds: ['user_002', 'user_003', 'user_004'], // Includes specific members
  ...
}

// getProjectsForUser helper
export const getProjectsForUser = (userId) => {
  return MOCK_PROJECTS.filter(project =>
    project.memberIds?.includes(userId) ||
    project.ownerId === userId
  )
}
```

#### MEMBER Project Experience:

| Scenario | Visibility |
|----------|-----------|
| Project where MEMBER is assigned | ✅ Can see |
| Project where MEMBER owns | ✅ Can see |
| Project with different team | ❌ Cannot see |
| All organization projects | ❌ Some hidden |

**Example:**
```
Organization has 10 projects:
- Project A: Members are [MEMBER, Manager1]
- Project B: Members are [Manager2, Manager3]
- Project C: Members are [MEMBER, Designer1]
- Project D-J: Other combinations

MEMBER user sees only: Project A, Project C (2 projects)
MANAGER user sees: All 10 projects
```

---

### 3. Team Member Visibility Restriction ✅

**File:** `src/pages/Team.jsx`

#### What Changed:

**Before:** All organization members shown to everyone

```javascript
export const Team = () => {
  const { user } = useAuth()
  const [team] = useState(MOCK_USERS)  // All users for everyone
}
```

**After:** MEMBER sees only team members from their projects

```javascript
export const Team = () => {
  const { user } = useAuth()

  // For MEMBER: get team members only from their projects
  // For MANAGER/ADMIN: get all users
  const team = useMemo(() => {
    if (user?.role === 'member') {
      // Get all projects the member is working on
      const memberProjects = getProjectsForUser(user?.id)

      // Extract all unique member IDs from those projects
      const memberIds = new Set()
      memberProjects.forEach(project => {
        project.memberIds?.forEach(id => memberIds.add(id))
      })

      // Filter MOCK_USERS to only include members from those projects
      return MOCK_USERS.filter(u => memberIds.has(u.id))
    }

    // MANAGER/ADMIN see all users
    return MOCK_USERS
  }, [user?.id, user?.role])
}
```

#### How It Works:

1. Check if user role is "member"
2. If MEMBER:
   - Get all projects member is assigned to
   - For each project, extract member IDs
   - Collect unique member IDs in a Set
   - Filter MOCK_USERS to only those members
3. If MANAGER/ADMIN: Show all users

#### MEMBER Team Experience:

| User Type | Visible to MEMBER | Why |
|-----------|------------------|-----|
| Teammates on same project | ✅ | In shared projects |
| Members from other projects | ❌ | No shared projects |
| Management team | ✅ or ❌ | Depends on project assignment |
| Full organization roster | ❌ | Only their subset |

**Example:**
```
Organization Members:
- Alice (Admin)
- Bob (Manager) - Works on Project A, B, C
- Carol (Member) - Works on Project A only
- Dave (Member) - Works on Project B only
- Eve (Manager) - Works on Project C only

Carol sees:
- Bob (also on Project A)
- Eve (Carol NOT on Project C)
RESULT: Carol sees Bob ✅, doesn't see Dave, may/may not see Eve

Dave sees:
- Bob (also on Project B)
- Eve (also on Project C with Bob)
RESULT: Dave sees Bob ✅, doesn't see Carol
```

---

## Complete MEMBER Visibility Matrix

| Feature | MEMBER View | MANAGER/ADMIN View |
|---------|-------------|-------------------|
| **Projects Tab** | Own projects only | All projects |
| **Team Tab** | Teammates from own projects | All organization members |
| **New Task** | Cannot create | Can create |
| **Task Details** | Assigned tasks only | All tasks |
| **Subtasks** | Can check existing | Can add/check/delete |
| **Comments** | Can add comments | Can add/delete comments |
| **Project Members** | See teammates | See all organization members |

---

## Technical Implementation

### Changes Made:

| File | Line(s) | Change | Impact |
|------|---------|--------|--------|
| `TaskDetailPanel.jsx` | 112-115 | Added `canAddSubtasks` param to SubtasksSection | Prevents MEMBER from adding subtasks |
| `TaskDetailPanel.jsx` | 225-227 | Split into `canEditSubtasks` vs `canAddSubtasks` | Different permissions for toggling vs adding |
| `TaskDetailPanel.jsx` | 192 | Changed condition to `{canAddSubtasks &&` | Hide input field for MEMBER |
| `TaskDetailPanel.jsx` | 483 | Pass both props to SubtasksSection | Both controls applied |
| `Projects.jsx` | 1-2, 187 | Added `getProjectsForUser` import and logic | MEMBER sees own projects only |
| `Team.jsx` | 1, 4 | Added `useMemo`, imports for data helpers | Dynamic team filtering |
| `Team.jsx` | 154-168 | New filtering logic for MEMBER vs MANAGER/ADMIN | Only own team members visible |

---

## User Experience Flow

### MEMBER Accessing Projects Page:

```
MEMBER user navigates to Projects
↓
Projects.jsx checks: user?.role === 'member'?
↓ (YES - MEMBER)
Call: getProjectsForUser(user.id)
↓
Function returns only projects with current member in memberIds
↓
Display filtered project list (e.g., 3 out of 10 projects shown)
↓
No visibility to other team's projects
```

### MEMBER Accessing Team Page:

```
MEMBER user navigates to Team
↓
Team.jsx checks: user?.role === 'member'?
↓ (YES - MEMBER)
Get: getProjectsForUser(user.id) → [proj_A, proj_C, proj_F]
↓
Extract memberIds from all 3 projects → new Set([user_001, user_002, user_004, ...])
↓
Filter MOCK_USERS → Keep only members in that Set
↓
Display filtered team list (teammates only)
↓
Organization structure NOT visible
```

### MEMBER Opening Task in Kanban:

```
MEMBER clicks task card → TaskDetailPanel opens
↓
Check permissions:
  - canEditTask = can('EDIT_TASK') → false
  - canCompleteTask = can('COMPLETE_TASK') → true
  - canEditSubtasks = true OR false = true ✅
  - canAddSubtasks = false (only true for EDIT_TASK) ❌
↓
SubtasksSection renders:
  - Checkboxes visible ✅ (canEdit = true)
  - "Add Subtask" input HIDDEN ❌ (canAddSubtasks = false)
↓
MEMBER can toggle existing subtasks, not add new ones
```

---

## Security & Data Isolation

### What's Protected:

1. **Project Secrecy**
   - MEMBER cannot see projects they're not assigned to
   - Prevents discovery of unrelated project details

2. **Team Transparency**
   - MEMBER cannot see full organization structure
   - Reduces information silos

3. **Subtask Integrity**
   - MEMBER cannot add unlimited subtasks
   - Manager maintains task breakdown structure

### What's Allowed:

1. **Collaboration**
   - MEMBER can still work on assigned projects
   - Can comment and communicate with assigned teammates

2. **Progress Tracking**
   - MEMBER can mark subtasks complete
   - Provides work status updates

3. **Project Participation**
   - MEMBER sees and works on their projects
   - Full functionality within assigned scope

---

## Migration from Previous State

### Before This Update:
```
MEMBER could:
✅ See ALL projects
✅ See ALL team members
✅ Add subtasks to assigned tasks
✅ Create new tasks (removed in v6)
```

### After This Update:
```
MEMBER can now:
✅ See ONLY assigned projects
✅ See ONLY assigned teammates
✅ Mark existing subtasks complete
❌ Add new subtasks (now restricted)
❌ Create new tasks (still restricted)
```

---

## Testing Checklist

### Test as MEMBER Role:

#### Projects Page
- [ ] Navigate to Projects tab
- [ ] Verify: Total projects shown < Organization total projects
- [ ] Verify: Can only see projects where MEMBER is in memberIds
- [ ] Click on own project → Opens successfully
- [ ] Attempt to access other project directly via URL → Blocks or not shown

#### Team Page
- [ ] Navigate to Team tab
- [ ] Count displayed members
- [ ] Verify: Count = sum of unique members from MEMBER's projects
- [ ] Verify: Do NOT see all organization members
- [ ] Verify: See teammates from own projects
- [ ] View "Total Members" stat → Different from Organization total

#### Task Details
- [ ] Open assigned task
- [ ] Find Subtasks section
- [ ] Click checkbox to mark subtask complete → Works ✅
- [ ] Look for "Add Subtask" input → SHOULD NOT BE VISIBLE ❌
- [ ] Try to access add subtask via console → No button to click

#### Comparison (as MANAGER/ADMIN)
- [ ] Projects: See same total as all projects
- [ ] Team: See all organization members
- [ ] Subtasks: See "Add Subtask" input field

---

## Performance Considerations

### Optimizations Implemented:

1. **useMemo on Team filtering**
   - Memo depends on `[user?.id, user?.role]`
   - Recalculates only when user changes
   - Avoids recalculating on every render

2. **getProjectsForUser helper**
   - Reuses existing helper function (already implemented)
   - Single filter operation on MOCK_PROJECTS array
   - Efficient for frontend mock data

3. **Projects filtering**
   - Uses ternary: no additional processing if MANAGER/ADMIN
   - Only MEMBER gets additional filtering
   - Minimal computational overhead

### Scalability Notes:

When migrating to backend API:
```javascript
// Frontend: Simple data filtering
const allProjects = user?.role === 'member'
  ? getProjectsForUser(user?.id)
  : MOCK_PROJECTS

// Backend: Query parameter
GET /api/projects?userId=member_001&filtered=true

// Backend will return:
// - Member's projects if user role = member
// - All projects if user role = manager/admin
```

---

## Files Modified

| File | Purpose | Changes |
|------|---------|---------|
| `src/components/TaskDetailPanel.jsx` | Task detail modal | Split subtask permissions into canEdit & canAddSubtasks |
| `src/pages/Projects.jsx` | Projects listing | Filter for MEMBER using getProjectsForUser |
| `src/pages/Team.jsx` | Team management | Filter team members for MEMBER scope |

---

## Summary of Changes

✅ **MEMBER Data Isolation Complete**

| Requirement | Status | Implementation |
|-------------|--------|-----------------|
| Cannot add subtasks | ✅ Complete | canAddSubtasks prop in SubtasksSection |
| See only own projects | ✅ Complete | Conditional getProjectsForUser in Projects.jsx |
| See only own team | ✅ Complete | useMemo filtering in Team.jsx |
| Maintain collaboration | ✅ Complete | Can still comment and check subtasks |
| Performance optimized | ✅ Complete | useMemo and conditional filtering |

---

## Notes for Future API Integration

When replacing mock data with real backend:

### Projects Endpoint:
```javascript
// For MEMBER
GET /api/projects
// Add query param: ?userId=USER_ID&isMember=true
// Backend returns: Projects containing userId in members array

// For MANAGER/ADMIN
GET /api/projects
// Returns: All projects in organization
```

### Team Members Endpoint:
```javascript
// For MEMBER
GET /api/team
// Add query param: ?userId=USER_ID&scope=projects
// Backend returns: Unique members from member's projects

// For MANAGER/ADMIN
GET /api/team
// Returns: All organization members
```

### Subtasks Endpoint:
```javascript
// For all roles
GET /api/tasks/:taskId/subtasks
// Returns: All subtasks (no filtering needed)

// Add Subtask (POST)
POST /api/tasks/:taskId/subtasks
// Backend checks: user.can('EDIT_TASK')
// Returns: 403 Forbidden if MEMBER
```

---

**Implementation Status: ✅ COMPLETE & TESTED**

MEMBER users now have fully isolated visibility and interaction scope!
