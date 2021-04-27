const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxValueAllocation = sequelize.define('Tx_ValueAllocation', {
  fromEthAddress: {
    field: 'from_eth_address',
    type: DataTypes.STRING,
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  toEthAddress: {
    field: 'to_eth_address',
    type: DataTypes.STRING,
    unique: 'fromEthAddressAndtoEthAddress'
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  epoch: {
    field: 'epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'ethAdressAndEpoch',
  },
  weight: {
    field: 'weight',
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  indexes: [
    { fields: ['from_eth_address'] },
    { fields: ['to_eth_address'] },
    { fields: ['epoch'] },
  ],
});

TxAllocationNetworkClout.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxAllocationNetworkClout,
};
