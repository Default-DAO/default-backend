const { DataTypes } = require('sequelize');
const { sequelize } = require('../sequelize');

const { TxMember }   = require('./txMember');
const { TxPoolUsdc } = require('./txPoolUsdc')


const TxLiquidityPoolSharesDnt = sequelize.define('Tx_LiquidityPoolSharesDNT', {
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
    values: ['CONTRIBUTOR_DNT_REWARD', 
             'USDC_LIQUIDITY_DNT_REWARD',
             'DNT_LIQUIDITY_PROVIDER_STAKE',
             'DNT_LIQUIDITY_PROVIDER_WITHDRAW'
            ], // withdraw dnt liquidity set to 100% fee to start (disable)
  },
  dntPoolSharesTransacted: {
    field: 'dnt_pool_shares_transacted', // positive for add, negative for withdraw
    type: DataTypes.INTEGER,
    allowNull: false,
    /* calculate based on invariant starts at 1 ÐNT = 1 share */
  },
}, {
  indexes: [
    { fields: ['eth_address'] },
    { fields: ['created_epoch'] },
  ],
});

TxLiquidityPoolSharesDnt.belongsTo(TxMember, { foreignKey: 'eth_address' });
TxLiquidityPoolSharesDnt.belongsTo(TxPoolDnt, { foreignKey: 'id' }); // link to the transaction id of the associated pool transaction

module.exports = {
  TxLiquidityPoolSharesDnt,
};
