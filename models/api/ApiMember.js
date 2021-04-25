const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('../tx/txMember');

// TODO add profile pic field
const ApiMember = sequelize.define('Api_Member', {
  ethAddress: {
    field: 'eth_address',
    type: DataTypes.STRING,
    references: {
      model: 'Tx_Members',
      key: 'eth_address',
    },
  },
  alias: {
    field: 'alias',
    type: DataTypes.STRING,
    allowNull: false,
    maxLength: 42,
  },
  totalLiquidity: {
    field: 'total_liquidity',
    type: DataTypes.INTEGER,
  },
  totalRewardsEarned: {
    field: 'total_rewards_earned',
    type: DataTypes.INTEGER,
  },
  netGain: {
    field: 'net_gain',
    type: DataTypes.INTEGER,
  },
  netPosition: {
    field: 'net_position',
    type: DataTypes.INTEGER,
  },
  claimed: {
    field: 'claimed',
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  cap: {
    field: 'cap',
    type: DataTypes.INTEGER,
  },
  nonce: {
    field: 'nonce',
    type: DataTypes.UUID,
    allowNull: false,
    defaultValue: Sequelize.UUIDV4,
  },
}, {
  indexes: [
    { unique: true, fields: ['eth_address'] },
  ],
});

ApiMember.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
  ApiMember,
};
