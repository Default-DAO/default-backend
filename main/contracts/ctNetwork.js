const router = require('express').Router();

router.get('/api/ctNetwork/getNetworkState', async (req, res) => {
  try {
    /*  @dev
     *  request: no auth required
     *  response: returns the network state for most recent epoch
     *  
     *  response object: 
     * 
     *    return {
     *      currentEpoch: Integer;     => highest epoch number in txNetwork.js
     *      USDCwithdrawFee: Float;    => withdraw fee % for USDC from pool, stays at 100% until on-chain
     *      DNTwithdrawFee: Float;     => withdraw fee % for DNT from pool, stays at 100% until on-chain
     *      epochIssuance: 1000000;    => tokens issued for the epoch
     *      rewardsDistribution: {   
     *        contributorRewards: .5,  => multiplier for tokens going to contributors
     *        liquidityRewards: .5     => multiplier for tokens going to liquidity providers (USDC)
     *      }
     *    }
     */

    // pseudocode
        TxNetwork.getLatest();
    //

  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/api/ctNetwork/incrementEpoch', async (req, res) => {
  try {
    /*  @dev
     *  request: require admin auth,  
     *  response:
     */

  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
