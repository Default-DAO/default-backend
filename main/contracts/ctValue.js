const router = require('express').Router();
const {
  BAD_REQUEST,
  PAGINATION_LIMIT,
  NO_DELEGATION_FOUND,
} = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index');

const { authMiddleware, checkSumAddress } = require('../../utils/auth');
const { getDelegationsFromAmount } = require('./ctStake');

router.post('/api/txRewards/send', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      allocations,
    } = req.body;

    // Add epoch to each allocation
    const epoch = await getCurrentEpoch();

    const isDelegatedTo = await prisma.txElects.findFirst({
      where: { toEthAddress: ethAddress, epoch },
    });

    // if ethAddress has not been delegated to do not allow them to allocate
    if (!isDelegatedTo) {
      res.status(400).send({
        result: {
          success: false,
          error: true,
          errorCode: NO_DELEGATION_FOUND,
        },
      });
      return;
    }

    for (const allocation of allocations) {
      allocation.epoch = epoch;
    }

    // remove any zero weight allocations or self allocations.
    // All allocations will be deleted in the next DB call
    const allocationsToWrite = allocations.filter(
      (a) => a.weight > 0 && a.toEthAddress !== ethAddress,
    );

    // Delete all existing allocations
    await prisma.txRewards.deleteMany({
      where: {
        fromEthAddress: ethAddress,
        epoch,
      },
    });

    // Add new allocations
    await prisma.txRewards.createMany({
      data: allocationsToWrite,
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/txRewards/send: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

async function getAllocationsFromAmount(toAddress, epoch) {
  const allocationsFrom = await prisma.txRewards.findMany({
    where: {
      toEthAddress: toAddress,
      epoch,
    },
  });

  let totalAmount = 0;
  for (let i = 0; i < allocationsFrom.length; i++) {
    const fromAddress = allocationsFrom[i].fromEthAddress;
    const totalWeight = await prisma.txRewards.aggregate({
      where: {
        fromEthAddress: fromAddress,
        epoch,
      },
      sum: {
        weight: true,
      },
    });
    const allocatableAmount = await getDelegationsFromAmount(fromAddress, epoch);
    totalAmount += allocatableAmount * (allocationsFrom[i].weight / totalWeight.sum.weight);
  }

  return totalAmount;
}

router.get('/api/txRewards/to', async (req, res) => {
  /*
    Retrieve allocations to other addresses from the requesting eth address.
    Parameters:
      -ethAddress - retrieve allocations sent by this address
      -epoch - epoch to retrieve allocations from
  */
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const epoch = Number(req.query.epoch);

    // calculate total DNT delegated to ethAddress
    const stakesReceived = await prisma.txElects.findMany({
      where: { toEthAddress: ethAddress, epoch },
    });
    const stakerAddresses = stakesReceived.map((stake) => stake.fromEthAddress);

    // construct total weight map of delegations this epoch
    const totalWeights = await prisma.txElects.groupBy({
      by: ['fromEthAddress'],
      where: { fromEthAddress: { in: stakerAddresses }, epoch },
      sum: { weight: true },
    });
    const totalWeightMap = totalWeights.reduce((acc, del) => {
      acc[del.fromEthAddress] = del.sum.weight;
      return acc;
    }, {});

    // constrcut total staked DNT map by stakerAddresses
    const totalStakeAmts = await prisma.txDaoToken.groupBy({
      by: ['ethAddress'],
      where: { ethAddress: { in: stakerAddresses }, transactionType: 'STAKE' },
      sum: { amount: true },
    });
    const totalDntStakedMap = totalStakeAmts.reduce((acc, stake) => {
      acc[stake.ethAddress] = Math.abs(Number(stake.sum.amount));
      return acc;
    }, {});

    // use total weight map and total dnt staked map to determine points received
    const totalPointsReceived = stakesReceived.reduce((acc, stake) => {
      const weightPercentage = (stake.weight / totalWeightMap[stake.fromEthAddress]);
      return acc + (weightPercentage * totalDntStakedMap[stake.fromEthAddress]);
    }, 0);

    // Retrieve allocations to other members from this ethAddress
    const allocations = await prisma.txRewards.findMany({
      where: { fromEthAddress: ethAddress, epoch },
      include: { toTxMember: true },
    });
    const totalWeight = allocations.reduce((acc, alloc) => acc + alloc.weight, 0);

    // add field to allocation objects to display points allocated
    const allocationsTo = allocations.map((alloc) => (
      { ...alloc, points: (alloc.weight / totalWeight) * totalPointsReceived }
    ));

    res.send({
      result: {
        totalPoints: totalPointsReceived,
        allocationsToAmount: totalPointsReceived,
        allocationsTo,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/txRewards/to: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/txRewards/from', async (req, res) => {
  /*
    Retrieve allocations to the requesting eth address from other addresses.
    Parameters:
      -ethAddress - retrieve allocations sent to this address
      -epoch - epoch to retrieve allocations from
      -skip - offset for pagination. defaults to 0.
  */
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const skip = Number(req.query.skip || 0);
    const epoch = Number(req.query.epoch);

    // 1. Retrieve allocations to ethAddress from other members
    const allocations = await prisma.txRewards.findMany({
      where: { toEthAddress: ethAddress, epoch },
      include: { fromTxMember: true },
      take: PAGINATION_LIMIT,
      skip,
    });

    // 2. calculate how many points each allocator has to give in total

    // 2-a. retrieve all stakes to every allocator and the total weights each allocator has given
    const allocatorAddresses = allocations.map((alloc) => alloc.fromEthAddress);
    const stakesToAllocators = await prisma.txElects.findMany({
      where: { toEthAddress: { in: allocatorAddresses }, epoch },
    });
    const totalStakeWeights = await prisma.txElects.groupBy({
      by: ['fromEthAddress'],
      where: { toEthAddress: { in: allocatorAddresses }, epoch },
      sum: { weight: true },
    });
    const totalStakeWeightMap = totalStakeWeights.reduce((acc, stake) => {
      acc[stake.fromEthAddress] = Number(stake.sum.weight);
      return acc;
    }, {});

    // 2-b. retrieve all staked dnt from every allocator has received (from delegations)
    const stakerAddresses = stakesToAllocators.map((stake) => stake.fromEthAddress);
    const totalStakedDnt = await prisma.txDaoToken.groupBy({
      by: ['ethAddress'],
      where: { ethAddress: { in: stakerAddresses }, transactionType: 'STAKE' },
      sum: { amount: true },
    });
    const totalStakedDntMap = totalStakedDnt.reduce((acc, dntStake) => {
      acc[dntStake.ethAddress] = Math.abs(Number(dntStake.sum.amount));
      return acc;
    }, {});

    // 2-c. calculate the total amount of votes each allocator has given to the ethAddress
    // and the total each each allocator has to give.
    const totalAllocatorPointMap = stakesToAllocators.reduce((acc, stake) => {
      const weightPercentage = stake.weight / totalStakeWeightMap[stake.fromEthAddress];
      const pointsAllocated = weightPercentage * totalStakedDntMap[stake.fromEthAddress];
      acc[stake.toEthAddress] = (acc[stake.toEthAddress] || 0) + pointsAllocated;
      return acc;
    }, {});

    const totalAllocWeights = await prisma.txRewards.groupBy({
      by: ['fromEthAddress'],
      where: { fromEthAddress: { in: allocatorAddresses }, epoch },
      sum: { weight: true },
    });
    const totalAllocWeightMap = totalAllocWeights.reduce((acc, alloc) => {
      acc[alloc.fromEthAddress] = alloc.sum.weight;
      return acc;
    }, {});

    // 3. add points field to each allocation and use votes calculated previously
    // to populate that field. also count total points.
    let totalPoints = 0;
    const allocationsFrom = allocations.map((alloc) => {
      const weightPercent = alloc.weight / totalAllocWeightMap[alloc.fromEthAddress];
      const pointsAllocated = weightPercent * totalAllocatorPointMap[alloc.fromEthAddress];
      totalPoints += pointsAllocated;
      return { ...alloc, points: pointsAllocated };
    });

    res.send({
      result: {
        totalPoints,
        allocationsFromAmount: totalPoints,
        allocationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/txRewards/from: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {
  getAllocationsFromAmount,
  router,
};
