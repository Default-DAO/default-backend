const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const router = require('express').Router();

const { NOT_WHITELISTED, INVALID_SIGNATURE } = require('../../config/keys');
const { authMsg, isValidSignature, jwtOptions } = require('../../utils/auth');
const { rateLimiter } = require('../../utils/rateLimiter');
const { ApiMember } = require('../../models/api/apiMember');

// limit repeated failed requests to login endpoint
router.use('/api/auth/login', rateLimiter);

router.get('/api/auth/login', async (req, res) => {
  try {
    const apiMember = await ApiMember.findOne({
      where: { ethAddress: req.query.ethAddress },
    });

    if (apiMember) {
      res.send({
        result: {
          authMsg: Object.assign(authMsg,
            { message: { nonce: apiMember.nonce } }),
          error: false,
        },
      });
      return;
    }
    res.send({
      result: {
        error: true,
        errorCode: INVALID_SIGNATURE,
      },
    });
    return;
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { signature, ethAddress, chainId } = req.body;
    const member = await ApiMember.findOne({
      where: { ethAddress },
    });

    if (member) {
      if (isValidSignature(ethAddress, member.nonce, chainId, signature)) {
        const token = jwt.sign(
          { ethAddress },
          process.env.SECRET,
          jwtOptions,
        );
        const apiMember = await ApiMember.findOne({
          where: { ethAddress },
        });

        await ApiMember.update({ nonce: uuid.v4() }, {
          where: { ethAddress },
        });

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
          },
        });
        return;
      }
      // handle invalid signature
      res.send({
        result: {
          error: true,
          errorCode: NOT_WHITELISTED,
        },
      });
      return;
    }
  } catch (err) {
    res.status(400).send(err);
  }
});

// if you can get a response you are successfully authed
router.get('/api/auth/secret', async (req, res) => {
  res.send({ result: { success: true, error: false } });
});

module.exports = router;
