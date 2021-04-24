const {Sequelize} = require('sequelize')
// new Sequelize(db, username, pw, options)
const sequelize = new Sequelize(process.env.DATABASE_URI, process.env.DATABASE_USERNAME, null, {
    dialect: 'postgres',
    port: 5432,
    logging: true
})

module.exports = {
    sequelize
}