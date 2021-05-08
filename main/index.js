const router = require('express').Router();

router.get('/', async (req, res) => {
  res.send({ result: { success: true, error: false, } });
  return;
});

module.exports = router;

