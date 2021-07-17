const router = require('express').Router();
const {
  BAD_REQUEST,
  VOTE_THRESHOLD,
  NOT_AUTHORIZED
} = require('../../config/keys');

const { prisma } = require('../../prisma/index');
const { round } = require('../../utils/tokenmath');
const { generateProposalResult } = require('../../services/vote');
const { authMiddleware } = require('../../utils/auth');

router.get('/api/ctVote/proposals', async (_, res) => {
  try {
    // calculate total votes available
    const totalStakedAgg = await prisma.txDntToken.aggregate({
      where: { transactionType: 'STAKE' },
      sum: { amount: true },
    });
    const totalAvailableVotes = round(Number(totalStakedAgg.sum.amount));

    // retrieve all active proposal ids
    const activeProposals = await prisma.proposal.findMany({
      select: { id: true },
      where: { isActive: true },
    });
    const activeProposalIds = activeProposals.reduce((acc, p) => {
      acc.push(p.id);
      return acc;
    }, []);

    // if there are active proposals then calculate the current votes
    // and store the results in voteCountMap. If a proposal is inactive
    // we will have the results of the vote stored in proposal.result.
    let voteCountMap = {};
    if (activeProposalIds.length) {
      const voteWeightAgg = await prisma.txDntToken.groupBy({
        by: ['ethAddress'],
        where: {
          // making such a complicated join might be more of a performance kill
          // than just getting all weights
          txMember: {
            is: { votes: { some: { proposalId: { in: activeProposalIds } } } },
          },
          transactionType: 'STAKE',
        },
        sum: { amount: true },
      });

      voteCountMap = voteWeightAgg.reduce((acc, stake) => {
        acc[stake.ethAddress] = Number(stake.sum.amount);
        return acc;
      }, {});
    }

    const rawProposals = await prisma.proposal.findMany({
      include: { proposer: true },
      orderBy: [{ epoch: 'desc' }, { isActive: 'desc' }],
    });

    const proposals = rawProposals.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc,
      category: p.category,
      epoch: p.epoch,
      duration: p.duration,
      proposerAddress: p.proposer.ethAddress,
      proposerAlias: p.proposer.alias,
      isApproved: p.isApproved,
      isActive: p.isActive,
      inFavorOfCount: p.isActive ? voteCountMap[p.id] : p.result.inFavorOfCount,
      againstCount: p.isActive ? voteCountMap[p.id] : p.result.againstCount,
    }));

    res.send({
      result: {
        totalAvailableVotes,
        threshold: VOTE_THRESHOLD,
        proposals,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/ctVote/proposals: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctVote/proposal', async (req, res) => {
  try {
    const id = Number(req.query.id);
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: { proposer: true },
    });

    let netVotes;
    let netVotesNeeded;
    let votes;
    if (proposal.isActive) {
      // if proposal is active calculate current state
      const currentResult = await generateProposalResult(proposal);
      netVotes = currentResult.netVotes;
      netVotesNeeded = currentResult.netVotesNeeded;
      votes = currentResult.votes;
    } else {
      // proposal is no longer active. grab the frozen state from the result
      // field
      netVotes = proposal.result.netVotes;
      netVotesNeeded = proposal.result.netVotesNeeded;
      votes = proposal.result.votes;
    }

    res.send({
      result: {
        netVotes,
        netVotesNeeded,
        category: proposal.category,
        duration: proposal.duration,
        epoch: proposal.epoch,
        isApproved: proposal.isApproved,
        isActive: proposal.isActive,
        votes,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/ctVote/proposal/:id ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctVote/create', authMiddleware, async (req, res) => {
  try {
    const { proposalId, inFavorOf, ethAddress } = req.body;
    const proposal = await prisma.proposal.findUnique(
      { where: { id: proposalId } },
    );

    if (!proposal.isActive) {
      throw new Error('Proposal is no longer active');
    }

    await prisma.proposalVote.create({
      data: {
        proposalId,
        inFavorOf,
        voterAddress: ethAddress,
      },
    });

    // check if this vote makes vote pass, if it does make vote inactive and passed
    const result = await generateProposalResult(proposal);
    if (result.netVotes >= result.netVotesNeeded) {
      await prisma.proposal.update({
        where: { id: proposalId },
        data: { isActive: false, isApproved: true, result },
      });
    }

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/ctVote/create ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctVote/proposal/create', authMiddleware, async (req, res) => {
  try {
    const {
      category,
      name,
      desc,
      duration,
      ethAddress,
    } = req.body;

    const stakedDnt = await prisma.txDntToken.aggregate({
      where: { ethAddress, transactionType: 'STAKE' },
      sum: { amount: true },
    });

    if (stakedDnt < 100000) {
      res.send({
        result: {
          error: true,
          errorCode: NOT_AUTHORIZED,
        }
      });
      return
    }

    const currentEpoch = await prisma.txProtocol.findFirst({
      orderBy: {
        epochNumber: 'desc',
      },
    });

    await prisma.proposal.create({
      category,
      name,
      desc,
      epoch: currentEpoch.epochNumber,
      duration,
      proposerAddress: ethAddress,
    });

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log('Failed POST /api/ctVote/proposal/create ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {
  router,
};
