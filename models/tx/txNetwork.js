const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const TxNetwork = sequelize.define('Tx_Network', {
  epochNumber: {
    field: 'epoch_number',
    type: DataTypes.INTEGER,
    allowNull: false
  },
  withdrawFeeDnt: { // fee applied to all DNT Liquidity withdrawls this epoch 
    field: 'DNT_liquidity_withdraw_fee',
    type: DataTypes.FLOAT,
    allowNull: false,
    validates: { // is a valid percentage, starts at 1
      min: 0,
      max: 1
    }
  },
  withdrawFeeUSDC: { // fee applied to all USDC Liquidity withdrawls this epoch 
    field: 'USDC_liquidity_withdraw_fee',
    type: DataTypes.FLOAT,
    allowNull: false,
    validates: { // starts at 1, changes to .1 when we go on chain
      min: 0,
      max: 1
    }
  },
  dntEpochRewardIssuance: {
    field: 'DNT_reward_epoch_issuance',
    type: DataTypes.INTEGER,
    allowNull: false,
    validates: {
      equals: 1000000 // 1M DNT tokens issued per epoch 
    }
  },
  dntRewardDistributions: {
    field: 'DNT_reward_distributions',
    type: DataTypes.JSON,
    allowNull: false
  }
  /* @dev
   * denotes how the 1M tokens are distributed
   * JSON object looks like this:
   * 
   * var dntRewardDistributions = { 
   *  contributorDntRewards: .5,
   *  liquidityDntRewards: .5
   * }
   * 
   * and eventually can change based on our network protocol, we may one day have something like this:
   * 
   * var dntRewardDistributions = { 
   *  contributorRewards: .35,
   *  liquidityRewards: .35,
   *  influencerRewards: .1,       // Small dnt bonus for highest $CLOUT members
   *  communityRewards: .1,        // Community can "claim" some tokens each day (bonus for discord activity)
   *  stakingRewards: .1           // Passive staking rewards to encourage participation in the community
   * }
   */

}, {
  indexes: [
    { unique: true, fields: ['epoch_number'] },
  ],
});

module.exports = {
  TxNetwork,
};
