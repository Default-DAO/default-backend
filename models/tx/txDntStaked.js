const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxDntStaked = sequelize.define('Tx_DntStaked', {
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
  amount: {
    field: 'amount',
    type: DataTypes.INTEGER,
    allowNull: false,
    /* make sure amount_staked is not greater than the amount of ÐNT
      rewards in the treasury pool
    */
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxDntStaked.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxDntStaked,
};
