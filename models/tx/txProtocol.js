const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

// ONLY ADMIN
const TxProtocol = sequelize.define('Tx_Protocol', {
  epochNumber: {
    field: 'epoch_number',
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true, // increment the primaryKey by 1 each time
  },
  dntWithdrawFee: { // fee applied to all DNT Liquidity withdrawls this epoch
    field: 'dnt_withdraw_fee',
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { // is a valid percentage, starts at 1
      min: 0,
      max: 1,
    },
  },
  usdcWithdrawFee: { // fee applied to all USDC Liquidity withdrawls this epoch
    field: 'usdc_withdraw_fee',
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { // starts at 1, changes to .1 when we go on chain
      min: 0,
      max: 1,
    },
  },
  dntEpochRewardIssuanceAmount: {
    field: 'dnt_epoch_reward_issuance_amount',
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      equals: 1000000, // 1M DNT tokens issued per epoch
    },
  },
  dntRewardDistributions: {
    field: 'dnt_reward_distributions',
    type: DataTypes.JSON,
    allowNull: false,
  },
  /* @dev
   * denotes how the 1M tokens are distributed
   * JSON object looks like this:
   *
   * var dntRewardDistributions = {
   *  contributorDntRewards: .5,
   *  liquidityDntRewards: .5
   * }
   *
   * and eventually can change based on our network protocol,
   * we may one day have something like this:
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
  TxProtocol,
};
