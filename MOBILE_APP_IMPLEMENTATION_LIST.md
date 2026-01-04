# Mobile App Implementation List - Recent Frontend Changes

## 📱 Overview
This document lists all recent frontend changes that need to be implemented in the mobile app (Flutter).

**Last Updated:** January 2025

---

## 🆕 Recent Frontend Features to Implement

### 1. Budget Tracking - Edit & Delete Functionality ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- Edit existing budget entries
- Delete budget entries with confirmation
- Edit existing cost entries
- Delete cost entries with confirmation
- Budget History table with edit/delete actions
- Tracked Costs table with edit/delete actions

**API Endpoints:**
- `PUT /projects/budget/:id` - Update budget
- `DELETE /projects/budget/:id` - Delete budget
- `PUT /projects/costs/:id` - Update cost
- `DELETE /projects/costs/:id` - Delete cost

**Mobile App Implementation Required:**
- [ ] Budget list screen with edit/delete actions
- [ ] Cost list screen with edit/delete actions
- [ ] Edit budget dialog/form
- [ ] Edit cost dialog/form
- [ ] Delete confirmation dialogs
- [ ] Swipe-to-delete functionality (optional)

**Estimated Effort:** 2-3 days

---

### 2. Approval Center - Bulk Approve/Reject ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- Bulk approve multiple items at once
- Bulk reject multiple items at once
- Multi-select checkboxes for pending approvals
- Grouped processing by entity type
- Enhanced error handling for partial failures

**API Endpoints:**
- `POST /approvals/bulk` - Now supports both "approved" and "rejected" status

**Mobile App Implementation Required:**
- [ ] Multi-select UI for pending approvals
- [ ] Bulk approve button/action
- [ ] Bulk reject button/action
- [ ] Selection counter display
- [ ] Grouped processing logic
- [ ] Error handling for partial failures
- [ ] Success/error feedback

**Estimated Effort:** 2-3 days

---

### 3. Productivity Dashboard - All Employees Filter ⭐⭐ MEDIUM PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- "All Employees" option in employee filter
- Proper handling of empty employeeId parameter
- Display productivity metrics for all employees when "All Employees" is selected

**API Changes:**
- `GET /productivity/metrics` - Now properly handles missing employeeId parameter

**Mobile App Implementation Required:**
- [ ] "All Employees" option in employee dropdown
- [ ] Filter logic to omit employeeId when "All Employees" is selected
- [ ] Display all employees' productivity in list/grid view
- [ ] Aggregate statistics for all employees

**Estimated Effort:** 1-2 days

---

### 4. Billing Management - Invoice View & Edit ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- View full invoice details dialog
- Edit invoice details (date, amount, tax, currency, status, notes)
- Real-time calculation of tax and total
- Invoice items breakdown display
- Payment history display

**API Endpoints:**
- `GET /invoices/:id` - Get invoice details
- `PUT /invoices/:id` - Update invoice

**Mobile App Implementation Required:**
- [ ] Invoice detail view screen
- [ ] Edit invoice screen/form
- [ ] Invoice items list display
- [ ] Payment history display
- [ ] Real-time calculation logic
- [ ] Currency selection dropdown
- [ ] Status update functionality

**Estimated Effort:** 3-4 days

---

### 5. Leave Balance - Update Balance Feature ⭐⭐ MEDIUM PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- Update leave balance manually
- Update accrued leave
- Update used leave
- Update balance dialog with validation

**API Endpoints:**
- `PUT /leave/balance/update` - Update leave balance

**Mobile App Implementation Required:**
- [ ] Update balance screen/form
- [ ] Leave type selection
- [ ] Balance, accrued, used input fields
- [ ] Validation logic
- [ ] Success/error feedback

**Estimated Effort:** 1-2 days

---

### 6. Clock In/Out - Assigned Projects from Project Plans ⭐⭐⭐ HIGH PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- Display only assigned projects from project plans during clock-in
- Show allotted hours for each assigned project
- Filter projects based on employee assignment in project plans
- Remove fallback to all projects

**API Endpoints:**
- `GET /project-plan/employee/assigned` - Get assigned projects with allotted hours

**Mobile App Implementation Required:**
- [ ] Fetch assigned projects from project plans
- [ ] Display allotted hours in project selection
- [ ] Filter projects to show only assigned ones
- [ ] Update clock-in dialog to use assigned projects
- [ ] Display allotted hours in project chips/list

**Estimated Effort:** 2-3 days

---

### 7. Common Sidebar - Dynamic Menu Based on Permissions ⭐⭐ MEDIUM PRIORITY
**Status:** ✅ Implemented in Web | ⚠️ Partial in Mobile App

**Features Added:**
- Dynamic menu loading based on role and permissions
- Menu items filtered by permissions
- Path mapping for role-specific routes
- Nested menu support
- Menu grouping (Dashboard, Features, etc.)

**Mobile App Implementation Required:**
- [ ] Dynamic menu/drawer based on permissions
- [ ] Role-based menu filtering
- [ ] Permission-based feature access
- [ ] Menu item grouping
- [ ] Navigation based on permissions

**Estimated Effort:** 2-3 days

---

### 8. Payroll Export - Employee Filter & JSON Display ⭐⭐ MEDIUM PRIORITY
**Status:** ✅ Implemented in Web | ❌ Not in Mobile App

**Features Added:**
- Employee dropdown filter (instead of text input)
- Display selected employee name
- JSON format display in table format
- Dynamic filename with employee name
- Improved blob handling for all export types

**Mobile App Implementation Required:**
- [ ] Employee dropdown in payroll export screen
- [ ] Employee name display
- [ ] JSON data table view
- [ ] File download with dynamic naming
- [ ] Export format selection

**Estimated Effort:** 2-3 days

---

## 🔧 Technical Implementation Notes

### API Service Updates
The following API service methods have been added/updated:

```javascript
// Budget Tracking
updateProjectBudget: (id, data) => api.put(`/projects/budget/${id}`, data)
deleteProjectBudget: (id) => api.delete(`/projects/budget/${id}`)
updateProjectCost: (id, data) => api.put(`/projects/costs/${id}`, data)
deleteProjectCost: (id) => api.delete(`/projects/costs/${id}`)

// Approval Center
bulkApprove: (data) => api.post("/approvals/bulk", data) // Now supports status parameter

// Leave Balance
updateLeaveBalance: (data) => api.put("/leave/balance/update", data)

// Billing
updateInvoice: (id, data) => api.put(`/invoices/${id}`, data)

// Project Plans
getEmployeeAssignedProjects: (params) => api.get("/project-plan/employee/assigned", { params })
```

### State Management Updates
- Budget tracking now includes edit/delete state management
- Approval center includes bulk selection state
- Invoice management includes view/edit state

### UI/UX Patterns
- Confirmation dialogs for delete operations
- Edit dialogs with pre-populated data
- Bulk action buttons with selection count
- Expandable sections for detailed views
- Filter dropdowns instead of text inputs

---

## 📋 Implementation Priority

### High Priority (Implement First)
1. Clock In/Out - Assigned Projects from Project Plans
2. Budget Tracking - Edit & Delete Functionality
3. Approval Center - Bulk Approve/Reject
4. Billing Management - Invoice View & Edit

### Medium Priority
5. Leave Balance - Update Balance Feature
6. Productivity Dashboard - All Employees Filter
7. Payroll Export - Employee Filter & JSON Display
8. Common Sidebar - Dynamic Menu Based on Permissions

---

## 🎯 Estimated Total Effort

**High Priority Features:** 9-13 days
**Medium Priority Features:** 8-10 days
**Total Estimated Effort:** 17-23 days

---

## 📝 Notes

- All features should maintain offline support where applicable
- Error handling should match web implementation
- UI/UX should follow mobile app design patterns
- Test all features on both iOS and Android
- Ensure proper state management and data persistence
- Add loading states and error messages
- Implement proper navigation flows

---

## 🔄 Sync with Backend

Ensure mobile app API calls match the updated backend endpoints:
- Check request/response formats
- Verify authentication tokens
- Test error handling
- Validate data structures

---

**Next Steps:**
1. Review this list with the mobile app development team
2. Prioritize features based on business needs
3. Create detailed implementation tickets
4. Set up API integration tests
5. Begin implementation starting with high-priority features

