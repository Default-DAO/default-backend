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
  const totalAvailableVotes = round(Number(totalStakedAgg.sum.amount));

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
    acc[stake.ethAddress] = Number(stake.sum.amount);
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

module.exports = { generateProposalResult };
