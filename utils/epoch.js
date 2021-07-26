const { _ } = require('lodash');
const { prisma } = require('../prisma/index');
const { round } = require('./tokenmath');

const genesisEpochDate = new Date('April 19, 2021 12:00:00');

const contribRewardPercent = 0.50;
const lpRewardPercent = 0.50;

const dntRewardDistributionObj = {
  lpReward: 0,
  contributorReward: 0,
};

async function getCurrentProtocol() {
  return prisma.txProtocol.findFirst({
    orderBy: {
      epochNumber: 'desc',
    },
  });
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

async function getCurrentEpoch() {
  const { epochNumber } = await getCurrentProtocol();
  return epochNumber;
}

async function constructRewardDistributions(epochNumber) {
  const currentProtocol = await prisma.txProtocol.findUnique({
    where: { epochNumber },
  });

  // this object will be saved to the db as a reciept of all the
  // allocations and delegations that happened this epoch
  const dntRewardDistributions = {};

  // contributors get 50% of new DNT minted
  const contributorIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount / 2;

  // lps get 50% of new DNT minted
  const lpIssuanceDntAmt = currentProtocol.dntEpochRewardIssuanceAmount / 2;

  // STEP 1.
  // Get total DNT Staked for every member
  // Get DNT delegated to other people for every member
  // Calculate voting power for each member
  // Delegate to self + other people's delegations
  // Normalize voting powers in percentage relative to other members

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
  const memberStakes = {};
  dntStakes.forEach((dntStake) => {
    const { ethAddress, sum } = dntStake;
    const absoluteSum = Math.abs(Number(sum.amount));
    memberStakes[ethAddress] = {
      totalStakedDnt: absoluteSum,
      totalOwnershipPercent: absoluteSum / totalDntStakedAbs,
    };
  });

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

  const delegations = await prisma.txStakeDelegation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  const netOwnershipMap = {};
  delegations.forEach((delegation) => {
    const { fromEthAddress, toEthAddress, weight } = delegation;
    if (!memberStakes[fromEthAddress]) {
      throw new Error(`${fromEthAddress} has attempted to delegate without staking`);
    }

    // percentage of total weight fromEthAddress delegated to toEthAddress
    const percentageDelegated = weight / delegationWeightMap[fromEthAddress];

    // percentage of fromEthAddress's total staked dnt that was delegated
    // to toEthAddress
    const delegatedDntAmt = memberStakes[fromEthAddress].totalStakedDnt * percentageDelegated;

    if (!(toEthAddress in netOwnershipMap)) {
      netOwnershipMap[toEthAddress] = 0;
    }
    netOwnershipMap[toEthAddress] += delegatedDntAmt;
  });

  // STEP 2.
  // Map the allocation data

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

  // map who gave what to whom for allocations
  const allocations = await prisma.txValueAllocation.findMany({
    where: { epoch: currentProtocol.epochNumber },
  });

  const allocationMap = {};
  allocations.forEach((allocation) => {
    const { fromEthAddress, toEthAddress, weight } = allocation;
    if (!(fromEthAddress in allocationMap)) {
      allocationMap[fromEthAddress] = {};
    }
    allocationMap[fromEthAddress][toEthAddress] = weight;
  });

  // STEP 3:
  // Filter raters who don't have delegation power
  // Filter people who are not allocated by, people who allocated to less than 2 people
  // Note:
  // Use Karken's votes when you don't have enough information:
  // 1. Somebody to only 1 person (degenerated case)
  // 2. If a pair of people was not allocated to by at least 2 people
  // { A: {B: {C: 1} } } means A / B rated By C is 1 => since there's only C rating A/B, use Kraken

  let allocatedMembers = {};
  const filterInvalidAllocations = { ...allocationMap };
  Object.keys(allocationMap).forEach((ethAddress) => {
    if (Object.keys(allocationMap[ethAddress]).length <= 1
      || !(ethAddress in netOwnershipMap) || netOwnershipMap[ethAddress] <= 0) {
      delete filterInvalidAllocations[ethAddress];
      return;
    }

    allocatedMembers = { ...allocatedMembers, ...allocationMap[ethAddress] };
  });

  const filteredAllocationMap = { ...filterInvalidAllocations };
  Object.keys(filterInvalidAllocations).forEach((ethAddress) => {
    if (!(ethAddress in allocatedMembers)) {
      delete filteredAllocationMap[ethAddress];
    }
  });

  // console.log("FILT: ", filteredAllocationMap)

  // STEP 4.
  // For people A, B, C, D
  // Calculate all relative contributions, calculate triplets for ALL: A => B / C, A => B / D, A => C / B ....

  // { A: {B: {C: 1} } } means A / B rated By C is 1
  const relativeContributionMap = {};
  Object.keys(filteredAllocationMap).forEach((fromEthAddress) => {
    if (Object.keys(filteredAllocationMap[fromEthAddress]).length <= 1) {
      return;
    }

    Object.keys(filteredAllocationMap[fromEthAddress]).forEach((to1) => {
      Object.keys(filteredAllocationMap[fromEthAddress]).forEach((to2) => {
        if (to1 === to2) {
          return;
        }

        if (!(to1 in relativeContributionMap)) {
          relativeContributionMap[to1] = {};
        }
        if (!(to2 in relativeContributionMap[to1])) {
          relativeContributionMap[to1][to2] = {};
        }
        relativeContributionMap[to1][to2][fromEthAddress] = allocationMap[fromEthAddress][to1] / allocationMap[fromEthAddress][to2];
      });
    });
  });

  // console.log("RELCON: ", relativeContributionMap)

  // STEP 5.
  // Calculate average of EVERYONE who makes opinion about someone. 
  // For example, if A => B /C, D => B / C, get the average of the two.
  // Average = SUM of relative contributions * individual voting power / (total voting power - voting powers of irrelevant people)

  const completeRelativeContributionsAvg = {};
  Object.keys(relativeContributionMap).forEach((ratedMember) => {
    Object.keys(relativeContributionMap[ratedMember]).forEach((comparedMember) => {
      let average = 0;
      let total = 0;
      Object.keys(relativeContributionMap[ratedMember][comparedMember]).forEach((rater) => {
        const weight = relativeContributionMap[ratedMember][comparedMember][rater];
        const raterOwnership = netOwnershipMap[rater];
        average += weight * raterOwnership;
        total += raterOwnership;
      });

      average /= total;

      if (!(ratedMember in completeRelativeContributionsAvg)) {
        completeRelativeContributionsAvg[ratedMember] = {};
      }
      completeRelativeContributionsAvg[ratedMember][comparedMember] = average;
    });
  });

  // console.log("COMRELAVG: ", completeRelativeContributionsAvg)

  // STEP 6.
  // Repeat step 4, except excluding one person at a time this time. 
  // For example, for A => B /C, D => B / C, exclude D one time, and exclude A one time, and get averages for both.

  const excludedRelativeContributionAvg = {};
  Object.keys(relativeContributionMap).forEach((excludedRatedMember) => {
    Object.keys(relativeContributionMap[excludedRatedMember]).forEach((comparedMember) => {
      Object.keys(relativeContributionMap).forEach((ratedMember) => {
        if (ratedMember === excludedRatedMember || ratedMember === comparedMember) return;
        let average = 0;
        let total = 0;
        if (!(comparedMember in relativeContributionMap[ratedMember])) {
          //If no data, use default value, which asserts that everybody did equal work
          average = 1;
        } else {
          const raters = Object.keys(relativeContributionMap[ratedMember][comparedMember]);

          raters.forEach((rater) => {
            if (rater === excludedRatedMember && raters.length > 1) return;

            const weight = relativeContributionMap[ratedMember][comparedMember][rater];
            const raterOwnership = netOwnershipMap[rater];
            // console.log(weight, raterOwnership)
            average += weight * raterOwnership;
            total += raterOwnership;
          });

          average /= total;
        }

        if (!(excludedRatedMember in excludedRelativeContributionAvg)) {
          excludedRelativeContributionAvg[excludedRatedMember] = {};
        }
        if (!(comparedMember in excludedRelativeContributionAvg[excludedRatedMember])) {
          excludedRelativeContributionAvg[excludedRatedMember][comparedMember] = 0;
        }
        excludedRelativeContributionAvg[excludedRatedMember][comparedMember] += average;
      });
    });
  });

  // console.log("EXC: ", excludedRelativeContributionAvg)

  // STEP 7.
  // Calculate what each member gets from other people's pie
  // To get what B gets from A's pie, get X and Y where
  // X = average of the opinions of relative contributions of A relative to B
  // Y = sum of averages of opinions of relative contributions of A relative to B excluding a third member
  // 1 / (1 + X + Y)
  // What A is allowed to take in B's pie

  const pieBites = {};
  const pieLeft = {};
  Object.keys(completeRelativeContributionsAvg).forEach((A) => {
    Object.keys(completeRelativeContributionsAvg[A]).forEach((B) => {
      // console.log("AB< ", A, B)
      const completeAvg = completeRelativeContributionsAvg[A][B];
      const excludedAvg = excludedRelativeContributionAvg[A][B];
      //A relative to B gets B's share of A's pie
      if (!(B in pieBites)) {
        pieBites[B] = 0;
      }
      const bite = 1 / (1 + completeAvg + excludedAvg);
      // console.log("BITE: ", A, B, bite)
      pieBites[B] += bite;

      if (!(A in pieLeft)) {
        pieLeft[A] = 1;
      }
      pieLeft[A] -= bite;
    });
  });

  // STEP 8.
  // For member A,
  // X = aggregate of the bites A takes per everybody's pie
  // Y = what's left in A's pie after everybody takes bites from A's pie (1 - Everybody's bites)
  // What A deserves = (X + Y) / number of people
  // Calculate this for everybody, and sum of all these adds up to 1.

  const numberOfPeople = Object.keys(allocatedMembers).length;
  const noInfoPeople = [];
  let totalLeftOver = 1;
  Object.keys(allocatedMembers).forEach((person) => {
    if (!(person in pieBites)) {
      noInfoPeople.push(person);
      return;
    }
    // const leftPie = Math.max(0, pieLeft[person]);
    const eatenPie = ((pieBites[person] + pieLeft[person]) / numberOfPeople);
    totalLeftOver -= eatenPie;
    if (!dntRewardDistributions[person]) {
      dntRewardDistributions[person] = _.cloneDeep(dntRewardDistributionObj);
    }
    dntRewardDistributions[person].contributorReward = eatenPie * contributorIssuanceDntAmt;
  });

  // Artificial Kraken's split for the people without much info
  const leftOverSplit = totalLeftOver / noInfoPeople.length;
  noInfoPeople.forEach((person) => {
    if (!dntRewardDistributions[person]) {
      dntRewardDistributions[person] = _.cloneDeep(dntRewardDistributionObj);
    }
    dntRewardDistributions[person].contributorReward = leftOverSplit * contributorIssuanceDntAmt;
  });

  // STEP 9.
  // Distribute LP rewards

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
  // console.log(dntRewardDistributions);

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
    const { lpReward, contributorReward } = dntRewardDistributions[ethAddress];
    if (lpReward) {
      lpRewards.push({
        ethAddress,
        createdEpoch: currentProtocol.epochNumber,
        transactionType: 'LP_REWARD',
        amount: lpReward,
      });
    }

    if (contributorReward) {
      contributorRewards.push({
        ethAddress,
        createdEpoch: currentProtocol.epochNumber,
        transactionType: 'CONTRIBUTOR_REWARD',
        amount: contributorReward,
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

  // STEP 7. BRING OVER PREVIOUS EPOCH'S STAKES TO THE NEXT EPOCH AS DEFAULT

  const previousDelegations = await prisma.txStakeDelegation.findMany({
    where: {
      epoch: currentProtocol.epochNumber,
    },
  });

  const newDelegations = [];
  previousDelegations.forEach((stake) => {
    const newDelegation = { ...stake };
    newDelegation.epoch = currentProtocol.epochNumber + 1;
    newDelegations.push(newDelegation);
  });

  await prisma.txDntToken.createMany({ data: newDelegations });
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
