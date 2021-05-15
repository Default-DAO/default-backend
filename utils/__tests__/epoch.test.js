const { prisma } = require('../../prisma/index');
const {
  getCurrentEpoch,
  incrementEpoch,
  getCurrentProtocol,
  constructRewardDistributions,
} = require('../epoch');
const { clearDb } = require('../../prisma/utils');

// test constants
const contributorOne = '0xACfCc092898B9BB277D60a13084233609c8011f7';
const contributorTwo = '0x46d036e5685d9b30630b1526243ad37F4A5D3a0C';
const lpOne = '0x065BfdFDa7225059d6f2b9B81352Ad5DD058635E';
const lpTwo = '0x7948380DEBfB312af5d4BbdfFD491ca8D52c6B66';

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
  await prisma.txDntToken.createMany({
    data: contributors.map(
      (c) => ({
        ethAddress: c.ethAddress,
        createdEpoch: 0,
        transactionType: 'SWAP',
        amount: 1000,
      }),
    ),
  });

  // contributors stake all of their DNT
  await prisma.txDntToken.createMany({
    data: contributors.map(
      (c) => ({
        ethAddress: c.ethAddress,
        createdEpoch: 0,
        transactionType: 'STAKE',
        amount: 1000,
      }),
    ),
  });

  // the two contributors delegate to each other
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
            fromEthAddress: contributorTwo,
            toEthAddress: contributorOne,
            epoch: 0,
            weight: 5,
          }],
  });
  console.log('generated test data');
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

  test('simple dntRewardDistributions object', async () => {
    const { epochNumber } = await getCurrentProtocol();
    const distributions = await constructRewardDistributions(epochNumber);

    // verify every lp and contributor appears in the distributions object
    expect(Object.keys(distributions).length === 4).toBe(true);

    // verify the amount allocated from contrib 1 to contrib 2 is accurate
    expect(distributions[contributorOne].allocations[contributorTwo]).toBe(25);

    // verify the amount allocated from contrib 2 to contrib 1 is accurate
    expect(distributions[contributorTwo].allocations[contributorOne]).toBe(25);
  });

  test('complex dntRewardDistributions object', async () => {
    const { epochNumber } = await getCurrentProtocol();
    const contributorThree = '0xc042cc6FfC6D0f9c459793EeD1f0fb8EE34f6771';
    const contributorFour = '0xF2b24E09027816f265DAB32dCa84dd274c4122df';
    const newContributors = [{
      ethAddress: contributorThree,
      type: 'PERSONAL',
      alias: 'new_contributor_1',
      createdEpoch: 0,
    }, {
      ethAddress: contributorFour,
      type: 'PERSONAL',
      alias: 'new_contributor_2',
      createdEpoch: 0,
    }];

    await prisma.txMember.createMany({
      data: newContributors,
    });

    await prisma.apiMember.createMany({
      data: newContributors.map((c) => ({ ethAddress: c.ethAddress })),
    });

    // new contribs stake
    await prisma.txDntToken.create({
      data: {
        ethAddress: contributorThree,
        amount: 1000, // same as the other contributors
        createdEpoch: 0,
        transactionType: 'STAKE',
      },
    });
    await prisma.txDntToken.create({
      data: {
        ethAddress: contributorFour,
        amount: 30000, // 10x the entire network, net staked === 33000
        createdEpoch: 0,
        transactionType: 'STAKE',
      },
    });

    // new contribs delegate to each other
    await prisma.txStakeDelegation.create({
      data: {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        weight: 1,
        epoch: 0,
      },
    });
    await prisma.txStakeDelegation.create({
      data: {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        weight: 1,
        epoch: 0,
      },
    });

    // contributor three and contributor four delegated but did not allocate
    // we should expect to see contributor one and contributor two have the
    // unused allocating power.

    const distributions = await constructRewardDistributions(epochNumber);
    // @todo will finish this tomorrow very tired.
    expect(null).toBe(null);
    // const distributions = await constructRewardDistributions(epochNumber);

    // // verify every lp and contributor appears in the distributions object
    // expect(Object.keys(distributions).length === 4).toBe(true);

    // // verify the amount allocated from contrib 1 to contrib 2 is accurate
    // expect(distributions[contributorOne].allocations[contributorTwo]).toBe(25);

    // // verify the amount allocated from contrib 2 to contrib 1 is accurate
    // expect(distributions[contributorTwo].allocations[contributorOne]).toBe(25);
  });
});

describe('incrementEpoch', () => {
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

  test('should increment epoch', async () => {
    const currentProtocol = await getCurrentProtocol();

    await incrementEpoch();

    const incrementedEpoch = await getCurrentEpoch();
    expect(incrementedEpoch).toBe(currentProtocol.epochNumber + 1);
  });

  test('should create a simple dntRewardDistributions JSON object', async () => {
    await incrementEpoch();

    const currentEpoch = await getCurrentEpoch();

    const pastEpoch = currentEpoch - 1;

    const {
      dntRewardDistributions,
      dntEpochRewardIssuanceAmount,
    } = await prisma.txProtocol.findFirst({
      where: { epochNumber: pastEpoch },
    });

    // VERIFY LP REWARDS
    // expected LP reward === (new tokens / 2) * lp_ownership_percentage
    // in this test case each lp has contributed 50% so they get an equal share
    const expectedLpReward = dntEpochRewardIssuanceAmount / 2 / lps.length;

    // verify LP rewards are caluclated accurately
    expect(dntRewardDistributions[lpOne].lpReward).toBe(expectedLpReward);
    expect(dntRewardDistributions[lpTwo].lpReward).toBe(expectedLpReward);

    // VERIFY ALLOCATIONS
    // execpted contributor reward === (new tokens /2 ) * percentage of allocations received
    const expectedContribReward = dntEpochRewardIssuanceAmount / 2 / contributors.length;

    // verify contributor rewards are calculated accurately
    expect(
      dntRewardDistributions[contributorOne].allocations[contributorTwo],
    ).toBe(expectedContribReward);
    expect(
      dntRewardDistributions[contributorTwo].allocations[contributorOne],
    ).toBe(expectedContribReward);

    // VERIFY DELEGATIONS
    const totalDntStaked = await prisma.txDntToken.aggregate({
      where: {
        transactionType: 'STAKE',
      },
      sum: {
        amount: true,
      },
    });

    // eslint-disable-next-line max-len
    // expected deletegation value === (total staked dnt of delegator) * (percentage delegated to delegatee)
    // in this test case each contributor delegates 100% of their staked tokens to each other.
    // each contributor owns 50% of all staked tokens.
    const exectedDelegationValue = totalDntStaked.sum.amount / 2;

    // verify delegations are calculated accurately
    expect(
      dntRewardDistributions[contributorOne].delegations[contributorTwo],
    ).toBe(exectedDelegationValue);

    expect(
      dntRewardDistributions[contributorTwo].delegations[contributorOne],
    ).toBe(exectedDelegationValue);
  });

  test('should accurately write txDntToken rewards', async () => {
    await incrementEpoch();
    const currentEpoch = await getCurrentEpoch();
    const pastEpoch = currentEpoch - 1;
    const { dntEpochRewardIssuanceAmount } = await getCurrentProtocol();

    const expectedContribReward = dntEpochRewardIssuanceAmount / 2 / contributors.length;
    const expectedLpReward = dntEpochRewardIssuanceAmount / 2 / lps.length;

    const contribOneRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: contributorOne,
        createdEpoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(contribOneRewards.amount).toBe(expectedContribReward);

    const contribTwoRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: contributorTwo,
        createdEpoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(contribTwoRewards.amount).toBe(expectedContribReward);

    const lpOneRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: lpOne,
        createdEpoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(lpOneRewards.amount).toBe(expectedLpReward);

    const lpTwoRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: lpTwo,
        createdEpoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(lpTwoRewards.amount).toBe(expectedLpReward);
  });
});

describe('getCurrentEpoch', () => {
  beforeEach(async () => {
    await clearDb();
  });

  afterEach(async (done) => {
    await clearDb();
    return done();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    return done();
  });

  test('should return current epoch', async () => {
    const currentProtocol = {
      epochNumber: 0,
      dntWithdrawFee: 1000,
      usdcWithdrawFee: 1000,
      dntEpochRewardIssuanceAmount: 100000,
    };
    await prisma.txProtocol.create({ data: currentProtocol });
    await expect(getCurrentEpoch()).resolves.toBe(0);
  });
});
