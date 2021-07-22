const { _ } = require('lodash');
const { prisma } = require('../prisma/index');
const { round } = require('./tokenmath');
const { closeExpiredProposals } = require('../services/vote');

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
  /*

  Here is the structure for dntRewardsDistributions JSONobject.
  This object will act like a recepit for all delegations and allocations
  that happened over the epoch.

  @todo maybe it would be easier if we provided delegations received and
  allocations receivedd instead of delegations given and allocations received.
  This was just the easiest way to write the transactions to the DB but if it causes
  issues we can change it.

  Example Object:
    {
      "0xACfCc092898B9BB277D60a13084233609c8011f7": {  // address
        "lpReward": 10,  // 0xACf... received 10 DNT from providing liquidity
        "allocations": {   // allocations this address has received

          // 0xACfCc... received 45 DNT in allocations from 0x46d0...
          "0x46d036e5685d9b30630b1526243ad37F4A5D3a0C": 45
        },
        "delegations": {  // delegations this address has given

          // 0xACfCc... delegated 9000 DNT to 0x46d0...
          "0x46d036e5685d9b30630b1526243ad37F4A5D3a0C": 9000
        }
      },
      "0x46d036e5685d9b30630b1526243ad37F4A5D3a0C": {...}
      "0xeADf09E02E64e9fcB565a6507fb3aA2DD24357b2": {...}
    }
  */
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
  const contributorIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount / 2;

  // lps get 50% of new DNT minted
  const lpIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount / 2;

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

  // STEP1. CALCULATE DNT SHARES OF ALL MEMBERS BY AGGREGATING txDntTokens

  // Get total dnt staked
  // (minus the staked DNT of those who did not allocate)
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: { transactionType: 'STAKE' },
    sum: { amount: true },
  });
  const totalDntStakedAbs = Math.abs(Number(totalDntStaked.sum.amount));

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
  dntStakes.forEach((dntStake) => {
    const { ethAddress, sum } = dntStake;
    const absoluteSum = Math.abs(Number(sum.amount));
    netOwnershipMap[ethAddress] = {
      totalStakedDnt: absoluteSum,
      totalOwnershipPercent: absoluteSum / totalDntStakedAbs,
    };
  });

  // STEP2. CALCULATE REWARDS DISTRIBUTION AND DIVIDE UP epochIssuance

  // populate raw dnt values into dntRewardDistributions
  const delegations = await prisma.txStakeDelegation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  delegations.forEach((delegation) => {
    const { fromEthAddress, toEthAddress, weight } = delegation;
    if (!netOwnershipMap[fromEthAddress]) {
      throw new Error(`${fromEthAddress} has attempted to delegate without staking`);
    }
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
    dntRewardDistributions[fromEthAddress].delegations[toEthAddress] = round(totalDntDelegated);
  });

  // populate allocations into dntRewardDistributions obj
  const allocations = await prisma.txValueAllocation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  allocations.forEach((allocation) => {
    const { fromEthAddress, weight, toEthAddress } = allocation;
    if (!dntRewardDistributions[toEthAddress]) {
      dntRewardDistributions[toEthAddress] = _.cloneDeep(
        dntRewardDistributionObj,
      );
    }

    // base case. if there is no trust (aka no DNT has been delegated to this user)
    if (!trustMap[fromEthAddress]) {
      throw new Error(
        `${fromEthAddress} has attempted to allocate to ${toEthAddress} without being delegating to`,
      );
    }

    // percentage of total weight fromEthAddress allocated to toEthAddress
    const percentageAllocated = weight / allocationWeightMap[fromEthAddress];

    // (percentage total ownership fromEthAddress has of all delegated dnt)
    // * (percentage allocated of staked dnt from fromEthAddress to toEthAddress)
    // * (newly minted DNT available for contributor rewards)
    const totalDntAllocated = (trustMap[fromEthAddress] / totalDntStakedAbs)
      * percentageAllocated
      * contributorIssuanceDntAmt;

    dntRewardDistributions[toEthAddress].allocations[fromEthAddress] = round(totalDntAllocated);
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

    dntRewardDistributions[ethAddress].lpReward = round(lpRewardsDnt);
  });

  return dntRewardDistributions;
}

async function incrementEpoch() {
  const currentProtocol = await getCurrentProtocol();
  const dntRewardDistributions = await constructRewardDistributions(
    currentProtocol.epochNumber,
  );

  // calculate unallocatedMultiplier
  // this will be used to distribute unallocated DNT evenly
  let totalDntAllocated = 0;
  Object.keys(dntRewardDistributions).forEach((ethAddress) => {
    const { allocations } = dntRewardDistributions[ethAddress];

    Object.keys(allocations).forEach((fromEthAddress) => {
      totalDntAllocated += allocations[fromEthAddress];
    });
  });
  const percentAllocated = totalDntAllocated
    / (currentProtocol.dntEpochRewardIssuanceAmount * contribRewardPercent);
  const unallocatedMultipler = round((1 / (percentAllocated || 1)));

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
      let totalReward = 0;
      Object.keys(allocations).forEach((fromEthAddress) => {
        // update dntRewardDistributions with the final value
        const finalAllocation = allocations[fromEthAddress] * unallocatedMultipler;

        // add the final allocation total to the running total
        totalReward += finalAllocation;

        // update the dntRewardDistributions object to reflect the final total
        dntRewardDistributions[ethAddress].allocations[fromEthAddress] = finalAllocation;
      });

      contributorRewards.push({
        ethAddress,
        createdEpoch: currentProtocol.epochNumber,
        transactionType: 'CONTRIBUTOR_REWARD',
        amount: totalReward,
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

  // STEP 7. CLOSE EXPIRED PROPOSALS
  closeExpiredProposals();
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
