const { sequelize } = require('../../db/sequelize');

const { DataTypes } = require('sequelize');


const TxMember = sequelize.define('Tx_Member', {
    ethAddress: {
        field: "eth_address",
        type: DataTypes.STRING,
        primaryKey: true,
        maxLength: 42, // we should add additional eth address validation
    },
    type: {
        field: "type",
        type: DataTypes.STRING,
        values: ['ENTITY', 'PERSONAL'],
        allowNull: false,
    },
    createdEpoch: {
        field: 'created_epoch',
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});

module.exports = {
    TxMember,
}