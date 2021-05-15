const { PrismaClient } = require('@prisma/client');
const { members } = require('./member');

const prisma = new PrismaClient();

async function valueAllocate(from, weights, people, epoch) {
  if (weights.length !== people.length) return;
  const valueAllocations = [];
  weights.forEach((weight, i) => {
    valueAllocations.push({
      fromEthAddress: from,
      toEthAddress: people[i],
      weight,
      epoch,
    });
  });

  for (let i = 0; i < weights.length; i++) {
    await prisma.txValueAllocation.create({
      data: valueAllocations[i],
    });
  }
}

async function allocateValue() {
  await valueAllocate( // scottsgc allocate epoch 1
    members.scottsgc.ethAddress,
    [3, 3, 4],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    1,
  );

  await valueAllocate( // scottsgc allocate epoch 2
    members.scottsgc.ethAddress,
    [2, 1, 7],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    2,
  );

  await valueAllocate( // zaz allocate epoch 2
    members.zaz.ethAddress,
    [1, 1, 1],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.scottsgc.ethAddress],
    2,
  );

  await valueAllocate( // fullyallocated epoch 1
    members.fullyallocated.ethAddress,
    [1, 10],
    [members.scottsgc.ethAddress, members.soma.ethAddress],
    1,
  );

  await valueAllocate( // soma epoch 1
    members.soma.ethAddress,
    [1],
    [members.fullyallocated.ethAddress],
    1,
  );
}

module.exports = {
  allocateValue,
};
