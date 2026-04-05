# QUICK TEST GUIDE - VIEWER RESTRICTIONS

## 5-Minute Test

### Test Credentials
```
VIEWER:  viewer@example.com  /  viewer123
MEMBER:  member@example.com  /  member123
MANAGER: manager@example.com / manager123
ADMIN:   admin@example.com   / admin123
```

---

## Test Procedure

### 1. Dashboard Page (2 minutes)

**Login as VIEWER:**
1. Open http://localhost:3000/login
2. Email: `viewer@example.com`
3. Password: `viewer123`
4. Click "Sign In"

**Expected Results for VIEWER:**
- ✅ See dashboard with stats
- ✅ See "Recent Activity" section
- ✅ See "My Tasks" section
- ❌ **"New Task" button should NOT be visible**
- ❌ **"Reports & Analytics" section should NOT be visible**
- ❌ **"Generate Report" button should NOT be visible**

**If VIEWER can see any of these buttons, restart browser and clear cache**

---

### 2. Projects Page (2 minutes)

**Still logged in as VIEWER:**
1. Click "Projects" in top navigation
2. Look at the projects grid

**Expected Results for VIEWER:**
- ✅ See all project cards
- ✅ Can see project details, progress, teams
- ❌ **"New Project" button should NOT be visible**
- ❌ **No delete/trash icon on project cards**

**Try as MEMBER to compare:**
1. Logout and login as `member@example.com` / `member123`
2. Go to Projects

**Member should NOT see "New Project" button but VIEWER also doesn't**

---

### 3. Projects Page - Delete Button Test (1 minute)

**Still as MEMBER:**
1. Look for delete/trash icon on project cards
2. Should NOT be visible for MEMBER

**Now as MANAGER:**
1. Logout and login as `manager@example.com` / `manager123`
2. Go to Projects

**Manager SHOULD see:**
- ✅ "New Project" button
- ✅ Delete/trash icon on cards

**This proves permission system is working correctly**

---

### 4. Admin Panel Test (30 seconds)

**Logged in as VIEWER:**
1. Try to navigate to: `http://localhost:3000/admin`
2. Should see "Permission Denied" page with message

**Expected Message:**
```
🔒
Access Denied

You don't have the required permission
to access this resource.
```

**Logged in as ADMIN:**
1. Logout and login as `admin@example.com` / `admin123`
2. Navigate to: `http://localhost:3000/admin`
3. Should see full Admin Panel

---

## Complete Comparison Table

### Dashboard Page

| Feature | VIEWER | MEMBER | MANAGER | ADMIN |
|---------|--------|--------|---------|-------|
| View Stats | ✅ | ✅ | ✅ | ✅ |
| New Task Button | ❌ | ✅ | ✅ | ✅ |
| Reports Section | ❌ | ❌ | ❌ | ✅ |
| Generate Report | ❌ | ❌ | ❌ | ✅ |
| Team Report | ❌ | ❌ | ❌ | ✅ |

### Projects Page

| Feature | VIEWER | MEMBER | MANAGER | ADMIN |
|---------|--------|--------|---------|-------|
| View Projects | ✅ | ✅ | ✅ | ✅ |
| New Project | ❌ | ❌ | ✅ | ✅ |
| Delete Project | ❌ | ❌ | ✅ | ✅ |

### Permissions

| Feature | VIEWER | MEMBER | MANAGER | ADMIN |
|---------|--------|--------|---------|-------|
| READ | ✅ | ✅ | ✅ | ✅ |
| CREATE | ❌ | Partial | ✅ | ✅ |
| EDIT | ❌ | Partial | ✅ | ✅ |
| DELETE | ❌ | ❌ | ✅ | ✅ |
| MANAGE | ❌ | ❌ | Partial | ✅ |

---

## Browser Console Test (Optional)

```javascript
// Open DevTools: F12 or Right-click → Inspect

// Test permission system
const { can } = usePermission()

// For VIEWER, should all be false except VIEW_PROJECT
console.log(can('CREATE_PROJECT'))    // false
console.log(can('DELETE_PROJECT'))    // false
console.log(can('CREATE_TASK'))       // false
console.log(can('DELETE_TASK'))       // false
console.log(can('VIEW_REPORTS'))      // false
console.log(can('MANAGE_USERS'))      // false
console.log(can('VIEW_PROJECT'))      // true ← only this is true

// Check user info
const { user } = useAuth()
console.log(user)
// Should show: { role: 'viewer', ... }
```

---

## What Changed

**File Modified:** `src/config/permissions.js` (Lines 99-103)

**Change:**
```javascript
// BEFORE
[ROLES.VIEWER]: [
  PERMISSIONS.VIEW_PROJECT,
  PERMISSIONS.CREATE_COMMENT,  // ← Removed this
],

// AFTER
[ROLES.VIEWER]: [
  PERMISSIONS.VIEW_PROJECT,  // ← Only this remains
],
```

---

## Success Criteria Checklist

- [ ] VIEWER cannot see "New Project" button
- [ ] VIEWER cannot see delete icons on projects
- [ ] VIEWER cannot see "New Task" button
- [ ] VIEWER cannot see "Reports" section
- [ ] VIEWER cannot access /admin
- [ ] MEMBER has "New Task" button
- [ ] MANAGER has "New Project" + delete buttons
- [ ] ADMIN has access to everything
- [ ] All role transitions work smoothly

---

## If Something Doesn't Work

### Issue: Buttons still showing for VIEWER
**Solution:**
1. Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache: DevTools → Application → Clear Site Data
3. Close and reopen browser
4. Check file modification: `src/config/permissions.js`

### Issue: Getting errors in console
**Solution:**
1. Check that all files are saved
2. Verify no syntax errors: Look at VS Code
3. Restart dev server: Stop and run `npm run dev`

### Issue: Still seeing buttons on VIEWER
**Solution:**
1. Verify logged in as correct user: Check user avatar/name
2. Check browser console: Are there any red errors?
3. Verify file change was saved: Grep the file

---

## Expected Behavior Summary

```
VIEWER Role = Read-Only Access Only

✅ Can view everything
✅ Can read projects, tasks, team info
✅ Cannot modify anything
✅ Cannot delete anything
✅ Cannot access admin features
✅ Smooth, intuitive experience

Result: Perfect for observers, stakeholders, clients
```

---

## Time Estimate

- **Setup:** 30 seconds (clear cache, reload)
- **Test Dashboard:** 2 minutes
- **Test Projects:** 1.5 minutes
- **Test Admin:** 30 seconds
- **Total:** ~4-5 minutes

---

## Success Output

When done correctly, you should see:

```
VIEWER user sees:        ADMIN user sees:
✅ Projects (read-only)   ✅ Projects (+ create, delete)
✅ Tasks (read-only)      ✅ Tasks (+ create, edit, delete)
✅ Team (read-only)       ✅ Team (+ invite, remove)
❌ No action buttons      ✅ All management options
❌ No admin access        ✅ Admin panel access
```

---

## Documentation Files

- **`VIEWER_ROLE_RESTRICTIONS.md`** - Detailed breakdown
- **`VISUAL_COMPARISON_GUIDE.md`** - Visual UI comparison
- **`VIEWER_RESTRICTIONS_SUMMARY.md`** - Complete summary
- **`QUICK_START_GUIDE.md`** - Implementation patterns
- **`RBAC_TESTING_GUIDE.md`** - Full testing scenarios

---

**Test Instructions Complete! ✅**

Ready to verify? Start the dev server and test now! 🚀
