const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { getCurrentEpoch, getCurrentProtocol } = require('../../utils/epoch');

const { prisma } = require('../../prisma/index');

const { authMiddleware, getCurrentProtocol } = require('../../utils/auth');

router.get('/api/ctProtocol', async (req, res) => {
  try {

    const protocol = await getCurrentProtocol()

    res.send({
      result: {
        protocol,
        error: false,
      },
    });

  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

module.exports = {router};
