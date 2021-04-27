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
  alias: {
    field: 'alias', // naming is a part of the network: we eventually have Default Naming Service like ENS/DNS/Handshake/y.at
    type: DataTypes.STRING,
  },
  createdEpoch: {
    field: 'created_epoch',
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  /* @dev
   * available_liquidity_USDC keeps track of the amount of liquidity
   * the member is allowed to provide next epoch (effective cap). 
   * This starts at 100,000 for each new member. Each LP transaction
   * reduces this number by the total amount, and resets to 50,000 when
   * it hits 0 (we can adjust this number in the future).
   */
  availableLiquidityUsdc: {  
    field: 'available_liquidity_USDC',
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, {
  indexes: [
    { unique: true, fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

module.exports = {
  TxMember,
};
