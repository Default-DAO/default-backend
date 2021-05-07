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

    // Add epoch to each delegation
    const createdEpoch = await getCurrentEpoch();

    const stake = await prisma.txDntToken.create({
      data: {
        ethAddress,
        amountDnt,
        createdEpoch,
        transactionType: 'STAKE'
      },
    });
    console.log(stake);

    res.send({ result: { success: true, error: false } });
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

router.post('/api/txStakeDelegation/send', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      delegations,
    } = req.body;

    console.log(delegations);

    // Add epoch to each delegation
    const epoch = await getCurrentEpoch();

    for (let delegation of delegations) {
      delegation.epoch = epoch;
    }

    console.log(ethAddress, epoch)

    // Delete all existing delegations
    await prisma.txStakeDelegation.deleteMany({
      where: {
        fromEthAddress: ethAddress,
        epoch
      },
    });

    // Add new delegations
    await prisma.txStakeDelegation.createMany({
      data: delegations,
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

router.get('/api/txStakeDelegation', async (req, res) => {
  try {
    let {
      ethAddress,
      page,
      epoch
    } = req.query;
    page = Number(page)
    epoch = Number(epoch)
    
    // Delegations to other members from ethAddress
    const delegationsTo = await prisma.txStakeDelegation.findMany({
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

    // Delegations to ethAddress from other members
    const delegationsFrom = await prisma.txStakeDelegation.findMany({
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

    res.send({
      result: {
        delegationsTo,
        delegationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log("E: ",err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;
