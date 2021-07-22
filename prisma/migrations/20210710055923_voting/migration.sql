-- CreateTable
CREATE TABLE "proposal" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "epoch" INTEGER NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proposer_address" VARCHAR(42) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_vote" (
    "id" SERIAL NOT NULL,
    "in_favor_of" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "proposal_id" INTEGER NOT NULL,
    "voter_address" VARCHAR(42) NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "proposal.id_index" ON "proposal"("id");

-- CreateIndex
CREATE INDEX "proposal.epoch_index" ON "proposal"("epoch");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_vote.proposal_id_voter_address_unique" ON "proposal_vote"("proposal_id", "voter_address");

-- CreateIndex
CREATE INDEX "proposal_vote.proposal_id_index" ON "proposal_vote"("proposal_id");

-- CreateIndex
CREATE INDEX "proposal_vote.voter_address_index" ON "proposal_vote"("voter_address");

-- AddForeignKey
ALTER TABLE "proposal" ADD FOREIGN KEY ("proposer_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_vote" ADD FOREIGN KEY ("proposal_id") REFERENCES "proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_vote" ADD FOREIGN KEY ("voter_address") REFERENCES "tx_member"("eth_address") ON DELETE CASCADE ON UPDATE CASCADE;
