const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index')

const { authMiddleware } = require('../../utils/auth');

router.post('/api/ctPools/addLiquidity', async (req, res) => {
  try {
    const {
      ethAddress,
      amountUsdc,
    } = req.body;

    // STEP0: VALIDATE METAMASK SIGNATURE

    // STEP1: FIND MEMBER FROM txMember

    // STEP2: GET availableCap = liquidityCapUsdc - amountUsdc TO FIGURE OUT LIMIT
    // lastLiquidityProvidedEpoch > CURRENT EPOCH RETURN ERROR
    // IF LOWER THAN 0 RETURN ERROR

    // STEP3: ADD amountUsdc TO txUsdcTokens

    // STEP4: IF availableCap = 0
    // RESET liquidityCapUsdc TO 50000

    // STEP5: IF availableCap > 0
    // SAVE liquidityCapUsdc TO availableCap

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.post('/api/ctPools/withdrawUsdc', async (req, res) => {
  try {
    const {
      ethAddress,
      amountUsdc,
    } = req.body;

    // STEP0: VALIDATE METAMASK SIGNATURE

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

router.post('/api/ctPools/withdrawDnt', async (req, res) => {
  try {
    const {
      ethAddress,
      amountDnt,
    } = req.body;

    // STEP0: VALIDATE METAMASK SIGNATURE

    // STEP1: GET withdrawFeeDnt from txProtocol and do amountDnt - amountDnt * withdrawFeeDnt

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
router.post('api/ctPools/swapTokens', async (req, res) => {
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

// HELP
router.get('/api/ctPools/getPoolShares', async (req, res) => {
  try {
    const {
      ethAddress,
      pool,
    } = req.body;

    // STEP0. AGGREGATE txDntToken. GET TOTAL AMOUNT AND AMOUNT THAT BELONGS TO ethAddress

    // STEP1. AGGREGATE txUsdcToken. GET TOTAL AMOUNT AND AMOUNT THAT BELONGS TO ethAddress

    // STEP2. FIGURE OUT SHARES IN % FOR EACH POOL

    // STEP3. SEND {
    // dnt: { total, amount, shares }
    // usdc: { total, amount, shares }
    // }
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
