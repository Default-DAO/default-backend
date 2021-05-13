const router = require('express').Router();
const {
  NOT_WHITELISTED, ALREADY_CLAIMED, INTERNAL_ERROR, BAD_REQUEST,
} = require('../config/keys');

const { uploadToS3 } = require('../utils/s3');
const { authMiddleware, checkSumAddress } = require('../utils/auth');
const { prisma } = require('../prisma/index');


router.get('/api/member', async (req, res) => {
  try {
    const ethAddress = checkSumAddress(req.query.ethAddress);
    const txMember = await prisma.txMember.findUnique({
      where: { ethAddress },
    })
    const apiMember = await prisma.apiMember.findUnique({
      where: { ethAddress },
    });
    if (txMember && apiMember) {
      res.send({
        result: {
          apiMember,
          txMember,
          error: false, // TODO use wrapper to return every response so we can standardize
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
    console.log("Failed get /api/member: ", err)
    res.status(400).send(err);
  }
});

router.post('/api/member/claim', authMiddleware, async (req, res) => {
  // @todo need to catch exceptions better and provide better error messages:
  // what happens when a user submits an alias that is too long? we should
  // provide a better error message.
  try {
    const { ethAddress, alias } = req.body;
    const txMember = await prisma.txMember.findUnique({
      where: { ethAddress },
    });
    const apiMember = await prisma.apiMember.findUnique({
      where: { ethAddress },
    });
    if (txMember && apiMember && !apiMember.claimed) {
      const updatedApiMember = await prisma.apiMember.update({
        where: { id: apiMember.id },
        data: { claimed: true }
      });

      const updatedTxMember = await prisma.txMember.update({
        where: { ethAddress: txMember.ethAddress },
        data: { alias }
      })

      res.send({
        result: {
          apiMember: updatedApiMember,
          txMember: updatedTxMember,
          error: false, // @todo use wrapper to return every response so we can standardize
        },
      });
      return;
    }
    res.send({
      result: {
        error: true,
        errorCode: ALREADY_CLAIMED,
      },
    });
    return;
  } catch (err) {
    console.log("Failed /api/member/claim: ", err)
    res.status(400).send({
      result: {
        error: true,
        errorCode: BAD_REQUEST,
      },
    });
  }
});

router.put('/api/member/image', async (req, res) => {
  //@todo this endpoint needs to save s3 url to db too
  try {
    const { image } = req.body;
    const url = await uploadToS3(image);

    res.send({
      result: {
        url,
        error: false, // TODO use wrapper to return every response so we can standardize
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

router.put('/api/member/alias', authMiddleware, async (req, res) => {
  try {
    const { alias, ethAddress } = req.body;

    const updatedApiMember = await ApiMember.update({
      where: { ethAddress },
      data: { alias }
    });

    res.send({ result: { apiMember: updatedApiMember, error: false } });
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
