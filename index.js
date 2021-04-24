
require('dotenv').config({path: __dirname + '/.env'})

const express = require('express');
const session = require('express-session')
const bodyParser = require('body-parser');
const cors = require('cors')

const {User} = require('./models/user')

const port = process.env.PORT;

const app = express();

app.use(cors())
app.use(bodyParser.json());
app.use(session({ secret: process.env.APP_SECRET, cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }}))

app.get('/', async (req, res) => {
    try {
        //db interaction
        let user = await User.findAll()

        //sessions
        const session = req.session
        req.session.id = 'some id'
        req.session.destroy()

        //query
        const query = req.query
        res.send({});
    } catch(err) {
        res.status(400).send(err);
    }
});

app.post('/', (req, res) => {
    try {
        //body
        const body = req.body;
        res.send({});
    } catch(err) {
        res.status(400).send(err);
    }
});

app.listen(port, () => {
    console.log(`Started ${process.env.APP_NAME} on port: `, port);
});

module.exports = {
    app: app
};