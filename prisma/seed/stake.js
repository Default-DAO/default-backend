const { PrismaClient } = require('@prisma/client')
const shortid = require('shortid')
const prisma = new PrismaClient()
const {members} = require('./member')

async function stakeDelegate(from, weights, people, epoch) {
  if (weight.length != people.length) return
  let stakeDelegations = []
  weights.forEach((weight, i) => {
    stakeDelegations.push({
      fromEthAddress: from,
      toEthAddress: people[i],
      weight,
      epoch: epoch ? epoch : 1,
    })
  })
  prisma.txStakeDelegation.createMany({
    data: stakeDelegations
  })
}

async function dntStake() {
  await prisma.txDntStake.upsert({ //scottsgc epoch 1
    ethAddress: members.scottsgc.ethAddress,
    createdEpoch: 1,
    amount: 50000
  })

  await stakeDelegate(
    members.scottsgc.ethAddress, 
    [3, 3, 4],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.zaz.ethAddress],
    1
  )

  await prisma.txDntStake.upsert({ //scottsgc epoch 2
    ethAddress: members.scottsgc.ethAddress,
    createdEpoch: 2,
    amount: 10000
  })

  await stakeDelegate(
    members.scottsgc.ethAddress, 
    [2, 1, 7],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.zaz.ethAddress],
    2
  )

  await prisma.txDntStake.upsert({ //zaz epoch 1
    ethAddress: members.zaz.ethAddress,
    createdEpoch: 1,
    amount: 3000
  })

  await stakeDelegate(
    members.zaz.ethAddress, 
    [1, 1, 1],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.scottsgc.ethAddress],
    1
  )

  await prisma.txDntStake.upsert({ //fullyallocated epoch 1
    ethAddress: members.fullyallocated.ethAddress,
    createdEpoch: 1,
    amount: 100000
  })

  await stakeDelegate(
    members.fullyallocated.ethAddress, 
    [1, 1],
    [members.scottsgc.ethAddress, members.soma.ethAddress],
    1
  )

  await prisma.txDntStake.upsert({ //soma epoch 1
    ethAddress: members.soma.ethAddress,
    createdEpoch: 1,
    amount: 5000
  })

  await stakeDelegate(
    members.soma.ethAddress, 
    [4],
    [members.scottsgc.ethAddress],
    1
  )
}

module.exports = {
  dntStake
}