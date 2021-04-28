const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember } = require('./txMember');
const { TxPoolUsdc } = require('./txPoolUsdc');

const TxLiquidityPoolSharesUsdc = sequelize.define('Tx_LiquidityPoolSharesUSDC', {
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
  transactionType: {
    field: 'transaction_type',
    type: DataTypes.STRING,
    values: ['USDC_LIQUIDITY_PROVIDER_DEPOSIT', // TODO make these constants
      'USDC_LIQUIDITY_PROVIDER_WITHDRAW'], // withdraw usdc liquidity set to 100% fee at start (disable)
    allowNull: false,
  },
  usdcPoolSharesTransacted: {
    field: 'usdc_pool_shares_transacted', // positive for deposit, negative for withdraw
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxLiquidityPoolSharesUsdc.belongsTo(TxMember, { foreignKey: 'eth_address' });
// TxLiquidityPoolSharesUsdc.belongsTo(TxPoolUsdc);

module.exports = {
  TxLiquidityPoolSharesUsdc,
};
