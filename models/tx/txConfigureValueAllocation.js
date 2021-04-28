const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxConfigureValueAllocation = sequelize.define('Tx_ConfigureValueAllocation', {
  fromEthAddress: {
    field: 'from_eth_address',
    type: DataTypes.STRING,
    unique: 'ethAddressesAndEpoch',
    references: {
      model: 'Tx_Member',
      key: 'eth_address',
    },
  },
  toEthAddress: {
    field: 'to_eth_address',
    type: DataTypes.STRING,
    unique: 'ethAddressesAndEpoch',
    references: {
      model: 'Tx_Member',
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
        throw new Error('Cannot self allocate');
      }
    },
  },
});

TxConfigureValueAllocation.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxConfigureValueAllocation,
};
