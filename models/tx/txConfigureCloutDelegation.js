const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxConfigureCloutDelegation = sequelize.define('Tx_ConfigureCloutDelegation', {
  fromEthAddress: {
    field: 'from_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'ethAddressesAndEpoch',
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  toEthAddress: {
    field: 'to_eth_address',
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'ethAddressesAndEpoch',
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  epoch: {
    field: 'epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'ethAddressesAndEpoch',
  },
  weight: {
    field: 'weight',
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { fields: ['from_eth_address'] },
    { fields: ['to_eth_address'] },
    { fields: ['epoch'] },
  ],
  validate: {
    cannotSelfDelegate() {
      if (this.fromEthAddress === this.toEthAddress) {
        throw new Error('Cannot self delegate');
      }
    },
  },
});

TxConfigureCloutDelegation.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxConfigureCloutDelegation,
};
