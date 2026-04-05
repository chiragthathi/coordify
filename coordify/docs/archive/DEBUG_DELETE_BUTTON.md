# Debug Guide - Delete Button for ADMIN Users

## Steps to Debug

### Step 1: Check Browser Console
1. Log in as ADMIN: `admin@example.com` / `admin123`
2. Navigate to Projects page
3. Open Browser Console (F12 → Console tab)
4. Look for debug messages starting with "🔐 DEBUG"

You should see:
```
🔐 DEBUG - User: {id: 'user_admin_001', email: 'admin@example.com', role: 'admin', ...}
🔐 DEBUG - User Role: admin
🔐 DEBUG - Can Delete Project: true
```

### Step 2: Verify User Role Shows as 'admin'
- If User Role shows something other than `admin` (e.g., `ADMIN` or `undefined`), that's the issue

### Step 3: Check if Projects Are Showing
- If filteredProjects.length === 0, that's why delete button appears nowhere
- Add this debug to verify: Check the count shown like "Showing 3 of 10 projects"

---

## Common Issues & Solutions

### Issue 1: Can Delete Project shows FALSE
**Possible Causes:**
- User not actually logged in as admin
- Session cleared
- Browser cache issue

**Solution:**
1. Log out (click profile → Logout)
2. Clear browser cache (Ctrl+Shift+Delete)
3. Refresh page (Ctrl+F5)
4. Log back in as admin@example.com

### Issue 2: No Projects Showing
**Possible Causes:**
- MOCK_PROJECTS is empty
- Projects filtered incorrectly

**Solution:**
- Try resetting project filters (click "Clear filters" if shown)
- Try a different project search

### Issue 3: Delete Button Still Not Visible After True
**This shouldn't happen, but if it does:**
- The ProjectCard component might have a CSS issue
- Check that Trash2 icon is importing correctly
- Hard refresh browser (Ctrl+Shift+R)

---

## Manual Permission Test

Open browser console and paste this:

```javascript
// Test permission system directly
import('./src/config/permissions.js').then(mod => {
  console.log('ADMIN has DELETE_PROJECT:', mod.hasPermission('admin', 'DELETE_PROJECT'))
  console.log('MANAGER has DELETE_PROJECT:', mod.hasPermission('manager', 'DELETE_PROJECT'))
  console.log('MEMBER has DELETE_PROJECT:', mod.hasPermission('member', 'DELETE_PROJECT'))
  console.log('VIEWER has DELETE_PROJECT:', mod.hasPermission('viewer', 'DELETE_PROJECT'))
})
```

Expected output:
```
ADMIN has DELETE_PROJECT: true
MANAGER has DELETE_PROJECT: false
MEMBER has DELETE_PROJECT: false
VIEWER has DELETE_PROJECT: false
```

---

## What to Report

Please check console and let me know:

1. What does "Can Delete Project:" show?
   - ✅ If `true` → Permission system is working
   - ❌ If `false` → Permission check failing

2. What does "User Role:" show?
   - Should be `admin` (lowercase)
   - If different, tell me what it shows

3. Are projects shown on the page?
   - Count displayed like "Showing 3 of 10 projects"?
   - Or "No projects found"?

4. Browser and steps you took to get to this point

---

## Temporary Debug View

I've added console logging to the Projects page. When you load Projects as ADMIN, you'll see debug messages in the console. This will help us identify if:

1. Permission check is returning true/false
2. User object is populated correctly
3. Role is showing correctly

Please share what the console says!
