const { Sequelize } = require('sequelize')

let sequelize;
if (process.env.NODE_ENV === 'development') {
    sequelize = new Sequelize({
        dialect: 'sqlite',
        logging: true,
        storage: 'db.sqlite',
    });
    //sequelize.sync({ force: true });
} else {
    sequelize = new Sequelize(process.env.DATABASE_URI, process.env.DATABASE_USERNAME, null, {
        dialect: 'postgres',
        port: 5432,
        logging: true,
    })
}



module.exports = {
    sequelize
}