const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT, ALREADY_OCCURRED } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');
const { getMemberDnt, getMemberDntStaked } = require('./ctPools')

router.post('/api/txStakeDelegation/stake', authMiddleware, async (req, res) => {
  try {
    let {
      ethAddress,
      amountDnt,
    } = req.body;
    amountDnt = Number(amountDnt)

    let memberDnt = await getMemberDnt()
    let memberDntStaked = await getMemberDntStaked()
    if (amountDnt > memberDnt - memberDntStaked) {
      res.send({
        result: {
          error: true,
          errorCode: OVER_LIMIT,
        }
      });
      return
    }
    // Add epoch to each delegation
    const createdEpoch = await getCurrentEpoch();

    const exists = await prisma.txDntToken.findFirst({
      where: {
        ethAddress,
        createdEpoch,
        transactionType: 'STAKE'
      }
    })
    if (exists && exists.amount) {
      res.send({
        result: {
          error: true,
          errorCode: ALREADY_OCCURRED,
        }
      });
      return
    }

    const stake = await prisma.txDntToken.create({
      data: {
        ethAddress,
        amountDnt,
        createdEpoch,
        transactionType: 'STAKE'
      },
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log("Failed /api/txStakeDelegation/stake: ", err)
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

    // Add epoch to each delegation
    const epoch = await getCurrentEpoch();

    for (let delegation of delegations) {
      delegation.epoch = epoch;
    }

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

async function getDelegationsFromAmount(toAddress, epoch) {
  const delegationsFrom = await prisma.txStakeDelegation.findMany({
    where: {
      toEthAddress: toAddress,
      epoch,
    }
  });

  let totalAmount = 0
  for (let i = 0; i < delegationsFrom.length; i++) {
    let fromAddress = delegationsFrom[i].fromEthAddress
    let totalWeight = await prisma.txStakeDelegation.aggregate({
      where: {
        fromEthAddress: fromAddress,
        epoch,
      },
      sum: {
        weight: true
      }
    })
    let stakeAmount = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: fromAddress,
        createdEpoch: epoch
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
    stakeAmount = stakeAmount ? stakeAmount.amount : 0

    totalAmount += stakeAmount * (delegationsFrom[i].weight / totalWeight.sum.weight)
  }

  return totalAmount
}

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
    console.log({delegationsTo, delegationsFrom})

    const delegationsToAmount = await prisma.txDntToken.findFirst({
      where: {
        ethAddress,
        createdEpoch: epoch
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const delegationsFromAmount = await getDelegationsFromAmount(ethAddress, epoch)

    res.send({
      result: {
        delegationsToAmount: delegationsToAmount.amount,
        delegationsFromAmount,
        delegationsTo,
        delegationsFrom,
        error: false,
      },
    });
  } catch (err) {
    console.log("Failed /api/txStakeDelegation: ", err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {
  getDelegationsFromAmount,
  router
};
