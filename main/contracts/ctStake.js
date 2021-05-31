const router = require('express').Router();
const {
  BAD_REQUEST,
  PAGINATION_LIMIT,
  ALREADY_OCCURRED,
  NO_STAKE_FOUND,
} = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index');

const { authMiddleware, checkSumAddress } = require('../../utils/auth');
const { round } = require('../../utils/tokenmath');
const { getMemberDnt, getMemberDntStaked } = require('./ctPools');

router.post('/api/txStakeDelegation/stake', authMiddleware, async (req, res) => {
  try {
    let {
      ethAddress,
      amount,
    } = req.body;
    amount = Number(amount);

    const memberDnt = await getMemberDnt();
    const memberDntStaked = await getMemberDntStaked();
    if (amount > memberDnt - memberDntStaked) {
      res.send({
        result: {
          error: true,
          errorCode: OVER_LIMIT,
        },
      });
      return;
    }
    // Add epoch to each delegation
    const createdEpoch = await getCurrentEpoch();

    const exists = await prisma.txDntToken.findFirst({
      where: {
        ethAddress,
        createdEpoch,
        transactionType: 'STAKE',
      },
    });
    if (exists && exists.amount && exists.amount.toNumber()) {
      res.send({
        result: {
          error: true,
          errorCode: ALREADY_OCCURRED,
        },
      });
      return;
    }

    const stake = await prisma.txDntToken.create({
      data: {
        ethAddress,
        amount,
        createdEpoch,
        transactionType: 'STAKE',
      },
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/txStakeDelegation/stake: ', err);
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

    const isStaked = await prisma.txDntToken.findFirst({
      where: { ethAddress, transactionType: 'STAKE' },
    });

    // if user is not staked do not allow them to delegate
    if (!isStaked) {
      res.status(400).send({
        result: {
          success: false,
          error: true,
          errorCode: NO_STAKE_FOUND,
        },
      });
      return;
    }

    // Add epoch to each delegation
    const epoch = await getCurrentEpoch();

    for (const delegation of delegations) {
      delegation.epoch = epoch;
    }

    // remove any zero weight delegations or self delegations
    // These delegations if theyve been added will be deleted
    // and not recreated
    const delegationsToWrite = delegations.filter(
      (d) => d.weight > 0 && d.toEthAddress !== ethAddress,
    );

    // Delete all existing delegations
    await prisma.txStakeDelegation.deleteMany({
      where: {
        fromEthAddress: ethAddress,
        epoch,
      },
    });

    // Add new delegations
    await prisma.txStakeDelegation.createMany({
      data: delegationsToWrite,
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/txStakeDelegation/send: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/txStakeDelegation/to', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const epoch = Number(req.query.epoch);

    const stakedDnt = await prisma.txDntToken.aggregate({
      where: { ethAddress, transactionType: 'STAKE' },
      sum: { amount: true },
    });
    const totalStakedDnt = stakedDnt.sum ? Number(stakedDnt.sum.amount) : 0;

    // Delegations to other members from ethAddress
    const delegations = await prisma.txStakeDelegation.findMany({
      where: { fromEthAddress: ethAddress, epoch },
      include: { toTxMember: true },
    });

    const totalWeight = delegations.reduce((acc, del) => acc + del.weight, 0);

    const delegationsTo = delegations.map((del) => (
      { ...del, votes: (del.weight / totalWeight) * totalStakedDnt }
    ));

    res.send({
      result: {
        totalVotes: totalStakedDnt,
        delegationsToAmount: totalStakedDnt,
        delegationsTo,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/txStakeDelegation/to: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/txStakeDelegation/from', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const skip = Number(req.query.skip || 0);
    const epoch = Number(req.query.epoch);

    // Delegations to ethAddress from other members
    const delegations = await prisma.txStakeDelegation.findMany({
      where: { toEthAddress: ethAddress, epoch },
      include: { fromTxMember: true },
      skip,
      take: PAGINATION_LIMIT,
    });

    // calculate total weights delegated so far
    const totalWeightAgg = await prisma.txStakeDelegation.groupBy({
      where: { epoch },
      by: ['fromEthAddress'],
      sum: { weight: true },
    });
    const totalWeightMap = totalWeightAgg.reduce((acc, del) => {
      acc[del.fromEthAddress] = del.sum ? del.sum.weight : 0;
      return acc;
    }, {});

    // calculate total dnt staked to calculate votes
    const totalStakedDntAgg = await prisma.txDntToken.groupBy({
      where: { transactionType: 'STAKE' },
      by: ['ethAddress'],
      sum: { amount: true },
    });
    const totalStakedDntMap = totalStakedDntAgg.reduce((acc, stake) => {
      const stakeAmount = stake.sum ? Number(stake.sum.amount) : 0;
      acc[stake.ethAddress] = stakeAmount;
      return acc;
    }, {});

    // add vote details to delegationsFrom list and calculate totalVotes
    let totalVotes = 0;
    const delegationsFrom = delegations.map((del) => {
      const weightPercentage = del.weight / totalWeightMap[del.fromEthAddress];
      const votes = round(
        weightPercentage * totalStakedDntMap[del.fromEthAddress],
      );
      totalVotes += votes;
      return { ...del, votes };
    });

    res.send({
      result: {
        totalVotes,
        delegationsFromAmount: totalVotes,
        delegationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/txStakeDelegation/from: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

async function getDelegationsFromAmount(toAddress, epoch) {
  const delegationsFrom = await prisma.txStakeDelegation.findMany({
    where: {
      toEthAddress: toAddress,
      epoch,
    },
  });

  let totalAmount = 0;
  for (let i = 0; i < delegationsFrom.length; i++) {
    const { fromEthAddress } = delegationsFrom[i];
    // @todo we should not be making a query in a
    // for loop like this. there is a better more efficient way.
    const totalWeight = await prisma.txStakeDelegation.aggregate({
      where: {
        fromEthAddress,
        epoch,
      },
      sum: {
        weight: true,
      },
    });
    let stakeAmount = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: fromEthAddress,
        createdEpoch: epoch,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    stakeAmount = stakeAmount ? stakeAmount.amount.toNumber() : 0;

    totalAmount += stakeAmount * (delegationsFrom[i].weight / totalWeight.sum.weight);
  }

  return totalAmount;
}

module.exports = {
  getDelegationsFromAmount,
  router,
};
