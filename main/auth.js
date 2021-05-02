const router = require('express').Router();

const { NOT_WHITELISTED, BAD_REQUEST } = require('../config/keys');
const { authMsg } = require('../utils/auth');
const { rateLimiter } = require('../utils/rateLimiter');
const { prisma } = require('../prisma/index');


// limit repeated failed requests to login endpoint
router.use('/api/auth', rateLimiter);

router.get('/api/auth', async (req, res) => {
  try {
    const member = await prisma.apiMember.findUnique({
      where: { ethAddress: req.query.ethAddress },
    });


    if (member) {
      const { content } = authMsg.message;
      const { nonce } = member;
      res.send({
        result: {
          authMsg: Object.assign(authMsg, { message: { content, nonce } }),
          error: false,
        },
      });
      return;
    }
    res.send({
      result: {
        error: true,
        errorCode: NOT_WHITELISTED,
      },
    });
    return;
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;
