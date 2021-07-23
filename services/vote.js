const { VOTE_THRESHOLD } = require('../config/keys');
const { round } = require('../utils/tokenmath');
const { prisma } = require('../prisma/index');

// @todo more comments
const generateProposalResult = async (proposal) => {
  /*
  // @param proposal - proposal to generate result for
  // result JSON object structure:
  // {
  //  netVotes: 500,
  //  netVotesNeeded: 0,
  //  totalAvailableVotes: 1000,
  //  inFavorOfVotes: 750,
  //  againstVotes: 250,
  //  votes: [{
  //    id: 1,
  //    ethAddress: "asdfasdfdasdf",
  //    alias: "zaz",
  //    inFavorOf: true,
  //    voteCount: 1000
  //  }]
  // }
  */

  // calculate total votes available
  const totalStakedAgg = await prisma.txDntToken.aggregate({
    where: { transactionType: 'STAKE' },
    sum: { amount: true },
  });
  const totalAvailableVotes = Math.abs(round(Number(totalStakedAgg.sum.amount)));

  const rawVotes = await prisma.proposalVote.findMany({
    where: { proposalId: proposal.id },
    include: { voter: true },
  });
  const voteWeightAgg = await prisma.txDntToken.groupBy({
    by: ['ethAddress'],
    where: {
      txMember: { is: { votes: { some: { proposalId: proposal.id } } } },
      transactionType: 'STAKE',
    },
    sum: { amount: true },
  });
  const voteCountMap = voteWeightAgg.reduce((acc, stake) => {
    acc[stake.ethAddress] = Math.abs(Number(stake.sum.amount));
    return acc;
  }, {});

  let netVotes = 0;
  let againstCount = 0;
  let inFavorOfCount = 0;
  const votes = rawVotes.map((rawVote) => {
    const voteCount = voteCountMap[rawVote.voter.ethAddress];
    netVotes = rawVote.inFavorOf ? netVotes + voteCount : netVotes - voteCount;

    if (rawVote.inFavorOf) {
      inFavorOfCount += voteCount;
    } else {
      againstCount += voteCount;
    }

    return {
      id: rawVote.id,
      alias: rawVote.voter.alias,
      ethAddress: rawVote.voter.ethAddress,
      inFavorOf: rawVote.inFavorOf,
      voteCount,
    };
  });
  const totalVotesNeeded = (totalAvailableVotes * VOTE_THRESHOLD);
  const netVotesNeeded = totalVotesNeeded >= netVotes ? totalVotesNeeded - netVotes : 0;

  return {
    netVotes, netVotesNeeded, totalAvailableVotes, votes, againstCount, inFavorOfCount,
  };
};

const closeExpiredProposals = async () => {
  const currentEpoch = await prisma.txProtocol.findFirst({
    orderBy: {
      epochNumber: 'desc',
    },
  });
  const activeProposals = await prisma.proposal.findMany({
    where: { isActive: true },
  });

  // running these queries in a for loop because this function will only be used
  // in async jobs so execution time is not such a big deal.
  activeProposals.forEach(async (proposal) => {
    if (proposal.epoch + proposal.duration <= currentEpoch.epochNumber) {
      const result = await generateProposalResult(proposal);
      const isApproved = result.netVotesNeeded === 0;
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: { isActive: false, isApproved, result },
      });
    }
  });
};

module.exports = { generateProposalResult, closeExpiredProposals };
