const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const TxMember = sequelize.define('Tx_Member', {
  ethAddress: {
    field: 'eth_address',
    type: DataTypes.STRING,
    primaryKey: true,
    maxLength: 42, // we should add additional eth address validation
  },
  type: {
    field: 'type',
    type: DataTypes.STRING,
    values: ['ENTITY', 'PERSONAL'],
    allowNull: false,
  },
  createdEpoch: {
    field: 'created_epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { unique: true, fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

module.exports = {
  TxMember,
};
