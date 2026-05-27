-- Add emailStaffInvitationEnabled field to Setting model
ALTER TABLE `Setting` ADD COLUMN `emailStaffInvitationEnabled` BOOLEAN NOT NULL DEFAULT true;