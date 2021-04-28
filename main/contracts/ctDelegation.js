const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys');
const { TxConfigureCloutDelegation } = require('../../models/tx/txConfigureCloutDelegation');
const { getCurrentEpoch } = require('../../utils/epoch');

router.post('/api/txConfigureCloutDelegation/send', async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      weight,
    } = req.body;

    await TxConfigureCloutDelegation.create({
      fromEthAddress,
      toEthAddress,
      weight,
      epoch: getCurrentEpoch(),
    });

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

router.get('/api/txConfigureCloutDelegation', async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page,
    } = req.body;

    const queryObject = {};
    fromEthAddress ? queryObject.fromEthAddress = fromEthAddress : null;
    toEthAddress ? queryObject.toEthAddress = toEthAddress : null;

    const valueAllocations = await TxConfigureCloutDelegation.findAll({
      where: {
        ...queryObject,
        epoch,
      },
      limit: PAGINATION_LIMIT,
      offset: page,
    });
    res.send({
      result: {
        valueAllocations,
        error: false,
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

module.exports = router;
