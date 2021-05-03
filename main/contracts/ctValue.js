const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

const { authMiddleware } = require('../utils/auth');

router.post('/api/txValueAllocation/send', authMiddleware, async (req, res) => {
  try {
    const {
      allocations,
    } = req.body;

    console.log(allocations);

    const valueAllocations = await prisma.txValueAllocation.createMany({
      data: allocations,
    });
    console.log(valueAllocations);

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log(err);

    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/txValueAllocation', authMiddleware, async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page,
    } = req.body;

    const valueAllocations = await prisma.txValueAllocation.findMany({
      where: {
        fromEthAddress,
        toEthAddress,
        epoch,
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });
    console.log(valueAllocations);

    res.send({
      result: {
        valueAllocations,
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
