const router = require('express').Router();
const { BAD_REQUEST } = require('../../config/keys');

// If the person does not run this request by end of the epoch, the available stakes get distributed automatically according to current ownership of the network
router.post('/api/ctValue/configure', async (req, res) => {
  try {
    // configurations: [{
    //   fromEthAddress: String,
    //   toEthAddress: String,
    //   weight: Number,
    //   epoch: Number
    // }]
    const {
      configurations,
      ethAddress,
    } = req.body;

    // QUESTIONS:
    // This doesn't add the value back to txDntTokens for now, and tokens will be added during reward issuance right?

    // STEP0: VALIDATE Metamask signature

    // STEP1. ADD configurations TO txValueConfiguration

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

router.get('/api/ctValue', async (req, res) => {
  try {
    const {
      ethAddress,
    } = req.body;

    // STEP0: VALIDATE METAMASK SIGNATURE

    // STEP1. GET ALL txValueConfiguration

    // STEP2. AGGREGATE ALL txValueConfiguration AND CREATE amount

    // STEP3. SEND {
    //   amount,
    //   configurations
    // }

    res.send({
      result: {
        error: false,
      },
    });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;
