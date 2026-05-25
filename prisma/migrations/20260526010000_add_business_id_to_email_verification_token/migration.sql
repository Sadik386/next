-- Add nullable businessId column to EmailVerificationToken for invite/verification with business context
ALTER TABLE `EmailVerificationToken` ADD COLUMN `businessId` INTEGER NULL;

-- Add index for looking up tokens by businessId
-- Note: This is optional but helps with queries that filter by businessId
CREATE INDEX `EmailVerificationToken_businessId_idx` ON `EmailVerificationToken`(`businessId`);

-- Add FK constraint if businessId is present (nullable FK is supported)
-- FK is optional since businessId may be null for general email verification
ALTER TABLE `EmailVerificationToken` ADD CONSTRAINT `EmailVerificationToken_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;