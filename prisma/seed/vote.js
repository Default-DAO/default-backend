const { PrismaClient } = require('@prisma/client');
const { members } = require('./member');
const { VOTE_THRESHOLD } = require('../../config/keys');

const prisma = new PrismaClient();

const generateVotes = async () => {
  const totalAvailableVotes = 400001;
  const category1 = 'Rejected Proposal';
  const category2 = 'Accepted Proposal';
  const category3 = 'In Progress Proposal';
  const proposals = [

    { // rejectedd proposal
      category: category1,
      name: 'Allow XYZ to repurchase tokens at X price',
      desc: 'We should let xyz repurchase tokens at x price for y weeks becuase'
    + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean rhoncus,'
    + ' leo placerat molestie sagittis, erat velit finibus felis, id finibus leo'
    + 'sem quis arcu. In dignissim orci libero, vitae ultrices velit'
    + ' scelerisque nec. Mauris laoreet enim quis tempus eleifend. Integer'
    + ' mattis metus vitae mi ornare commodo quis in elit. Morbi eget blandit'
    + ' dui. Proin nec velit pulvinar, aliquet velit at, scelerisque sem. Etiam'
    + ' tristique porta magna id pellentesque. Proin porttitor nec orci semper'
    + 'rhoncus. Integer leo felis, lacinia eget vulputate interdum, '
    + 'imperdiet in ante. Proin accumsan fringilla dolor, sed consectetur '
    + 'sapien feugiat quis. Aenean sit amet tortor tristique, porta justo'
    + 'vitae, eleifend augue. Aliquam maximus felis est, in facilisis diam'
    + 'lacinia at. Quisque pretium turpis quis quam rutrum, eget maximus ante'
    + ' dapibus. Etiam varius nulla non ex maximus bibendum. Aliquam sed sem'
    + 'non leo hendrerit convallis. Mauris et aliquet tortor. Morbi quis '
    + 'placerat eros, sed ullamcorper sem. Proin ut egestas elit.',
      duration: 1,
      epoch: 0,
      isApproved: false,
      isActive: false,
      proposerAddress: members.zaz.ethAddress,
    },
    { // accepted proposal
      category: category2,
      name: 'Test proposal 2',
      desc: 'We should let xyz repurchase tokens at x price for y weeks becuase'
    + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean rhoncus,'
    + ' leo placerat molestie sagittis, erat velit finibus felis, id finibus leo'
    + 'sem quis arcu. In dignissim orci libero, vitae ultrices velit'
    + ' scelerisque nec. Mauris laoreet enim quis tempus eleifend. Integer',
      duration: 1,
      epoch: 1,
      isApproved: true,
      isActive: false,
      proposerAddress: members.fullyallocated.ethAddress,
      result: { inFavorOfCount: 300000, againstCount: 100000 },

    },

    { // in progress proposal
      category: category3,
      name: 'In progress',
      desc: 'We should let xyz repurchase tokens at x price for y weeks becuase'
    + 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean rhoncus,'
    + ' leo placerat molestie sagittis, erat velit finibus felis, id finibus leo'
    + 'sem quis arcu. In dignissim orci libero, vitae ultrices velit'
    + ' scelerisque nec. Mauris laoreet enim quis tempus eleifend. Integer',
      duration: 1,
      epoch: 1,
      isApproved: false,
      isActive: true,
      proposerAddress: members.scottsgc.ethAddress,
    },

  ];

  const stakes = [{
    ethAddress: members.zaz.ethAddress,
    createdEpoch: 5,
    transactionType: 'STAKE',
    amount: 200000,
  }, {
    ethAddress: members.fullyallocated.ethAddress,
    createdEpoch: 5,
    transactionType: 'STAKE',
    amount: 100000,
  }, {
    ethAddress: members.scottsgc.ethAddress,
    createdEpoch: 5,
    transactionType: 'STAKE',
    amount: 100000,
  }, {
    ethAddress: members.soma.ethAddress,
    createdEpoch: 5,
    transactionType: 'STAKE',
    amount: 1,
  }];

  await prisma.txDntToken.createMany({
    data: stakes,
  });

  await prisma.proposal.createMany({
    data: proposals,
  });

  const rejectedProposal = await prisma.proposal.findFirst({
    where: { category: category1 },
  });

  const acceptedProposal = await prisma.proposal.findFirst({
    where: { category: category2 },
  });

  const inProgressProposal = await prisma.proposal.findFirst({
    where: { category: category3 },
  });

  const votes = [
    // first proposal rejection
    {
      inFavorOf: true,
      proposalId: rejectedProposal.id,
      voterAddress: members.zaz.ethAddress,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.fullyallocated.ethAddress,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.scottsgc.ethAddress,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.soma.ethAddress,
    },

    // second proposal acceptance
    {
      inFavorOf: true,
      proposalId: acceptedProposal.id,
      voterAddress: members.zaz.ethAddress,
    }, {
      inFavorOf: true,
      proposalId: acceptedProposal.id,
      voterAddress: members.fullyallocated.ethAddress,
    }, {
      inFavorOf: true,
      proposalId: acceptedProposal.id,
      voterAddress: members.scottsgc.ethAddress,
    }, {
      inFavorOf: false,
      proposalId: acceptedProposal.id,
      voterAddress: members.soma.ethAddress,
    },

    // third proposal votes in progress
    {
      inFavorOf: false,
      proposalId: inProgressProposal.id,
      voterAddress: members.soma.ethAddress,
    }, {
      inFavorOf: true,
      proposalId: inProgressProposal.id,
      voterAddress: members.fullyallocated.ethAddress,
    },
  ];

  const rejectedProposalResult = {
    inFavorOfCount: 200000,
    againstCount: 200001,
    netVotes: -1,
    totalAvailableVotes,
    netVotesNeeded: totalAvailableVotes * VOTE_THRESHOLD,
    votes: [{
      inFavorOf: true,
      proposalId: rejectedProposal.id,
      voterAddress: members.zaz.ethAddress,
      alias: members.zaz.alias,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.fullyallocated.ethAddress,
      alias: members.fullyallocated.alias,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.scottsgc.ethAddress,
      alias: members.scottsgc.alias,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.soma.ethAddress,
      alias: members.soma.alias,
    }],
  };

  const acceptedProposalResult = {
    inFavorOfCount: 400000,
    againstCount: 1,
    netVotes: 399999,
    totalAvailableVotes,
    netVotesNeeded: totalAvailableVotes * VOTE_THRESHOLD,
    votes: [{
      inFavorOf: true,
      proposalId: rejectedProposal.id,
      voterAddress: members.zaz.ethAddress,
      alias: members.zaz.alias,
    }, {
      inFavorOf: true,
      proposalId: rejectedProposal.id,
      voterAddress: members.fullyallocated.ethAddress,
      alias: members.fullyallocated.alias,
    }, {
      inFavorOf: true,
      proposalId: rejectedProposal.id,
      voterAddress: members.scottsgc.ethAddress,
      alias: members.scottsgc.alias,
    }, {
      inFavorOf: false,
      proposalId: rejectedProposal.id,
      voterAddress: members.soma.ethAddress,
      alias: members.soma.alias,
    }],
  };

  // expected current result for in progress proposal
  // const inProgressProposalResult = {
  //   inFavorOfCount: 1,
  //   againstCount: 100000,
  //   netVotes: 999999,
  //   totalAvailableVotes,
  //   netVotesNeeded: totalAvailableVotes * VOTE_THRESHOLD,
  //   votes: [{
  //     inFavorOf: true,
  //     proposalId: inProgressProposal.id,
  //     voterAddress: members.soma.ethAddress,
  //   }, {
  //     inFavorOf: false,
  //     proposalId: inProgressProposal.id,
  //     voterAddress: members.fullyallocated.ethAddress,
  //   }],
  // };
  await prisma.proposalVote.createMany({
    data: votes,
  });

  await prisma.proposal.update({
    where: { id: rejectedProposal.id },
    data: { result: rejectedProposalResult },
  });

  await prisma.proposal.update({
    where: { id: acceptedProposal.id },
    data: { result: acceptedProposalResult },
  });
};

module.exports = generateVotes;
