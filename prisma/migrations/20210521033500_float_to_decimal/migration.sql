/*
  Warnings:

  - You are about to alter the column `total_liquidity` on the `api_member` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.
  - You are about to alter the column `total_rewards_earned` on the `api_member` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.
  - You are about to alter the column `net_gain` on the `api_member` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.
  - You are about to alter the column `net_position` on the `api_member` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.
  - You are about to alter the column `amount` on the `tx_dnt_token` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.
  - You are about to alter the column `amount` on the `tx_usdc_token` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(20,8)`.

*/
-- AlterTable
ALTER TABLE "api_member" ALTER COLUMN "total_liquidity" SET DATA TYPE DECIMAL(20,8),
ALTER COLUMN "total_rewards_earned" SET DATA TYPE DECIMAL(20,8),
ALTER COLUMN "net_gain" SET DATA TYPE DECIMAL(20,8),
ALTER COLUMN "net_position" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "tx_dnt_token" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8);

-- AlterTable
ALTER TABLE "tx_usdc_token" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(20,8);
