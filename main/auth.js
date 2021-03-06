const router = require('express').Router();

const { NOT_WHITELISTED, BAD_REQUEST } = require('../config/keys');
const { authMsg } = require('../utils/auth');
const { prisma } = require('../prisma/index');

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
    console.log('Failed /api/auth: ', err);
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {router};
