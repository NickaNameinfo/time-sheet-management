-- Add Investment (My Self / KYC) menu permissions
-- Parent: Investment. Submenus: KYC, Submit KYC, My Self Reports, Investment Reports, (Admin) Update KYC Status, User Reports, Withdrawal Requests, Referral Approve, Referral Reports

-- Parent Menu: Investment
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`)
VALUES ('investment', 'Investment', '/Dashboard/Investment', 'Savings', NULL, '["Admin"]', TRUE, 6)
ON DUPLICATE KEY UPDATE
  menu_title = VALUES(menu_title),
  menu_path = VALUES(menu_path),
  menu_icon = VALUES(menu_icon),
  parent_menu = VALUES(parent_menu),
  allowed_roles = VALUES(allowed_roles),
  is_active = VALUES(is_active),
  display_order = VALUES(display_order);

-- Submenus (user / My Self)
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_kyc', 'KYC Status', '/Dashboard/Investment/KYC', 'Savings', 'investment', '["Admin"]', TRUE, 6.1),
('investment_kyc_submit', 'Submit / Update KYC', '/Dashboard/Investment/KYC/Submit', 'Person', 'investment', '["Admin"]', TRUE, 6.2),
('investment_myself_reports', 'My Self Reports', '/Dashboard/Investment/MySelfReports', 'Assessment', 'investment', '["Admin"]', TRUE, 6.3),
('investment_reports', 'Investment Reports', '/Dashboard/Investment/Reports', 'TrendingUp', 'investment', '["Admin"]', TRUE, 6.4)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);

-- Submenus (Admin only)
INSERT INTO `menu_permissions` (`menu_key`, `menu_title`, `menu_path`, `menu_icon`, `parent_menu`, `allowed_roles`, `is_active`, `display_order`) VALUES
('investment_update_kyc_status', 'Update KYC Status', '/Dashboard/Investment/UpdateKycStatus', 'CheckCircle', 'investment', '["Admin"]', TRUE, 6.5),
('investment_admin_user_reports', 'User Reports', '/Dashboard/Investment/AdminUserReports', 'People', 'investment', '["Admin"]', TRUE, 6.6),
('investment_withdrawal_requests', 'Withdrawal Requests', '/Dashboard/Investment/WithdrawalRequests', 'PendingActions', 'investment', '["Admin"]', TRUE, 6.7),
('investment_referral_earnings', 'Referral – Approve', '/Dashboard/Investment/ReferralEarnings', 'People', 'investment', '["Admin"]', TRUE, 6.8),
('investment_referral_reports', 'Referral Reports', '/Dashboard/Investment/ReferralReports', 'Assessment', 'investment', '["Admin"]', TRUE, 6.9)
ON DUPLICATE KEY UPDATE menu_title = VALUES(menu_title), menu_path = VALUES(menu_path), menu_icon = VALUES(menu_icon), parent_menu = VALUES(parent_menu), allowed_roles = VALUES(allowed_roles), is_active = VALUES(is_active), display_order = VALUES(display_order);
