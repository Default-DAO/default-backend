const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxPooUsdc = sequelize.define('Tx_PoolUSDC', {
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
  transactionType: {
    field: 'transaction_type',
    type: DataTypes.STRING,
    values: ['DEPOSIT', 
             'WITHDRAW', 
             'SWAP'],
    allowNull: false,
  },
  amount: {
    field: 'amount', // can be positive/negative for DNT_SWAP depending on the direction
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxLiquidityUsdc.belongsTo(TxMember, { foreignKey: 'eth_address' });
/* @todo
 * In the future add the swap tx if it's a DNT swap e.g.
 * TxLiquidityUsdc.belongsTo(TxPoolSwap, {foreignKey: 'swap_tx'});
 */

module.exports = {
  TxPooUsdc,
};
