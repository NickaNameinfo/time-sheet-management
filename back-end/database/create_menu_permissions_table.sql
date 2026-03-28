-- Create menu_permissions table
-- This table stores permission settings for menu items based on roles

CREATE TABLE IF NOT EXISTS `menu_permissions` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `menu_key` VARCHAR(100) NOT NULL UNIQUE,
  `menu_title` VARCHAR(255) NOT NULL,
  `menu_path` VARCHAR(255),
  `menu_icon` VARCHAR(100),
  `parent_menu` VARCHAR(100) DEFAULT NULL,
  `allowed_roles` JSON NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `display_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_parent_menu (parent_menu),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default menu permissions
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
-- Main Menu Items
('dashboard', 'Dashboard', '/Dashboard', 'Dashboard', NULL, '["Admin"]', TRUE, 1),
('manage_employees', 'Manage Employees', '/Dashboard/employee', 'People', NULL, '["Admin", "HR"]', TRUE, 2),
('manage_projects', 'Manage Projects', '/Dashboard/projects', 'Business', NULL, '["Admin"]', TRUE, 3),

-- Phase 1 & 2 Features
('overtime_management', 'Overtime Management', '/Dashboard/Overtime', 'Schedule', NULL, '["Admin", "HR", "TL"]', TRUE, 10),
('leave_balance', 'Leave Balance', '/Dashboard/LeaveBalance', 'EventAvailable', NULL, '["Admin", "HR", "TL", "Employee"]', TRUE, 11),
('shift_management', 'Shift Management', '/Dashboard/Shifts', 'WorkHistory', NULL, '["Admin", "HR"]', TRUE, 12),
('payroll_export', 'Payroll Export', '/Dashboard/Payroll', 'Payments', NULL, '["Admin", "HR"]', TRUE, 13),
('billing_invoicing', 'Billing & Invoicing', '/Dashboard/Billing', 'AccountBalance', NULL, '["Admin"]', TRUE, 14),
('budget_tracking', 'Budget Tracking', '/Dashboard/Budget', 'AccountTree', NULL, '["Admin"]', TRUE, 15),
-- productivity moved under employee_productivity (see below)
('approval_center', 'Approval Center', '/Dashboard/Approvals', 'CheckCircle', NULL, '["Admin", "HR", "TL"]', TRUE, 17),
('automated_reports', 'Automated Reports', '/Dashboard/Reports/Automated', 'Email', NULL, '["Admin"]', TRUE, 18),

-- Approvals Submenu
('leave_details', 'Leave Details', '/Dashboard/leaves', NULL, 'approvals', '["Admin", "HR"]', TRUE, 20),
('compoff_details', 'Comp-Off Details', '/Dashboard/CompOffList', NULL, 'approvals', '["Admin", "HR"]', TRUE, 21),

-- Reports Submenu
('employee_report', 'Employee Report', '/Dashboard/Reports/EmployeeReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 30),
('consolidated_report', 'Consolidated Report', '/Dashboard/Reports/ConsolidatedReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 31),
('project_report', 'Project Report', '/Dashboard/Reports/ProjectReport', NULL, 'reports', '["Admin", "TL"]', TRUE, 32),
('weekly_report', 'Weekly Report', '/Dashboard/Reports/WeeklyReport', NULL, 'reports', '["Admin", "HR", "TL"]', TRUE, 33),
('monthly_report', 'Monthly Report', '/Dashboard/Reports/MonthlyReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 34),
('yearly_report', 'Yearly Report', '/Dashboard/Reports/YearlyReport', NULL, 'reports', '["Admin"]', TRUE, 35),
('discipline_report', 'Discipline Report', '/Dashboard/Reports/CodeReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 36),
('leave_report', 'Leave Report', '/Dashboard/Reports/LeaveReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 37),

-- Settings Submenu
('settings_updates', 'Updates', '/Dashboard/Settings', NULL, 'settings', '["Admin"]', TRUE, 40),
('settings_discipline', 'Discipline', '/Dashboard/Discipline', NULL, 'settings', '["Admin"]', TRUE, 41),
('settings_designation', 'Designation', '/Dashboard/Designation', NULL, 'settings', '["Admin"]', TRUE, 42),
('settings_areaofwork', 'Area of Work', '/Dashboard/Areaofwork', NULL, 'settings', '["Admin"]', TRUE, 43),
('settings_variation', 'Variation', '/Dashboard/Variations', NULL, 'settings', '["Admin"]', TRUE, 44),
('menu_permissions', 'Menu Permissions', '/Dashboard/Settings/MenuPermissions', NULL, 'settings', '["Admin"]', TRUE, 45),

-- Employee Productivity parent (employee work-related items grouped here)
('employee_productivity', 'Employee Productivity', '/Dashboard/EmployeeHome', 'TrendingUp', NULL, '["TL", "Admin", "Employee", "HR"]', TRUE, 50),
-- Employee Productivity submenus
('employee_dashboard', 'Employee Dashboard', '/Dashboard/EmployeeHome', 'Dashboard', 'employee_productivity', '["TL", "Admin", "Employee", "HR"]', TRUE, 50.1),
('teamlead_dashboard', 'Team Lead Dashboard', '/Dashboard/TeamLeadHome', 'Dashboard', 'employee_productivity', '["TL", "Admin"]', TRUE, 50.2),
('project_work_details', 'Project Work Details', '/Dashboard/TeamLeadProjectWorks', 'Assignment', 'employee_productivity', '["TL", "Admin"]', TRUE, 50.3),
('time_management', 'Time Management', '/Dashboard/TimeManagement', 'AccessTime', 'employee_productivity', '["TL", "Admin", "Employee", "HR"]', TRUE, 50.4),
('productivity', 'Productivity', '/Dashboard/Productivity', 'TrendingUp', 'employee_productivity', '["Admin", "TL"]', TRUE, 50.5),
('apply_leave', 'Apply Leave', '/Dashboard/AddLeaves', 'EventAvailable', 'employee_productivity', '["TL", "Admin", "Employee", "HR"]', TRUE, 50.6),
('compoff', 'Comp-Off', '/Dashboard/CompOff', 'Assignment', 'employee_productivity', '["TL", "Admin", "Employee", "HR"]', TRUE, 50.7)

ON DUPLICATE KEY UPDATE 
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);
