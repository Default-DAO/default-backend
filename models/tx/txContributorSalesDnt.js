const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');

const TxContributorSalesDNT = sequelize.define('Tx_ContributorSalesDNT', {
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
    /* check that this numeber is less than or equal to total contributor tokens
     */
  },
  discountRate: {
    field: 'discount_rate',
    type: DataTypes.DECIMAL,
    allowNull: false,
    /* (value is percentage. for example a value of .85 equals 85% of amount) */
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxContributorSalesDNT.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  TxContributorSalesDNT,
};
