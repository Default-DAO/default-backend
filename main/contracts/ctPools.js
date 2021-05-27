// Helpful documentations on web3 subscribe
// https://ethereum.stackexchange.com/questions/12553/understanding-logs-and-log-blooms/12587
// https://ethereum.stackexchange.com/questions/26621/subscribe-to-all-token-transfers-for-entire-blockchain
// https://web3js.readthedocs.io/en/v1.2.11/web3.html
const router = require('express').Router();
const { BAD_REQUEST, OVER_LIMIT, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');
const Web3 = require('web3');

const { BAD_REQUEST, OVER_LIMIT, PENDING, UNREGISTERED } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');
const { prisma } = require('../../prisma/index');
const { authMiddleware, checkSumAddress } = require('../../utils/auth');

// Check if transaction went through on the blockchain. Receipt returns null if transaction pending
async function updateLiquidity(hash, amount) {
  try {
    let receipt = await web3.eth.getTransactionReceipt(hash)
    if (!receipt) return PENDING

    let ethAddress = checkSumAddress(receipt.from)
    console.log('Got transaction receipt from ' + ethAddress);

    const member = await prisma.txMember.findUnique({
      where: {
        ethAddress,
      },
    });
    if (!member) return UNREGISTERED

    const epoch = await getCurrentEpoch();

    const epochDeposits = await prisma.txUsdcToken.aggregate({
      where: {
        ethAddress,
        transactionType: 'DEPOSIT',
        createdEpoch: epoch,
      },
      sum: {
        amount: true,
      },
    });

    const epochDepositsAmt = epochDeposits.sum.amount ? epochDeposits.sum.amount.toNumber() : 0;

    const depositLimit = member.liquidityCapUsdc - epochDepositsAmt - amount;

    if (depositLimit >= 0) {
      await prisma.txUsdcToken.create({
        data: {
          ethAddress,
          createdEpoch: epoch,
          transactionType: 'DEPOSIT',
          amount,
        },
      });
    }

    if (depositLimit == 0) {
      await prisma.txMember.update({
        where: {
          ethAddress,
        },
        data: {
          liquidityCapUsdc: 50000,
        },
      });
    }
  } catch (err) {
    console.log("Failed updateLiquidity: ", err)
  }
}

// USE WHEN dUSDC CONTRACT IS LIVE
async function subscribeWeb3TransferEvent() {
  const web3 = new Web3(process.env.NODE_WSS_ADDRESS)
  web3.eth.subscribe('logs', {
    fromBlock: 1,
    //Will be process.env.DEFAULT_CONTRACT_ADDRESS once we launch dUSDC
    address: process.env.DEFAULT_CONTRACT_ADDRESS,
    //"topics[0]" is a sha3 hash of Transfer(address,address,uint256), which is a canonical signature of transfer event
    topics: ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]
  }, function (error, result) {
    if (error) {
      console.log("web3 subscribe error: ", error)
    }
  }).on("data", async function (trxData) {
    function formatAddress(data) {
      var step1 = web3.utils.hexToBytes(data);
      for (var i = 0; i < step1.length; i++) if (step1[0] == 0) step1.splice(0, 1);
      return checkSumAddress(web3.utils.bytesToHex(step1));
    }

    let contractAddress = trxData.address
    let amount = web3.utils.hexToNumberString(trxData.data) / Math.pow(10, 6)
    let from = formatAddress(trxData.topics['1'])
    let to = formatAddress(trxData.topics['2'])
    let transactionHash = trxData.transactionHash

    console.log("Register new transfer: " + transactionHash);
    console.log("Contract " + contractAddress +
      " has transaction of " + amount +
      " from " + from + " to " + to);

    await updateLiquidity(trxData.transactionHash, amount)
  });
}

// USE BEFORE dUSDC CONTRACT IS LIVE.
// Pings the blockchain every 10 seconds to check approval for 10 hours
router.post('/api/ctPools/addLiquidity/checkTransfer', async (req, res) => {
  try {
    const {
      transactionHash,
      amount,
    } = req.body;

    //10 hours
    let intervals = 6 * 60 * 10
    setInterval(async function () {
      intervals--
      await updateLiquidity(transactionHash, amount)
      if (intervals <= 0) {
        clearInterval(this)
      }
    }, 10 * 1000)

    res.send({
      result: {
        error: false, success: true
      },
    });
    return;

  } catch (err) {
    console.log('Failed POST /api/ctPools/addLiquidity/checkTransfer: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctPools/addLiquidity/checkLimit', authMiddleware, async (req, res) => {
  try {
    const {
      ethAddress,
      amount,
    } = req.body;

    const member = await prisma.txMember.findUnique({
      where: {
        ethAddress,
      },
    });

    const epoch = await getCurrentEpoch();

    const epochDeposits = await prisma.txUsdcToken.aggregate({
      where: {
        ethAddress,
        transactionType: 'DEPOSIT',
        createdEpoch: epoch,
      },
      sum: {
        amount: true,
      },
    });

    const epochDepositsAmt = epochDeposits.sum.amount ? epochDeposits.sum.amount.toNumber() : 0;

    const depositLimit = member.liquidityCapUsdc - epochDepositsAmt - amount;

    if (depositLimit < 0) {
      res.send({
        result: {
          error: true, errorCode: OVER_LIMIT,
        },
      });
      return;
    } else {
      res.send({
        result: {
          error: false, success: true
        },
      });
      return;
    }
  } catch (err) {
    console.log('Failed POST /api/ctPools/addLiquidity/checkLimit: ', err);
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
      transactionType: 'DEPOSIT',
    },
    sum: {
      amount: true,
    },
  });
  const totalUsdcWithdrawn = await prisma.txUsdcToken.aggregate({
    where: {
      transactionType: 'WITHDRAW',
    },
    sum: {
      amount: true,
    },
  });
  const totalUsdcDepositedAmt = totalUsdcDeposited.sum.amount
    ? totalUsdcDeposited.sum.amount.toNumber() : 0;
  const totalUsdcWithdrawnAmt = totalUsdcWithdrawn.sum.amount
    ? totalUsdcWithdrawn.sum.amount.toNumber() : 0;
  return totalUsdcDepositedAmt - totalUsdcWithdrawnAmt;
}

async function getDnt() {
  const totalDnt = await prisma.txDntToken.aggregate({
    where: {
      OR: [
        { transactionType: 'CONTRIBUTOR_REWARD' },
        { transactionType: 'LP_REWARD' },
      ],
    },
    sum: {
      amount: true,
    },
  });
  const totalDntAmt = totalDnt.sum.amount ? totalDnt.sum.amount.toNumber() : 0;
  return totalDntAmt;
}

async function getDntStaked() {
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: {
      transactionType: 'STAKE',
    },
    sum: {
      amount: true,
    },
  });
  return totalDntStaked.sum.amount ? totalDntStaked.sum.amount.toNumber() : 0;
}

router.get('/api/ctPools', async (req, res) => {
  try {
    const usdc = await getUsdc();
    const dnt = await getDnt();
    const dntStaked = await getDntStaked();

    res.send({
      result: {
        usdc,
        dnt,
        dntStaked,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/ctPools: ', err);
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
      transactionType: 'DEPOSIT',
      ethAddress,
    },
    sum: {
      amount: true,
    },
  });
  const totalUsdcWithdrawn = await prisma.txUsdcToken.aggregate({
    where: {
      transactionType: 'WITHDRAW',
      ethAddress,
    },
    sum: {
      amount: true,
    },
  });
  const totalUsdcDepositedAmt = totalUsdcDeposited.sum.amount
    ? totalUsdcDeposited.sum.amount : 0;
  const totalUsdcWithdrawnAmt = totalUsdcWithdrawn.sum.amount
    ? totalUsdcWithdrawn.sum.amount : 0;

  return totalUsdcDepositedAmt - totalUsdcWithdrawnAmt;
}

async function getMemberDnt(ethAddress) {
  // Dnt
  const totalDnt = await prisma.txDntToken.aggregate({
    where: {
      OR: [
        { transactionType: 'CONTRIBUTOR_REWARD' },
        { transactionType: 'LP_REWARD' },
      ],
      ethAddress,
    },
    sum: {
      amount: true,
    },
  });

  const totalDntAmt = totalDnt.sum.amount ? totalDnt.sum.amount.toNumber() : 0;

  return totalDntAmt;
}

async function getMemberDntStaked(ethAddress) {
  // Dnt Staked
  const totalDntStaked = await prisma.txDntToken.aggregate({
    where: {
      transactionType: 'STAKE',
      ethAddress,
    },
    sum: {
      amount: true,
    },
  });
  return totalDntStaked.sum.amount ? totalDntStaked.sum.amount.toNumber() : 0;
}

// Get pool information for member
router.get('/api/ctPools/member', async (req, res) => {
  try {
    const {
      ethAddress,
    } = req.query;

    const usdc = await getMemberUsdc(ethAddress);
    const dnt = await getMemberDnt(ethAddress);
    const dntStaked = await getMemberDntStaked(ethAddress);

    res.send({
      result: {
        usdc,
        dnt,
        dntStaked,
        error: false,
      },
    });
  } catch (err) {
    console.log('Failed GET /api/ctPools/member: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctPools/member/dntHistory', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const skip = Number(req.query.skip || 0);
    const result = await prisma.txDntToken.findMany({
      where: { ethAddress },
      orderBy: [{ createdEpoch: 'desc' }, { createdAt: 'desc' }],
      take: PAGINATION_LIMIT,
      skip,
    });
    res.send({ result, error: false });
    return;
  } catch (err) {
    console.log('Failed GET /api/ctPools/member/dntHistory: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctPools/member/usdcHistory', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const skip = Number(req.query.skip || 0);
    const result = await prisma.txUsdcToken.findMany({
      where: { ethAddress },
      orderBy: [{ createdEpoch: 'desc' }, { createdAt: 'desc' }],
      take: PAGINATION_LIMIT,
      skip,
    });
    res.send({ result, error: false });
    return;
  } catch (err) {
    console.log('Failed GET /api/ctPools/member/usdcHistory: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctPools/dnt/stakeHistory', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);

    const result = await prisma.txDntToken.findMany({
      where: { ethAddress, transactionType: 'STAKE' },
      orderBy: [{ createdEpoch: 'asc' }],
    });
    res.send({ result, error: false });
    return;
  } catch (err) {
    console.log('Failed GET /api/ctPools/dnt/stakeHistory: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctPools/dnt/stakeRanking', async (req, res) => {
  try {
    const result = await prisma.txDntToken.groupBy({
      by: ['ethAddress'],
      where: { transactionType: 'STAKE' },
      sum: {
        amount: true,
      },
      orderBy: [{ _sum: { amount: 'desc' } }],
      take: 10,
    });
    res.send({ result, error: false });
    return;
  } catch (err) {
    console.log('Failed GET /api/ctPools/dnt/stakeRanking: ', err);
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
  getMemberDntStaked,
  subscribeWeb3TransferEvent
};
