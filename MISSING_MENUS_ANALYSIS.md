# Missing Menus Analysis - Frontend Menu Settings

## 📋 Overview
This document identifies menu items that exist in routes/components but are missing from the menu_permissions table in the database.

**Analysis Date:** January 2025

---

## 🔍 Routes Found in App.jsx

### Admin Dashboard Routes (`/Dashboard/*`)
1. ✅ `/Dashboard` - Home (dashboard)
2. ✅ `/Dashboard/employee` - Employee Management
3. ✅ `/Dashboard/Settings` - Settings
4. ✅ `/Dashboard/AddUpdates` - Add Updates
5. ✅ `/Dashboard/Discipline` - Discipline
6. ✅ `/Dashboard/Areaofwork` - Area of Work
7. ✅ `/Dashboard/Variations` - Variations
8. ✅ `/Dashboard/Designation` - Designation
9. ✅ `/Dashboard/Roles` - Roles
10. ✅ `/Dashboard/Settings/MenuPermissions` - Menu Permissions
11. ✅ `/Dashboard/Settings/OvertimeRules` - Overtime Rules
12. ✅ `/Dashboard/Settings/AppSettings` - App Settings
13. ✅ `/Dashboard/lead` - Team Leads
14. ✅ `/Dashboard/hr` - HR Management
15. ✅ `/Dashboard/projects` - Projects
16. ✅ `/Dashboard/project-planning` - Project Planning
17. ✅ `/Dashboard/leaves` - Leaves
18. ✅ `/Dashboard/CompOffList` - Comp-Off List
19. ✅ `/Dashboard/profile` - Profile
20. ✅ `/Dashboard/create/:id?` - Add Employee
21. ✅ `/Dashboard/addLead` - Add Team Lead
22. ✅ `/Dashboard/addHr` - Add HR
23. ✅ `/Dashboard/addProject/:id?` - Add Project
24. ✅ `/Dashboard/Overtime` - Overtime Management
25. ✅ `/Dashboard/LeaveBalance` - Leave Balance
26. ✅ `/Dashboard/Shifts` - Shift Management
27. ✅ `/Dashboard/Payroll` - Payroll Export
28. ✅ `/Dashboard/Budget` - Budget Tracking
29. ✅ `/Dashboard/Projects/:projectId/Budget` - Project Budget
30. ✅ `/Dashboard/Billing` - Billing Management
31. ✅ `/Dashboard/Productivity` - Productivity Dashboard
32. ✅ `/Dashboard/Approvals` - Approval Center
33. ✅ `/Dashboard/EmployeeHome` - Employee Home
34. ✅ `/Dashboard/AddProjectDetails` - Add Project Details
35. ✅ `/Dashboard/AddLeaves` - Add Leaves
36. ✅ `/Dashboard/CompOff` - Comp-Off
37. ✅ `/Dashboard/TimeManagement` - Time Management
38. ✅ `/Dashboard/TeamLeadHome` - Team Lead Home
39. ✅ `/Dashboard/TeamLeadProjectWorks` - Project Work Details

### Reports Routes (`/Dashboard/Reports/*`)
40. ✅ `/Dashboard/Reports/ProjectReport` - Project Report
41. ✅ `/Dashboard/Reports/ConsolidatedReport` - Consolidated Report
42. ✅ `/Dashboard/Reports/EmployeeReport` - Employee Report
43. ✅ `/Dashboard/Reports/WeeklyReport` - Weekly Report
44. ✅ `/Dashboard/Reports/MonthlyReport` - Monthly Report
45. ✅ `/Dashboard/Reports/YearlyReport` - Yearly Report
46. ✅ `/Dashboard/Reports/CodeReport` - Discipline Code Report
47. ✅ `/Dashboard/Reports/LeaveReport` - Leave Report
48. ✅ `/Dashboard/Reports/Automated` - Automated Reports

### HR Dashboard Routes (`/Hr/*`)
49. ✅ `/Hr/LeaveBalance` - Leave Balance
50. ✅ `/Hr/create/:id?` - Add Employee (HR)
51. ✅ `/Hr/employee` - Employee Management (HR)
52. ✅ `/Hr/Settings` - Settings (HR)
53. ✅ `/Hr/AddUpdates` - Add Updates (HR)
54. ✅ `/Hr/Profile` - Profile
55. ✅ `/Hr/TimeManagement` - Time Management
56. ✅ `/Hr/AddLeaves` - Add Leaves
57. ✅ `/Hr/CompOff` - Comp-Off

### Team Lead Dashboard Routes (`/TeamLead/*`)
58. ✅ `/TeamLead/TimeManagement` - Time Management
59. ✅ `/TeamLead/AddLeaves` - Add Leaves
60. ✅ `/TeamLead/CompOff` - Comp-Off
61. ✅ `/TeamLead/Profile` - Profile
62. ✅ `/TeamLead/ProjectWorkDetails` - Project Work Details
63. ✅ `/TeamLead/Approvals` - Approval Center
64. ✅ `/TeamLead/Productivity` - Productivity Dashboard
65. ✅ `/TeamLead/ShiftManagement` - Shift Management
66. ✅ `/TeamLead/OvertimeManagement` - Overtime Management

### Employee Dashboard Routes (`/Employee/*`)
67. ✅ `/Employee/EmployeeHome` - Employee Home
68. ✅ `/Employee/TimeManagement` - Time Management
69. ✅ `/Employee/AddLeaves` - Add Leaves
70. ✅ `/Employee/CompOff` - Comp-Off
71. ✅ `/Employee/Profile` - Profile
72. ✅ `/Employee/ShiftDetails` - Shift Details

---

## 📊 Menu Items Currently in Database (from create_menu_permissions_table.sql)

### Main Menu Items
1. ✅ `dashboard` - Dashboard
2. ✅ `manage_employees` - Manage Employees
3. ✅ `manage_projects` - Manage Projects

### Phase 1 & 2 Features
4. ✅ `overtime_management` - Overtime Management
5. ✅ `leave_balance` - Leave Balance
6. ✅ `shift_management` - Shift Management
7. ✅ `payroll_export` - Payroll Export
8. ✅ `billing_invoicing` - Billing & Invoicing
9. ✅ `budget_tracking` - Budget Tracking
10. ✅ `productivity` - Productivity
11. ✅ `approval_center` - Approval Center
12. ✅ `automated_reports` - Automated Reports

### Settings Submenu
13. ✅ `settings_updates` - Updates
14. ✅ `settings_discipline` - Discipline
15. ✅ `settings_designation` - Designation
16. ✅ `settings_areaofwork` - Area of Work
17. ✅ `settings_variation` - Variation
18. ✅ `menu_permissions` - Menu Permissions

### Common Menu Items
19. ✅ `employee_dashboard` - Employee Dashboard
20. ✅ `teamlead_dashboard` - Team Lead Dashboard
21. ✅ `project_work_details` - Project Work Details
22. ✅ `time_management` - Time Management
23. ✅ `apply_leave` - Apply Leave
24. ✅ `compoff` - Comp-Off

### Reports Submenu (from SQL)
25. ✅ `employee_report` - Employee Report
26. ✅ `consolidated_report` - Consolidated Report
27. ✅ `project_report` - Project Report
28. ✅ `weekly_report` - Weekly Report
29. ✅ `monthly_report` - Monthly Report
30. ✅ `yearly_report` - Yearly Report
31. ✅ `discipline_report` - Discipline Report
32. ✅ `leave_report` - Leave Report

### Approvals Submenu
33. ✅ `leave_details` - Leave Details
34. ✅ `compoff_details` - Comp-Off Details

### Additional (from add_roles_menu_permission.sql)
35. ✅ `settings_roles` - Roles

---

## ❌ MISSING MENU ITEMS

### 1. Project Planning ⚠️ HIGH PRIORITY
**Route:** `/Dashboard/project-planning`  
**Component:** `ProjectPlanning`  
**Menu Key:** `project_planning`  
**Status:** ❌ NOT IN DATABASE

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('project_planning', 'Project Planning', '/Dashboard/project-planning', 'AccountTree', NULL, '["Admin"]', TRUE, 4)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 2. Team Leads Management ⚠️ HIGH PRIORITY
**Route:** `/Dashboard/lead`  
**Component:** `Leads`  
**Menu Key:** `manage_team_leads`  
**Status:** ❌ NOT IN DATABASE

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('manage_team_leads', 'Manage Team Leads', '/Dashboard/lead', 'People', NULL, '["Admin"]', TRUE, 2.5)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 3. HR Management ⚠️ HIGH PRIORITY
**Route:** `/Dashboard/hr`  
**Component:** `Hr`  
**Menu Key:** `manage_hr`  
**Status:** ❌ NOT IN DATABASE

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('manage_hr', 'Manage HR', '/Dashboard/hr', 'People', NULL, '["Admin"]', TRUE, 2.6)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 4. Settings - Overtime Rules ⚠️ MEDIUM PRIORITY
**Route:** `/Dashboard/Settings/OvertimeRules`  
**Component:** `OvertimeRules`  
**Menu Key:** `settings_overtime_rules`  
**Status:** ❌ NOT IN DATABASE (but Settings parent exists)

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('settings_overtime_rules', 'Overtime Rules', '/Dashboard/Settings/OvertimeRules', NULL, 'settings', '["Admin"]', TRUE, 45.5)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 5. Settings - App Settings ⚠️ MEDIUM PRIORITY
**Route:** `/Dashboard/Settings/AppSettings`  
**Component:** `AppSettings`  
**Menu Key:** `settings_app_settings`  
**Status:** ❌ NOT IN DATABASE (but Settings parent exists)

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('settings_app_settings', 'App Settings', '/Dashboard/Settings/AppSettings', NULL, 'settings', '["Admin"]', TRUE, 46)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 6. Add Employee (Create) ⚠️ LOW PRIORITY
**Route:** `/Dashboard/create/:id?`  
**Component:** `AddEmployee`  
**Menu Key:** `add_employee`  
**Status:** ❌ NOT IN DATABASE (but Manage Employees exists)

**Note:** This is typically accessed via "Add" button in Employee Management, so may not need separate menu item.

---

### 7. Add Team Lead ⚠️ LOW PRIORITY
**Route:** `/Dashboard/addLead`  
**Component:** `AddLead`  
**Menu Key:** `add_team_lead`  
**Status:** ❌ NOT IN DATABASE (but Manage Team Leads would exist)

**Note:** This is typically accessed via "Add" button in Team Lead Management, so may not need separate menu item.

---

### 8. Add HR ⚠️ LOW PRIORITY
**Route:** `/Dashboard/addHr`  
**Component:** `AddHr`  
**Menu Key:** `add_hr`  
**Status:** ❌ NOT IN DATABASE (but Manage HR would exist)

**Note:** This is typically accessed via "Add" button in HR Management, so may not need separate menu item.

---

### 9. Add Project ⚠️ LOW PRIORITY
**Route:** `/Dashboard/addProject/:id?`  
**Component:** `AddProject`  
**Menu Key:** `add_project`  
**Status:** ❌ NOT IN DATABASE (but Manage Projects exists)

**Note:** This is typically accessed via "Add" button in Project Management, so may not need separate menu item.

---

### 10. Add Project Details ⚠️ LOW PRIORITY
**Route:** `/Dashboard/AddProjectDetails`  
**Component:** `AddProjectDetails`  
**Menu Key:** `add_project_details`  
**Status:** ❌ NOT IN DATABASE

**Note:** This might be accessed from Project Work Details or Time Management, may not need separate menu item.

---

### 11. Profile ⚠️ LOW PRIORITY
**Route:** `/Dashboard/profile`, `/Employee/Profile`, `/TeamLead/Profile`, `/Hr/Profile`  
**Component:** `Profile`  
**Menu Key:** `profile`  
**Status:** ❌ NOT IN DATABASE

**Note:** Profile is typically accessed from user menu/dropdown, may not need separate menu item.

---

### 12. Reports Parent Menu ⚠️ MEDIUM PRIORITY
**Route:** N/A (Parent menu for reports)  
**Menu Key:** `reports`  
**Status:** ❌ NOT IN DATABASE (but individual report items exist)

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('reports', 'Reports', '/Dashboard/Reports', 'Assessment', NULL, '["Admin", "HR", "TL"]', TRUE, 19)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 13. Settings Parent Menu ⚠️ MEDIUM PRIORITY
**Route:** `/Dashboard/Settings`  
**Menu Key:** `settings`  
**Status:** ❌ NOT IN DATABASE (but Settings submenu items exist)

**Suggested SQL:**
```sql
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) 
VALUES ('settings', 'Settings', '/Dashboard/Settings', 'Settings', NULL, '["Admin"]', TRUE, 39)
ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

### 14. Approvals Parent Menu ⚠️ MEDIUM PRIORITY
**Route:** N/A (Parent menu for approvals)  
**Menu Key:** `approvals`  
**Status:** ❌ NOT IN DATABASE (but Approval Center and approval submenu items exist)

**Note:** This might be redundant since "Approval Center" already exists as a main menu item.

---

## 📝 Summary

### High Priority Missing Menus (Should be added)
1. ✅ **Project Planning** - Main feature, should be visible
2. ✅ **Manage Team Leads** - Main feature, should be visible
3. ✅ **Manage HR** - Main feature, should be visible

### Medium Priority Missing Menus (Should be added)
4. ✅ **Settings - Overtime Rules** - Submenu item
5. ✅ **Settings - App Settings** - Submenu item
6. ✅ **Reports Parent Menu** - Parent for all reports
7. ✅ **Settings Parent Menu** - Parent for all settings

### Low Priority Missing Menus (May not need menu items)
- Add Employee, Add Team Lead, Add HR, Add Project (typically accessed via buttons)
- Add Project Details (typically accessed from other screens)
- Profile (typically accessed from user menu)

---

## 🔧 Recommended SQL Script

Create a new migration file: `back-end/database/add_missing_menu_permissions.sql`

```sql
-- Add missing menu permissions

-- Main Menu Items
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('project_planning', 'Project Planning', '/Dashboard/project-planning', 'AccountTree', NULL, '["Admin"]', TRUE, 4),
('manage_team_leads', 'Manage Team Leads', '/Dashboard/lead', 'People', NULL, '["Admin"]', TRUE, 2.5),
('manage_hr', 'Manage HR', '/Dashboard/hr', 'People', NULL, '["Admin"]', TRUE, 2.6),

-- Parent Menus
('reports', 'Reports', '/Dashboard/Reports', 'Assessment', NULL, '["Admin", "HR", "TL"]', TRUE, 19),
('settings', 'Settings', '/Dashboard/Settings', 'Settings', NULL, '["Admin"]', TRUE, 39),

-- Settings Submenu Items
('settings_overtime_rules', 'Overtime Rules', '/Dashboard/Settings/OvertimeRules', NULL, 'settings', '["Admin"]', TRUE, 45.5),
('settings_app_settings', 'App Settings', '/Dashboard/Settings/AppSettings', NULL, 'settings', '["Admin"]', TRUE, 46)

ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
```

---

## ✅ Next Steps

1. Run the SQL script to add missing menu items
2. Verify menu items appear in Menu Permissions settings page
3. Test menu visibility for different roles
4. Update CommonSidebar if needed to handle new menu items

