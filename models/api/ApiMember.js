const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../../db/sequelize');

const { TxMember } = require('../tx/TxMember')


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
        field: "alias",
        type: DataTypes.STRING,
        allowNull: false,
        maxLength: 42,
    },
    createdEpoch: {
        field: 'created_epoch',
        type: DataTypes.INTEGER,
        allowNull: false,
    }, // we should consider removing this. it already exists in TxMember
    nonce: {
        field: 'nonce',
        type: DataTypes.UUID,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
    },
});

ApiMember.belongsTo(TxMember, { foreignKey: 'eth_address' });

module.exports = {
    ApiMember,
}