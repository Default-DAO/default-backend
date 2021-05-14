const router = require('express').Router();
const { BAD_REQUEST, OVER_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');

router.post('/api/ctPools/addLiquidity', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      amount,
    } = req.body;

    let member = await prisma.txMember.findUnique({
      where: {
        ethAddress
      }
    })

    let epoch = await getCurrentEpoch()

    let epochDeposits = await prisma.txUsdcToken.aggregate({
      where: {
        ethAddress,
        transactionType: 'DEPOSIT',
        createdEpoch: epoch
      },
      sum: {
        amount: true
      }
    })

    let depositLimit = member.liquidityCapUsdc - epochDeposits.sum.amount - amount

    if (depositLimit < 0) {
      res.send({
        result: {
          error: true,
          errorCode: OVER_LIMIT,
        }
      });
      return
    }

    if (depositLimit >= 0) {
      await prisma.txUsdcToken.create({
        data: {
          ethAddress,
          createdEpoch: epoch,
          transactionType: 'DEPOSIT',
          amount
        }
      })
    }

    if (depositLimit == 0) {
      await prisma.txMember.update({
        where: {
          ethAddress
        },
        data: {
          liquidityCapUsdc: 50000
        }
      })
    }

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    console.log("Failed /api/ctPools/addLiquidity: ", err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctPools/withdrawUsdc', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      amount,
    } = req.body;

    // STEP1: GET withdrawFeeUsdc from txProtocol and do amountUsdc - amountUsdc * withdrawFeeUsdc

    // STEP2: ADD negative transaction to txUsdcToken
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctPools/withdrawDnt', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      amount,
    } = req.body;

    // STEP0: VALIDATE METAMASK SIGNATURE

    // STEP1: GET withdrawFeeDnt from txProtocol and do amount - amount * withdrawFeeDnt

    // STEP2: ADD negative transaction to txDntTokens
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

// ???
router.post('api/ctPools/swapTokens', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      token,
      amount,
    } = req.body;

    // STEP0. METAMASK AUTH

    // STEP1. AGGREGATE DNT TOKEN AMOUNT FROM txDntTokens

    // STEP2. AGGREGATE USDC TOKEN AMOUNT FROM txUsdcToken

    // STEP3. CALCULATE RATIO OF DNT vs USDC

    // STEP4. CALCULATE HOW MUCH TOKEN AMOUNT amount IS IN OTHER TOKEN CURRENCY

    // STEP5. SAVE TRANSACTION TO txDntTOkens and txUsdcToken ACCORDINGLY BASED ON token
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

async function getUsdc() {
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
  return totalUsdcDeposited.sum.amount - totalUsdcWithdrawn.sum.amount;
}

async function getDnt() {
  const totalDnt = await prisma.txDntToken.aggregate({
    where: {
      OR: [
        { transactionType: "CONTRIBUTOR_REWARD" },
        { transactionType: "LP_REWARD" }
      ]
    },
    sum: {
      amount: true
    }
  });
  return totalDnt.sum.amount
}

async function getDntStaked() {
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: {
      transactionType: "STAKE",
    },
    sum: {
      amount: true
    }
  });
  return totalDntStaked.sum.amount
}

router.get('/api/ctPools', async (req, res) => {
  try {

    let usdc = await getUsdc()
    let dnt = await getDnt()
    let dntStaked = await getDntStaked()

    res.send({
      result: {
        usdc,
        dnt,
        dntStaked,
        error: false,
      },
    });
  } catch (err) {
    console.log('err pool: ', err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});


async function getMemberUsdc(ethAddress) {
  // Usdc
  const totalUsdcDeposited = await prisma.txUsdcToken.aggregate({
    where: {
      transactionType: "DEPOSIT",
      ethAddress
    },
    sum: {
      amount: true
    }
  });
  const totalUsdcWithdrawn = await prisma.txUsdcToken.aggregate({
    where: {
      transactionType: "WITHDRAW",
      ethAddress
    },
    sum: {
      amount: true
    }
  });
  return totalUsdcDeposited.sum.amount - totalUsdcWithdrawn.sum.amount;
}

async function getMemberDnt(ethAddress) {
  // Dnt
  const totalDnt = await prisma.txDntToken.aggregate({
    where: {
      OR: [
        { transactionType: "CONTRIBUTOR_REWARD" },
        { transactionType: "LP_REWARD" }
      ],
      ethAddress
    },
    sum: {
      amount: true
    }
  });

  return totalDnt.sum.amount
}

async function getMemberDntStaked(ethAddress) {
  // Dnt Staked
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: {
      transactionType: "STAKE",
      ethAddress
    },
    sum: {
      amount: true
    }
  });

  return totalDntStaked.sum.amount
}

//Get pool information for member
router.get('/api/ctPools/member', async (req, res) => {
  try {
    let {
      ethAddress
    } = req.query;

    let usdc = await getMemberUsdc(ethAddress)
    let dnt = await getMemberDnt(ethAddress)
    let dntStaked = await getMemberDntStaked(ethAddress)

    res.send({
      result: {
        usdc,
        dnt,
        dntStaked,
        error: false,
      },
    });
  } catch (err) {
    console.log('err: ', err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {
  router,
  getUsdc,
  getDnt,
  getDntStaked,
  getMemberUsdc,
  getMemberDnt,
  getMemberDntStaked
};
