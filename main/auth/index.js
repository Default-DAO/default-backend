const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const {
    authMsg,
    isValidSignature,
    jwtOptions
} = require('./utils');
const { rateLimiter } = require('../../utils/rateLimiter');
const { ApiMember } = require('../../models/api/ApiMember');

const router = require('express').Router(); 

// limit repeated failed requests to login endpoint
router.use('/api/auth/login', rateLimiter);

router.get('/api/auth/login', async (req, res) => {
    try {
        const apiMember = await ApiMember.findOne({
            where: { ethAddress: req.query.ethAddress }
        });

        if (apiMember) {
            res.send({
                result: {
                    authMsg: Object.assign(authMsg,
                        { message: { nonce: apiMember.nonce } }
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

router.post('/api/auth/login', async (req, res) => {
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
                const apiMember = await ApiMember.findOne({
                    where: { ethAddress: ethAddress }
                });

                await ApiMember.update({ nonce: uuid.v4() }, {
                    where: { ethAddress }
                });

                console.log(`apiMember === ${JSON.stringify(apiMember)}`);

                // todo find sequlize serialization lib
                res.send({
                    result: {
                        apiMember: {
                            ethAddress: apiMember.ethAddress,
                            alias: apiMember.alias,
                            createdEpoch: apiMember.createdEpoch,
                        },
                        token,
                        error: false,
                    }
                });
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
router.get('/api/auth/secret', async (req, res) => {
    res.send({ result: { success: true, error: false } });
    return;
});

module.exports = router