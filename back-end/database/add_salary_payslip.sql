-- Salary & Payslip menu + employee_payslips table

CREATE TABLE IF NOT EXISTS employee_payslips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id INT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) DEFAULT 0,
  total_hours DECIMAL(10,2) DEFAULT 0,
  expected_hours DECIMAL(10,2) DEFAULT 176,
  hourly_rate DECIMAL(12,4) DEFAULT 0,
  attendance_pay DECIMAL(12,2) DEFAULT 0,
  adjustments DECIMAL(12,2) DEFAULT 0,
  final_amount DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  notes TEXT,
  payslip_detail JSON NULL,
  updated_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_employee_payslip_period (employee_id, period_start, period_end),
  KEY idx_payslip_period (period_start, period_end),
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('salary_payslip', 'Salary & Payslip', '/Dashboard/SalaryPayslip', 'Savings', 'payroll_finance', '["Admin", "HR"]', TRUE, 7.15)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- Company logins use opt-in company_menu_permissions (missing key = hidden).
INSERT INTO company_menu_permissions (company_id, menu_key, enabled)
SELECT DISTINCT company_id, 'salary_payslip', 1
FROM company_menu_permissions
WHERE menu_key IN ('payroll_export', 'payroll_finance', 'billing_invoicing', 'budget_tracking')
  AND enabled = 1
ON DUPLICATE KEY UPDATE enabled = 1;

INSERT INTO company_menu_permissions (company_id, menu_key, enabled)
SELECT c.id, 'salary_payslip', 1
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM company_menu_permissions cmp
  WHERE cmp.company_id = c.id AND cmp.menu_key = 'salary_payslip'
);
