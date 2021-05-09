/*
  Warnings:

  - You are about to alter the column `dnt_withdraw_fee` on the `tx_protocol` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `usdc_withdraw_fee` on the `tx_protocol` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "api_member" ALTER COLUMN "total_liquidity" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_rewards_earned" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "net_gain" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "net_position" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tx_dnt_token" ALTER COLUMN "amount_dnt" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tx_protocol" ALTER COLUMN "dnt_withdraw_fee" SET DATA TYPE INTEGER,
ALTER COLUMN "usdc_withdraw_fee" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "tx_usdc_token" ALTER COLUMN "amount" SET DATA TYPE DOUBLE PRECISION;
