const { PrismaClient } = require('@prisma/client')
const { members } = require('./member')
const {getCurrentEpoch} = require('../../utils/epoch')
const prisma = new PrismaClient()

let DntTransactionTypes = {
  CONTRIBUTOR_REWARD: 'CONTRIBUTOR_REWARD',
  LP_REWARD: 'LP_REWARD',
  SWAP: 'SWAP',
  STAKE: 'STAKE'
}

let UsdcTransactionTypes = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW',
  SWAP: 'SWAP'
}

async function transactDnt() {
  await prisma.txDaoToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 1, 
      transactionType: DntTransactionTypes.CONTRIBUTOR_REWARD,
      amount: 500000, 
    }
  })

  await prisma.txDaoToken.create({
    data: {
      ethAddress: members.zaz.ethAddress,
      epoch: 1, 
      transactionType: DntTransactionTypes.LP_REWARD,
      amount: 500000, 
    }
  })

  await prisma.txDaoToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 2, 
      transactionType: DntTransactionTypes.SWAP,
      amount: 100000, 
    }
  })

  await prisma.txDaoToken.create({
    data: {
      ethAddress: members.zaz.ethAddress,
      epoch: 2,
      transactionType: DntTransactionTypes.STAKE,
      amount: 200000, 
    }
  })

  await prisma.txDaoToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 3,
      transactionType: DntTransactionTypes.STAKE,
      amount: 300000, 
    }
  })
}

async function transactUsdc() {
  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 1, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 100000, 
    }
  })

  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.soma.ethAddress,
      epoch: 2, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 50000, 
    }
  })

  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.fullyallocated.ethAddress,
      epoch: 2, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 15000, 
    }
  })

  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 3, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 5000, 
    }
  })
  

  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 2, 
      transactionType: UsdcTransactionTypes.SWAP,
      amount: 5000, 
    }
  })

  await prisma.txLiquidityToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      epoch: 3,
      transactionType: UsdcTransactionTypes.WITHDRAW,
      amount: 5000, 
    }
  })
}

module.exports = {
  transactDnt,
  transactUsdc
}