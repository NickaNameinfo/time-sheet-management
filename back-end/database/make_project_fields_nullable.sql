-- Make removed project fields nullable
-- This migration allows orderId, positionNumber, subPositionNumber, taskJobNo, and referenceNo to be NULL
-- since these fields have been removed from the front-end form

-- Make orderId nullable
ALTER TABLE `project` MODIFY COLUMN `orderId` VARCHAR(150) NULL;

-- Make positionNumber nullable
ALTER TABLE `project` MODIFY COLUMN `positionNumber` VARCHAR(150) NULL;

-- Make subPositionNumber nullable
ALTER TABLE `project` MODIFY COLUMN `subPositionNumber` VARCHAR(150) NULL;

-- Make taskJobNo nullable
ALTER TABLE `project` MODIFY COLUMN `taskJobNo` VARCHAR(150) NULL;

-- Make referenceNo nullable
ALTER TABLE `project` MODIFY COLUMN `referenceNo` VARCHAR(150) NULL;

