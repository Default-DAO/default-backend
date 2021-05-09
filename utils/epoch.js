const { prisma } = require('../prisma/index');
const { _ } = require('lodash');

const genesisEpochDate = new Date('April 19, 2021 12:00:00')

const dntRewardDistributionObj = {
  lpReward: 0,
  delegations: {},
  allocations: {},
}

async function getCurrentProtocol() {
  return await prisma.txProtocol.findFirst({
    orderBy: {
      epochNumber: "desc"
    }
  });
}

async function getCurrentEpoch() {
  try {
    const { epochNumber } = await getCurrentProtocol();
    return epochNumber;
  } catch (err) {
    throw err;
  }
}

function getCurrentCycle() {
  const today = new Date()
  let difference = (today.getTime() - genesisEpochDate.getTime()) / (1000 * 3600 * 24)
  return Math.ceil(difference / 30)
}

function isFriday() {
  const today = new Date()
  return today.getDay() === 5
}

function isMonday() {
  const today = new Date()
  return today.getDay() === 1
}

async function incrementEpoch() {

  const currentProtocol = await getCurrentProtocol();

  // this object will be saved to the db as a reciept of all the 
  // allocations and delegations that happened this epoch
  let dntRewardDistributions = {};

  // this object will keep track of total dnt(trust) delegated to an address
  // this will be used to determine allocation power
  let trustMap = {};

  // this object will keep track of total dnt(clout) allocated to an address
  // then one batch transaction will be written to the DB.
  let tokenDistributions = {};

  // contributors get 50% of new DNT minted
  const contributorIssuanceDntAmt =
    currentProtocol.dntEpochRewardIssuanceAmount / 2;

  // lps get 50% of new DNT minted
  const lpIssuanceDntAmt =
    currentProtocol.dntEpochRewardIssuanceAmount - contributorIssuanceDntAmt;

  // construct network ownership map. The totalOwnershipPercent
  // will be used to calculate TRUST delegated to a user. TRUST will be
  // represented by a percentage (percentage of total trust delegated this epoch)
  let netOwnershipMap = {};
  for (const { ethAddress, sum } of dntStakes) {
    // netOwnershipMap[ethAddress] = sum.amountDnt / totalDntStaked.sum.amount;
    netOwnershipMap[ethAddress] = {
      'totalStakedDnt': sum.amountDnt,
      'totalOwnershipPercent': sum.amountDnt / totalDntStaked.sum.amount,
    };
  }

  // construct a total weight map for delegations
  let delegationWeightMap = {};
  const totalDelWeights = await prisma.txStakeDelegation.groupBy({
    by: ['fromEthAddress'],
    where: { epoch: currentProtocol.epochNumber },
    sum: {
      weight: true,
    }
  });
  for (const { fromEthAddress, sum } of totalDelWeights) {
    delegationWeightMap[fromEthAddress] = sum.weight;
  }

  // construct a total weight map for allocations
  let allocationWeightMap = {};
  const totalAllocWeights = await prisma.txValueAllocation.groupBy({
    by: ['fromEthAddress'],
    where: { epoch: currentProtocol.epochNumber },
    sum: {
      weight: true,
    }
  })
  for (const { fromEthAddress, sum } of totalAllocWeights) {
    allocationWeightMap[fromEthAddress] = sum.weight;
  }


  // STEP1. CALCULATE DNT SHARES OF ALL MEMBERS BY AGGREGATING txDntTokens

  // Get total nominal dnt staked
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: {
      transactionType: "STAKE",
    },
    sum: {
      amountDnt: true
    }
  });

  // Get amount of dnt staked by each delegator
  const dntStakes = await prisma.txDntToken.groupBy({
    by: ['ethAddress'],
    where: {
      transactionType: "STAKE",
    },
    sum: {
      amountDnt: true
    }
  });

  // STEP2. CALCULATE REWARDS DISTRIBUTION AND DIVIDE UP epochIssuance

  // populate raw dnt values into delegation map 
  const delegations = await prisma.txStakeDelegation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  for (const { fromEthAddress, toEthAddress, weight } of delegations) {

    if (!dntRewardDistributions[fromEthAddress]) {
      dntRewardDistributions[fromEthAddress] = _.cloneDeep(
        dntRewardDistributionObj
      );
    }

    // percentage of total weight fromEthAddress delegated to toEthAddress
    const percentageDelegated = weight / delegationWeightMap[fromEthAddress];

    // (fromEthAddress's percentage ownership of dnt) 
    // * (fromEthAddress's percentage of personal ownership delegated to toEthAddress) 
    // * (total new dnt minted) = totalDntDelegated
    const totalDntDelegated =
      netOwnershipMap[fromEthAddress].totalStakedDnt * percentageDelegated;

    dntRewardDistributions[fromEthAddress]
      .delegations[toEthAddress] = totalDntDelegated;

    trustMap[toEthAddress] =
      (trustMap[toEthAddress] || 0) + totalDntDelegated
  }


  // populate allocations into dntRewardDistributions obj
  const allocations = await prisma.txValueAllocation.findMany({
    where: { epoch: currentProtocol.epochNumber }
  });

  for (const { fromEthAddress, toEthAddress, weight } of allocations) {
    if (!dntRewardDistributions[fromEthAddress]) {
      dntRewardDistributions[fromEthAddress] =
        Object.assign({}, dntRewardDistributionObj);
    }

    // percentage of total weight fromEthAddress allocated to toEthAddress
    const percentageAllocated = weight / allocationWeightMap[fromEthAddress];

    const totalDntAllocated =
      (trustMap[fromEthAddress] / totalDntStaked.sum.amountDnt)
      * percentageAllocated
      * contributorIssuanceDntAmt;

    dntRewardDistributions[fromEthAddress]
      .allocations[toEthAddress] = totalDntAllocated;

    tokenDistributions[toEthAddress] = (tokenDistributions[toEthAddress] || 0)
      + totalDntAllocated;
  }

  // Get total nominal usdc in lp
  const totalUsdc = await prisma.txUsdcToken.aggregate({
    where: {
      transactionType: "DEPOSIT",
    },
    sum: {
      amount: true
    }
  });

  // Get all Lps and the amount they deposited
  const usdcLps = await prisma.txUsdcToken.groupBy({
    by: ['ethAddress'],
    where: {
      transactionType: "DEPOSIT",
    },
    sum: {
      amount: true
    }
  });

  // STEP 3. LP REWARDS: AGGREGATE SHARES FOR LPS
  let lpRewards = [];
  for (const { ethAddress, sum } of usdcLps) {
    if (!dntRewardDistributions[ethAddress]) {
      dntRewardDistributions[ethAddress] =
        _.cloneDeep(dntRewardDistributionObj);
    }

    const percentageOwnership = sum.amount / totalUsdc.sum.amount;

    const lpRewardsDnt = percentageOwnership * lpIssuanceDntAmt;

    dntRewardDistributions[ethAddress].lpReward = lpRewardsDnt;

    lpRewards.push({
      ethAddress,
      createdEpoch: currentProtocol.epochNumber,
      transactionType: 'LP_REWARD',
      amountDnt: lpRewardsDnt,
    });
  }

  // STEP 4. CONTRIBUTOR REWARDS: AGGREGATE SHARES FOR CONTRIBUTORS
  let contributorRewards = [];
  Object.keys(tokenDistributions).forEach(ethAddress => {

    contributorRewards.push({
      ethAddress,
      createdEpoch: currentProtocol.epochNumber,
      transactionType: 'CONTRIBUTOR_REWARD',
      amountDnt: tokenDistributions[ethAddress]
    });

  });

  // STEP 5. SAVE EPOCH ISSUANCES AS REWARDS FOR BOTH CONTRIBUTORS AND LPS TO txDntTokens

  // create new LP_REWARD transactions
  await prisma.txDntToken.createMany({
    data: lpRewards,
  });

  // create new CONTRIBUTOR_REWARD transaction
  await prisma.txDntToken.createMany({
    data: contributorRewards,
  });

  //save dntRewardDistributions JSON obj to db
  await prisma.txProtocol.update({
    where: {
      epochNumber: currentProtocol.epochNumber,
    },
    data: {
      dntRewardDistributions
    },
  })

  // STEP 6. INCREMENT EPOCH
  await prisma.txProtocol.create({
    data: {
      epochNumber: currentProtocol.epochNumber + 1,
      dntWithdrawFee: currentProtocol.dntWithdrawFee,
      usdcWithdrawFee: currentProtocol.usdcWithdrawFee,
      dntEpochRewardIssuanceAmount: currentProtocol.dntEpochRewardIssuanceAmount,
    }
  });

};

module.exports = {
  getCurrentEpoch,
  getCurrentProtocol,
  getCurrentCycle,
  isFriday,
  isMonday,
  incrementEpoch,
}
