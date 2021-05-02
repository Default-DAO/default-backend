const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

const { authMiddleware } = require('../../utils/auth');

router.post('/api/txValueConfiguration/send', authMiddleware, async (req, res) => {
  try {
    const {
      configurations,
    } = req.body;

    console.log(configurations);

    const valueConfigurations = await prisma.txStakeConfiguration.createMany({
      data: configurations,
    });
    console.log(valueConfigurations);

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

router.get('/api/txValueConfiguration', authMiddleware, async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page,
    } = req.body;

    const valueConfigurations = await prisma.txValueConfiguration.findMany({
      where: {
        fromEthAddress,
        toEthAddress,
        epoch,
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });
    console.log(valueConfigurations);

    res.send({
      result: {
        valueConfigurations,
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
