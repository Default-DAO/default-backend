const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index');

const { authMiddleware } = require('../../utils/auth');

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
        OR: [
          { transactionType: "CONTRIBUTOR_REWARD" },
          { transactionType: "LP_REWARD" }
        ]
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

module.exports = router;
