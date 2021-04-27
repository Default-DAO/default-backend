const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxConfigureCloutDelegation = sequelize.define('Tx_ConfigureCloutDelegation', {
  fromEthAddress: {
    field: 'from_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Tx_Member',
      key: 'eth_address',
    },
  },
  toEthAddress: {
    field: 'to_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'fromEthAdressAndtoEthAddress', // does this work? trying to make it so you can't self delegate.
    references: {
      model: 'Tx_Member',
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
}, {
  indexes: [
    { fields: ['from_eth_address'] },
    { fields: ['to_eth_address']}
    { fields: ['epoch'] },
  ],
});

TxConfigureCloutDelegation.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxConfigureCloutDelegation,
};
