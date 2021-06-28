const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function protocol() {
  await prisma.txDao.upsert({
    where: { epoch: 1 },
    update: {},
    create: {
      epoch: 1,
      dtWithdrawFee: 1,
      ltWithdrawFee: 1,
      dtIssuanceAmount: 1000000,
      dtDistributions: {
        contributors: 0.5,
        liquidityProviders: 0.5
      }
    },
  })
  await prisma.txDao.upsert({
    where: { epoch: 2 },
    update: {},
    create: {
      epoch: 2,
      dtWithdrawFee: 1,
      ltWithdrawFee: 1,
      dtIssuanceAmount: 1000000,
      dtDistributions: {
        contributors: 0.5,
        liquidityProviders: 0.5
      }
    },
  })
  await prisma.txDao.upsert({
    where: { epoch: 3 },
    update: {},
    create: {
      epoch: 3,
      dtWithdrawFee: 1,
      ltWithdrawFee: 1,
      dtIssuanceAmount: 1000000,
      dtDistributions: {
        contributors: 0.5,
        liquidityProviders: 0.5
      }
    },
  })
}

module.exports = {
  protocol
}