const {
  BAD_REQUEST,
} = require('../config/keys');
const { TxMember } = require('../../models/tx/txMember');
const { TxPoolUsdc } = require('../../models/tx/txPoolUsdc');
const { TxLiquidityPoolSharesUsdc } = require('../../models/tx/txLiquidityPoolSharesUsdc');
const { TxLiquidityPoolSharesDnt } = require('../../models/tx/txLiquidityPoolSharesDnt');

const router = require('express').Router();

router.post('/api/ctPools/addLiquidity', async (req, res) => {
  try {
    const {
      ethAddress,
      amountUsdc
    } = req.body

    // TODO: requires metamask signature, takes params

    const txMember = await TxMember.findOne({
      where: {ethAddress}
    })
    const remainingLiquidityAvailable = txMember.availableLiquidityUsdc - amountUsdc
    
    if (remainingLiquidityAvailable >= 0) {
      await TxPoolUsdc.create({
        ethAddress,
        createdEpoch: getCurrentEpoch(),
        transactionType: "PROVIDE_USDC_LIQUIDITY",
        amountUsdc
      })
    }
    
    remainingLiquidityAvailable <= 0 ? remainingLiquidityAvailable = 50000 : null
    
    await TxMember.update({
      availableLiquidityUsdc: remainingLiquidityAvailable // reset allocation cap if member reaches it
    }, {
      where: {
        ethAddress
      }
    })

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

router.get('/api/ctPools/getPoolShares', async (req, res) => {
  /*  @dev (KEVIN'S NOTES)
  *  request: requires metamask signature
  * 
  *  response: if successsful, returns current user's ownership of both pools
  *  
  *  response object: 
  * 
  *    return {
  *      usdcLiquidityPoolShares: {
  *        ethAdress: req.ethAddress,
  *        createdEpoch: txNetwork.latestEpoch,
  *        transactionType: 'USDC_LIQUIDITY_PROVIDER_DEPOSIT'
  *        usdcPoolShares: [all txLiquidityPoolSharesUsdc rows related to user]
  *      },
  *      dntLiquidityPoolShares: {
  *        ethAdress: req.ethAddress,
  *        createdEpoch: txNetwork.latestEpoch,
  *        transactionType: 'USDC_LIQUIDITY_PROVIDER_DEPOSIT'
  *        dntPoolShares: [all txLiquidityPoolShareDnt rows related to user]
  *      }
  *    }
  */
  try {
    const {
      ethAddress
    } = req.body

    //TODO: metamask signature approval

    const usdc = await TxLiquidityPoolSharesUsdc.findAll({
      where: {
        ethAddress
      }
    })
    const dnt = await TxLiquidityPoolSharesDnt.findAll({
      where: {
        ethAddress
      }
    })

    const response = {
      usdcLiquidityPoolShares: usdc,
      dntPoolShares: dnt
    }

    res.send({ 
      result: { 
        response,
        error: false 
      } 
    });
  } catch(err) {
    res.status(400).send({
      result: {
        error: true,
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;