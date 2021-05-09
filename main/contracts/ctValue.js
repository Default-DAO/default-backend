const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');
const {getDelegationsFromAmount} = require('./ctStake')

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
    
    // Delete all existing allocations
    await prisma.txValueAllocation.deleteMany({
      where: {
        fromEthAddress: ethAddress,
        epoch
      },
    });

    // Add new allocations
    await prisma.txValueAllocation.createMany({
      data: allocations,
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log(err)
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
    let totalWeight = await prisma.txStakeDelegation.aggregate({
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

router.get('/api/txValueAllocation', async (req, res) => {
  try {
    let {
      ethAddress,
      page,
      epoch
    } = req.query;
    page = Number(page)
    epoch = Number(epoch)

    // Allocations to other members from ethAddress
    const allocationsTo = await prisma.txValueAllocation.findMany({
      where: {
        fromEthAddress: ethAddress,
        epoch,
      },
      include: {
        toTxMember: true
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });

    // Allocations to ethAddress from other members
    const allocationsFrom = await prisma.txValueAllocation.findMany({
      where: {
        toEthAddress: ethAddress,
        epoch,
      },
      include: {
        fromTxMember: true
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });

    const allocationsToAmount = await getDelegationsFromAmount(ethAddress, epoch)

    const allocationsFromAmount = await getAllocationsFromAmount(ethAddress, epoch) 

    res.send({
      result: {
        allocationsToAmount,
        allocationsFromAmount,
        allocationsTo,
        allocationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log("E: ", err)
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
