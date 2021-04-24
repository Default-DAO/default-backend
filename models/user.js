const {sequelize} = require('../db/sequelize')

const User = sequelize.define('user', {
    id: {
        field: "id",
        type: Sequelize.STRING,
        primaryKey: true
    },
    alias: {
        field: "alias",
        type: Sequelize.STRING
    }
})

module.exports = {
    User
}