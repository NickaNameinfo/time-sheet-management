-- Full menu restructure: Dashboard, Employee Management, Project Management, Sales & CRM,
-- Investment Management (with KYC + Referral sub-groups), Workforce Management, Payroll & Finance,
-- Approvals, Reports & Analytics, Productivity Tracking, Automation, System Settings.
-- Uses ON DUPLICATE KEY UPDATE so safe to re-run.
--
-- TO APPLY: From project root run:
--   cd back-end && npm run restructure-menus
-- Or in MySQL: source restructure_menus_full.sql;

-- Deactivate old root menus that are replaced by new structure
UPDATE menu_permissions SET is_active = FALSE WHERE menu_key IN ('employee_productivity', 'investment');

-- ========== ROOT / TOP-LEVEL ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('dashboard', 'Dashboard', '/Dashboard', 'Dashboard', NULL, '["Admin"]', TRUE, 1),
('employee_management', 'Employee Management', '/Dashboard/employee', 'People', NULL, '["Admin", "HR"]', TRUE, 2),
('project_management', 'Project Management', '/Dashboard/projects', 'Business', NULL, '["Admin"]', TRUE, 3),
('sales', 'Sales & CRM', '/Dashboard/Sales', 'Business', NULL, '["Admin"]', TRUE, 4),
('investment_management', 'Investment Management', '/Dashboard/Investment', 'Savings', NULL, '["Admin"]', TRUE, 5),
('workforce_management', 'Workforce Management', '/Dashboard/TimeManagement', 'AccessTime', NULL, '["Admin", "HR", "TL"]', TRUE, 6),
('payroll_finance', 'Payroll & Finance', '/Dashboard/Payroll', 'Payments', NULL, '["Admin", "HR"]', TRUE, 7),
('approvals', 'Approvals', '/Dashboard/Approvals', 'CheckCircle', NULL, '["Admin", "HR", "TL"]', TRUE, 8),
('reports', 'Reports & Analytics', '/Dashboard/Reports/EmployeeReport', 'Assessment', NULL, '["Admin", "HR", "TL"]', TRUE, 9),
('productivity_tracking', 'Productivity Tracking', '/Dashboard/EmployeeHome', 'TrendingUp', NULL, '["TL", "Admin", "Employee", "HR"]', TRUE, 10),
('automation', 'Automation', '/Dashboard/Reports/Automated', 'Email', NULL, '["Admin"]', TRUE, 11),
('settings', 'System Settings', '/Dashboard/Settings', 'Settings', NULL, '["Admin"]', TRUE, 12)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== EMPLOYEE MANAGEMENT ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('manage_employees', 'Employees', '/Dashboard/employee', 'People', 'employee_management', '["Admin", "HR"]', TRUE, 2.1),
('manage_team_leads', 'Team Leads', '/Dashboard/lead', 'People', 'employee_management', '["Admin"]', FALSE, 2.2),
('manage_hr', 'HR Management', '/Dashboard/hr', 'People', 'employee_management', '["Admin"]', FALSE, 2.3),
('roles_permissions', 'Roles & Permissions', '/Dashboard/Settings/MenuPermissions', 'Person', 'employee_management', '["Admin"]', TRUE, 2.4)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== PROJECT MANAGEMENT ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('manage_projects', 'Projects', '/Dashboard/projects', 'Business', 'project_management', '["Admin"]', TRUE, 3.1),
('project_planning', 'Project Planning', '/Dashboard/project-planning', 'AccountTree', 'project_management', '["Admin"]', TRUE, 3.2),
('project_work_details', 'Project Work Details', '/Dashboard/TeamLeadProjectWorks', 'Assignment', 'project_management', '["TL", "Admin"]', TRUE, 3.3)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== SALES & CRM ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('add_crm_date', 'Add CRM Entry', '/Dashboard/Sales/AddCrmDate', 'CalendarToday', 'sales', '["Admin"]', TRUE, 4.1),
('crm_list', 'CRM Records', '/Dashboard/Sales/CrmList', 'List', 'sales', '["Admin"]', TRUE, 4.2),
('crm_summary', 'CRM Summary', '/Dashboard/Sales/CrmSummary', 'Assessment', 'sales', '["Admin"]', TRUE, 4.3),
('lead_list', 'Leads', '/Dashboard/Sales/LeadList', 'People', 'sales', '["Admin"]', TRUE, 4.4)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== INVESTMENT MANAGEMENT (with sub-parents) ==========
-- Sub-parent: KYC Management
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_kyc_management', 'KYC Management', '/Dashboard/Investment/KYC', 'Person', 'investment_management', '["Admin"]', TRUE, 5.1)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_kyc', 'KYC Status', '/Dashboard/Investment/KYC', 'Savings', 'investment_kyc_management', '["Admin"]', TRUE, 5.11),
('investment_kyc_submit', 'Submit / Update KYC', '/Dashboard/Investment/KYC/Submit', 'Person', 'investment_kyc_management', '["Admin"]', TRUE, 5.12),
('investment_update_kyc_status', 'Update KYC Status', '/Dashboard/Investment/UpdateKycStatus', 'CheckCircle', 'investment_kyc_management', '["Admin"]', TRUE, 5.13),
('investment_reports', 'Investment Reports', '/Dashboard/Investment/Reports', 'TrendingUp', 'investment_management', '["Admin"]', TRUE, 5.2),
('investment_admin_user_reports', 'User Reports', '/Dashboard/Investment/AdminUserReports', 'People', 'investment_management', '["Admin"]', TRUE, 5.3),
('investment_myself_reports', 'Self Reports', '/Dashboard/Investment/MySelfReports', 'Assessment', 'investment_management', '["Admin"]', TRUE, 5.4),
('investment_withdrawal_requests', 'Withdrawal Requests', '/Dashboard/Investment/WithdrawalRequests', 'PendingActions', 'investment_management', '["Admin"]', TRUE, 5.5)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- Sub-parent: Referral Management
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_referral_management', 'Referral Management', '/Dashboard/Investment/ReferralEarnings', 'People', 'investment_management', '["Admin"]', TRUE, 5.6)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_referral_earnings', 'Referral Approvals', '/Dashboard/Investment/ReferralEarnings', 'People', 'investment_referral_management', '["Admin"]', TRUE, 5.61),
('investment_referral_reports', 'Referral Reports', '/Dashboard/Investment/ReferralReports', 'Assessment', 'investment_referral_management', '["Admin"]', TRUE, 5.62)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== WORKFORCE MANAGEMENT (Leave sub-parent) ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('leave_management', 'Leave Management', '/Dashboard/LeaveBalance', 'EventAvailable', 'workforce_management', '["Admin", "HR", "TL", "Employee"]', TRUE, 6.4)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('time_tracking', 'Time Tracking', '/Dashboard/TimeManagement', 'AccessTime', 'workforce_management', '["TL", "Admin", "Employee", "HR"]', TRUE, 6.1),
('shift_management', 'Shift Management', '/Dashboard/Shifts', 'WorkHistory', 'workforce_management', '["Admin", "HR"]', TRUE, 6.2),
('overtime_management', 'Overtime Management', '/Dashboard/Overtime', 'Schedule', 'workforce_management', '["Admin", "HR", "TL"]', TRUE, 6.3),
('leave_balance', 'Leave Balance', '/Dashboard/LeaveBalance', 'EventAvailable', 'leave_management', '["Admin", "HR", "TL", "Employee"]', TRUE, 6.41),
('apply_leave', 'Apply Leave', '/Dashboard/AddLeaves', 'EventAvailable', 'leave_management', '["TL", "Admin", "Employee", "HR"]', TRUE, 6.42),
('compoff', 'Comp-Off Management', '/Dashboard/CompOff', 'Assignment', 'workforce_management', '["TL", "Admin", "Employee", "HR"]', TRUE, 6.5)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== PAYROLL & FINANCE ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('payroll_export', 'Payroll Export', '/Dashboard/Payroll', 'Payments', 'payroll_finance', '["Admin", "HR"]', TRUE, 7.1),
('salary_payslip', 'Salary & Payslip', '/Dashboard/SalaryPayslip', 'Savings', 'payroll_finance', '["Admin", "HR"]', TRUE, 7.15),
('billing_invoicing', 'Billing & Invoicing', '/Dashboard/Billing', 'AccountBalance', 'payroll_finance', '["Admin"]', TRUE, 7.2),
('budget_tracking', 'Budget Tracking', '/Dashboard/Budget', 'AccountTree', 'payroll_finance', '["Admin"]', TRUE, 7.3)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== APPROVALS ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('approval_center', 'Approval Center', '/Dashboard/Approvals', 'CheckCircle', 'approvals', '["Admin", "HR", "TL"]', TRUE, 8.1),
('leave_details', 'Leave Approvals', '/Dashboard/leaves', NULL, 'approvals', '["Admin", "HR"]', TRUE, 8.2),
('compoff_details', 'Comp-Off Approvals', '/Dashboard/CompOffList', NULL, 'approvals', '["Admin", "HR"]', TRUE, 8.3)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== REPORTS & ANALYTICS ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('employee_report', 'Employee Reports', '/Dashboard/Reports/EmployeeReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 9.1),
('project_report', 'Project Reports', '/Dashboard/Reports/ProjectReport', NULL, 'reports', '["Admin", "TL"]', TRUE, 9.2),
('weekly_report', 'Weekly Reports', '/Dashboard/Reports/WeeklyReport', NULL, 'reports', '["Admin", "HR", "TL"]', TRUE, 9.3),
('monthly_report', 'Monthly Reports', '/Dashboard/Reports/MonthlyReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 9.4),
('yearly_report', 'Yearly Reports', '/Dashboard/Reports/YearlyReport', NULL, 'reports', '["Admin"]', TRUE, 9.5),
('leave_report', 'Leave Reports', '/Dashboard/Reports/LeaveReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 9.6),
('discipline_report', 'Discipline Reports', '/Dashboard/Reports/CodeReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 9.7),
('consolidated_report', 'Consolidated Reports', '/Dashboard/Reports/ConsolidatedReport', NULL, 'reports', '["Admin", "HR"]', TRUE, 9.8)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== PRODUCTIVITY TRACKING ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('employee_dashboard', 'Employee Dashboard', '/Dashboard/EmployeeHome', 'Dashboard', 'productivity_tracking', '["TL", "Admin", "Employee", "HR"]', TRUE, 10.1),
('teamlead_dashboard', 'Team Lead Dashboard', '/Dashboard/TeamLeadHome', 'Dashboard', 'productivity_tracking', '["TL", "Admin"]', TRUE, 10.2),
('productivity', 'Productivity Insights', '/Dashboard/Productivity', 'TrendingUp', 'productivity_tracking', '["Admin", "TL"]', TRUE, 10.3),
('time_management', 'Time Management', '/Dashboard/TimeManagement', 'AccessTime', 'productivity_tracking', '["TL", "Admin", "Employee", "HR"]', FALSE, 10.4)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== AUTOMATION ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('automated_reports', 'Automated Reports', '/Dashboard/Reports/Automated', 'Email', 'automation', '["Admin"]', TRUE, 11.1)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- ========== SYSTEM SETTINGS ==========
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('settings_updates', 'Updates', '/Dashboard/Settings', NULL, 'settings', '["Admin"]', TRUE, 12.1),
('settings_discipline', 'Discipline Rules', '/Dashboard/Discipline', NULL, 'settings', '["Admin"]', TRUE, 12.2),
('settings_designation', 'Designations', '/Dashboard/Designation', NULL, 'settings', '["Admin"]', TRUE, 12.3),
('settings_roles', 'Roles', '/Dashboard/Roles', NULL, 'settings', '["Admin"]', TRUE, 12.4),
('settings_areaofwork', 'Area of Work', '/Dashboard/Areaofwork', NULL, 'settings', '["Admin"]', TRUE, 12.5),
('settings_variation', 'Variations', '/Dashboard/Variations', NULL, 'settings', '["Admin"]', TRUE, 12.6),
('menu_permissions', 'Menu Permissions', '/Dashboard/Settings/MenuPermissions', NULL, 'settings', '["Admin"]', TRUE, 12.7),
('settings_overtime_rules', 'Overtime Rules', '/Dashboard/Settings/OvertimeRules', NULL, 'settings', '["Admin"]', TRUE, 12.8),
('settings_app_settings', 'Application Settings', '/Dashboard/Settings/AppSettings', NULL, 'settings', '["Admin"]', TRUE, 12.9)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);
