const router = require('express').Router();

router.post('/api/ctPools/addLiquidity', async (req, res) => {
  try {
    /*  @dev
     *  request: requires metamask signature, takes params
       *
       *  request payload:
       * 
       *    req = {
       *      ethAddress: String,
       *      amountUsdc: Integer,
       *    }
     * 
     *  response: if successsful, returns a list of all the transactions the user has made in the network
     *  
     *  response object: 
     * 
     *    return [
     *      {
     *        ethAddress: currentUser.address();
     *        epochCreated: currentEpoch;
     *        amountUsdc: Integer;
     *      },
     *      {
     *        ethAddress: currentUser.address();
     *        epochCreated: currentEpoch -1;
     *        amountUsdc: Integer;
     *      }
     *    }
     */

    // pseudocode
    var remainingLiquidityAvailable = txMember.availableLiquidityUsdc - req.amountUsdc
    if (remaininLiquidityAvailable >= 0) { // validate they have enough liquidity to provide
      txPoolUsdc.add({
        ethAddress: req.ethAddress,
        createdEpoch: currentEpoch,
        transactionType: "PROVIDE_USDC_LIQUIDITY,
        amountUsdc: req.amountUsdc
      })
    }
    
    if (remainLiquidityAvailable == 0) {
      txMember.edit(address).availableLiquidtyUsdc = 50000 // reset allocation cap if member reaches it
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

router.get('/api/ctPools/getPoolShares', async (req, res) => {
    /*  @dev
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
});

module.exports = router;