-- Optional: override or add payroll holidays (JSON array).
-- Example value:
-- [{"date":"2026-05-28","name":"Eid ul-Zuha (Bakrid) - official"}]
-- If a date exists in both supplement file and this setting, this setting wins.

INSERT INTO app_settings (setting_key, setting_value, description)
VALUES (
  'payroll_custom_holidays',
  '[]',
  'Custom public holidays for payroll (JSON array of {date, name})'
)
ON DUPLICATE KEY UPDATE description = VALUES(description);
