const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxDntTokens = sequelize.define('Tx_DntTokens', {
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
    values: ['CONTRIBUTOR_REWARD',
      'LP_REWARD',
      'SWAP',
      'STAKE'],
    allowNull: false,
  },
  amountDnt: {
    field: 'amount_dnt', // positive for epoch issuance, positive/negative for swap depending on direction
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxDntTokens.belongsTo(TxMember, { foreignKey: 'eth_address' });
/* @todo
 * In the future add the swap tx if it's a DNT swap e.g.
 * TxLiquidityDnt.belongsTo(TxPoolSwap, {foreignKey: 'swap_tx'});
 */

module.exports = {
  TxDntTokens,
};
