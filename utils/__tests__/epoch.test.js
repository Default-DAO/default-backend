const { prisma } = require('../../prisma/index');
const {
  getCurrentEpoch,
  incrementEpoch,
  getCurrentProtocol,
  constructRewardDistributions,
  contribRewardPercent,
  lpRewardPercent,
} = require('../epoch');
const { clearDb } = require('../../prisma/utils');

// test constants
const contributorOne = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const contributorTwo = 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
const contributorThree = 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC';
const contributorFour = 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD';
const contributorFive = 'EEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE';
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
}, {
  ethAddress: contributorFive,
  type: 'PERSONAL',
  alias: 'contributor_5',
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
        amt += 0;
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
        amt += 0;
        return {
          ethAddress: c.ethAddress,
          createdEpoch: 0,
          transactionType: 'STAKE',
          amount: amt,
        };
      },
    ),
  });

  // the four contributors delegate to self
  await prisma.txStakeDelegation.createMany({
    data:
      [{
        fromEthAddress: contributorOne,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorFive,
        toEthAddress: contributorFive,
        epoch: 0,
        weight: 1,
      }],
  });
}

async function createAllocationTest1() {
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

async function createAllocationTest2() {
  await prisma.txValueAllocation.createMany({
    data:
      // CONTRIBUTOR 1
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
        fromEthAddress: contributorOne,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      },
      // CONTRIBUTOR 2
      {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 30,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 30,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      },
      // CONTRIBUTOR THREE
      {
        fromEthAddress: contributorThree,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 3,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 3,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 2,
      },
      // CONTRIBUTOR FOUR
      {
        fromEthAddress: contributorFour,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 9,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 9,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }],
  });
}

async function createAllocationTest3() {
  await prisma.txValueAllocation.createMany({
    data:
      // CONTRIBUTOR 1
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
        fromEthAddress: contributorOne,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorOne,
        toEthAddress: contributorFive,
        epoch: 0,
        weight: 1,
      },
      // CONTRIBUTOR 2
      {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 2,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorTwo,
        toEthAddress: contributorFive,
        epoch: 0,
        weight: 1,
      },
      // CONTRIBUTOR THREE
      {
        fromEthAddress: contributorThree,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 2,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFive,
        epoch: 0,
        weight: 1,
      },
      // CONTRIBUTOR FOUR
      {
        fromEthAddress: contributorFour,
        toEthAddress: contributorOne,
        epoch: 0,
        weight: 2,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorTwo,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        epoch: 0,
        weight: 1,
      }, {
        fromEthAddress: contributorFour,
        toEthAddress: contributorFive,
        epoch: 0,
        weight: 1,
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

  test('Should distribute contributor rewards with empty values', async () => {
    const { epochNumber } = await getCurrentProtocol();
    await createAllocationTest1();
    const distributions = await constructRewardDistributions(epochNumber);

    const contributorOneReward = 16.666666666666664;
    const contributorTwoReward = 16.666666666666664;
    const contributorThreeReward = 16.666666666666664;

    expect(
      Math.abs(distributions[contributorOne].contributorReward - contributorOneReward),
    ).toBeLessThanOrEqual(0.00000000001);

    expect(
      Math.abs(distributions[contributorTwo].contributorReward - contributorTwoReward),
    ).toBeLessThanOrEqual(0.00000000001);

    expect(
      Math.abs(distributions[contributorThree].contributorReward - contributorThreeReward),
    ).toBeLessThanOrEqual(0.00000000001);
  });

  test('Should distribute contributor rewards without empty values', async () => {
    const { epochNumber } = await getCurrentProtocol();
    await createAllocationTest2();
    const distributions = await constructRewardDistributions(epochNumber);

    const contributorOneReward = 19.969116518743498;
    const contributorTwoReward = 15.863665617848971;
    const contributorThreeReward = 9.060128882257043;
    const contributorFourReward = 5.107088981150489;

    expect(
      Math.abs(distributions[contributorOne].contributorReward - contributorOneReward),
    ).toBeLessThanOrEqual(0.00000000001);

    expect(
      Math.abs(distributions[contributorTwo].contributorReward - contributorTwoReward),
    ).toBeLessThanOrEqual(0.00000000001);

    expect(
      Math.abs(distributions[contributorThree].contributorReward - contributorThreeReward),
    ).toBeLessThanOrEqual(0.00000000001);

    expect(
      Math.abs(distributions[contributorFour].contributorReward - contributorFourReward),
    ).toBeLessThanOrEqual(0.00000000001);
  });

  test('Includes no opinion member', async () => {
    const { epochNumber } = await getCurrentProtocol();
    await createAllocationTest3();
    const distributions = await constructRewardDistributions(epochNumber);

    console.log(distributions)
    // const contributorOneReward = 19.969116518743498;
    // const contributorTwoReward = 15.863665617848971;
    // const contributorThreeReward = 9.060128882257043;
    // const contributorFourReward = 5.107088981150489;

    // expect(
    //   Math.abs(distributions[contributorOne].contributorReward - contributorOneReward),
    // ).toBeLessThanOrEqual(0.00000000001);

    // expect(
    //   Math.abs(distributions[contributorTwo].contributorReward - contributorTwoReward),
    // ).toBeLessThanOrEqual(0.00000000001);

    // expect(
    //   Math.abs(distributions[contributorThree].contributorReward - contributorThreeReward),
    // ).toBeLessThanOrEqual(0.00000000001);

    // expect(
    //   Math.abs(distributions[contributorFour].contributorReward - contributorFourReward),
    // ).toBeLessThanOrEqual(0.00000000001);
  });
});
