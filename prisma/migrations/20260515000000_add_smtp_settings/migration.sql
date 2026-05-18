-- Add SMTP settings fields to Setting table
-- This migration adds email notification and SMTP configuration fields

-- Add SMTP connection fields
ALTER TABLE `Setting` ADD COLUMN `smtpProvider` VARCHAR(50) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpHost` VARCHAR(255) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpPort` INT NULL DEFAULT 587;
ALTER TABLE `Setting` ADD COLUMN `smtpUsername` VARCHAR(150) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpPassword` VARCHAR(500) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpEncryption` VARCHAR(10) NULL;

-- Add SMTP sender configuration
ALTER TABLE `Setting` ADD COLUMN `smtpFromEmail` VARCHAR(150) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpFromName` VARCHAR(100) NULL;
ALTER TABLE `Setting` ADD COLUMN `smtpReplyTo` VARCHAR(150) NULL;
ALTER TABLE `Setting` ADD COLUMN `supportEmail` VARCHAR(150) NULL;

-- Add email content fields
ALTER TABLE `Setting` ADD COLUMN `emailFooterText` TEXT NULL;
ALTER TABLE `Setting` ADD COLUMN `companyAddressFooter` TEXT NULL;

-- Add email notification toggles
ALTER TABLE `Setting` ADD COLUMN `emailOrderConfirmationEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Setting` ADD COLUMN `emailInvoiceEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Setting` ADD COLUMN `emailPasswordResetEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Setting` ADD COLUMN `emailUserRegistrationEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Setting` ADD COLUMN `emailLowStockEnabled` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `Setting` ADD COLUMN `emailDailySummaryEnabled` BOOLEAN NOT NULL DEFAULT false;

-- Add missing emailHeaderLogoUrl if not exists
-- Note: This may already exist in some databases, so we make it safe
-- ALTER TABLE `Setting` ADD COLUMN IF NOT EXISTS would be ideal but MySQL doesn't support this
-- So we skip this as it was likely added earlier