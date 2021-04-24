require('dotenv').config({ path: __dirname + '/.env' })

const express = require('express');
const expressJwt = require('express-jwt');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const uuid = require('uuid')

const {
    authMsg,
    isValidSignature,
    jwtAlgorithm,
    jwtOptions
} = require('./utils/auth');
const { rateLimiter } = require('./middleware/rateLimiter');
const { ApiMember } = require('./models/api/ApiMember');

const port = process.env.PORT;
const app = express();

app.use(cors())
app.use(bodyParser.json());

// all routes require JWT auth except /api/login
app.use(expressJwt({
    secret: process.env.SECRET,
    algorithms: [jwtAlgorithm],
}).unless({ path: ['/api/login'] }));

// limit repeated failed requests to login endpoint
app.use('/api/login', rateLimiter);

app.get('/api/login', async (req, res) => {
    try {
        const member = await ApiMember.findOne({
            where: { ethAddress: req.query.ethAddress }
        });

        if (member) {
            res.send({
                result: {
                    authMsg: Object.assign(authMsg,
                        { message: { nonce: member.nonce } }
                    ),
                    error: false,
                }
            });
            return;
        }
        res.send({
            result: {
                error: true,
                errorCode: 'notWhitelisted',
            }
        });
        return;

    } catch (err) {
        res.status(400).send(err);
        return;
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const signature = req.body.signature;
        const ethAddress = req.body.ethAddress;
        const chainId = req.body.chainId;
        const member = await ApiMember.findOne({
            where: { ethAddress: ethAddress }
        });

        if (member) {
            if (isValidSignature(ethAddress, member.nonce, chainId, signature)) {
                const token = jwt.sign(
                    { ethAddress },
                    process.env.SECRET,
                    jwtOptions
                );
                await ApiMember.update({ nonce: uuid.v4() }, {
                    where: { ethAddress }
                });
                res.send({ result: { token, error: false } });
                return;

            } else {
                // handle invalid signature
                res.send({
                    result: {
                        error: true,
                        errorCode: 'invalidSignature',
                    }
                });
                return;
            }
        }
    } catch (err) {
        res.status(400).send(err);
    }
});

// if you can get a response you are successfully authed
app.get('/api/secret', async (req, res) => {
    res.send({ result: { success: true, error: false } });
    return;
});

app.listen(port, () => {
    console.log(`Started ${process.env.APP_NAME} on port: ${port}`);
});

module.exports = {
    app
};