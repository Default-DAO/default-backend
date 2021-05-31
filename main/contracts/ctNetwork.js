const router = require('express').Router();
const { getCurrentProtocol } = require('../../utils/epoch');

const { BAD_REQUEST } = require('../../config/keys');

const { checkSumAddress } = require('../../utils/auth');

const { prisma } = require('../../prisma/index');

router.get('/api/ctNetwork/network', async (req, res) => {
  try {
    const epoch = Number(req.query.epoch);
    const requestorEthAddress = checkSumAddress(req.query.ethAddress);
    const protocol = await prisma.txProtocol.findUnique({
      where: { epochNumber: epoch },
    });

    const currentProtocol = await getCurrentProtocol();

    if (epoch === currentProtocol.epoch) {
      res.status(400).send({ error: true, errorCode: BAD_REQUEST });
      return;
    }
    const totalContribRewards = protocol.dntEpochRewardIssuanceAmount / 2;

    const rewardTxs = await prisma.txDntToken.findMany({
      select: {
        txMember: {
          select: {
            alias: true,
            ethAddress: true,
          },
        },
        amount: true,
      },
      where: {
        createdEpoch: protocol.epochNumber,
        transactionType: 'CONTRIBUTOR_REWARD',
      },
      orderBy: [{ amount: 'desc' }],
    });

    const totalPointsAgg = await prisma.txDntToken.aggregate({
      where: { transactionType: 'STAKE', createdEpoch: { lte: epoch } },
      sum: { amount: true },
    });
    const totalPoints = Number(totalPointsAgg.sum.amount);

    let requestorTxMember;
    const result = rewardTxs.reduce((acc, tx) => {
      const percentTotal = Number(tx.amount) / totalContribRewards;
      const points = percentTotal * totalPoints;
      const resultObj = {
        ethAddress: tx.txMember.ethAddress,
        alias: tx.txMember.alias,
        amountDnt: Number(tx.amount),
        percentTotal,
        points,
      };

      if (requestorEthAddress === resultObj.ethAddress) {
        requestorTxMember = resultObj;
      } else {
        acc.push(resultObj);
      }

      return acc;
    }, []);

    // add requesting eth address to the beginning of the list
    result.unshift(requestorTxMember);

    res.send({ result, error: false });
  } catch (err) {
    console.log('Failed /api/ctNetwork/network: ', err);
    res.status(400).send(err);
  }
});

module.exports = { router };
