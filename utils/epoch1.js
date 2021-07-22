const { _ } = require('lodash');
const { prisma } = require('../prisma/index');
const { round } = require('./tokenmath');

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

async function constructRewardDistributions(epochNumber) {
  const currentProtocol = await prisma.txProtocol.findUnique({
    where: { epochNumber },
  });

  // STEP 1.
  // Get total DNT Staked for every member
  // Get DNT delegated to other people for every member
  // Calculate voting power for each member
  // Delegate to self + other people's delegations
  // Normalize voting powers in percentage relative to other members

  // STEP 2.
  // Normalize allocations weights to percentages
  
  // STEP 3.
  // For people A, B, C, D
  // Calculate all relative contribuions, calculate triplets for ALL: A => B / C, A => B / D, A => C / B ....
  
  // STEP 4.
  // Calculate average of EVERYONE who makes opinion about someone. 
  // For example, if A => B /C, D => B / C, get the average of the two.
  // Average = SUM of relative contributions * individual voting power / (total voting power - voting powers of irrelevant people)

  // STEP 5.
  // Repeat step 4, except excluding one person at a time this time. 
  // For example, for A => B /C, D => B / C, exclude D one time, and exclude A one time, and get averages for both.

  // STEP 6.
  // Calculate what each member gets from other people's pie  
  // To get what A gets from B's pie, get X and Y where 
  // X = average of the opinions of relative contributions of B relative to A
  // Y = sum of averages of opinions of relative contributions of B relative to A excluding a third member
  // 1 / (1 + X + Y)
  // What A is allowed to take in B's pie

  // STEP 7.
  // For member A, 
  // X = aggregate of the bites A takes per everybody's pie
  // Y = what's left in A's pie after everybody takes bites from A's pie (1 - Everybody's bites)
  // What A deserves = (X + Y) / number of people
  // Calculate this for everybody, and sum of all these adds up to 1.

  // STEP 8.
  // Distribute contributor tokens according to STEP 7
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
