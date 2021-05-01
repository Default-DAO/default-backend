const router = require('express').Router();
const { BAD_REQUEST } = require('../../config/keys')
const { TxConfigureCloutDelegation } = require('../../models/tx/txStakeConfiguration');
const { TxStakingDnt } = require('../../models/tx/txDntStaked');
const { TxPoolDnt } = require('../../models/tx/txDntTokens');
const { txLiquidityPoolSharesDnt } = require('../../models/tx/txDntTokens');

//HELP
router.post('/api/ctStake/configure', async (req, res) => {
  try {
    // configurations: [{
    //   fromEthAddress: String,
    //   toEthAddress: String,
    //   weight: Number,
    //   epoch: Number
    // }]
    const {
      configurations,
      stakeAmount,
      ethAddress
    } = req.body

    //QUESTIONS:
    //How much can you stake? Is there a limit to how much you can stake based on how much you have in the pool?

    //STEP0: VALIDATE Metamask signature

    //STEP1. SUBTRACT stakeAmount FROM txDntTokens

    //STEP2. CHECK AMOUNT AVAILABLE IF TRANSACTION CAN GO THROUGH

    //STEP3. ADD stakeAmount TO tx txDntStaked

    //STEP4. INSERT configurations TO txStakeConfiguration

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

router.get('/api/ctStake', async (req, res) => {
  try {
    const {
      ethAddress
    } = req.query

    //STEP0: VALIDATE METAMASK SIGNATURE

    //STEP1. GET all txStakeConfigurations

    //STEP2. AGGREGATE all txStakeConfigurations and make stakeAmount

    //STEP3. SEND {
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
