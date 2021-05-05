/*
  Warnings:

  - You are about to drop the column `alias` on the `api_member` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `tx_stake_delegation` table. All the data in the column will be lost.
  - You are about to drop the `tx_dnt_stake` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tx_dnt_stake" DROP CONSTRAINT "tx_dnt_stake_eth_address_fkey";

-- AlterTable
ALTER TABLE "api_member" DROP COLUMN "alias";

-- AlterTable
ALTER TABLE "tx_stake_delegation" DROP COLUMN "amount";

-- DropTable
DROP TABLE "tx_dnt_stake";
