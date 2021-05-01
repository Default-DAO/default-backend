-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('ENTITY', 'PERSONAL');

-- CreateEnum
CREATE TYPE "DntTransactionType" AS ENUM ('CONTRIBUTOR_REWARD', 'LP_REWARD', 'SWAP', 'STAKE');

-- CreateEnum
CREATE TYPE "UsdcTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'SWAP');

-- CreateTable
CREATE TABLE "api_member" (
    "id" SERIAL NOT NULL,
    "eth_address" VARCHAR(42) NOT NULL,
    "alias" VARCHAR(42) NOT NULL,
    "total_liquidity" INTEGER,
    "total_rewards_earned" INTEGER,
    "net_gain" INTEGER,
    "net_position" INTEGER,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "cap" INTEGER,
    "nonce" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_member" (
    "eth_address" VARCHAR(42) NOT NULL,
    "type" "MemberType" NOT NULL,
    "alias" VARCHAR(42),
    "created_epoch" INTEGER NOT NULL,
    "liquidity_cap_usdc" INTEGER,
    "liquidity_cap_epoch" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("eth_address")
);

-- CreateTable
CREATE TABLE "tx_dnt_stake" (
    "id" SERIAL NOT NULL,
    "eth_address" VARCHAR(42) NOT NULL,
    "created_epoch" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_dnt_token" (
    "id" SERIAL NOT NULL,
    "eth_address" VARCHAR(42) NOT NULL,
    "created_epoch" INTEGER NOT NULL,
    "transaction_type" "DntTransactionType" NOT NULL,
    "amount_dnt" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_protocol" (
    "epoch_number" INTEGER NOT NULL,
    "dnt_withdraw_fee" DOUBLE PRECISION NOT NULL,
    "usdc_withdraw_fee" DOUBLE PRECISION NOT NULL,
    "dnt_epoch_reward_issuance_amount" INTEGER NOT NULL,
    "dnt_reward_distributions" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("epoch_number")
);

-- CreateTable
CREATE TABLE "tx_stake_allocation" (
    "id" SERIAL NOT NULL,
    "from_eth_address" VARCHAR(42) NOT NULL,
    "to_eth_address" VARCHAR(42) NOT NULL,
    "epoch" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_usdc_token" (
    "id" SERIAL NOT NULL,
    "eth_address" VARCHAR(42) NOT NULL,
    "created_epoch" INTEGER NOT NULL,
    "transaction_type" "UsdcTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_value_delegation" (
    "id" SERIAL NOT NULL,
    "from_eth_address" VARCHAR(42) NOT NULL,
    "to_eth_address" VARCHAR(42) NOT NULL,
    "epoch" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_member.eth_address_unique" ON "api_member"("eth_address");

-- CreateIndex
CREATE INDEX "tx_member_created_epoch" ON "tx_member"("created_epoch");

-- CreateIndex
CREATE INDEX "tx_dnt_stake_created_epoch" ON "tx_dnt_stake"("created_epoch");

-- CreateIndex
CREATE INDEX "tx_dnt_stake_eth_address" ON "tx_dnt_stake"("eth_address");

-- CreateIndex
CREATE INDEX "tx_dnt_token_created_epoch" ON "tx_dnt_token"("created_epoch");

-- CreateIndex
CREATE INDEX "tx_dnt_token_eth_address" ON "tx_dnt_token"("eth_address");

-- CreateIndex
CREATE UNIQUE INDEX "tx_stake_allocation.from_eth_address_to_eth_address_epoch_unique" ON "tx_stake_allocation"("from_eth_address", "to_eth_address", "epoch");

-- CreateIndex
CREATE INDEX "tx_stake_allocation.epoch_index" ON "tx_stake_allocation"("epoch");

-- CreateIndex
CREATE INDEX "tx_stake_allocation.from_eth_address_index" ON "tx_stake_allocation"("from_eth_address");

-- CreateIndex
CREATE INDEX "tx_stake_allocation.to_eth_address_index" ON "tx_stake_allocation"("to_eth_address");

-- CreateIndex
CREATE INDEX "tx_usdc_token_created_epoch" ON "tx_usdc_token"("created_epoch");

-- CreateIndex
CREATE INDEX "tx_usdc_token_eth_address" ON "tx_usdc_token"("eth_address");

-- CreateIndex
CREATE UNIQUE INDEX "TxValueDelegation_fromEthAddress_toEthAddress_epoch_key" ON "tx_value_delegation"("from_eth_address", "to_eth_address", "epoch");

-- CreateIndex
CREATE INDEX "tx_value_delegation_epoch" ON "tx_value_delegation"("epoch");

-- CreateIndex
CREATE INDEX "tx_value_delegation_from_eth_address" ON "tx_value_delegation"("from_eth_address");

-- CreateIndex
CREATE INDEX "tx_value_delegation_to_eth_address" ON "tx_value_delegation"("to_eth_address");

-- AddForeignKey
ALTER TABLE "api_member" ADD FOREIGN KEY ("eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_dnt_stake" ADD FOREIGN KEY ("eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_dnt_token" ADD FOREIGN KEY ("eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_stake_allocation" ADD FOREIGN KEY ("from_eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_stake_allocation" ADD FOREIGN KEY ("to_eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_usdc_token" ADD FOREIGN KEY ("eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_value_delegation" ADD FOREIGN KEY ("from_eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_value_delegation" ADD FOREIGN KEY ("to_eth_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;
