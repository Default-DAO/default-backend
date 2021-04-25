const router = require('express').Router();
const { NOT_WHITELISTED } = require('../../config/keys');

const { ApiMember } = require('../../models/api/apiMember');

router.get('/api/profile', async (req, res) => {
  try {
    const member = await ApiMember.findOne({
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

router.put('/api/profile/image', async (req, res) => {
  try {

  } catch (err) {
    res.status(400).send(err);
  }
});

router.put('/api/profile/alias', async (req, res) => {
  try {

  } catch (err) {
    res.status(400).send(err);
  }
});

module.exports = router;
