-- Migration: business_member_role
-- Add roleId to BusinessMember for business-specific roles
-- Root cause: User.roleId is global, so changing a user's role in one business changes it in all businesses

-- Step 1: Add roleId column to BusinessMember as NOT NULL
-- Default of 1 is only a migration artifact; actual values are backfilled immediately after
ALTER TABLE `BusinessMember` ADD COLUMN `roleId` INT NOT NULL DEFAULT 1;

-- Step 2: Backfill roleId from User.roleId for all existing memberships
UPDATE `BusinessMember` bm
INNER JOIN `User` u ON bm.`userId` = u.`id`
SET bm.`roleId` = u.`roleId`;

-- Step 3: Remove the migration default so schema-level enforcement kicks in
-- (After backfill, all rows have their correct roleId; the default is no longer needed)
ALTER TABLE `BusinessMember` ALTER COLUMN `roleId` DROP DEFAULT;