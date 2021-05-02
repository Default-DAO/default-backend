const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { PrismaClient, Prisma } = require('@prisma/client')
const prisma = new PrismaClient()

router.get('/api/ctNetwork/getNetworkState', async (req, res) => {
  try {

    // Network state
    const networkState = await prisma.txProtocol.findFirst({
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

    console.log(networkState, totalUsdc, totalDnt);

    return {
      network: networkState,
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

router.post('/api/ctNetwork/incrementEpoch', async (req, res) => {
  try {
    /*  @dev
     *  request: require admin auth,
     *  response: upon successful distribution, return the network state for new epoch
     *
     *  response object: should look similar to above
     *
     *    return {
     *      currentEpoch: Integer,     => highest epoch number in Tx_Network table
     *      USDCwithdrawFee: Float,    => withdraw fee % for USDC from pool, stays at 100% until on-chain
     *      DNTwithdrawFee: Float,     => withdraw fee % for DNT from pool, stays at 100% until on-chain
     *      epochIssuance: 1000000,    => tokens issued for the epoch
     *      rewardsDistribution: {
     *        contributorRewards: .5,  => multiplier for tokens going to contributors
     *        liquidityRewards: .5     => multiplier for tokens going to liquidity providers (USDC)
     *      }
     *    }
     */

    // pseudocode
    const newNetworkState = TxProtocol.createNew({
      epochNumber: currentEpoch + 1,
      USDCwithdrawFee: 1.0,
      DNTwithdrawFee: 1.0,
      epochIssuance: 1000000,
      rewardsDistribution: {
        contributorRewards: 0.5,
        liquidityRewards: 0.5,
      },
    });

    // distribute tokens to contributors here
    TxLiquidityPoolSharesDnt.createnew({ // this table was deleted FYI
      transactionType: 'CONTRIBUTOR_DNT_REWARD',
      // ...
    });

    // distribute tokens to LPs here
    TxLiquidityPoolSharesDnt.createnew({ // this table was deleted FYI
      transactionType: 'USDC_LIQUIDITY_DNT_REWARD',
      // ...
    });

    return { success: newNetworkState };
    //
  } catch (err) {
    res.status(400).send(err);
  }
});

/* @todo
  * move Member logic out of ctNetwork and into new file called ctMember.js
  */

router.get('/api/ctNetwork/getMemberSet', async (req, res) => {
  try {
    /*  @dev
    *  request: no auth required
    *  response: returns a list of all members by address & alias
    *
    *  response object:
    *
    *    return [     => a list of all the members in the network
    *        {
    *          ethAddress: String,
    *          alias: String,
    *          type: 'PERSONAL' or 'ENTITY,
    *          createdEpoch: Integer
    *        },
    *        {
    *          ethAddress: String,
    *          alias: String,
    *          type: 'PERSONAL' or 'ENTITY,
    *          createdEpoch: Integer
    *        }
    *    ]
    */

    // pseudocode
    return TxMember.getAll();
  } catch (err) {
    res.status(400).send(err);
  }
}),

  router.post('/api/ctNetwork/registerNewMember', async (req, res) => {
    try {
      /*  @dev
                *  request: requires metamask signature, takes params
                *
                *  request payload:
                *
                *    req = {
                *      ethAddress: String,
                *      alias: String,
                *      type: String,
                *    }
                *
                *  response: returns a new member object
                *
                *  response object:
                *
                *    return {
                *      newMember: {
                *        ethAddress: String,
                *        alias: String,
                *        type: 'PERSONAL' or 'ENTITY,
                *        createdEpoch: Integer,
                *        availableLiquidityUsdc: 100000
                *      }
                *    }
                */

      // pseudocode
      const newMember = TxMember.createNew({
        ethAddress: req.ethAddress,
        alias: req.alias,
        type: req.type,
        createdEpoch: TxProtocol.latestEntry.epochNumber,
        availableLiquidityUsdc: 100000,
      });

      return { success: newMember };
    } catch (err) {
      res.status(400).send(err);
    }
  });

module.exports = router;
