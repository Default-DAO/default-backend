const router = require('express').Router();
const { BAD_REQUEST } = require('../../config/keys');
const { getCurrentProtocol } = require('../../utils/epoch');

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

module.exports = { router };
