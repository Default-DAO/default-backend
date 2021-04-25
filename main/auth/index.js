const router = require('express').Router();

const { NOT_WHITELISTED } = require('../../config/keys');
const { authMsg, authMiddleware } = require('../../utils/auth');
const { rateLimiter } = require('../../utils/rateLimiter');
const { ApiMember } = require('../../models/api/apiMember');

// limit repeated failed requests to login endpoint
router.use('/api/auth', rateLimiter);

router.get('/api/auth', async (req, res) => {
  try {
    const member = await ApiMember.findOne({
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
    res.status(400).send(err);
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
