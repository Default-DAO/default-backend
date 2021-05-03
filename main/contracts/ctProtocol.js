const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/api/ctProtocol/getState', async (req, res) => {
  try {

    // Protocol state
    const protocolState = await prisma.txProtocol.findFirst({
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Usdc
    const totalUsdcDeposited = await prisma.txUsdcToken.aggregate({
      where: {
        transactionType: "DEPOSIT"
      },
      sum: {
        amount: true
      }
    });
    const totalUsdcWithdrawn = await prisma.txUsdcToken.aggregate({
      where: {
        transactionType: "WITHDRAW"
      },
      sum: {
        amount: true
      }
    });
    const totalUsdc = totalUsdcDeposited - totalUsdcWithdrawn;

    // Dnt
    const totalDnt = await prisma.txUsdcToken.aggregate({
      where: {
        OR: {[
          { transactionType: "CONTRIBUTOR_REWARD" },
          { transactionType: "LP_REWARD" }
        ]}
      },
      sum: {
        amountDnt: true
      }
    });

    console.log(protocolState, totalUsdc, totalDnt);

    return {
      protocolState: protocolState,
      pools: {
        USDCPool: totalUsdc,
        DNTPool: totalDnt,
      },
    };

  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

// TO BE RUN EVERY MONDAY
router.post('/api/ctProtocol/incrementEpoch', authMiddleware, async (req, res) => {
  try {
     // STEP0. GET PROTOCOL STATE FROM txProtocol AND GET EPOCH ISSUEANCE

     // 1. Get dnt issuance amount and distributions
     const { dntEpochRewardIssuanceAmount, dntRewardDistributions } = await prisma.txProtocol.findFirst({
       orderBy: {
         updatedAt: "desc"
       }
     });

     /* 2. Calculate contributor rewards */

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
     const dntStaked = await prisma.txDntToken.groupBy({
       by: ['ethAddress'],
       where: {
         transactionType: "STAKE",
       },
       sum: {
         amountDnt: true
       }
     });

     // Calculate relative amount of dnt staked compared to total dnt staked
     let delegators = {};

     for (const { ethAddress, amountDnt } of dntStaked) {
       delegators[ethAddress] = amountDnt / totalDntStaked;
     }

     // Get all delegators (and their total weight denominators)
     // * total weight denominator = sum of a delegators delegation weights
     const delegationWeightTotals = await prisma.txStakeDelegation.groupBy({
       by: ['fromEthAddress'],
       sum: {
         weight: true
       }
     });

     // Calculate amount delegated to each allocator by looping through all delegators and their delegations
     let allocators = {};

     for (const { fromEthAddress, weight: totalWeight } of delegationWeightTotals) {
       // Get delegator's delegations
       const delegations = await prisma.txStakeDelegation.findMany({
         where: {
           fromEthAddress
         }
       });

       // Give allocation power to everyone in the delegator's delegation network
       for (const { toEthAddress, weight } of delegations) {
         // Init allocator power to 0 if needed
         allocators[toEthAddress] = allocators[toEthAddress] || 0;

         // Calculate allocation power
         const allocationPower = (weight / totalWeight) * delegators[fromEthAddress];

         // Add to allocator's total power
         allocators[toEthAddress] += allocationPower;
       }
     }

     // Get all allocators (and their total weight denominators)
     // * total weight denominator = sum of a delegators delegation weights
     const allocationWeightTotals = await prisma.txValueAllocation.groupBy({
       by: ['fromEthAddress'],
       sum: {
         weight: true
       }
     });

     // Calculate value allocated to each contributor by looping through all allocators and their allocations
     let contributors = {};

     for (const { fromEthAddress, weight: totalWeight } of allocationWeightTotals) {
       // Get allocator's allocations
       const allocations = await prisma.txValueAllocation.findMany({
         where: {
           fromEthAddress
         }
       });

       // Give value to everyone in the allocator's allocation network
       for (const { toEthAddress, weight } of allocations) {
         // Init value to 0 if needed
         contributors[toEthAddress] = contributors[toEthAddress] || 0;

         // Calculate allocation power
         const relativeValue = (weight / totalWeight) * allocators[fromEthAddress];
         const totalValue = dntEpochRewardIssuanceAmount * dntRewardDistributions.contributors;
         const value = relativeValue * totalValue;

         // Add to contributor's total value
         contributors[toEthAddress] += value;
       }
     }

     /* 3. Calculate lp rewards */

     // Get total nominal usdc in lp
     const totalUsdc = await prisma.txUsdcToken.aggregate({
       where: {
         transactionType: "DEPOSIT",
       },
       sum: {
         amountDnt: true
       }
     });

     // Get all delegators (and their total weight denominators)
     const usdcLps = await prisma.txUsdcToken.groupBy({
       by: ['ethAddress'],
       where: {
         transactionType: "DEPOSIT",
       },
       sum: {
         amount: true
       }
     });

     // Calculate rewards for each lp based on their liquidity provided relative to the total liquidity provided
     let lps = {};

     for (const { ethAddress, amount } of usdcLps) {
       // Calculate rewards
       const relativeValue = (amount / totalUsdc);
       const totalValue = dntEpochRewardIssuanceAmount * dntRewardDistributions.lps;
       const value = relativeValue * totalValue;

       lps[ethAddress] = value;
     }

     /* 4. Increment Epoch */

     // STEP1. CALCULATE DNT SHARES OF ALL MEMBERS BY AGGREGATING txDntTokens

     // STEP2. CALCULATE REWARDS DISTRIBUTION AND DIVIDE UP epochIssuance

     // STEP3. CONTRIBUTOR REWARDS: AGGREGATE SHARES FOR CONTRIBUTORS

     // STEP4. LP REWARDS: AGGREGATE SHARES FOR LPS

     // STEP5. SAVE EPOCH ISSUANCES AS REWARDS FOR BOTH CONTRIBUTORS AND LPS TO txDntTokens

  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});
