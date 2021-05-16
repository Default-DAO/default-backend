const router = require('express').Router();
const { _ } = require('lodash');
const {
  getCurrentProtocol,
  contribRewardPercent,
  constructRewardDistributions,
} = require('../../utils/epoch');

const { prisma } = require('../../prisma/index');

router.get('/api/ctNetwork/network', async (req, res) => {
  try {
    const epoch = Number(req.query.epoch);
    const protocol = await prisma.txProtocol.findUnique({
      where: { epochNumber: epoch },
    });

    const currentProtocol = await getCurrentProtocol();
    const totalContribRewards = protocol.dntEpochRewardIssuanceAmount
      * contribRewardPercent;

    let result = [];

    if (protocol.epochNumber === currentProtocol.epochNumber) {
      // this is the current epoch. since the allocations have not been written
      // to the DB yet we need to calculate the current state.
      const dntRewardDistributions = await constructRewardDistributions(
        protocol.epochNumber,
      );

      // Remove those without any allocations
      Object.keys(dntRewardDistributions).map((ethAddress) => {
        if (_.isEmpty(dntRewardDistributions[ethAddress].allocations)) {
          delete dntRewardDistributions[ethAddress];
        }
      });

      // dntRewardDistributions only contains ethAddresses so we an object
      // to map aliases to addresses
      const ethAliasMap = {};
      const txMembers = await prisma.txMember.findMany({
        select: { alias: true, ethAddress: true },
        where: { ethAddress: { in: Object.keys(dntRewardDistributions) } },
      });
      txMembers.forEach((txMember) => {
        ethAliasMap[txMember.ethAddress] = txMember.alias;
      });

      // using the dntRewardDistributions add up all the current allocations
      // to each user
      Object.keys(dntRewardDistributions).forEach((ethAddress) => {
        const { allocations } = dntRewardDistributions[ethAddress];

        let totalDntAllocated = 0;
        Object.keys(allocations).forEach((allocatingAddress) => {
          totalDntAllocated += allocations[allocatingAddress];
        });

        result.push({
          ethAddress: ethAddress,
          alias: ethAliasMap[ethAddress],
          amountDnt: totalDntAllocated,
          percentTotal: totalDntAllocated / totalContribRewards,
        });
      });
    } else {
      // old epoch. The allocation values are already written to the
      // txDntToken table so just read from the table.
      const rewardTxs = await prisma.txDntToken.findMany({
        select: {
          txMember: {
            select: {
              alias: true,
              ethAddress: true
            },
          },
          amount: true,
        },
        where: {
          createdEpoch: protocol.epochNumber,
          transactionType: 'CONTRIBUTOR_REWARD',
        },
      });

      result = rewardTxs.map(
        (tx) => ({
          ethAddress: tx.txMember.ethAddress,
          alias: tx.txMember.alias,
          amountDnt: tx.amount,
          percentTotal: tx.amount / totalContribRewards,
        }),
      );
    }

    res.send({ result, error: false });
  } catch (err) {
    console.log('Failed /api/ctNetwork/network: ', err);
    res.status(400).send(err);
  }
});

module.exports = { router };
