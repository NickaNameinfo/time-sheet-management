-- Hide "Time Management" under Productivity Tracking (menu_key: time_management).
-- Safe to re-run.
UPDATE `menu_permissions`
SET `is_active` = FALSE
WHERE `menu_key` = 'time_management';
