const { prisma } = require('../../prisma/index');
const {
  getCurrentEpoch,
  incrementEpoch,
  getCurrentProtocol
} = require('../epoch');
const { clearDb } = require('../../prisma/utils');

describe('incrementEpoch', () => {

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

  beforeEach(async () => {
    await clearDb();

    // generate test data
    const currentProtocol = {
      epochNumber: 0,
      dntWithdrawFee: 1000,
      usdcWithdrawFee: 1000,
      dntEpochRewardIssuanceAmount: 100,
    };


    // create geneis epoch
    await prisma.txProtocol.create({ data: currentProtocol });

    // create contributors
    await prisma.txMember.createMany({ data: contributors });
    await prisma.apiMember.createMany({
      data: contributors.map(c => ({ ethAddress: c.ethAddress }))
    });

    // create lps
    await prisma.txMember.createMany({ data: lps });
    await prisma.apiMember.createMany({
      data: lps.map(lp => ({ ethAddress: lp.ethAddress }))
    });

    // initial usdc liquidity provided by lps
    await prisma.txUsdcToken.createMany({
      data: lps.map(
        lp => ({
          ethAddress: lp.ethAddress,
          createdEpoch: 0,
          transactionType: 'DEPOSIT',
          amount: 1000,
        })
      )
    });

    // create inital contributor dnt
    await prisma.txDntToken.createMany({
      data: contributors.map(
        c => ({
          ethAddress: c.ethAddress,
          createdEpoch: 0,
          transactionType: 'SWAP',
          amountDnt: 1000,
        })
      )
    });

    // contributors stake all of their DNT
    await prisma.txDntToken.createMany({
      data: contributors.map(
        c => ({
          ethAddress: c.ethAddress,
          createdEpoch: 0,
          transactionType: 'STAKE',
          amountDnt: 1000,
        })
      )
    });

    // the two contributors delegate to each other
    await prisma.txStakeDelegation.createMany({
      data:
        [{
          fromEthAddress: contributorOne,
          toEthAddress: contributorTwo,
          epoch: 0,
          weight: 1
        }, {
          fromEthAddress: contributorTwo,
          toEthAddress: contributorOne,
          epoch: 0,
          weight: 5,
        }]
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
        }]
    });

    return;
  });

  afterEach(async (done) => {
    await clearDb();
    return done();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    return done();
  })

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
      dntEpochRewardIssuanceAmount
    } = await prisma.txProtocol.findFirst({
      where: { epochNumber: pastEpoch }
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
    const expectedContribReward =
      dntEpochRewardIssuanceAmount / 2 / contributors.length;

    // verify contributor rewards are calculated accurately
    expect(
      dntRewardDistributions[contributorOne].allocations[contributorTwo]
    ).toBe(expectedContribReward);
    expect(
      dntRewardDistributions[contributorTwo].allocations[contributorOne]
    ).toBe(expectedContribReward);


    // VERIFY DELEGATIONS
    const totalDntStaked = await prisma.txDntToken.aggregate({
      where: {
        transactionType: "STAKE",
      },
      sum: {
        amountDnt: true
      }
    });

    // expected deletegation value === (total staked dnt of delegator) * (percentage delegated to delegatee)
    // in this test case each contributor delegates 100% of their staked tokens to each other.
    // each contributor owns 50% of all staked tokens.
    const exectedDelegationValue = totalDntStaked.sum.amountDnt / 2;

    // verify delegations are calculated accurately
    expect(
      dntRewardDistributions[contributorOne].delegations[contributorTwo]
    ).toBe(exectedDelegationValue);

    expect(
      dntRewardDistributions[contributorTwo].delegations[contributorOne]
    ).toBe(exectedDelegationValue)

  });

  test('should accurately write txDntToken rewards', async () => {
    await incrementEpoch();
    const currentEpoch = await getCurrentEpoch();
    const pastEpoch = currentEpoch - 1;
    const { dntEpochRewardIssuanceAmount } = await getCurrentProtocol();

    const expectedContribReward =
      dntEpochRewardIssuanceAmount / 2 / contributors.length;
    const expectedLpReward = dntEpochRewardIssuanceAmount / 2 / lps.length;

    const contribOneRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: contributorOne,
        createdEpoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD'
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(contribOneRewards.amountDnt).toBe(expectedContribReward);

    const contribTwoRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: contributorTwo,
        createdEpoch: pastEpoch,
        transactionType: 'CONTRIBUTOR_REWARD'
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(contribTwoRewards.amountDnt).toBe(expectedContribReward);

    const lpOneRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: lpOne,
        createdEpoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(lpOneRewards.amountDnt).toBe(expectedLpReward);

    const lpTwoRewards = await prisma.txDntToken.findFirst({
      where: {
        ethAddress: lpTwo,
        createdEpoch: pastEpoch,
        transactionType: 'LP_REWARD',
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(lpTwoRewards.amountDnt).toBe(expectedLpReward);
  });
});

describe('getCurrentEpoch', () => {
  beforeEach(async () => {
    await clearDb();
    return;
  });

  afterEach(async (done) => {
    await clearDb();
    return done();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    return done();
  })

  test('should return current epoch', async () => {
    const currentProtocol = {
      epochNumber: 0,
      dntWithdrawFee: 1000,
      usdcWithdrawFee: 1000,
      dntEpochRewardIssuanceAmount: 100000,
    }
    await prisma.txProtocol.create({ data: currentProtocol });
    await expect(getCurrentEpoch()).resolves.toBe(0)
  });
});