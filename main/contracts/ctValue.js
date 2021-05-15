const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');
const { getDelegationsFromAmount } = require('./ctStake');

router.post('/api/txValueAllocation/send', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      allocations,
    } = req.body;

    // Add epoch to each allocation
    const epoch = await getCurrentEpoch();

    for (let allocation of allocations) {
      allocation.epoch = epoch;
    }

    // remove any zero weight allocations or self allocations.
    // All allocations will be deleted in the next DB call
    const allocationsToWrite = allocations.filter(
      a => a.weight > 0 && a.toEthAddress !== ethAddress
    );

    // Delete all existing allocations
    await prisma.txValueAllocation.deleteMany({
      where: {
        fromEthAddress: ethAddress,
        epoch
      },
    });

    // Add new allocations
    await prisma.txValueAllocation.createMany({
      data: allocationsToWrite,
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/txValueAllocation/send: ', err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

async function getAllocationsFromAmount(toAddress, epoch) {
  const allocationsFrom = await prisma.txValueAllocation.findMany({
    where: {
      toEthAddress: toAddress,
      epoch,
    }
  });

  let totalAmount = 0
  for (let i = 0; i < allocationsFrom.length; i++) {
    let fromAddress = allocationsFrom[i].fromEthAddress
    let totalWeight = await prisma.txValueAllocation.aggregate({
      where: {
        fromEthAddress: fromAddress,
        epoch,
      },
      sum: {
        weight: true
      }
    })
    let allocatableAmount = await getDelegationsFromAmount(fromAddress, epoch)
    totalAmount += allocatableAmount * (allocationsFrom[i].weight / totalWeight.sum.weight)
  }

  return totalAmount
}

router.get('/api/txValueAllocation/to', async (req, res) => {
  try {
    let {
      ethAddress,
      epoch
    } = req.query;
    epoch = Number(epoch)

    // Allocations to other members from ethAddress
    const allocationsTo = await prisma.txValueAllocation.findMany({
      where: {
        fromEthAddress: ethAddress,
        epoch,
      },
      include: {
        toTxMember: true
      }
    });

    const allocationsToAmount = await getDelegationsFromAmount(ethAddress, epoch)

    res.send({
      result: {
        allocationsToAmount,
        allocationsTo,
        error: false,
      },
    });
  } catch (err) {
    console.log("Failed GET /api/txValueAllocation/to: ", err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});


router.get('/api/txValueAllocation/from', async (req, res) => {
  try {
    let {
      ethAddress,
      skip,
      epoch
    } = req.query;
    skip = Number(skip)
    epoch = Number(epoch)

    // Allocations to ethAddress from other members
    const allocationsFrom = await prisma.txValueAllocation.findMany({
      where: {
        toEthAddress: ethAddress,
        epoch,
      },
      include: {
        fromTxMember: true
      },
      skip,
      take: PAGINATION_LIMIT,
    });

    const allocationsFromAmount = await getAllocationsFromAmount(ethAddress, epoch)

    res.send({
      result: {
        allocationsFromAmount,
        allocationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log("Failed GET /api/txValueAllocation/from: ", err)
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
  router
};
