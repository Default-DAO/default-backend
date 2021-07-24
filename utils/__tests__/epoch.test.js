const { prisma } = require('../../prisma/index');
const {
  getCurrentEpoch,
  incrementEpoch,
  getCurrentProtocol,
  constructRewardDistributions,
  contribRewardPercent,
  lpRewardPercent,
} = require('../epoch1');
const { clearDb } = require('../../prisma/utils');

// test constants
const contributorOne = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const contributorTwo = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const contributorThree = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
const contributorFour = 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD';
const lpOne = 'E';
const lpTwo = 'F';

const contributors = [{
  ethAddress: contributorOne,
  type: 'PERSONAL',
  alias: 'contributor_1',
  createdEpoch: 0,
}, {
  ethAddress: contributorTwo,
  type: 'PERSONAL',
  alias: 'contributor_2',
  createdEpoch: 0,
}, {
  ethAddress: contributorThree,
  type: 'PERSONAL',
  alias: 'contributor_3',
  createdEpoch: 0,
}, {
  ethAddress: contributorFour,
  type: 'PERSONAL',
  alias: 'contributor_4',
  createdEpoch: 0,
}];

const lps = [{
  ethAddress: lpOne,
  type: 'ENTITY',
  alias: 'lq_1',
  createdEpoch: 0,
}, {
  ethAddress: lpTwo,
  type: 'PERSONAL',
  alias: 'lp_2',
  createdEpoch: 0,
}];

async function createTestData() {
  const currentProtocol = {
    epochNumber: 0,
    dntWithdrawFee: 1000,
    usdcWithdrawFee: 1000,
    dntEpochRewardIssuanceAmount: 100,
  };

  // create genesis epoch
  await prisma.txProtocol.create({ data: currentProtocol });

  // create contributors
  await prisma.txMember.createMany({ data: contributors });
  await prisma.apiMember.createMany({
    data: contributors.map((c) => ({ ethAddress: c.ethAddress })),
  });

  // create lps
  await prisma.txMember.createMany({ data: lps });
  await prisma.apiMember.createMany({
    data: lps.map((lp) => ({ ethAddress: lp.ethAddress })),
  });

  // initial usdc liquidity provided by lps
  await prisma.txUsdcToken.createMany({
    data: lps.map(
      (lp) => ({
        ethAddress: lp.ethAddress,
        createdEpoch: 0,
        transactionType: 'DEPOSIT',
        amount: 1000,
      }),
    ),
  });

  // create inital contributor dnt
  let amt = 1000;
  await prisma.txDntToken.createMany({
    data: contributors.map(
      (c) => {
        amt += 1000;
        return {
          ethAddress: c.ethAddress,
          createdEpoch: 0,
          transactionType: 'SWAP',
          amount: amt,
        };
      },
    ),
  });

  amt = 1000;
  // contributors stake all of their DNT
  await prisma.txDntToken.createMany({
    data: contributors.map(
      (c) => {
        amt += 1000;
        return {
          ethAddress: c.ethAddress,
          createdEpoch: 0,
          transactionType: 'STAKE',
          amount: amt,
        };
      },
    ),
  });

  // the four contributors delegate to each other
  await prisma.txStakeDelegation.createMany({
    data:
      [{
        fromEthAddress: contributorOne,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 5,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 3,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 3,
      }],
  });

  // the two contributors allocate to each other
  await prisma.txValueAllocation.createMany({
    data:
      [{
        fromEthAddress: contributorOne,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorOne,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 3,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 3,
      }],
  });
}

describe('constructRewardDistributions', () => {
  beforeEach(async () => {
    await clearDb();
    await createTestData();
  });

  afterEach(async (done) => {
    await clearDb();
    return done();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    return done();
  });

  test('should create simple dntRewardDistributions object', async () => {
    const { epochNumber } = await getCurrentProtocol();
    const distributions = await constructRewardDistributions(epochNumber);

  });
});