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
      orderBy: [{
        amount: 'desc',
      }],
    });

    let requestorTxMember;
    const result = rewardTxs.reduce((acc, tx) => {
      const resultObj = {
        ethAddress: tx.txMember.ethAddress,
        alias: tx.txMember.alias,
        amountDnt: tx.amount ? tx.amount.toNumber() : 0,
        percentTotal: ((tx.amount ? tx.amount.toNumber() : 0) / totalContribRewards),
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
