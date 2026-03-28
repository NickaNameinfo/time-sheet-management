-- Seed super admin email(s). These emails always have access regardless of user access allowlist.
INSERT INTO `app_settings` (`setting_key`, `setting_value`, `description`) VALUES
('super_admin_emails', '["admin@nickname.com"]', 'Super admin emails; always allowed to access the application')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);
