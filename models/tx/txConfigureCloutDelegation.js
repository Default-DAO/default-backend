const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxCloutDelegation = sequelize.define('Tx_Clout_Delegation', {
  fromEthAddress: {
    field: 'from_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  toEthAddress: {
    field: 'to_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'fromEthAdressAndtoEthAddress', // does this work? trying to make it so you can't self delegate.
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
  weight: {
    field: 'weight',
    type: DataTypes.INTEGER,
    allowNull: false
  }
  /*
  delegations field example. eth_address_x will be a pk from the member table.
  {
    "eth_address_a": 1, // amount of points delegated
    "eth_address_b": 5,
    "eth_address_c": 3
  }
  */
}, {
  indexes: [
    { fields: ['from_eth_address'] },
    { fields: ['to_eth_address']}
    { fields: ['epoch'] },
  ],
});

TxDelegationNetworkValue.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxDelegationNetworkValue,
};
