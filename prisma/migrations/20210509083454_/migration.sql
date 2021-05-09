/*
  Warnings:

  - You are about to drop the column `amount_dnt` on the `tx_dnt_token` table. All the data in the column will be lost.
  - Added the required column `amount` to the `tx_dnt_token` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tx_dnt_token" DROP COLUMN "amount_dnt",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL;
