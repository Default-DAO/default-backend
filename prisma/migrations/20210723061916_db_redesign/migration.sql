/*
  Warnings:

  - You are about to drop the column `epoch` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `proposer_address` on the `proposal` table. All the data in the column will be lost.
  - You are about to drop the column `voter_address` on the `proposal_vote` table. All the data in the column will be lost.
  - You are about to drop the `api_member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_dnt_token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_protocol` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_stake_delegation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_usdc_token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tx_value_allocation` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[proposal_id,voter_id]` on the table `proposal_vote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dao_id` to the `proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `proposer_id` to the `proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `protocol_id` to the `proposal` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voter_id` to the `proposal_vote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "api_member" DROP CONSTRAINT "api_member_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_dnt_token" DROP CONSTRAINT "tx_dnt_token_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_stake_delegation" DROP CONSTRAINT "tx_stake_delegation_from_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_stake_delegation" DROP CONSTRAINT "tx_stake_delegation_to_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_usdc_token" DROP CONSTRAINT "tx_usdc_token_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_value_allocation" DROP CONSTRAINT "tx_value_allocation_from_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "tx_value_allocation" DROP CONSTRAINT "tx_value_allocation_to_eth_address_fkey";

-- DropForeignKey
ALTER TABLE "proposal" DROP CONSTRAINT "proposal_proposer_address_fkey";

-- DropForeignKey
ALTER TABLE "proposal_vote" DROP CONSTRAINT "proposal_vote_voter_address_fkey";

-- DropIndex
DROP INDEX "proposal.epoch_index";

-- DropIndex
DROP INDEX "proposal_vote.proposal_id_voter_address_unique";

-- DropIndex
DROP INDEX "proposal_vote.voter_address_index";

-- AlterTable
ALTER TABLE "proposal" DROP COLUMN "epoch",
DROP COLUMN "proposer_address",
ADD COLUMN     "dao_id" INTEGER NOT NULL,
ADD COLUMN     "proposer_id" INTEGER NOT NULL,
ADD COLUMN     "protocol_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "proposal_vote" DROP COLUMN "voter_address",
ADD COLUMN     "voter_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "api_member";

-- DropTable
DROP TABLE "tx_dnt_token";

-- DropTable
DROP TABLE "tx_member";

-- DropTable
DROP TABLE "tx_protocol";

-- DropTable
DROP TABLE "tx_stake_delegation";

-- DropTable
DROP TABLE "tx_usdc_token";

-- DropTable
DROP TABLE "tx_value_allocation";

-- CreateTable
CREATE TABLE "dao" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol" (
    "id" SERIAL NOT NULL,
    "epoch" INTEGER NOT NULL,
    "dnt_withdraw_fee" INTEGER NOT NULL,
    "usdc_withdraw_fee" INTEGER NOT NULL,
    "mint_amt" INTEGER,
    "budget_amt" INTEGER,
    "reward_distributions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dao_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "eth_address" VARCHAR(42) NOT NULL,
    "type" "MemberType" NOT NULL,
    "alias" VARCHAR(42),
    "liquidity_cap_usdc" INTEGER,
    "liquidity_cap_epoch_usdc" INTEGER,
    "total_liquidity" DECIMAL(20,8),
    "total_rewards_earned" DECIMAL(20,8),
    "net_gain" DECIMAL(20,8),
    "net_position" DECIMAL(20,8),
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "cap" INTEGER,
    "nonce" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dao_id" INTEGER NOT NULL,
    "protocol_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delegation" (
    "id" SERIAL NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dao_id" INTEGER NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "from_member_id" INTEGER NOT NULL,
    "to_member_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allocation" (
    "id" SERIAL NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dao_id" INTEGER NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "from_member_id" INTEGER NOT NULL,
    "to_member_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dnt_token" (
    "id" SERIAL NOT NULL,
    "transaction_type" "DntTransactionType" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usdc_token" (
    "id" SERIAL NOT NULL,
    "transaction_type" "UsdcTransactionType" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "protocol_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "protocol.epoch_dao_id_unique" ON "protocol"("epoch", "dao_id");

-- CreateIndex
CREATE INDEX "protocol.epoch_index" ON "protocol"("epoch");

-- CreateIndex
CREATE INDEX "protocol.dao_id_index" ON "protocol"("dao_id");

-- CreateIndex
CREATE UNIQUE INDEX "member.dao_id_eth_address_unique" ON "member"("dao_id", "eth_address");

-- CreateIndex
CREATE UNIQUE INDEX "member.dao_id_alias_unique" ON "member"("dao_id", "alias");

-- CreateIndex
CREATE INDEX "ethAddress" ON "member"("eth_address");

-- CreateIndex
CREATE INDEX "member_dao_id" ON "member"("dao_id");

-- CreateIndex
CREATE INDEX "member_protocol_id" ON "member"("protocol_id");

-- CreateIndex
CREATE UNIQUE INDEX "delegation.protocol_id_from_member_id_to_member_id_unique" ON "delegation"("protocol_id", "from_member_id", "to_member_id");

-- CreateIndex
CREATE INDEX "delegation.protocol_id_index" ON "delegation"("protocol_id");

-- CreateIndex
CREATE INDEX "delegation.from_member_id_index" ON "delegation"("from_member_id");

-- CreateIndex
CREATE INDEX "delegation.to_member_id_index" ON "delegation"("to_member_id");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_fromMemberId_toMemberId_protocolId_key" ON "allocation"("from_member_id", "to_member_id", "protocol_id");

-- CreateIndex
CREATE INDEX "allocation_from_member_id" ON "allocation"("from_member_id");

-- CreateIndex
CREATE INDEX "allocation_to_member_id" ON "allocation"("to_member_id");

-- CreateIndex
CREATE INDEX "protocol_id" ON "allocation"("protocol_id");

-- CreateIndex
CREATE INDEX "dnt_token_protocol_id" ON "dnt_token"("protocol_id");

-- CreateIndex
CREATE INDEX "dnt_token_member" ON "dnt_token"("member_id");

-- CreateIndex
CREATE INDEX "usdc_token_protocol_id" ON "usdc_token"("protocol_id");

-- CreateIndex
CREATE INDEX "usdc_token_member_id" ON "usdc_token"("member_id");

-- CreateIndex
CREATE INDEX "proposal.protocol_id_index" ON "proposal"("protocol_id");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_vote.proposal_id_voter_id_unique" ON "proposal_vote"("proposal_id", "voter_id");

-- CreateIndex
CREATE INDEX "proposal_vote.voter_id_index" ON "proposal_vote"("voter_id");

-- AddForeignKey
ALTER TABLE "protocol" ADD FOREIGN KEY ("dao_id") REFERENCES "dao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD FOREIGN KEY ("dao_id") REFERENCES "dao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation" ADD FOREIGN KEY ("dao_id") REFERENCES "dao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation" ADD FOREIGN KEY ("from_member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delegation" ADD FOREIGN KEY ("from_member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation" ADD FOREIGN KEY ("dao_id") REFERENCES "dao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation" ADD FOREIGN KEY ("from_member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allocation" ADD FOREIGN KEY ("to_member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnt_token" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dnt_token" ADD FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usdc_token" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usdc_token" ADD FOREIGN KEY ("member_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD FOREIGN KEY ("dao_id") REFERENCES "dao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD FOREIGN KEY ("proposer_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal" ADD FOREIGN KEY ("protocol_id") REFERENCES "protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_vote" ADD FOREIGN KEY ("voter_id") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
