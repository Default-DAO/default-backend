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
  await prisma.txDntToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 1, 
      transactionType: DntTransactionTypes.CONTRIBUTOR_REWARD,
      amount: 500000, 
    }
  })

  await prisma.txDntToken.create({
    data: {
      ethAddress: members.zaz.ethAddress,
      createdEpoch: 1, 
      transactionType: DntTransactionTypes.LP_REWARD,
      amount: 500000, 
    }
  })

  await prisma.txDntToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 2, 
      transactionType: DntTransactionTypes.SWAP,
      amount: 100000, 
    }
  })

  await prisma.txDntToken.create({
    data: {
      ethAddress: members.zaz.ethAddress,
      createdEpoch: 2,
      transactionType: DntTransactionTypes.STAKE,
      amount: 200000, 
    }
  })

  await prisma.txDntToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 3,
      transactionType: DntTransactionTypes.STAKE,
      amount: 300000, 
    }
  })
}

async function transactUsdc() {
  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 1, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 100000, 
    }
  })

  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.soma.ethAddress,
      createdEpoch: 2, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 50000, 
    }
  })

  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.fullyallocated.ethAddress,
      createdEpoch: 2, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 15000, 
    }
  })

  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 3, 
      transactionType: UsdcTransactionTypes.DEPOSIT,
      amount: 5000, 
    }
  })
  

  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 2, 
      transactionType: UsdcTransactionTypes.SWAP,
      amount: 5000, 
    }
  })

  await prisma.txUsdcToken.create({
    data: {
      ethAddress: members.scottsgc.ethAddress,
      createdEpoch: 3,
      transactionType: UsdcTransactionTypes.WITHDRAW,
      amount: 5000, 
    }
  })
}

module.exports = {
  transactDnt,
  transactUsdc
}