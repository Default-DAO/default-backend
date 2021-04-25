const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxAllocationNetworkClout = sequelize.define('Tx_AllocationNetworkCLOUT', {
  ethAddress: {
    field: 'eth_address',
    type: DataTypes.STRING,
    unique: 'ethAdressAndEpoch',
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  epoch: {
    field: 'epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'ethAdressAndEpoch',
  },
  allocations: {
    field: 'allocations',
    type: DataTypes.JSON,
    allowNull: false,
  },
  /*
  allocations field example. eth_address_x will be a pk from the txmember table.
  {
    "eth_address_a": 1, // amount of points delegated
    "eth_address_b": 5,
    "eth_address_c": 3
  }
  */

}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['epoch'] },
  ],
});

TxAllocationNetworkClout.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxAllocationNetworkClout,
};
