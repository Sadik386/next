-- CreateTable: ProductVariant
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `businessId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `optionSignature` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NULL,
    `barcode` VARCHAR(100) NULL,
    `stockQuantity` INTEGER NOT NULL DEFAULT 0,
    `lowStockThreshold` INTEGER NOT NULL DEFAULT 10,
    `location` VARCHAR(255) NULL,
    `salePriceOverride` DECIMAL(10,2) NULL,
    `costPriceOverride` DECIMAL(10,2) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ProductVariant_productId_optionSignature_key`(`productId`, `optionSignature`),
    UNIQUE INDEX `ProductVariant_businessId_sku_key`(`businessId`, `sku`),
    UNIQUE INDEX `ProductVariant_businessId_barcode_key`(`businessId`, `barcode`),
    INDEX `ProductVariant_businessId_productId_idx`(`businessId`, `productId`),
    INDEX `ProductVariant_businessId_status_idx`(`businessId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: StockLog
ALTER TABLE `StockLog` ADD COLUMN `productVariantId` INTEGER NULL;

-- AlterTable: OrderItem
ALTER TABLE `OrderItem`
    ADD COLUMN `productVariantId` INTEGER NULL,
    ADD COLUMN `variantLabel` VARCHAR(255) NULL,
    ADD COLUMN `skuSnapshot` VARCHAR(100) NULL;

-- AlterTable: Sale
ALTER TABLE `Sale`
    ADD COLUMN `productVariantId` INTEGER NULL,
    ADD COLUMN `variantLabel` VARCHAR(255) NULL,
    ADD COLUMN `skuSnapshot` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `StockLog_productVariantId_idx` ON `StockLog`(`productVariantId`);

-- CreateIndex
CREATE INDEX `OrderItem_productVariantId_idx` ON `OrderItem`(`productVariantId`);

-- CreateIndex
CREATE INDEX `Sale_productVariantId_idx` ON `Sale`(`productVariantId`);

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StockLog` ADD CONSTRAINT `StockLog_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sale` ADD CONSTRAINT `Sale_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
