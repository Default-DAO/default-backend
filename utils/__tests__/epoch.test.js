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
const contributorOne = '0xACfCc092898B9BB277D60a13084233609c8011f7';
const contributorTwo = '0x46d036e5685d9b30630b1526243ad37F4A5D3a0C';
const lpOne = '0x065BfdFDa7225059d6f2b9B81352Ad5DD058635E';
const lpTwo = '0x7948380DEBfB312af5d4BbdfFD491ca8D52c6B66';

const contributors = [{
  ethAddress: contributorOne,
  type: 'PERSONAL',
  alias: 'contributor_1',
  epoch: 0,
}, {
  ethAddress: contributorTwo,
  type: 'PERSONAL',
  alias: 'contributor_2',
  epoch: 0,
}];

const lps = [{
  ethAddress: lpOne,
  type: 'ENTITY',
  alias: 'lq_1',
  epoch: 0,
}, {
  ethAddress: lpTwo,
  type: 'PERSONAL',
  alias: 'lp_2',
  epoch: 0,
}];

async function createTestData() {
  const currentProtocol = {
    epoch: 0,
    dtWithdrawFee: 1000,
    ltWithdrawFee: 1000,
    dtIssuanceAmount: 100,
  };

  // create genesis epoch
  await prisma.txDao.create({ data: currentProtocol });

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
  await prisma.txLiquidityToken.createMany({
    data: lps.map(
      (lp) => ({
        ethAddress: lp.ethAddress,
        epoch: 0,
        transactionType: 'DEPOSIT',
        amount: 1000,
      }),
    ),
  });

  // create inital contributor dnt
  await prisma.txDaoToken.createMany({
    data: contributors.map(
      (c) => ({
        ethAddress: c.ethAddress,
        epoch: 0,
        transactionType: 'SWAP',
        amount: 1000,
      }),
    ),
  });

  // contributors stake all of their DNT
  await prisma.txDaoToken.createMany({
    data: contributors.map(
      (c) => ({
        ethAddress: c.ethAddress,
        epoch: 0,
        transactionType: 'STAKE',
        amount: 1000,
      }),
    ),
  });

  // the two contributors delegate to each other
  await prisma.txElects.createMany({
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
  await prisma.txRewards.createMany({
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

  test('should create simple dtDistributions object', async () => {
    const { epoch } = await getCurrentProtocol();
    const distributions = await constructRewardDistributions(epoch);

    // verify every lp and contributor appears in the distributions object
    expect(Object.keys(distributions).length === 4).toBe(true);

    // verify the amount allocated from contrib 1 to contrib 2 is accurate
    expect(distributions[contributorOne].allocations[contributorTwo]).toBe(25);

    // verify the amount allocated from contrib 2 to contrib 1 is accurate
    expect(distributions[contributorTwo].allocations[contributorOne]).toBe(25);
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
    expect(incrementedEpoch).toBe(currentProtocol.epoch + 1);
  });

  test('should create a simple dtDistributions JSON object', async () => {
    await incrementEpoch();

    const currentEpoch = await getCurrentEpoch();

    const pastEpoch = currentEpoch - 1;

    const {
      dtDistributions,
      dtIssuanceAmount,
    } = await prisma.txDao.findFirst({
      where: { epoch: pastEpoch },
    });

    // VERIFY LP REWARDS
    // expected LP reward === (new tokens / 2) * lp_ownership_percentage
    // in this test case each lp has contributed 50% so they get an equal share
    const expectedLpReward = dtIssuanceAmount / 2 / lps.length;

    // verify LP rewards are caluclated accurately
    expect(dtDistributions[lpOne].lpReward).toBe(expectedLpReward);
    expect(dtDistributions[lpTwo].lpReward).toBe(expectedLpReward);

    // VERIFY ALLOCATIONS
    // execpted contributor reward === (new tokens /2 ) * percentage of allocations received
    const expectedContribReward = dtIssuanceAmount / 2 / contributors.length;

    // verify contributor rewards are calculated accurately
    expect(
      dtDistributions[contributorOne].allocations[contributorTwo],
    ).toBe(expectedContribReward);
    expect(
      dtDistributions[contributorTwo].allocations[contributorOne],
    ).toBe(expectedContribReward);

    // VERIFY DELEGATIONS
    const totalDntStaked = await prisma.txDaoToken.aggregate({
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
      dtDistributions[contributorOne].delegations[contributorTwo],
    ).toBe(exectedDelegationValue);

    expect(
      dtDistributions[contributorTwo].delegations[contributorOne],
    ).toBe(exectedDelegationValue);
  });

  test('should accurately write txDaoToken rewards', async () => {
    await incrementEpoch();
    const currentEpoch = await getCurrentEpoch();
    const pastEpoch = currentEpoch - 1;
    const { dtIssuanceAmount } = await getCurrentProtocol();

    const expectedContribReward = dtIssuanceAmount / 2 / contributors.length;
    const expectedLpReward = dtIssuanceAmount / 2 / lps.length;

    const contribOneRewards = await prisma.txDaoToken.findFirst({
      where: {
        ethAddress: contributorOne,
        epoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(contribOneRewards.amount.toNumber()).toBe(expectedContribReward);

    const contribTwoRewards = await prisma.txDaoToken.findFirst({
      where: {
        ethAddress: contributorTwo,
        epoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(contribTwoRewards.amount.toNumber()).toBe(expectedContribReward);

    const lpOneRewards = await prisma.txDaoToken.findFirst({
      where: {
        ethAddress: lpOne,
        epoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(lpOneRewards.amount.toNumber()).toBe(expectedLpReward);

    const lpTwoRewards = await prisma.txDaoToken.findFirst({
      where: {
        ethAddress: lpTwo,
        epoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(lpTwoRewards.amount.toNumber()).toBe(expectedLpReward);
  });

  test('should handle allocations not being made', async () => {
    const { epoch, dtIssuanceAmount } = await getCurrentProtocol();
    const contributorThree = '0xc042cc6FfC6D0f9c459793EeD1f0fb8EE34f6771';
    const contributorFour = '0xF2b24E09027816f265DAB32dCa84dd274c4122df';
    const newContributors = [{
      ethAddress: contributorThree,
      type: 'PERSONAL',
      alias: 'new_contributor_1',
      epoch: 0,
    }, {
      ethAddress: contributorFour,
      type: 'PERSONAL',
      alias: 'new_contributor_2',
      epoch: 0,
    }];

    await prisma.txMember.createMany({
      data: newContributors,
    });

    await prisma.apiMember.createMany({
      data: newContributors.map((c) => ({ ethAddress: c.ethAddress })),
    });

    // new contribs stake
    await prisma.txDaoToken.create({
      data: {
        ethAddress: contributorThree,
        amount: 1000, // same as the other contributors
        epoch: 0,
        transactionType: 'STAKE',
      },
    });
    await prisma.txDaoToken.create({
      data: {
        ethAddress: contributorFour,
        amount: 7000, // 7x the entire network, net staked === 10,000
        epoch: 0,
        transactionType: 'STAKE',
      },
    });

    // new contribs delegate to each other
    await prisma.txElects.create({
      data: {
        fromEthAddress: contributorThree,
        toEthAddress: contributorFour,
        weight: 1,
        epoch: 0,
      },
    });
    await prisma.txElects.create({
      data: {
        fromEthAddress: contributorFour,
        toEthAddress: contributorThree,
        weight: 1,
        epoch: 0,
      },
    });

    // contributor three and contributor four delegated but did not allocate
    // we should expect to see only 20% allocations made because
    // the unallocated multiplier has not been applied yet

    const distributions = await constructRewardDistributions(epoch);
    let netLpReward = 0;
    let netContribReward = 0;
    Object.keys(distributions).forEach((ethAddress) => {
      const { lpReward, allocations } = distributions[ethAddress];

      netLpReward += lpReward || 0;

      Object.keys(allocations).forEach((fromEthAddress) => {
        netContribReward += allocations[fromEthAddress];
      });
    });

    const totalContribDntRewardAmt = dtIssuanceAmount * contribRewardPercent;
    const totalLpDntRewardAmt = dtIssuanceAmount * lpRewardPercent;

    // only 2,000 out of 10,000 staked DNT was allocated. We should expect to
    // see 0.2
    expect(netContribReward / totalContribDntRewardAmt).toBe(0.2);

    // all LP rewards were distributed so we should expect to see 1.
    expect(netLpReward / totalLpDntRewardAmt).toBe(1);

    // the total percentage that has been allocated
    // should be 60% of the dtIssuanceAmount
    const totalDntRewarded = netLpReward + netContribReward;
    expect(totalDntRewarded / dtIssuanceAmount).toBe(0.6);

    // increment epoch. this should correctly allocate all the tokens
    // even though only 20% allocations were made.
    await incrementEpoch();

    const finishedProtocol = await prisma.txDao.findUnique({
      where: { epoch },
    });
    const finalDistributions = finishedProtocol.dtDistributions;
    let finalLpRewards = 0;
    let finalContribRewards = 0;
    Object.keys(finalDistributions).forEach((ethAddress) => {
      const { lpReward, allocations } = finalDistributions[ethAddress];

      finalLpRewards += lpReward || 0;

      Object.keys(allocations).forEach((fromEthAddress) => {
        finalContribRewards += allocations[fromEthAddress];
      });
    });

    // only 2,000 out of 10,000 staked DNT was allocated. BUT we should expect
    // to see 100% of DNT rewarded due to the unallocation multiplier
    expect(finalContribRewards / totalContribDntRewardAmt).toBe(1);

    // all LP rewards were distributed so we should expect to see 1.
    expect(finalLpRewards / totalLpDntRewardAmt).toBe(1);

    // the total percentage that has been allocated
    // is 60% of the dtIssuanceAmount BUT due to the unallocation
    // multiplier we should see 100%.
    const finalDntRewarded = finalLpRewards + finalContribRewards;
    expect(finalDntRewarded / dtIssuanceAmount).toBe(1);

    // finally verify that total new minted tokens were distributed to DB even
    // though only 20% of allocations were made
    const totalContribTokens = await prisma.txDaoToken.aggregate({
      where: { epoch: epoch, transactionType: 'CONTRIBUTOR_REWARD' },
      sum: { amount: true },
    });

    const totalLpRewards = await prisma.txDaoToken.aggregate({
      where: { epoch: epoch, transactionType: 'LP_REWARD' },
      sum: { amount: true },
    });

    expect(totalContribTokens.sum.amount.toNumber()).toBe(totalContribDntRewardAmt);
    expect(totalLpRewards.sum.amount.toNumber()).toBe(totalLpDntRewardAmt);
  });

  test('should have correct allocations', async () => {
    // test case:
    // 1. contributor 1 has 9000 staked. contributor 2 has 1000 staked.
    // 2. contributor 1 delegated 100% and allocated 100% to contributor 2.
    // 3. contributor 2 delegated 100% and allocated 100% to contributor 1.
    // 4. contributor 2 now has 90% of the allocating power in the network.
    //    so since contributor 2 has allocated 100% to contributor 1
    //    contributor 1 should have 90% of all this epoch's contrib rewards.

    const epoch = await getCurrentEpoch();

    await prisma.txDaoToken.create({
      data: {
        ethAddress: contributorOne,
        amount: 8000, // total net staked is now 10,000. contribOne has 9,000
        epoch: epoch,
        transactionType: 'STAKE',
      },
    });

    await incrementEpoch();

    const protocol = await prisma.txDao.findUnique({
      where: { epoch },
    });

    const distributions = protocol.dtDistributions;

    const contribOneRewards = distributions[contributorOne].allocations[contributorTwo];

    expect(contribOneRewards).toBe(
      (protocol.dtIssuanceAmount * contribRewardPercent) * 0.90,
    );
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
      epoch: 0,
      dtWithdrawFee: 1000,
      ltWithdrawFee: 1000,
      dtIssuanceAmount: 100000,
    };
    await prisma.txDao.create({ data: currentProtocol });
    await expect(getCurrentEpoch()).resolves.toBe(0);
  });
});
