const router = require('express').Router();
const { BAD_REQUEST, PAGINATION_LIMIT } = require('../../config/keys')
const { TxConfigureValueAllocation } = require('../../models/tx/txConfigureValueAllocation');
const { getCurrentEpoch } = require('../../utils/epoch`')

router.post('/api/txConfigureValueAllocation/send', async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      weight
    } = req.body

    await TxConfigureValueAllocation.create({
      fromEthAddress,
      toEthAddress,
      weight,
      epoch: getCurrentEpoch()
    })

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

router.get('/api/txConfigureValueAllocation', async (req, res) => {
  try {
    const {
      fromEthAddress,
      toEthAddress,
      epoch,
      page
    } = req.body

    let queryObject = {}
    fromEthAddress ? queryObject.fromEthAddress = fromEthAddress : null
    toEthAddress ? queryObject.toEthAddress = toEthAddress : null
  
    let valueAllocations = await TxConfigureValueAllocation.findAll({
      where: {
        ...queryObject,
        epoch
      },
      limit: PAGINATION_LIMIT,
      offset: page
    })
    res.send({
      result: {
        valueAllocations: valueAllocations,
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