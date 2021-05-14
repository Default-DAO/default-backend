const { PrismaClient } = require('@prisma/client')
const { members } = require('./member')

const prisma = new PrismaClient()


async function stakeDelegate(from, weights, people, epoch) {
  if (weights.length != people.length) return
  let stakeDelegations = []
  weights.forEach((weight, i) => {
    stakeDelegations.push({
      fromEthAddress: from,
      toEthAddress: people[i],
      weight,
      epoch: epoch ? epoch : 1,
    })
  })
  await prisma.txStakeDelegation.createMany({
    data: stakeDelegations
  })
}

async function delegateStake() {
  await stakeDelegate( //scottsgc allocate epoch 1
    members.scottsgc.ethAddress,
    [3, 3, 4],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    1
  )

  await stakeDelegate( //scottsgc allocate epoch 2
    members.scottsgc.ethAddress,
    [2, 1, 7],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    2
  )

  await stakeDelegate( //zaz allocate epoch 2
    members.zaz.ethAddress,
    [1, 1, 1],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.scottsgc.ethAddress],
    2
  )

  await stakeDelegate( //fullyallocated epoch 1
    members.fullyallocated.ethAddress,
    [1, 10],
    [members.scottsgc.ethAddress, members.soma.ethAddress],
    1
  )

  await stakeDelegate( //soma epoch 1
    members.soma.ethAddress,
    [1],
    [members.fullyallocated.ethAddress],
    1
  )
}

module.exports = {
  delegateStake
}