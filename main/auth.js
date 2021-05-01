const router = require('express').Router();

const { NOT_WHITELISTED, BAD_REQUEST } = require('../config/keys');
const { authMsg, authMiddleware } = require('../utils/auth');
const { rateLimiter } = require('../utils/rateLimiter');
//const { prisma } = require('../prisma/index');
const { PrismaClient, Prisma } = require('@prisma/client')

const prisma = new PrismaClient()


// limit repeated failed requests to login endpoint
router.use('/api/auth', rateLimiter);

router.get('/api/auth', async (req, res) => {
  try {
    // const member = await prisma.apiMember.findUnique({
    //   where: { ethAddress: req.query.ethAddress },
    // }).catch(e => {
    //   console.log('hit catch');
    //   console.log(JSON.stringify(e));
    //   console.log(e.code);
    // });
    try {
      await prisma.apiMember.findUnique({ where: { ethAddress: req.query.ethAddress }, });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        // The .code property can be accessed in a type-safe manner
        if (e.code === 'P2002') {
          console.log(
            'There is a unique constraint violation, a new user cannot be created with this email'
          )
        }
        console.log(e.code);
      }
      throw e
    }

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
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

// if you can get a response you are successfully authed
router.get('/api/auth/secret', authMiddleware, async (req, res) => {
  res.send({ result: { success: true, error: false } });
});
router.post('/api/auth/secret', authMiddleware, async (req, res) => {
  res.send({ result: { success: true, error: false } });
});

module.exports = router;
