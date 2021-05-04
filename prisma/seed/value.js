const { PrismaClient } = require('@prisma/client')
const shortid = require('shortid')
const prisma = new PrismaClient()
const {members} = require('./member')

async function valueAllocate(from, weights, people, epoch) {
  if (weight.length != people.length) return
  let valueAllocations = []
  weights.forEach((weight, i) => {
    valueAllocations.push({
      fromEthAddress: from,
      toEthAddress: people[i],
      weight,
      epoch: epoch ? epoch : 1,
    })
  })
  prisma.txValueAllocation.createMany({
    data: valueAllocations
  })
}

async function allocateValue() {
  await valueAllocate( //scottsgc allocate epoch 1
    members.scottsgc.ethAddress, 
    [3, 3, 4],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.zaz.ethAddress],
    1
  )

  await valueAllocate( //scottsgc allocate epoch 2
    members.scottsgc.ethAddress, 
    [2, 1, 7],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.zaz.ethAddress],
    2
  )

  await valueAllocate( //zaz allocate epoch 2
    members.zaz.ethAddress, 
    [1, 1, 1],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, member.scottsgc.ethAddress],
    2
  )

  await valueAllocate( //fullyallocated epoch 1
    members.fullyallocated.ethAddress, 
    [1, 10],
    [members.scottsgc.ethAddress, members.soma.ethAddress],
    1
  )

  await valueAllocate( //soma epoch 1
    members.soma.ethAddress, 
    [1],
    [members.fullyallocated.ethAddress],
    1
  )
}

module.exports = {
  allocateValue
}