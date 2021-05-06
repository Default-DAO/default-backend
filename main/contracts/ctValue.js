const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');

router.post('/api/txValueAllocation/send', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      allocations,
    } = req.body;

    console.log(allocations);

    // Add epoch to each allocation
    const epoch = await getCurrentEpoch();

    for (let allocation of allocations) {
      allocation.epoch = epoch;
    }

    console.log(ethAddress, epoch)

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

router.get('/api/txValueAllocation', async (req, res) => {
  try {
    const {
      ethAddress,
      page,
    } = req.query;

    console.log('txValue', ethAddress, page)

    const epoch = await getCurrentEpoch();

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
    console.log(allocationsTo);

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
    console.log(allocationsFrom);

    res.send({
      result: {
        allocationsTo,
        allocationsFrom,
        error: false,
      },
    });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;
