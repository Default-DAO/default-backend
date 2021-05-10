const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function protocol() {
  await prisma.txProtocol.upsert({
    where: { epochNumber: 3 },
    update: {},
    create: {
      epochNumber: 3,
      dntWithdrawFee: 1,
      usdcWithdrawFee: 1,
      dntEpochRewardIssuanceAmount: 1000000,
      dntRewardDistributions: {
        contributors: 0.5,
        liquidityProviders: 0.5
      }
    },
  })
}

module.exports = {
  protocol
}