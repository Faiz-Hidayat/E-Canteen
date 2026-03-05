-- AlterTable
ALTER TABLE `orders` ADD COLUMN `midtrans_payment_status` VARCHAR(191) NULL,
    ADD COLUMN `payment_expires_at` DATETIME(3) NULL;
