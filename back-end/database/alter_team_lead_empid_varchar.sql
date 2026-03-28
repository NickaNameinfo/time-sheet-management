-- Run after alter_employee_empid_varchar.sql if you use team leads with employee EMPID.
ALTER TABLE `team_lead`
  MODIFY COLUMN `EMPID` VARCHAR(50) NULL DEFAULT NULL;
