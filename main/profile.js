const router = require('express').Router();
const {
  NOT_WHITELISTED, ALREADY_CLAIMED, INTERNAL_ERROR, BAD_REQUEST,
} = require('../config/keys');

const { uploadToS3 } = require('../utils/s3');
const { authMiddleware } = require('../utils/auth');
const { prisma } = require('../prisma/index');


router.get('/api/profile', async (req, res) => {
  try {
    const member = await prisma.apiMember.findUnique({
      where: { ethAddress: req.query.ethAddress },
    });
    if (member) {
      const {
        ethAdress,
        alias,
        totalLiquidity,
        totalRewardsEarned,
        netGain,
        netPosition,
        claimed, cap,
      } = member; // TODO find sequelize serializer
      res.send({
        result: {
          apiMember: {
            ethAdress,
            alias,
            totalLiquidity,
            totalRewardsEarned,
            netGain,
            netPosition,
            claimed,
            cap,
          },
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
    res.status(400).send(err);
  }
});

router.post('/api/profile/claim', authMiddleware, async (req, res) => {
  try {
    const { ethAddress } = req.body;
    const member = await prisma.apiMember.findUnique({
      where: { ethAddress },
    });
    if (member && !member.claimed) {
      const {
        id,
        ethAdress,
        alias,
        totalLiquidity,
        totalRewardsEarned,
        netGain,
        netPosition,
        cap,
      } = member; // TODO find sequelize serializer

      const updatedMember = await prisma.apiMember.update({
        where: { id },
        data: { claimed: true }
      });

      if (updatedMember && !updatedMember.claimed) {
        res.status(500).send({
          result: {
            error: true,
            errorCode: INTERNAL_ERROR,
          },
        });
        return; // update failed
      }

      if (updatedMember && updatedMember.claimed) {
        res.send({
          result: {
            apiMember: {
              ethAdress,
              alias,
              totalLiquidity,
              totalRewardsEarned,
              netGain,
              netPosition,
              claimed: true,
              cap,
            },
            error: false, // TODO use wrapper to return every response so we can standardize
          },
        });
        return;
      }
    }
    res.send({
      result: {
        error: true,
        errorCode: ALREADY_CLAIMED, // better validation that this already exists
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

router.put('/api/profile/image', async (req, res) => {
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
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

router.put('/api/profile/alias', async (req, res) => {
  try {
    const { alias, ethAddress } = req.body;

    // await ApiMember.update({ alias }, {
    //   where: { ethAddress },
    // });
    // @todo convert to prisma

    res.send({ result: { success: true, error: false } });
  } catch (err) {
    res.status(400).send({
      result: {
        error: true,
        errorCodde: BAD_REQUEST,
      },
    });
  }
});

module.exports = router;
