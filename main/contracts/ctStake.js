const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');

router.post('/api/txStakeDelegation/stake', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      amountDnt,
    } = req.body;

    console.log(ethAddress, amountDnt);

    const stake = await prisma.txDntToken.create({
      data: {
        ethAddress,
        amountDnt,
        transactionType: 'STAKE'
      },
    });
    console.log(stake);

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

router.post('/api/txStakeDelegation/send', authMiddleware, async (req, res) => {
  try {
    const {
      delegations,
    } = req.body;

    console.log(delegations);

    const stakeDelegations = await prisma.txStakeDelegation.createMany({
      data: delegations,
    });
    console.log(stakeDelegations);

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

router.get('/api/txStakeDelegation', authMiddleware, async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page,
    } = req.body;

    const stakeDelegations = await prisma.txStakeDelegation.findMany({
      where: {
        fromEthAddress,
        toEthAddress,
        epoch,
      },
      skip: page * PAGINATION_LIMIT,
      take: PAGINATION_LIMIT,
    });
    console.log(stakeDelegations);

    res.send({
      result: {
        stakeDelegations,
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
