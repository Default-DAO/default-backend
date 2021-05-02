const router = require('express').Router();

router.get('/api/ctProtocol/getState', async (req, res) => {
  try {
    // STEP0. GET PROTOCOL STATE FROM txProtocol

    // STEP1. GET ALL USDC TRANSACTIONS FROM txUsdcToken AND AGGREGATE TOTAL AMOUNT

    // STEP2. GET ALL DNT TRANSACTIONS FROM txDntTokens AND AGGREGATE TOTAL AMOUNT

    // STEP4. RETURN {
    //   protocol
    //   usdc
    //   dnt
    // }

  } catch (err) {
    res.status(400).send(err);
  }
});

// HELP
// TO BE RUN EVERY MONDAY
router.post('/api/ctProtocol/incrementEpoch', async (req, res) => {
  try {
    // STEP0. GET PROTOCOL STATE FROM txProtocol AND GET EPOCH ISSUEANCE

    // STEP1. CALCULATE DNT SHARES OF ALL MEMBERS BY AGGREGATING txDntTokens

    // STEP2. CALCULATE REWARDS DISTRIBUTION AND DIVIDE UP epochIssuance

    // STEP3. CONTRIBUTOR REWARDS: AGGREGATE SHARES FOR CONTRIBUTORS

    // STEP4. LP REWARDS: AGGREGATE SHARES FOR LPS

    // STEP5. SAVE EPOCH ISSUANCES AS REWARDS FOR BOTH CONTRIBUTORS AND LPS TO txDntTokens

  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
