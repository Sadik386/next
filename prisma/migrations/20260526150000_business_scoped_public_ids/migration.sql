-- Make Product public IDs business-scoped instead of globally unique
ALTER TABLE `Product` DROP INDEX `Product_productId_key`;
ALTER TABLE `Product` ADD UNIQUE INDEX `Product_businessId_productId_key` (`businessId`, `productId`);

-- Make Customer public IDs business-scoped instead of globally unique
ALTER TABLE `Customer` DROP INDEX `Customer_customerId_key`;
ALTER TABLE `Customer` ADD UNIQUE INDEX `Customer_businessId_customerId_key` (`businessId`, `customerId`);

-- Make Supplier public IDs business-scoped instead of globally unique
ALTER TABLE `Supplier` DROP INDEX `Supplier_supplierId_key`;
ALTER TABLE `Supplier` ADD UNIQUE INDEX `Supplier_businessId_supplierId_key` (`businessId`, `supplierId`);

-- Make Order public IDs business-scoped instead of globally unique
ALTER TABLE `Order` DROP INDEX `Order_orderId_key`;
ALTER TABLE `Order` ADD UNIQUE INDEX `Order_businessId_orderId_key` (`businessId`, `orderId`);

-- Make Sale public IDs business-scoped instead of globally unique
ALTER TABLE `Sale` DROP INDEX `Sale_saleId_key`;
ALTER TABLE `Sale` ADD UNIQUE INDEX `Sale_businessId_saleId_key` (`businessId`, `saleId`);

-- Make Expense public IDs business-scoped instead of globally unique
ALTER TABLE `Expense` DROP INDEX `Expense_expenseId_key`;
ALTER TABLE `Expense` ADD UNIQUE INDEX `Expense_businessId_expenseId_key` (`businessId`, `expenseId`);
