const { prisma } = require('../../prisma/index');
const { getCurrentEpoch, incrementEpoch } = require('../epoch');
const { clearDb } = require('../../prisma/utils');

describe('incrementEpoch', () => {
  beforeAll(() => {
    return clearDb();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    done();
  });

  test('should increment epoch', async () => {
    const contributorOne = '0xACfCc092898B9BB277D60a13084233609c8011f7';
    const contributorTwo = '0x46d036e5685d9b30630b1526243ad37F4A5D3a0C';
    const lpOne = '0x065BfdFDa7225059d6f2b9B81352Ad5DD058635E';
    const lpTwo = '0x7948380DEBfB312af5d4BbdfFD491ca8D52c6B66';
    const currentProtocol = {
      epochNumber: 0,
      dntWithdrawFee: 1000,
      usdcWithdrawFee: 1000,
      dntEpochRewardIssuanceAmount: 100,
    };
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
          transactionType: 'CONTRIBUTOR_REWARD',
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

    // increment epoch
    await incrementEpoch();

    const incrementedEpoch = await getCurrentEpoch();
    expect(incrementedEpoch).toBe(currentProtocol.epochNumber + 1);


    //@todo validate that currentProtocol.dntEpochRewardIssuanceAmount has been populated correctly
    //@todo validate the transactions in txDntToken are accurate
  });
});

describe('getCurrentEpoch', () => {
  beforeAll(() => {
    return clearDb();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    done();
  });

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