const { prisma } = require('../../prisma/index');
const { getCurrentEpoch, incrementEpoch } = require('../epoch');
const { clearDb } = require('../../prisma/utils');

describe('incrementEpoch', async () => {
  beforeAll(() => {
    return clearDb();
  });

  afterAll(async (done) => {
    await prisma.$disconnect();
    done();
  });

  test('should increment epoch', () => {
    // @todo work in progress 
    // const addressOne = '0xeADf09E02E64e9fcB565a6507fb3aA2DX24357b2';
    // const addressTwo = '0xePFaf09E02E64e9fcBz65a6507fb3aA2DX24358m1';
    // const currentEpoch = {
    //   epochNumber: 0,
    //   dntWithdrawFee: 1000,
    //   usdcWithdrawFee: 1000,
    //   dntEpochRewardIssuanceAmount: 100000,
    // };
    // const members = [{
    //   ethAddress: addressOne,
    //   type: 'PERSONAL',
    //   alias: 'test_user_1',
    //   createdEpoch: 0,
    // }, {
    //   ethAddress: addressTwo,
    //   type: 'PERSONL',
    //   alias: 'test_user_2',
    //   createdEpoch: 0,
    // }];
    // await prisma.txProtocol.create({ data: currentEpoch });
    // await prisma.txMember.createMany(members);
    // await prisma.apiMember.createMany(members.map(
    //   m => ({ ethAddress: m.ethAddress, alias: m.alias }))
    // );
    // await prisma.txDntToken.createMany([{
    //   ethAddress: addressOne,
    //   createdEpoch: 0,
    //   transactionType: 'STAKE',
    //   amountDnt: 1000,
    // }, {
    //   ethAddress: addressOne,
    //   createdEpoch: 0,
    //   transactionType: 'STAKE',
    //   amountDnt: 1000,
    // }]);
    // await prisma.txUsdcToken.createMany([{
    //   ethAddress: addressOne,
    //   createdEpoch: 0,
    //   transactionType: 'DEPOSIT',
    //   amount: 1000,
    // }, {
    //   ethAddress: addressOne,
    //   createdEpoch: 0,
    //   transactionType: 'DEPOSIT',
    //   amount: 1000,
    // }]);

    expect(false).toBe(true);
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
    const currentEpoch = {
      epochNumber: 0,
      dntWithdrawFee: 1000,
      usdcWithdrawFee: 1000,
      dntEpochRewardIssuanceAmount: 100000,
    }
    await prisma.txProtocol.create({ data: currentEpoch });
    await expect(getCurrentEpoch()).resolves.toBe(0)
  });
});