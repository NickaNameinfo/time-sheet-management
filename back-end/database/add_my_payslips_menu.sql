-- My Payslips menu for employees (download paid slips by month)

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('my_payslips', 'My Payslips', '/Employee/MyPayslips', 'Receipt', 'payroll_finance', '["Employee"]', TRUE, 7.05)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

INSERT INTO company_menu_permissions (company_id, menu_key, enabled)
SELECT DISTINCT company_id, 'my_payslips', 1
FROM company_menu_permissions
WHERE menu_key IN ('salary_payslip', 'payroll_export', 'payroll_finance')
  AND enabled = 1
ON DUPLICATE KEY UPDATE enabled = 1;
