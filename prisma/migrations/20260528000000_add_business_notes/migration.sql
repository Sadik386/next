-- CreateBusinessNote table for platform admin internal notes on businesses
CREATE TABLE `BusinessNote` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `businessId` INT NOT NULL,
    `userId` INT NOT NULL,
    `note` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `BusinessNote_businessId_idx` (`businessId`),
    CONSTRAINT `BusinessNote_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `BusinessNote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
