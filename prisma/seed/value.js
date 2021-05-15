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

  console.log(`valueAllocations[0] === ${JSON.stringify(valueAllocations[0])}`);
  await prisma.txValueAllocation.create({
    data: valueAllocations[0],
  });

  console.log(`valueAllocations[1] === ${JSON.stringify(valueAllocations[1])}`);
  await prisma.txValueAllocation.create({
    data: valueAllocations[1],
  });

  console.log(`valueAllocations[2] === ${JSON.stringify(valueAllocations[2])}`);
  await prisma.txValueAllocation.create({
    data: valueAllocations[2],
  });
}

async function allocateValue() {
  console.log('1');
  await valueAllocate( // scottsgc allocate epoch 1
    members.scottsgc.ethAddress,
    [3, 3, 4],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    1,
  );

  console.log('2');
  await valueAllocate( // scottsgc allocate epoch 2
    members.scottsgc.ethAddress,
    [2, 1, 7],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.zaz.ethAddress],
    2,
  );

  console.log('3');
  await valueAllocate( // zaz allocate epoch 2
    members.zaz.ethAddress,
    [1, 1, 1],
    [members.fullyallocated.ethAddress, members.soma.ethAddress, members.scottsgc.ethAddress],
    2,
  );

  console.log('4');
  await valueAllocate( // fullyallocated epoch 1
    members.fullyallocated.ethAddress,
    [1, 10],
    [members.scottsgc.ethAddress, members.soma.ethAddress],
    1,
  );

  console.log('5');
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
