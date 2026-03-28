-- Employee IDs can be alphanumeric (e.g. NN001). INT column coerced them to 0.
-- Run once on each tenant DB (company DB + superadmin DB if applicable):
--   node scripts/alter-employee-empid-varchar.js

ALTER TABLE `employee`
  MODIFY COLUMN `EMPID` VARCHAR(50) NOT NULL DEFAULT '';
