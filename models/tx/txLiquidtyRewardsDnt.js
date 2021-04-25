const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxLiquidityRewardsDnt = sequelize.define('Tx_LiquidityRewardsDNT', {
  ethAddress: {
    field: 'eth_address',
    type: DataTypes.STRING,
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  createdEpoch: {
    field: 'created_epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rewardsPoolSharesReceived: {
    field: 'rewards_pool_shares_received',
    type: DataTypes.INTEGER,
    allowNull: false,
    /* calculate based on invariant starts at 1 ÐNT = 1 share */
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxLiquidityRewardsDnt.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxLiquidityRewardsDnt,
};
