const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

const { authMiddleware } = require('../utils/auth');

router.post('/api/txStakeConfiguration/send', authMiddleware, async (req, res) => {
  try {
    const {
      configurations,
    } = req.body;

    console.log(configurations);

    const stakeConfigurations = await prisma.txStakeConfiguration.createMany({
      data: configurations,
    });
    console.log(stakeConfigurations);

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/txStakeConfiguration', authMiddleware, async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page,
    } = req.body;

    const stakeConfigurations = await prisma.txStakeConfiguration.findMany({
      where: {
        fromEthAddress,
        toEthAddress,
        epoch,
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });
    console.log(stakeConfigurations);

    res.send({
      result: {
        stakeConfigurations,
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
