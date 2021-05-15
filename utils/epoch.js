const { _ } = require('lodash');
const { prisma } = require('../prisma/index');

const genesisEpochDate = new Date('April 19, 2021 12:00:00');

const contribRewardPercent = 0.50;
const lpRewardPercent = 0.50;

const dntRewardDistributionObj = {
  lpReward: 0,
  delegations: {},
  allocations: {},
};

async function getCurrentProtocol() {
  return prisma.txProtocol.findFirst({
    orderBy: {
      epochNumber: 'desc',
    },
  });
}

async function getCurrentEpoch() {
  const { epochNumber } = await getCurrentProtocol();
  return epochNumber;
}

function getCurrentCycle() {
  const today = new Date();
  const difference = (today.getTime() - genesisEpochDate.getTime()) / (1000 * 3600 * 24);
  return Math.ceil(difference / 30);
}

function isFriday() {
  const today = new Date();
  return today.getDay() === 5;
}

function isMonday() {
  const today = new Date();
  return today.getDay() === 1;
}

async function constructRewardDistributions(epochNumber) {
  const currentProtocol = await prisma.txProtocol.findUnique({
    where: { epochNumber },
  });

  // this object will be saved to the db as a reciept of all the
  // allocations and delegations that happened this epoch
  const dntRewardDistributions = {};

  // this object will keep track of total dnt(trust) delegated to an address
  // this will be used to determine allocation power
  const trustMap = {};

  // contributors get 50% of new DNT minted
  const contributorIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount
   * contribRewardPercent;

  // lps get 50% of new DNT minted
  const lpIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount
   * lpRewardPercent;

  // construct a total weight map for delegations
  const delegationWeightMap = {};
  const totalDelWeights = await prisma.txStakeDelegation.groupBy({
    by: ['fromEthAddress'],
    where: { epoch: currentProtocol.epochNumber },
    sum: { weight: true },
  });
  totalDelWeights.forEach((totalDelWeight) => {
    const { fromEthAddress, sum } = totalDelWeight;
    delegationWeightMap[fromEthAddress] = sum.weight;
  });

  // construct a total weight map for allocations
  const allocationWeightMap = {};
  const totalAllocWeights = await prisma.txValueAllocation.groupBy({
    by: ['fromEthAddress'],
    where: { epoch: currentProtocol.epochNumber },
    sum: { weight: true },
  });
  totalAllocWeights.forEach((totalAllocWeight) => {
    const { fromEthAddress, sum } = totalAllocWeight;
    allocationWeightMap[fromEthAddress] = sum.weight;
  });

  const allDelegators = Object.keys(delegationWeightMap);
  const allAllocators = Object.keys(allocationWeightMap);
  const nonAllocators = allDelegators.filter((x) => !allAllocators.includes(x));

  console.log(`nonAllocators === ${nonAllocators}`);

  // STEP1. CALCULATE DNT SHARES OF ALL MEMBERS BY AGGREGATING txDntTokens

  // Get total dnt staked
  // (minus the staked DNT of those who did not allocate)
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: { transactionType: 'STAKE' },
    sum: { amount: true },
  });

  // Get amount of dnt staked by each delegator
  const dntStakes = await prisma.txDntToken.groupBy({
    by: ['ethAddress'],
    where: { transactionType: 'STAKE' },
    sum: { amount: true },
  });

  // construct network ownership map. The totalOwnershipPercent
  // will be used to calculate TRUST delegated to a user. TRUST will be
  // represented by a percentage (percentage of total trust delegated this epoch)
  const netOwnershipMap = {};
  let unallocatedPercentage = 0;
  dntStakes.forEach((dntStake) => {
    const { ethAddress, sum } = dntStake;
    const totalOwnershipPercent = sum.amount / totalDntStaked.sum.amount;
    netOwnershipMap[ethAddress] = {
      totalStakedDnt: sum.amount,
      totalOwnershipPercent: sum.amount / totalDntStaked.sum.amount,
    };

    if (nonAllocators.includes(ethAddress)) {
      unallocatedPercentage += totalOwnershipPercent;
    }
  });

  // unallocated multipler will be used to increase the allocations
  // all contributors receive in the case that someone delegates but
  // does not allocate.
  const unallocatedMultipler = 1 / (1 - unallocatedPercentage);

  // STEP2. CALCULATE REWARDS DISTRIBUTION AND DIVIDE UP epochIssuance

  // populate raw dnt values into dntRewardDistributions
  const delegations = await prisma.txStakeDelegation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  delegations.forEach((delegation) => {
    const { fromEthAddress, toEthAddress, weight } = delegation;
    if (!dntRewardDistributions[fromEthAddress]) {
      dntRewardDistributions[fromEthAddress] = _.cloneDeep(
        dntRewardDistributionObj,
      );
    }
    // percentage of total weight fromEthAddress delegated to toEthAddress
    const percentageDelegated = weight / delegationWeightMap[fromEthAddress];

    // percentage of fromEthAddress's total staked dnt that was delegated
    // to toEthAddress
    const totalDntDelegated = netOwnershipMap[fromEthAddress].totalStakedDnt * percentageDelegated;

    // add the raw dnt value to trust map. this tracks total dnt delegated
    // to user.
    trustMap[toEthAddress] = (trustMap[toEthAddress] || 0) + totalDntDelegated;

    // populate the dntRewardDistributions obj
    dntRewardDistributions[fromEthAddress].delegations[toEthAddress] = totalDntDelegated;
  });

  // populate allocations into dntRewardDistributions obj
  const allocations = await prisma.txValueAllocation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  allocations.forEach((allocation) => {
    const { fromEthAddress, weight, toEthAddress } = allocation;
    if (!dntRewardDistributions[fromEthAddress]) {
      dntRewardDistributions[fromEthAddress] = _.cloneDeep(
        dntRewardDistributionObj,
      );
    }

    // percentage of total weight fromEthAddress allocated to toEthAddress
    const percentageAllocated = weight / allocationWeightMap[fromEthAddress];

    // (percentage total ownership fromEthAddress has of all delegated dnt)
    // * (percentage allocated of staked dnt from fromEthAddress to toEthAddress)
    // * (percentage of network that is unallocated + 100%)
    // * (newly minted DNT available for contributor rewards)
    const totalDntAllocated = (trustMap[fromEthAddress] / totalDntStaked.sum.amount)
      * percentageAllocated
      * unallocatedMultipler
      * contributorIssuanceDntAmt;

    dntRewardDistributions[fromEthAddress].allocations[toEthAddress] = totalDntAllocated;
  });

  // Get total nominal usdc in lp
  const totalUsdc = await prisma.txUsdcToken.aggregate({
    where: { transactionType: 'DEPOSIT' },
    sum: { amount: true },
  });

  // Get all Lps and the amount they deposited
  const usdcLps = await prisma.txUsdcToken.groupBy({
    by: ['ethAddress'],
    where: { transactionType: 'DEPOSIT' },
    sum: { amount: true },
  });

  usdcLps.forEach((lp) => {
    const { ethAddress, sum } = lp;
    if (!dntRewardDistributions[ethAddress]) {
      dntRewardDistributions[ethAddress] = _.cloneDeep(dntRewardDistributionObj);
    }

    const percentageOwnership = sum.amount / totalUsdc.sum.amount;

    const lpRewardsDnt = percentageOwnership * lpIssuanceDntAmt;

    dntRewardDistributions[ethAddress].lpReward = lpRewardsDnt;
  });

  return dntRewardDistributions;
}

async function incrementEpoch() {
  const currentProtocol = await getCurrentProtocol();
  const dntRewardDistributions = await constructRewardDistributions(
    currentProtocol.epochNumber,
  );

  // STEP 3. LP REWARDS: AGGREGATE SHARES FOR LPS
  // STEP 4. CONTRIBUTOR REWARDS: AGGREGATE SHARES FOR CONTRIBUTORS
  const contributorRewards = [];
  const lpRewards = [];
  Object.keys(dntRewardDistributions).forEach((ethAddress) => {
    const { lpReward, allocations } = dntRewardDistributions[ethAddress];

    if (lpReward) {
      lpRewards.push({
        ethAddress,
        createdEpoch: currentProtocol.epochNumber,
        transactionType: 'LP_REWARD',
        amount: lpReward,
      });
    }

    if (!_.isEmpty(allocations)) {
      let totalDntRewarded = 0;
      Object.keys(allocations).forEach((fromEthAddress) => {
        totalDntRewarded += allocations[fromEthAddress];
      });
      contributorRewards.push({
        ethAddress,
        createdEpoch: currentProtocol.epochNumber,
        transactionType: 'CONTRIBUTOR_REWARD',
        amount: totalDntRewarded,
      });
    }
  });

  // STEP 5. SAVE EPOCH ISSUANCES AS REWARDS FOR BOTH CONTRIBUTORS AND LPS TO txDntTokens

  // create new LP_REWARD transactions
  await prisma.txDntToken.createMany({ data: lpRewards });

  // create new CONTRIBUTOR_REWARD transaction
  await prisma.txDntToken.createMany({ data: contributorRewards });

  // save dntRewardDistributions JSON obj to db. This is the recipet for all
  // allocations and delegations that occured during this epoch.
  await prisma.txProtocol.update({
    where: { epochNumber: currentProtocol.epochNumber },
    data: { dntRewardDistributions },
  });

  // STEP 6. INCREMENT EPOCH
  await prisma.txProtocol.create({
    data: {
      epochNumber: currentProtocol.epochNumber + 1,
      dntWithdrawFee: currentProtocol.dntWithdrawFee,
      usdcWithdrawFee: currentProtocol.usdcWithdrawFee,
      dntEpochRewardIssuanceAmount: currentProtocol.dntEpochRewardIssuanceAmount,
    },
  });
}

module.exports = {
  constructRewardDistributions,
  getCurrentEpoch,
  getCurrentProtocol,
  getCurrentCycle,
  isFriday,
  isMonday,
  incrementEpoch,
  contribRewardPercent,
  lpRewardPercent,
};
