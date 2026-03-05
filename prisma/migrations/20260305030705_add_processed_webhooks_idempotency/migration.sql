-- CreateTable
CREATE TABLE `processed_webhooks` (
    `midtrans_order_id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `processed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`midtrans_order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
